<template>
  <div class="blockly-wrap">
    <div ref="blocklyDiv" class="blockly-div"></div>
    <div ref="toolboxDivider" class="toolbox-divider"></div>

    <!-- Custom prompt dialog — replaces window.prompt() (disabled in Electron) -->
    <div v-if="prompt.visible" class="blockly-prompt-overlay" @click.self="cancelPrompt">
      <div class="blockly-prompt-dialog">
        <div class="blockly-prompt-title">{{ prompt.message }}</div>
        <input
          ref="promptInput"
          v-model="prompt.value"
          class="blockly-prompt-input"
          @keydown.enter="confirmPrompt"
          @keydown.esc="cancelPrompt"
        />
        <div class="blockly-prompt-actions">
          <button class="bp-btn bp-cancel" @click="cancelPrompt">Cancel</button>
          <button class="bp-btn bp-ok" @click="confirmPrompt">OK</button>
        </div>
      </div>
    </div>

    <div class="code-preview" v-if="appStore.showCode" :class="isDark ? 'preview-dark' : 'preview-light'">
      <div class="code-preview-header">
        <span>Arduino Code</span>
        <div style="display:flex; gap:4px; align-items:center">
          <v-btn size="x-small" variant="tonal" prepend-icon="mdi-content-copy" @click="copyCode">Copy</v-btn>
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="appStore.showCode = false" />
        </div>
      </div>
      <pre class="code-content">{{ fullDisplayCode }}</pre>
    </div>

    <!-- JSON Editor dialog -->
    <div v-if="appStore.showJson" class="blockly-prompt-overlay" @click.self="appStore.showJson = false">
      <div class="json-dialog">
        <div class="json-dialog-header">
          <span>Workspace JSON</span>
          <div style="display:flex; gap:6px; align-items:center">
            <v-btn size="x-small" variant="tonal" prepend-icon="mdi-content-copy" @click="copyJson">Copy</v-btn>
            <v-btn size="x-small" variant="tonal" prepend-icon="mdi-download" @click="downloadJson">Save</v-btn>
            <v-btn size="x-small" color="success" variant="flat" prepend-icon="mdi-check" @click="applyJson">Apply</v-btn>
            <v-btn icon="mdi-close" size="x-small" variant="text" @click="appStore.showJson = false" />
          </div>
        </div>
        <div v-if="jsonError" class="json-error">{{ jsonError }}</div>
        <textarea
          ref="jsonTextarea"
          v-model="jsonText"
          class="json-textarea"
          spellcheck="false"
          @keydown.tab.prevent="insertTab"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAppStore } from '../stores/app'
import { usePluginStore } from '../stores/plugins'
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'
import 'blockly/blocks'
import { toolbox as baseToolbox } from '../blockly/index'
import { getPluginToolboxCategories, getPluginIncludes, setBoardProvider } from '../plugins/pluginLoader'

// Resolve the board context that plugin generators receive as their 3rd arg.
// Pin numbers are the conservative defaults — sketches can still override by
// reading board.platform and emitting their own values. AVR's Wire.begin()
// ignores its arguments, so the i2c pins there are documentation only.
function makeBoardCtx(board) {
  const platform = board?.platform || null
  const ctx = { name: board?.name || null, platform, i2cSda: null, i2cScl: null }
  if (platform === 'arduino-esp32') { ctx.i2cSda = 21; ctx.i2cScl = 22 }
  else if (platform === 'arduino-avr') { ctx.i2cSda = 'A4'; ctx.i2cScl = 'A5' }
  else if (platform === 'arduino-sam') { ctx.i2cSda = 20; ctx.i2cScl = 21 }
  return ctx
}

const toolbox = baseToolbox

import variablesRaw from '../../public/icons/variables.svg?raw'
import gpioRaw      from '../../public/icons/gpio.svg?raw'
import timeRaw      from '../../public/icons/time.svg?raw'
import serialRaw    from '../../public/icons/serial.svg?raw'
import mathRaw      from '../../public/icons/math.svg?raw'
import logicRaw     from '../../public/icons/logic.svg?raw'
import loopsRaw     from '../../public/icons/loops.svg?raw'
import textRaw      from '../../public/icons/text.svg?raw'
import functionsRaw from '../../public/icons/functions.svg?raw'
import taskRaw      from '../../public/icons/task.svg?raw'

