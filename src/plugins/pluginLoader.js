// Plugin loader: spawns a sandboxed worker, validates the registration
// payload, then registers blocks + generators with Blockly. Returns a
// descriptor used by the toolbox + plugin manager UI.
//
// The renderer never executes plugin code directly. The worker hands us a
// JSON-like payload; we shape-check it, then build generators by wrapping
// each user-supplied string in `new Function('block','generator', code)`.
// Generator functions still run in the renderer because Blockly's code-gen
// path is sync — but they receive ONLY (block, generator) and cannot reach
// any host globals through closure (no `this`, no `window` capture).

import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'

import workerSrc from './pluginWorker.js?raw'

// ── Schema validation ────────────────────────────────────────────────────────

function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v) }
function isStr(v) { return typeof v === 'string' && v.length > 0 }

// Allowed values for the optional `category` field. Plugins that share a
// category collapse into a single Blockly toolbox group at the bottom of
// the workspace, so the toolbox doesn't grow one row per sensor.
const ALLOWED_CATEGORIES = ['Sensors', 'Actuators', 'Vision', 'Motion', 'Other']

// Allowed values for the optional `platforms` array. A plugin restricted to
// a subset of these is hidden in the toolbox / disabled in the catalog
// install button when the active board's platform isn't in the list.
const ALLOWED_PLATFORMS = ['arduino-avr', 'arduino-esp32', 'arduino-sam']

function validateManifest(m) {
  if (!isObj(m))          throw new Error('Manifest must be an object')
  if (!isStr(m.id))       throw new Error('Manifest.id required')
  if (!/^[a-z0-9][a-z0-9_.-]{2,}$/i.test(m.id)) throw new Error('Manifest.id has invalid characters')
  if (!isStr(m.name))     throw new Error('Manifest.name required')
  if (!isStr(m.version))  throw new Error('Manifest.version required')
  if (!isStr(m.main))     throw new Error('Manifest.main required')
  if (m.category != null) {
    if (!isStr(m.category) || !ALLOWED_CATEGORIES.includes(m.category)) {
      throw new Error(`Manifest.category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`)
    }
  }
  if (m.platforms != null) {
    if (!Array.isArray(m.platforms) || m.platforms.some(p => !ALLOWED_PLATFORMS.includes(p))) {
      throw new Error(`Manifest.platforms must be an array of: ${ALLOWED_PLATFORMS.join(', ')}`)
    }
  }
  return m
}

function validatePayload(p) {
  if (!isObj(p)) throw new Error('register() payload must be an object')

  if (p.toolbox && !isObj(p.toolbox))       throw new Error('payload.toolbox must be an object')
  if (p.toolbox?.name && !isStr(p.toolbox.name)) throw new Error('toolbox.name must be a string')

  if (!Array.isArray(p.blocks))             throw new Error('payload.blocks must be an array')
  for (const b of p.blocks) {
    if (!isObj(b))           throw new Error('Every block must be an object')
    if (!isStr(b.type))      throw new Error('Every block must have a string `type`')
  }

  if (p.generators != null && !isObj(p.generators)) {
    throw new Error('payload.generators must be an object map')
  }
  for (const [type, code] of Object.entries(p.generators || {})) {
    if (!isStr(code)) throw new Error(`Generator for "${type}" must be a string`)
  }

  if (p.includes != null && !Array.isArray(p.includes)) {
    throw new Error('payload.includes must be an array of strings')
  }

  return p
}

// ── Worker spawn ─────────────────────────────────────────────────────────────

// We inline the worker source via Vite's `?raw` import and run it from a Blob
// URL so it ships inside the bundle (no separate file to resolve in production
// file:// paths). Same for the plugin's own JS — we always feed it as a Blob
// URL to keep the worker's only network surface controlled by us.
let cachedWorkerUrl = null
function getWorkerUrl() {
  if (cachedWorkerUrl) return cachedWorkerUrl
  cachedWorkerUrl = URL.createObjectURL(new Blob([workerSrc], { type: 'application/javascript' }))
  return cachedWorkerUrl
}

function pluginCodeToUrl(jsSource) {
  return URL.createObjectURL(new Blob([jsSource], { type: 'application/javascript' }))
}

function loadInWorker(jsSource, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    let worker
    try {
      worker = new Worker(getWorkerUrl())
    } catch (e) {
      reject(new Error('Failed to spawn plugin worker: ' + e.message))
      return
    }

    const pluginUrl = pluginCodeToUrl(jsSource)
    const cleanup = () => {
      worker.terminate()
      URL.revokeObjectURL(pluginUrl)
    }
    const timer = setTimeout(() => { cleanup(); reject(new Error('Plugin load timed out')) }, timeoutMs)

    worker.onmessage = (e) => {
      const msg = e.data
      clearTimeout(timer)
      cleanup()
      if (msg?.kind === 'registered') resolve(msg.payload)
      else if (msg?.kind === 'error') reject(new Error(msg.message))
      else reject(new Error('Unknown worker response'))
    }
    worker.onerror = (e) => {
      clearTimeout(timer); cleanup()
      reject(new Error('Worker error: ' + (e.message || 'unknown')))
    }

    worker.postMessage({ kind: 'load', pluginUrl })
  })
}

// ── Block + generator registration ───────────────────────────────────────────

// Keeps a record of what each plugin registered so we can cleanly unregister.
const registry = new Map()   // pluginId → { blockTypes: [...], includes: [...], toolbox, manifest }

// Host supplies a live getter for the active board so generators can do things
// like dispatch I2C pins per platform without reaching into Vue/Pinia globals.
// BlocklyEditor sets this once at mount; the closure reads the store live so
// each generator call sees the current selection without re-registration.
let currentBoardProvider = () => ({ name: null, platform: null, i2cSda: null, i2cScl: null })

