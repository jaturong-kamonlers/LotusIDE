<template>
  <div class="menubar" @click.stop>
    <div
      v-for="menu in menus" :key="menu.label"
      class="menu-item"
      :class="{ active: openMenu === menu.label }"
      @click="toggleMenu(menu.label)"
      @mouseenter="openMenu && openMenu !== menu.label ? openMenu = menu.label : null"
    >
      {{ menu.label }}
      <div v-if="openMenu === menu.label" class="dropdown">
        <template v-for="(item, i) in menu.items" :key="i">
          <div v-if="item === '---'" class="dropdown-divider" />
          <div
            v-else-if="item.submenu"
            class="dropdown-item has-sub"
            @mouseenter="openSub = item.label"
            @mouseleave="openSub = null"
          >
            <v-icon size="16" class="item-icon">{{ item.icon || 'mdi-blank' }}</v-icon>
            <span>{{ item.label }}</span>
            <v-icon size="14" class="sub-arrow">mdi-chevron-right</v-icon>
            <div v-if="openSub === item.label" class="submenu">
              <template v-for="(sub, j) in item.submenu" :key="j">
                <div v-if="sub === '---'" class="dropdown-divider" />
                <div v-else class="dropdown-item" @click.stop="run(sub)">
                  <v-icon size="16" class="item-icon">{{ sub.icon || 'mdi-blank' }}</v-icon>
                  <span>{{ sub.label }}</span>
                  <span v-if="sub.shortcut" class="shortcut">{{ sub.shortcut }}</span>
                </div>
              </template>
            </div>
          </div>
          <div v-else class="dropdown-item" @click.stop="run(item)">
            <v-icon size="16" class="item-icon">{{ item.icon || 'mdi-blank' }}</v-icon>
            <span>{{ item.label }}</span>
            <span v-if="item.shortcut" class="shortcut">{{ item.shortcut }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Click outside to close -->
    <div v-if="openMenu" class="menu-backdrop" @click="close" />

    <!-- About dialog (sibling of menu items, OUTSIDE the v-if/v-else-if chain) -->
    <v-dialog v-model="aboutOpen" max-width="540" persistent>
      <v-card class="about-card">
        <v-card-title class="d-flex align-center pb-1">
          <v-icon size="28" color="primary" class="mr-2">mdi-information-outline</v-icon>
          About Lotus IDE
        </v-card-title>
        <v-card-text class="pt-2">
          <div class="text-h6 mb-1">Lotus IDE</div>
          <div class="text-body-2 text-medium-emphasis mb-3">
            Version {{ appVersion }} — Learning by Doing<br>
            Copyright © {{ new Date().getFullYear() }} Jaturong Kamonlers
          </div>

          <div class="text-body-2 mb-3">
            <strong>{{ t('menu.about.license_para1') }}</strong><br>
            {{ t('menu.about.license_para2') }}<br>
            {{ t('menu.about.license_para3') }}<br>
            {{ t('menu.about.license_para4') }}
          </div>

          <div class="d-flex flex-wrap ga-2 mb-3">
            <v-btn size="small" variant="outlined" prepend-icon="mdi-file-document-outline"
                   @click="openLink('https://github.com/jaturong-kamonlers/LotusIDE-Releases/blob/main/LICENSE')">
              View Full License
            </v-btn>
            <v-btn size="small" variant="outlined" prepend-icon="mdi-package-variant-closed"
                   @click="openLink('https://github.com/jaturong-kamonlers/LotusIDE-Releases/blob/main/THIRD-PARTY-NOTICES.md')">
              Third-Party Notices
            </v-btn>
            <v-btn size="small" variant="outlined" prepend-icon="mdi-github"
                   @click="openLink('https://github.com/jaturong-kamonlers/LotusIDE-Releases')">
              GitHub
            </v-btn>
          </div>

          <div class="text-caption text-medium-emphasis">
            Built on Electron, Vue, Vuetify, Blockly, arduino-cli.
            Plugin/board ecosystem inspired by KBProIDE (MIT, © tookit).
            {{ t('menu.about.third_party') }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="aboutOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { useSerialStore } from '../stores/serial'
import { useLibraryManagerStore } from '../stores/libraryManager'
import { useT } from '../i18n/useT'

const t = useT()

const appStore = useAppStore()
const serialStore = useSerialStore()
const libStore = useLibraryManagerStore()
const openMenu = ref(null)
const openSub = ref(null)
const aboutOpen = ref(false)
const appVersion = APP_VERSION

function openLink(url) {
  if (window.lotusAPI?.openExternal) window.lotusAPI.openExternal(url)
  else window.open(url, '_blank')
}

// One refresh on mount populates libStore.installed for the Include Library
// submenu. Install/uninstall via the Manage dialog calls refresh() itself, so
// the menu stays current without extra plumbing.
onMounted(() => { libStore.refresh() })

function toggleMenu(label) {
  openMenu.value = openMenu.value === label ? null : label
  openSub.value = null
}
function close() { openMenu.value = null; openSub.value = null }

async function run(item) {
  close()
  if (item.action) item.action()
}

// Insert `#include <Foo.h>` at the top of the sketch, immediately after any
// existing leading `#include` lines. No-op if the include is already present.
// Mutates appStore.arduinoCode — works in code mode. In Blockly mode the
// generated code will overwrite this on the next regeneration, which matches
// the Arduino IDE convention (this menu is a code-mode feature).
function insertIncludeAtTop(header) {
  if (!header) return
  const code = appStore.arduinoCode || ''
  const line = `#include <${header}>`
  const lines = code.split('\n')
  if (lines.some(l => l.trim() === line)) {
    appStore.log(`Already included: <${header}>`, 'info')
    return
  }
  let insertAt = 0
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (t === '' || t.startsWith('//') || t.startsWith('#include')) {
      insertAt = i + 1
      continue
    }
    break
  }
  lines.splice(insertAt, 0, line)
  appStore.arduinoCode = lines.join('\n')
  appStore.isDirty = true
  appStore.log(`Inserted #include <${header}>`, 'success')
}

// Build the Include Library submenu from currently installed libraries. Each
// library contributes one entry per header it exposes (per library.properties
// `includes=`, or scanned .h files as fallback). Libraries with zero detected
// headers fall back to a single entry using `<id>.h` — matches the common
// Arduino convention where the library folder name doubles as the header.
const includeLibrarySubmenu = computed(() => {
  const items = [
    { label: 'Manage Libraries...', icon: 'mdi-package-variant', action: () => appStore.showLibraryManager = true },
  ]
  const libs = (libStore.installed || []).filter(l => l && l.ok !== false)
  if (libs.length === 0) return items
  items.push('---')
  for (const lib of libs) {
    const headers = (lib.headers && lib.headers.length > 0) ? lib.headers : [`${lib.id}.h`]
    for (const h of headers) {
      items.push({
        label: h,
        icon: 'mdi-code-tags',
        action: () => insertIncludeAtTop(h),
      })
    }
  }
  return items
})

const INITIAL_WORKSPACE = { blocks: { languageVersion: 0, blocks: [{ type: 'lotus_setup', x: 30, y: 30 }, { type: 'lotus_loop', x: 30, y: 180 }] } }

const menus = computed(() => [
  {
    label: 'File',
    items: [
      { label: 'New', icon: 'mdi-file-plus-outline', shortcut: 'Ctrl+N', action: () => { appStore.currentFile = null; appStore.isDirty = false; appStore.loadWorkspaceRequest = JSON.parse(JSON.stringify(INITIAL_WORKSPACE)) } },
      { label: 'Open...', icon: 'mdi-folder-open-outline', shortcut: 'Ctrl+O', action: openFile },
      { label: 'Import from URL...', icon: 'mdi-link-variant', action: () => appStore.showImportUrl = true },
      '---',
      { label: 'Save', icon: 'mdi-content-save-outline', shortcut: 'Ctrl+S', action: saveFile },
      { label: 'Save As...', icon: 'mdi-content-save-edit-outline', shortcut: 'Ctrl+Shift+S', action: saveAs },
      '---',
      {
        label: 'Examples', icon: 'mdi-book-open-outline',
        submenu: [
          { label: 'Blink LED', icon: 'mdi-led-on', action: () => loadExample('blink') },
          { label: 'Serial Hello', icon: 'mdi-console-line', action: () => loadExample('serial') },
          { label: 'PWM Fade', icon: 'mdi-brightness-6', action: () => loadExample('pwm') },
        ],
      },
      '---',
      { label: 'Quit', icon: 'mdi-exit-to-app', shortcut: 'Alt+F4', action: () => window.lotusAPI?.window.close() },
    ],
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', icon: 'mdi-undo', shortcut: 'Ctrl+Z', action: () => document.execCommand('undo') },
      { label: 'Redo', icon: 'mdi-redo', shortcut: 'Ctrl+Y', action: () => document.execCommand('redo') },
      '---',
      { label: 'Cut', icon: 'mdi-content-cut', shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
      { label: 'Copy', icon: 'mdi-content-copy', shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
      { label: 'Paste', icon: 'mdi-content-paste', shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
      '---',
      { label: 'Select All', icon: 'mdi-select-all', shortcut: 'Ctrl+A', action: () => document.execCommand('selectAll') },
    ],
  },
  {
    label: 'Lotus',
    items: [
      { label: 'Verify / Compile', icon: 'mdi-check-circle-outline', shortcut: 'Ctrl+R', action: compile },
      { label: 'Upload', icon: 'mdi-upload', shortcut: 'Ctrl+U', action: upload },
      '---',
      { label: 'Boards Setup...', icon: 'mdi-developer-board', action: () => appStore.showBoardManager = true },
      { label: 'Plugin Setup...', icon: 'mdi-puzzle-outline',  action: () => appStore.showPluginManager = true },
      { label: 'GitHub',           icon: 'mdi-github',          action: () => appStore.showGithubManager = true },
      '---',
      { label: t('menu.diagnose_esp32'), icon: 'mdi-stethoscope', action: () => appStore.showDiagnoseEsp32 = true },
      '---',
      {
        label: 'Include Library', icon: 'mdi-library-outline',
        submenu: includeLibrarySubmenu.value,
      },
    ],
  },
  {
    label: 'View',
    items: [
      { label: 'Block Mode (Blockly)', icon: 'mdi-puzzle', shortcut: 'Ctrl+1', action: () => appStore.editorMode = 'blockly' },
      { label: 'Code Mode', icon: 'mdi-code-tags', shortcut: 'Ctrl+2', action: () => appStore.editorMode = 'code' },
      '---',
      {
        label: 'Theme', icon: 'mdi-palette-outline',
        submenu: [
          { label: 'Lotus (Default)', icon: 'mdi-flower', action: () => appStore.theme = 'lotus' },
          { label: 'Dark', icon: 'mdi-weather-night', action: () => appStore.theme = 'dark' },
          { label: 'Light', icon: 'mdi-white-balance-sunny', action: () => appStore.theme = 'light' },
        ],
      },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Serial Monitor', icon: 'mdi-console', shortcut: 'Ctrl+Shift+M', action: () => { appStore.showSerial = true; serialStore.showPlotter = false } },
      { label: 'Serial Plotter', icon: 'mdi-chart-line', shortcut: 'Ctrl+Shift+L', action: () => { appStore.showSerial = true; serialStore.showPlotter = true } },
      '---',
      { label: 'Select Board...', icon: 'mdi-cpu-64-bit', action: () => appStore.showBoardSelector = true },
      // USB-to-serial driver installers are Windows-only — on Linux the
      // ch341 / cp210x kernel modules are in-tree, on macOS they ship via
      // the system driver. Hide the submenu off-Windows to avoid dead UI.
      ...(window.lotusAPI?.platform === 'win32' ? [
        '---',
        {
          label: 'Install USB Drivers', icon: 'mdi-usb-port',
          submenu: [
            { label: 'CP210x (ESP32 DevKit)', icon: 'mdi-chip', action: () => installDriver('cp210x') },
            { label: 'CH340 / CH341 (Nano/clones)', icon: 'mdi-chip', action: () => installDriver('ch340') },
            '---',
            { label: 'Open Drivers Folder', icon: 'mdi-folder-open-outline', action: () => installDriver('open-folder') },
          ],
        },
      ] : []),
    ],
  },
  {
    label: 'Window',
    items: [
      { label: 'Minimize', icon: 'mdi-minus', action: () => window.lotusAPI?.window.minimize() },
      { label: 'Maximize / Restore', icon: 'mdi-square-outline', action: () => window.lotusAPI?.window.maximize() },
    ],
  },
  {
    label: 'Help',
    items: [
      { label: 'Check for Updates...', icon: 'mdi-cloud-download-outline', action: () => appStore.showUpdater = true },
      '---',
      { label: 'About Lotus IDE', icon: 'mdi-information-outline', action: showAbout },
      { label: 'Website', icon: 'mdi-web', action: () => appStore.log('www.lotus-arduibot.com', 'info') },
      { label: 'Report Bug...', icon: 'mdi-bug-outline', action: reportBug },
      '---',
      { label: 'Getting Started', icon: 'mdi-book-open-page-variant-outline', action: () => window.lotusAPI?.shell?.openExternal('https://jaturong-kamonlers.github.io/LotusIDE-Releases/manual.html') },
    ],
  },
])

async function installDriver(name) {
  if (!window.lotusAPI?.drivers) {
    appStore.log('Driver installer API not available — please rebuild', 'error')
    return
  }
  appStore.log(`Launching ${name} driver installer...`, 'info')
  const res = await window.lotusAPI.drivers.install(name)
  if (res?.error) appStore.log(res.error, 'error')
  else if (res?.note) appStore.log(res.note, 'info')
}

async function openFile() {
  if (!window.lotusAPI) return
  const paths = await window.lotusAPI.fs.openDialog({ filters: [{ name: 'Lotus Workspace', extensions: ['json'] }] })
  if (!paths[0]) return
  const result = await window.lotusAPI.fs.readFile(paths[0])
  if (result.content !== undefined) {
    try {
      const parsed = JSON.parse(result.content)
      appStore.loadWorkspaceRequest = parsed
      appStore.currentFile = paths[0]
      appStore.editorMode = 'blockly'
      appStore.isDirty = false
    } catch {
      appStore.log('Invalid workspace file', 'error')
    }
  } else {
    appStore.log(result.error || 'Failed to open file', 'error')
  }
}
async function saveFile() {
  if (!window.lotusAPI) return
  const currentName = appStore.currentFile?.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '') || appStore.selectedBoard?.id || 'sketch'
  const filePath = appStore.currentFile || await window.lotusAPI.fs.saveDialog({ filters: [{ name: 'Lotus Workspace', extensions: ['json'] }], defaultPath: `${currentName}.json` })
  if (!filePath) return
  const result = await window.lotusAPI.fs.writeFile(filePath, appStore.workspaceJson)
  if (!result?.error) { appStore.currentFile = filePath; appStore.isDirty = false; appStore.log(`Saved: ${filePath.split(/[\\/]/).pop()}`, 'success') }
  else appStore.log(result.error, 'error')
}
async function saveAs() {
  if (!window.lotusAPI) return
  const currentName = appStore.currentFile?.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '') || appStore.selectedBoard?.id || 'sketch'
  const filePath = await window.lotusAPI.fs.saveDialog({ filters: [{ name: 'Lotus Workspace', extensions: ['json'] }], defaultPath: `${currentName}.json` })
  if (!filePath) return
  const result = await window.lotusAPI.fs.writeFile(filePath, appStore.workspaceJson)
  if (!result?.error) { appStore.currentFile = filePath; appStore.isDirty = false; appStore.log(`Saved: ${filePath.split(/[\\/]/).pop()}`, 'success') }
  else appStore.log(result.error, 'error')
}
async function compile() {
  if (!appStore.selectedBoard) { appStore.log('Please select a board first', 'error'); return }
  appStore.compiling = true; appStore.clearLog()
  try {
    const board = appStore.selectedBoard
    const result = await window.lotusAPI?.arduino.compile({ code: appStore.arduinoCode, boardId: board.id, fqbn: board.fqbn })
    appStore.log(result?.error ? result.error : 'Compile success!', result?.error ? 'error' : 'success')
  } finally { appStore.compiling = false }
}
async function upload() {
  if (!appStore.canUpload) { appStore.log('Please select board and COM port first', 'error'); return }
  appStore.uploading = true
  try {
    const board = appStore.selectedBoard
    const result = await window.lotusAPI?.arduino.upload({ code: appStore.arduinoCode, boardId: board.id, fqbn: board.fqbn, port: serialStore.selectedPort })
    appStore.log(result?.error ? result.error : 'Upload complete!', result?.error ? 'error' : 'success')
    if (!result?.error) new Audio(`sounds/sucess.mp3?t=${Date.now()}`).play().catch(() => {})
  } finally { appStore.uploading = false }
}
function loadExample(name) {
  appStore.editorMode = 'code'
  appStore.log(`Load example: ${name}`, 'info')
}
function showAbout() {
  aboutOpen.value = true
}

// Open GitHub's "New Issue" page with a pre-filled bug template. We pass
// the user's environment via query params so they don't have to retype it.
// The URL is intentionally constructed in the renderer (not the main
// process) so the user sees the body before they submit.
function reportBug() {
  const board    = appStore.selectedBoard?.title || appStore.selectedBoard?.id || '(none)'
  const platform = window.lotusAPI?.platform || 'unknown'
  const lastLog  = (appStore.consoleLog || []).slice(-10)
    .map(l => `[${l.time}] ${l.type}: ${l.msg}`)
    .join('\n')
  const body = `**Describe the bug**
A clear and concise description of what the bug is.

**To reproduce**
1.
2.
3.

**Expected behavior**


**Environment**
- LotusIDE version: 1.1.0
- OS: ${platform}
- Board: ${board}

**Recent console log**
\`\`\`
${lastLog || '(empty)'}
\`\`\`

**Additional context**
`
  const params = new URLSearchParams({
    title: '[Bug] ',
    body,
    labels: 'bug',
  })
  const url = `https://github.com/jaturong-kamonlers/LotusIDE-Releases/issues/new?${params.toString()}`
  window.lotusAPI?.shell?.openExternal(url)
}
</script>

<style scoped>
.menubar {
  display: flex; align-items: stretch; height: 26px;
  background: #cfcfcf !important;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0; position: relative; z-index: 200;
  -webkit-app-region: no-drag;
}
.menu-item {
  position: relative; padding: 0 10px;
  font-size: 13px; cursor: pointer; display: flex; align-items: center;
  color: #1a1a1a; user-select: none;
  transition: background 0.1s;
}
.menu-item:hover, .menu-item.active { background: rgba(0,0,0,0.12); }

.menu-backdrop { position: fixed; inset: 0; z-index: 190; }

.dropdown {
  position: absolute; top: 100%; left: 0;
  min-width: 220px; background: #1a2d40;
  border: 1px solid rgba(255,255,255,0.12); border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  z-index: 300; padding: 4px 0;
}
.dropdown-item {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 14px; font-size: 13px; cursor: pointer;
  color: rgba(255,255,255,0.85); position: relative; white-space: nowrap;
}
.dropdown-item:hover { background: rgba(240,165,0,0.15); color: #f0a500; }
.item-icon { opacity: 0.6; flex-shrink: 0; }
.shortcut { margin-left: auto; padding-left: 24px; opacity: 0.45; font-size: 12px; }
.dropdown-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 3px 0; }

.has-sub { position: relative; }
.sub-arrow { margin-left: auto; opacity: 0.5; }
.submenu {
  position: absolute; left: 100%; top: -4px;
  min-width: 200px; background: #1a2d40;
  border: 1px solid rgba(255,255,255,0.12); border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  padding: 4px 0;
}
</style>