function toDataUri(svgRaw) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgRaw)}`
}

const appStore = useAppStore()
const pluginStore = usePluginStore()
const blocklyDiv = ref(null)
const toolboxDivider = ref(null)
const promptInput = ref(null)
const jsonTextarea = ref(null)
const jsonText = ref('')
const jsonError = ref('')
let workspace = null
const currentBoardHeader = ref(null)   // e.g. "LotusNanoBot.h"
const loadedBoards = new Set()
let boardLoadPromise = Promise.resolve()  // resolves when current board's blocks are registered

// Custom prompt — replaces window.prompt() which Electron blocks
const prompt = ref({ visible: false, message: '', value: '', callback: null })

function showPrompt(message, defaultValue, callback) {
  prompt.value = { visible: true, message, value: defaultValue || '', callback }
  nextTick(() => promptInput.value?.focus())
}
function confirmPrompt() {
  const { callback, value } = prompt.value
  prompt.value.visible = false
  callback?.(value.trim() || null)
}
function cancelPrompt() {
  const { callback } = prompt.value
  prompt.value.visible = false
  callback?.(null)
}

function positionToolboxDivider() {
  const toolboxEl = blocklyDiv.value?.querySelector('.blocklyToolboxDiv')
  if (!toolboxEl || !toolboxDivider.value) return
  const w = toolboxEl.getBoundingClientRect().width
  toolboxDivider.value.style.left = w + 'px'
}

// Set KBIDE custom Msg hues so block colour() calls don't error
function ensureKBIDEMsg() {
  if (!Blockly.Msg.MUSIC_HUE)  Blockly.Msg.MUSIC_HUE  = 200
  if (!Blockly.Msg.SENSOR_HUE) Blockly.Msg.SENSOR_HUE = 290
  if (!Blockly.Msg.BASIC_HUE)  Blockly.Msg.BASIC_HUE  = 160
}

// Safely evaluate a KBIDE CommonJS block file in the browser. KBIDE files often
// reference Vue.prototype.$global.board.board_info.dir at module top level for
// FieldImage paths; without a Vue stub those refs throw and the entire file
// errors out before any Blockly.Blocks[...] assignments run.
function evalBlockFile(code, boardId) {
  const mockRequire = () => ({
    remote: { dialog: { showOpenDialog: () => {} } },
    nativeImage: { createFromPath: () => ({ resize: () => ({}), getSize: () => ({ width: 0, height: 0 }), toBitmap: () => [] }) },
  })
  const VueStub = {
    prototype: {
      $global: { board: { board_info: { dir: boardId ? `boards/${boardId}` : '' } } },
    },
  }
  // Proxy that redirects old generator['type'] = fn → generator.forBlock['type'] = fn
  const generatorProxy = new Proxy(javascriptGenerator, {
    set(target, prop, value) {
      if (typeof value === 'function' && typeof prop === 'string' && !prop.startsWith('_')) {
        target.forBlock[prop] = value
        return true
      }
      target[prop] = value
      return true
    },
  })
  // Inject patched Blockly object with proxied JavaScript generator
  const patchedBlockly = Object.assign(Object.create(Object.getPrototypeOf(Blockly)), Blockly, {
    JavaScript: generatorProxy,
  })
  const mod = { exports: null }
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('module', 'exports', 'require', 'Vue', code)
    fn(mod, {}, mockRequire, VueStub)
    if (typeof mod.exports === 'function') mod.exports(patchedBlockly)
  } catch (e) {
    console.warn('[BlocklyEditor] block file error:', e.message)
  }
}

// Convert a KBIDE icon path → local boards/ URL (relative so it works in dev +
// production file:// where leading "/" resolves to drive root, not page root).
function iconToLocalUrl(iconPath) {
  if (!iconPath) return null
  const normalized = iconPath.replace(/\\/g, '/')
  // Absolute path containing boards dir: extract from boards/{id}/...
  const m = normalized.match(/boards\/(.+)$/)
  if (m) return 'boards/' + m[1]
  // Already a boards/... or icons/... path (with or without leading slash) — strip the slash
  if (iconPath.startsWith('/boards/') || iconPath.startsWith('/icons/')) return iconPath.slice(1)
  if (iconPath.startsWith('boards/')  || iconPath.startsWith('icons/'))  return iconPath
  return null
}

// Blockly hue (0-360 or #rrggbb) → solid color string
function hueColor(hue) {
  if (typeof hue === 'string' && hue.startsWith('#')) return hue
  return `hsl(${hue}, 65%, 50%)`
}
// Blockly hue → 22% opacity tint for row background
function hueTint(hue) {
  if (typeof hue === 'string' && hue.startsWith('#')) {
    const r = parseInt(hue.slice(1, 3), 16)
    const g = parseInt(hue.slice(3, 5), 16)
    const b = parseInt(hue.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, 0.22)`
  }
  return `hsla(${hue}, 65%, 50%, 0.22)`
}

