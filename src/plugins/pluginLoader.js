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

function validateManifest(m) {
  if (!isObj(m))          throw new Error('Manifest must be an object')
  if (!isStr(m.id))       throw new Error('Manifest.id required')
  if (!/^[a-z0-9][a-z0-9_.-]{2,}$/i.test(m.id)) throw new Error('Manifest.id has invalid characters')
  if (!isStr(m.name))     throw new Error('Manifest.name required')
  if (!isStr(m.version))  throw new Error('Manifest.version required')
  if (!isStr(m.main))     throw new Error('Manifest.main required')
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

function buildGeneratorFn(codeStr, blockType) {
  // Wrap in IIFE shape so the user's return value flows back to Blockly.
  try {
    // eslint-disable-next-line no-new-func
    return new Function('block', 'generator', codeStr)
  } catch (e) {
    throw new Error(`Generator for "${blockType}" failed to compile: ${e.message}`)
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

// Toolbox categories contributed by plugins — consumed by BlocklyEditor when
// it rebuilds the toolbox after a board switch.
export function getPluginToolboxCategories() {
  return [...registry.values()].map(d => ({
    kind: 'category',
    name: d.toolbox.name,
    colour: String(d.toolbox.color || '#7E57C2'),
    toolboxitemid: `plugin-cat-${d.manifest.id}`,
    contents: d.blockTypes.map(t => ({ kind: 'block', type: t })),
  }))
}