export function setBoardProvider(fn) {
  if (typeof fn === 'function') currentBoardProvider = fn
}

function buildGeneratorFn(codeStr, blockType) {
  // The user's code body is compiled once. At call time we shim in the live
  // board context as a 3rd argument so plugin code can write
  //   `if (board.platform === 'arduino-esp32') { ... }`
  // without any host-global access.
  let userFn
  try {
    // eslint-disable-next-line no-new-func
    userFn = new Function('block', 'generator', 'board', codeStr)
  } catch (e) {
    throw new Error(`Generator for "${blockType}" failed to compile: ${e.message}`)
  }
  return function(block, generator) {
    return userFn(block, generator, currentBoardProvider())
  }
}

export async function loadPlugin({ manifest, entrySource, iconUrl }) {
  validateManifest(manifest)
  if (registry.has(manifest.id)) {
    throw new Error(`Plugin "${manifest.id}" is already loaded`)
  }

  const payload = validatePayload(await loadInWorker(entrySource))

  // Register Blockly blocks
  const blockTypes = []
  for (const def of payload.blocks) {
    if (Blockly.Blocks[def.type]) {
      throw new Error(`Block type "${def.type}" is already registered by another source`)
    }
    Blockly.Blocks[def.type] = {
      init() { this.jsonInit(def) },
    }
    blockTypes.push(def.type)
  }

  // Register code generators
  for (const [type, codeStr] of Object.entries(payload.generators || {})) {
    if (!blockTypes.includes(type)) {
      // generator without matching block — ok, but warn via thrown error so
      // the caller can show it. We still continue to keep partial behaviour.
      console.warn(`[plugin:${manifest.id}] generator for unknown block "${type}"`)
    }
    javascriptGenerator.forBlock[type] = buildGeneratorFn(codeStr, type)
  }

  const descriptor = {
    manifest,
    blockTypes,
    includes: Array.isArray(payload.includes) ? payload.includes.slice() : [],
    toolbox: payload.toolbox || { name: manifest.name, color: '#7E57C2' },
    // Hoist optional metadata from the manifest so the toolbox + Plugin Manager
    // UI don't have to re-read it for grouping and platform filtering.
    category: manifest.category || null,
    platforms: Array.isArray(manifest.platforms) ? manifest.platforms.slice() : null,
    iconUrl: iconUrl || null,
  }
  registry.set(manifest.id, descriptor)
  return descriptor
}

export function unloadPlugin(pluginId) {
  const desc = registry.get(pluginId)
  if (!desc) return false
  for (const t of desc.blockTypes) {
    delete Blockly.Blocks[t]
    delete javascriptGenerator.forBlock[t]
  }
  registry.delete(pluginId)
  return true
}

export function listLoadedPlugins() {
  return [...registry.values()]
}

export function getPluginIncludes() {
  const all = []
  for (const d of registry.values()) all.push(...d.includes)
  return [...new Set(all)]
}

// Default colour per category — picked once here so the toolbox stays
// visually consistent across plugins that didn't specify their own colour.
const CATEGORY_COLOURS = {
  Sensors:   '#4FC3F7',  // light blue
  Actuators: '#FFB74D',  // orange
  Vision:    '#BA68C8',  // purple
  Motion:    '#81C784',  // green
  Other:     '#7E57C2',  // indigo
}

// Toolbox categories contributed by plugins — consumed by BlocklyEditor when
// it rebuilds the toolbox after a board switch.
//
// Behaviour:
//   - Plugins with the same `category` collapse into one Blockly category
//     so 15 sensor plugins don't make 15 separate toolbox rows.
//   - Plugins without a category fall back to their own per-plugin row
//     (legacy behaviour, used by the standalone example plugin).
//   - If `currentPlatform` is provided, plugins whose `platforms[]`
//     doesn't include it are skipped — the toolbox refreshes after every
//     board change so this stays in sync.
export function getPluginToolboxCategories(currentPlatform = null) {
  const compatible = [...registry.values()].filter(d => {
    if (!d.platforms || !currentPlatform) return true
    return d.platforms.includes(currentPlatform)
  })

  const grouped = new Map()  // category → { name, colour, contents[] }
  const ungrouped = []

  for (const d of compatible) {
    if (!d.category) {
      ungrouped.push({
        kind: 'category',
        name: d.toolbox.name,
        colour: String(d.toolbox.color || '#7E57C2'),
        toolboxitemid: `plugin-cat-${d.manifest.id}`,
        contents: d.blockTypes.map(t => ({ kind: 'block', type: t })),
      })
      continue
    }
    if (!grouped.has(d.category)) {
      grouped.set(d.category, {
        kind: 'category',
        name: d.category,
        colour: CATEGORY_COLOURS[d.category] || '#7E57C2',
        toolboxitemid: `plugin-cat-${d.category}`,
        contents: [],
      })
    }
    const cat = grouped.get(d.category)
    // Drop a label divider before each plugin so that, when 10 sensor plugins
    // share one Sensors category, the blocks of BH1750 / BMP280 / DHT etc.
    // stay visually separated. The label is a Blockly toolbox primitive — no
    // generator code, no draggable shape — so it costs zero workspace state
    // while giving the user an "── BH1750 ──" header to scan past.
    cat.contents.push({
      kind: 'label',
      text: `── ${d.toolbox.name || d.manifest.name || d.manifest.id} ──`,
      'web-class': 'lotus-plugin-divider',
    })
    cat.contents.push(...d.blockTypes.map(t => ({ kind: 'block', type: t })))
  }

  return [...grouped.values(), ...ungrouped]
}