// Parse legacy KBIDE <sep> and <label> XML snippets into Blockly toolbox items
function _parseXmlToolboxItems(xml) {
  const items = []
  xml.replace(/<sep(?:\s+gap="(\d+)")?[^>]*\/?>/g, (_, gap) => {
    items.push(gap ? { kind: 'sep', gap: Number(gap) } : { kind: 'sep' })
  })
  xml.replace(/<label[^>]*\stext="([^"]*)"[^>]*/g, (_, text) => {
    items.push({ kind: 'label', text })
  })
  return items.length ? items : null
}

// Convert a KBIDE category config → Blockly toolbox category + metadata for icon injection
function buildToolboxCategory(cat) {
  const id = 'board-cat-' + cat.name.replace(/\s+/g, '-')
  const contents = (cat.blocks || [])
    .flatMap(b => {
      if (typeof b === 'string') return [{ kind: 'block', type: b }]
      if (b && b.xml) {
        const xml = b.xml.trim()
        // Sep/label items should not be treated as block XML
        if (/^<sep[\s>]|^<label[\s>]/.test(xml)) {
          return _parseXmlToolboxItems(xml) || []
        }
        return [{ kind: 'block', blockxml: xml }]
      }
      return []
    })
  return {
    toolboxDef: { kind: 'category', name: cat.name, colour: String(cat.color || '200'), toolboxitemid: id, contents },
    meta: { id, name: cat.name, iconUrl: iconToLocalUrl(cat.icon), hue: cat.color || '200' },
  }
}

// Inject PNG icons + color tint into board-specific category rows
// Finds rows by label text — more reliable than data-id for dynamically added categories
function injectBoardCategoryIcons(metas) {
  if (!blocklyDiv.value || !metas.length) return
  const allLabels = blocklyDiv.value.querySelectorAll('.blocklyTreeLabel')
  allLabels.forEach(label => {
    const name = label.textContent.trim()
    const meta = metas.find(m => m.name === name)
    if (!meta) return
    const rowEl  = label.closest('.blocklyTreeRow')
    const iconEl = rowEl?.querySelector('.blocklyTreeIcon')
    if (rowEl) {
      rowEl.style.background = hueTint(meta.hue)
      rowEl.style.boxShadow  = `inset 3px 0 0 ${hueColor(meta.hue)}`
      // White top/bottom border to match base category style
      rowEl.style.borderTop    = '1px solid rgba(255,255,255,0.25)'
      rowEl.style.borderBottom = '1px solid rgba(255,255,255,0.25)'
    }
    if (iconEl && meta.iconUrl) {
      Object.assign(iconEl.style, {
        backgroundImage:    `url("${meta.iconUrl}")`,
        backgroundSize:     `${ICON_SIZE} ${ICON_SIZE}`,
        backgroundRepeat:   'no-repeat',
        backgroundPosition: 'center',
        backgroundColor:    'transparent',
        visibility:         'visible',
        width:              ICON_SIZE,
        height:             ICON_SIZE,
        display:            'inline-block',
        flexShrink:         '0',
      })
    }
    if (rowEl) {
      rowEl.style.height     = ROW_HEIGHT
      rowEl.style.lineHeight = ROW_HEIGHT
      rowEl.style.display    = 'flex'
      rowEl.style.alignItems = 'center'
    }
  })
}

async function loadBoardBlocks(boardId) {
  if (!window.lotusAPI?.boards || !workspace) return
  ensureKBIDEMsg()

  // Re-eval block definitions on every board switch. Caching by boardId is
  // unsafe: Blockly.Blocks is a global registry, so a previously-selected
  // board's defs (e.g. LotusDevkit's 3-servo WIT_servo) can stay registered
  // after switching to another board (4Wheels with 2 servos) and only get
  // overwritten on first switch. Re-evaling forces the current board's defs
  // to win every time. Eval cost is negligible.
  const files = await window.lotusAPI.boards.getBlockFiles(boardId)
  for (const code of Object.values(files || {})) evalBlockFile(code, boardId)
  loadedBoards.add(boardId)

  // Get pre-resolved config (evaluated in main process — require() and Vue stub handled there)
  const configData = await window.lotusAPI.boards.getConfig(boardId)
  currentBoardHeader.value = configData?.boardHeader ?? null
  let toolboxDefs = []
  let iconMetas   = []
  if (configData && Array.isArray(configData.blocks)) {
    const built = configData.blocks
      .filter(cat => cat && typeof cat === 'object' && Array.isArray(cat.blocks) && cat.blocks.length > 0)
      .map(buildToolboxCategory)
    toolboxDefs = built.map(b => b.toolboxDef)
    iconMetas   = built.map(b => b.meta)
  }

  // The Task category targets ESP32 FreeRTOS APIs (xTaskCreatePinnedToCore,
  // vTaskDelay, ...) — hide it for AVR/SAM boards where those calls don't link.
  const isEsp32 = appStore.selectedBoard?.platform === 'arduino-esp32'
  const baseContents = baseToolbox.contents.filter(cat =>
    cat.toolboxitemid !== 'cat-task' || isEsp32)

  const pluginCats = getPluginToolboxCategories(appStore.selectedBoard?.platform || null)
  workspace.updateToolbox({
    kind: 'categoryToolbox',
    contents: [...toolboxDefs, ...baseContents, ...pluginCats],
  })
  setTimeout(() => { injectCategoryIcons(); injectBoardCategoryIcons(iconMetas); injectPluginCategoryIcons(); positionToolboxDivider() }, 600)
}

// Inject icons + colour bars for plugin-contributed categories (same look as
// board categories — pulls from pluginStore.installed for the data URI).
function injectPluginCategoryIcons() {
  if (!blocklyDiv.value) return
  for (const p of pluginStore.loaded) {
    const id = `plugin-cat-${p.manifest.id}`
    const container = blocklyDiv.value.querySelector(`[id="${id}"]`)
    const iconEl = container?.querySelector('.blocklyTreeIcon')
    const rowEl  = container?.querySelector('.blocklyTreeRow') ?? container
    const hue = p.toolbox?.color || '#7E57C2'
    if (rowEl) {
      rowEl.style.background = hueTint(hue)
      rowEl.style.boxShadow  = `inset 3px 0 0 ${hueColor(hue)}`
      rowEl.style.borderTop    = '1px solid rgba(255,255,255,0.25)'
      rowEl.style.borderBottom = '1px solid rgba(255,255,255,0.25)'
      rowEl.style.height     = ROW_HEIGHT
      rowEl.style.lineHeight = ROW_HEIGHT
      rowEl.style.display    = 'flex'
      rowEl.style.alignItems = 'center'
    }
    if (iconEl && p.iconUrl) {
      Object.assign(iconEl.style, {
        backgroundImage:    `url("${p.iconUrl}")`,
        backgroundSize:     `${ICON_SIZE} ${ICON_SIZE}`,
        backgroundRepeat:   'no-repeat',
        backgroundPosition: 'center',
        backgroundColor:    'transparent',
        visibility:         'visible',
        width:              ICON_SIZE,
        height:             ICON_SIZE,
        display:            'inline-block',
        flexShrink:         '0',
      })
    }
  }
}

const isDark = computed(() => appStore.theme !== 'light')

const darkBlocklyTheme = Blockly.Theme.defineTheme('lotusDark', {
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#0d1b2a',
    toolboxBackgroundColour: '#0f1e2d',
    toolboxForegroundColour: '#e8f1f2',
    flyoutBackgroundColour: '#152232',
    flyoutForegroundColour: '#e8f1f2',
    flyoutOpacity: 0.97,
    scrollbarColour: '#3a5068',
    insertionMarkerColour: '#f0a500',
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.4,
    cursorColour: '#f0a500',
  },
})

const lightBlocklyTheme = Blockly.Theme.defineTheme('lotusLight', {
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#FAFBFF',
    toolboxBackgroundColour: '#1e3a5f',
    toolboxForegroundColour: '#FFFFFF',
    flyoutBackgroundColour: '#263850',
    flyoutForegroundColour: '#FFFFFF',
    flyoutOpacity: 0.97,
    scrollbarColour: '#90A4AE',
    insertionMarkerColour: '#1565C0',
    insertionMarkerOpacity: 0.5,
    scrollbarOpacity: 0.5,
    cursorColour: '#1565C0',
  },
})

function getGridColour(theme) {
  return theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'
}

// ── Category icon injection ────────────────────────────────────────────────────
const ICON_SIZE  = '28px'   // SVG render size inside the element
const ROW_HEIGHT = '38px'   // toolbox row height (Blockly default is 22px)

const CATEGORY_ICONS = {
  'cat-variables': { icon: toDataUri(variablesRaw), color: '#E040FB' },
  'cat-gpio':      { icon: toDataUri(gpioRaw),      color: '#F57F17' },
  'cat-time':      { icon: toDataUri(timeRaw),      color: '#00B0FF' },
  'cat-serial':    { icon: toDataUri(serialRaw),    color: '#00C853' },
  'cat-math':      { icon: toDataUri(mathRaw),      color: '#448AFF' },
  'cat-logic':     { icon: toDataUri(logicRaw),     color: '#00BCD4' },
  'cat-loops':     { icon: toDataUri(loopsRaw),     color: '#69F0AE' },
  'cat-text':      { icon: toDataUri(textRaw),      color: '#FFD740' },
  'cat-functions': { icon: toDataUri(functionsRaw), color: '#B388FF' },
  'cat-task':      { icon: toDataUri(taskRaw),      color: '#7E57C2' },
}

function injectCategoryIcons() {
  Object.entries(CATEGORY_ICONS).forEach(([id, { icon, color }]) => {
    const container = blocklyDiv.value?.querySelector(`[id="${id}"]`)
    const iconEl    = container?.querySelector('.blocklyTreeIcon')
    const rowEl     = container?.querySelector('.blocklyTreeRow') ?? container
    if (!iconEl) return
    Object.assign(iconEl.style, {
      backgroundImage:    `url("${icon}")`,
      backgroundSize:     `${ICON_SIZE} ${ICON_SIZE}`,
      backgroundRepeat:   'no-repeat',
      backgroundPosition: 'center',
      backgroundColor:    'transparent',
      visibility:         'visible',
      width:              ICON_SIZE,
      height:             ICON_SIZE,
      display:            'inline-block',
      flexShrink:         '0',
    })
    if (rowEl) {
      rowEl.style.background  = color + '38'
      rowEl.style.boxShadow   = `inset 3px 0 0 ${color}`
      rowEl.style.height      = ROW_HEIGHT
      rowEl.style.lineHeight  = ROW_HEIGHT
      rowEl.style.display     = 'flex'
      rowEl.style.alignItems  = 'center'
    }
  })
}

// ── JSON editor ────────────────────────────────────────────────────────────────

function openJsonEditor() {
  if (!workspace) return
  jsonError.value = ''
  jsonText.value = JSON.stringify(Blockly.serialization.workspaces.save(workspace), null, 2)
  nextTick(() => jsonTextarea.value?.focus())
}

function applyJson() {
  jsonError.value = ''
  try {
    const parsed = JSON.parse(jsonText.value)
    Blockly.serialization.workspaces.load(parsed, workspace)
    appStore.showJson = false
  } catch (e) {
    jsonError.value = 'JSON Error: ' + e.message
  }
}

function downloadJson() {
  const blob = new Blob([jsonText.value], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = 'workspace.json'
  a.click()
  URL.revokeObjectURL(url)
}

function copyJson() {
  navigator.clipboard.writeText(jsonText.value)
}

function copyCode() {
  navigator.clipboard.writeText(fullDisplayCode.value)
}

function insertTab(e) {
  const el  = e.target
  const s   = el.selectionStart
  const end = el.selectionEnd
  jsonText.value = jsonText.value.slice(0, s) + '  ' + jsonText.value.slice(end)
  nextTick(() => { el.selectionStart = el.selectionEnd = s + 2 })
}

function generateCode() {
  if (!workspace) return
  try {
    appStore.arduinoCode = javascriptGenerator.workspaceToCode(workspace)
    appStore.workspaceJson = JSON.stringify(Blockly.serialization.workspaces.save(workspace))
  } catch (e) {
    console.warn('Code gen error:', e)
  }
}

// Center setup + loop horizontally side-by-side in the workspace view.
// Runs after a frame so Blockly has measured block sizes and workspace metrics.
function centerSetupAndLoop() {
  if (!workspace) return
  requestAnimationFrame(() => {
    const setupBlock = workspace.getBlocksByType('lotus_setup', false)[0]
    const loopBlock  = workspace.getBlocksByType('lotus_loop',  false)[0]
    if (!setupBlock || !loopBlock) return

    const metrics = workspace.getMetrics()
    const s = setupBlock.getHeightWidth()
    const l = loopBlock.getHeightWidth()
    const gap = 100
    const totalW = s.width + gap + l.width
    const maxH = Math.max(s.height, l.height)

    const startX = Math.max(20, (metrics.viewWidth - totalW) / 2)
    const startY = 30

    const sXY = setupBlock.getRelativeToSurfaceXY()
    const lXY = loopBlock.getRelativeToSurfaceXY()
    setupBlock.moveBy(startX - sXY.x, startY - sXY.y)
    loopBlock.moveBy(startX + s.width + gap - lXY.x, startY - lXY.y)
  })
}

// Full code shown in View Code = board header + plugin #includes + generated code
const fullDisplayCode = computed(() => {
  const boardHeader = currentBoardHeader.value
    ? `#include "${currentBoardHeader.value}"\n`
    : ''
  const pluginIncludes = getPluginIncludes().map(h => `#include <${h}>`).join('\n')
  const headerBlock = `#include <Arduino.h>\n${boardHeader}${pluginIncludes ? pluginIncludes + '\n' : ''}\n`
  return headerBlock + (appStore.arduinoCode || '')
})

onMounted(() => {
  if (!blocklyDiv.value) return
  workspace = Blockly.inject(blocklyDiv.value, {
    toolbox,

    scrollbars: true,
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
    grid: { spacing: 24, length: 3, colour: getGridColour(appStore.theme), snap: true },
    theme: appStore.theme === 'light' ? lightBlocklyTheme : darkBlocklyTheme,
  })

  const audio = workspace.getAudioManager()
  audio.load(['sounds/my-click.mp3'], 'click')
  audio.load(['sounds/delete.mp3'], 'delete')
  audio.load(['sounds/my-click.mp3'], 'disconnect')

  // Pre-populate with setup/loop blocks
  Blockly.serialization.workspaces.load({
    blocks: {
      languageVersion: 0,
      blocks: [
        { type: 'lotus_setup', x: 0, y: 0 },
        { type: 'lotus_loop',  x: 0, y: 0 },
      ],
    },
  }, workspace)
  centerSetupAndLoop()

  // Override Blockly's prompt (window.prompt is blocked in Electron)
  Blockly.dialog.setPrompt((msg, def, cb) => showPrompt(msg, def, cb))

  workspace.addChangeListener(generateCode)
  setTimeout(() => { injectCategoryIcons(); positionToolboxDivider() }, 400)

  // Load blocks for board that was already selected when editor mounted
  if (appStore.selectedBoard) boardLoadPromise = loadBoardBlocks(appStore.selectedBoard.id)
})

// Reload board blocks whenever the selected board changes
watch(() => appStore.selectedBoard, (board) => {
  if (board) boardLoadPromise = loadBoardBlocks(board.id)
  else if (workspace) {
    workspace.updateToolbox(baseToolbox)
    setTimeout(() => { injectCategoryIcons(); positionToolboxDivider() }, 400)
  }
})

// Rebuild toolbox whenever the installed plugin set changes (install / uninstall)
watch(() => pluginStore.loaded.map(p => p.manifest.id).join('|'), () => {
  if (!workspace) return
  if (appStore.selectedBoard) {
    boardLoadPromise = loadBoardBlocks(appStore.selectedBoard.id)
  } else {
    const pluginCats = getPluginToolboxCategories(appStore.selectedBoard?.platform || null)
    workspace.updateToolbox({ kind: 'categoryToolbox', contents: [...baseToolbox.contents, ...pluginCats] })
    setTimeout(() => { injectCategoryIcons(); injectPluginCategoryIcons(); positionToolboxDivider() }, 400)
  }
})

// Refresh plugin generator context whenever the selected board changes so
// `board.platform`/`board.i2cSda` etc. inside generators reflect the new
// target. The provider is read on every block code-gen call, so a single
// install at mount time is enough — this watch just keeps the toolbox
// in sync when the board switch would also change which plugins apply.
setBoardProvider(() => makeBoardCtx(appStore.selectedBoard))
watch(() => appStore.selectedBoard?.platform, () => {
  if (!workspace) return
  if (appStore.selectedBoard) boardLoadPromise = loadBoardBlocks(appStore.selectedBoard.id)
})

watch(() => appStore.theme, (newTheme) => {
  if (!workspace) return
  workspace.setTheme(newTheme === 'light' ? lightBlocklyTheme : darkBlocklyTheme)
})

watch(() => appStore.showJson, (val) => {
  if (val) openJsonEditor()
})

// Walk a Blockly serialization tree and collect every `type` field. Used to
// verify that all block definitions exist before deserialization — Blockly
// silently drops unknown blocks (rewiring next-pointers around them), which
// looks like data loss to the user when a workspace is re-opened.
function collectBlockTypes(obj, out) {
  if (!obj || typeof obj !== 'object') return
  if (typeof obj.type === 'string') out.add(obj.type)
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') collectBlockTypes(v, out)
  }
}

watch(() => appStore.loadWorkspaceRequest, async (req) => {
  if (!req || !workspace) return
  await boardLoadPromise

  // If the JSON mentions block types we don't yet know about (race / stale
  // registry / partial board load), reload the current board's block files
  // once and re-check. Then warn the user about anything still missing rather
  // than silently dropping their work.
  const wanted = new Set()
  collectBlockTypes(req, wanted)
  let missing = [...wanted].filter(t => !Blockly.Blocks[t])
  if (missing.length && appStore.selectedBoard) {
    loadedBoards.delete(appStore.selectedBoard.id)
    boardLoadPromise = loadBoardBlocks(appStore.selectedBoard.id)
    await boardLoadPromise
    missing = [...wanted].filter(t => !Blockly.Blocks[t])
  }
  if (missing.length) {
    appStore.log(`Workspace references unknown block types — these blocks will be dropped: ${missing.join(', ')}`, 'error')
  }

  try {
    Blockly.serialization.workspaces.load(req, workspace)
  } catch (e) {
    appStore.log('Failed to load workspace: ' + e.message, 'error')
  }
  appStore.loadWorkspaceRequest = null
})

// Resize Blockly SVG whenever Output panel toggles so no navy gap is left behind
watch(() => appStore.showConsole, () => {
  if (!workspace) return
  setTimeout(() => Blockly.svgResize(workspace), 50)
})

onUnmounted(() => { workspace?.dispose() })
</script>

<style scoped>
.blockly-wrap { position: relative; width: 100%; height: 100%; }
.blockly-div { width: 100%; height: 100%; }

/* Custom prompt dialog */
.blockly-prompt-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 9000;
}
.blockly-prompt-dialog {
  background: #1a2d45; border: 1px solid rgba(255,255,255,0.18);
  border-radius: 10px; padding: 20px 24px; min-width: 280px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; gap: 12px;
}
.blockly-prompt-title {
  font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9);
}
.blockly-prompt-input {
  background: #0a1628; border: 1px solid rgba(255,255,255,0.25);
  border-radius: 6px; padding: 7px 10px;
  color: #fff; font-size: 13px; outline: none; width: 100%;
}
.blockly-prompt-input:focus { border-color: #4fc3f7; }
.blockly-prompt-actions {
  display: flex; justify-content: flex-end; gap: 8px;
}
.bp-btn {
  padding: 5px 16px; border-radius: 6px; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.bp-cancel { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
.bp-cancel:hover { background: rgba(255,255,255,0.18); }
.bp-ok { background: #1976d2; color: #fff; }
.bp-ok:hover { background: #1565c0; }

/* Divider between Toolbox and Workspace: 2px white + 2px navy */
.toolbox-divider {
  position: absolute;
  top: 0; bottom: 0;
  width: 4px;
  background: linear-gradient(to right, #ffffff 50%, #0a1628 50%);
  z-index: 80;
  pointer-events: none;
}

/* Toolbox category styling */
:deep(.blocklyTreeLabel) {
  font-size: 21px !important;
  font-weight: 600 !important;
  letter-spacing: 0.3px !important;
}
:deep(.blocklyTreeRow) {
  height: 54px !important;
  line-height: 54px !important;
  border-radius: 9px !important;
  margin: 2px 6px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.25) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25) !important;
}
:deep(.blocklyTreeRow:hover) {
  filter: brightness(1.4) !important;
}
:deep(.blocklyTreeSelected > .blocklyTreeRow) {
  filter: brightness(1.7) !important;
  box-shadow: inset 4px 0 0 currentColor !important;
}
:deep(.blocklyTreeIcon) {
  width: 39px !important;
  height: 39px !important;
  border-radius: 8px !important;
}

.code-preview {
  position: absolute; right: 8px; top: 8px;
  width: 380px; max-height: 320px;
  border-radius: 8px; display: flex; flex-direction: column; overflow: hidden;
}
.preview-dark {
  background: rgba(10, 21, 32, 0.96);
  border: 1px solid rgba(255,255,255,0.12);
}
.preview-light {
  background: rgba(248, 246, 242, 0.97);
  border: 1px solid rgba(0,0,0,0.12);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
.code-preview-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 10px; border-bottom: 1px solid rgba(128,128,128,0.15);
  font-size: 12px; font-weight: 600; color: rgb(var(--v-theme-primary));
}
.code-content {
  padding: 10px; font-size: 12px; font-family: 'Fira Code', 'Consolas', monospace;
  overflow: auto; color: rgb(var(--v-theme-on-surface)); line-height: 1.5;
  white-space: pre;
}

.json-dialog {
  background: #1a2d45; border: 1px solid rgba(255,255,255,0.18);
  border-radius: 12px; padding: 0;
  width: min(800px, 92vw); height: min(600px, 80vh);
  display: flex; flex-direction: column;
  box-shadow: 0 12px 48px rgba(0,0,0,0.6);
  overflow: hidden;
}
.json-dialog-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.12);
  font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9);
  flex-shrink: 0;
}
.json-error {
  padding: 6px 14px; font-size: 12px;
  color: #ff5252; background: rgba(255,82,82,0.1);
  border-bottom: 1px solid rgba(255,82,82,0.3);
  flex-shrink: 0;
}
.json-textarea {
  flex: 1; width: 100%; border: none; outline: none; resize: none;
  background: #0a1628; color: #e2f0fb;
  font-family: 'Fira Code', 'Consolas', monospace; font-size: 12.5px;
  line-height: 1.6; padding: 12px 16px;
  tab-size: 2;
}
</style>
