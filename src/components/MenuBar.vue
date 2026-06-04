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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAppStore } from '../stores/app'
import { useSerialStore } from '../stores/serial'

const appStore = useAppStore()
const serialStore = useSerialStore()
const openMenu = ref(null)
const openSub = ref(null)

function toggleMenu(label) {
  openMenu.value = openMenu.value === label ? null : label
  openSub.value = null
}
function close() { openMenu.value = null; openSub.value = null }

async function run(item) {
  close()
  if (item.action) item.action()
}

const INITIAL_WORKSPACE = { blocks: { languageVersion: 0, blocks: [{ type: 'lotus_setup', x: 30, y: 30 }, { type: 'lotus_loop', x: 30, y: 180 }] } }

const menus = [
  {
    label: 'File',
    items: [
      { label: 'New', icon: 'mdi-file-plus-outline', shortcut: 'Ctrl+N', action: () => { appStore.currentFile = null; appStore.isDirty = false; appStore.loadWorkspaceRequest = JSON.parse(JSON.stringify(INITIAL_WORKSPACE)) } },
      { label: 'Open...', icon: 'mdi-folder-open-outline', shortcut: 'Ctrl+O', action: openFile },
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
      { label: 'Manage Boards...', icon: 'mdi-developer-board', action: () => appStore.showBoardManager = true },
      { label: 'Plugins...',       icon: 'mdi-puzzle-outline',  action: () => appStore.showPluginManager = true },
      { label: 'GitHub',           icon: 'mdi-github',          action: () => appStore.showGithubManager = true },
      '---',
      {
        label: 'Include Library', icon: 'mdi-library-outline',
        submenu: [
          { label: 'Manage Libraries...', icon: 'mdi-package-variant', action: () => appStore.log('Library manager — coming soon', 'info') },
        ],
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
      '---',
      { label: 'Getting Started', icon: 'mdi-book-open-page-variant-outline', action: () => appStore.log('Documentation coming soon', 'info') },
    ],
  },
]

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
  const currentName = appStore.currentFile?.split('\\').pop()?.replace(/\.[^.]+$/, '') || appStore.selectedBoard?.id || 'sketch'
  const filePath = appStore.currentFile || await window.lotusAPI.fs.saveDialog({ filters: [{ name: 'Lotus Workspace', extensions: ['json'] }], defaultPath: `${currentName}.json` })
  if (!filePath) return
  const result = await window.lotusAPI.fs.writeFile(filePath, appStore.workspaceJson)
  if (!result?.error) { appStore.currentFile = filePath; appStore.isDirty = false; appStore.log(`Saved: ${filePath.split('\\').pop()}`, 'success') }
  else appStore.log(result.error, 'error')
}
async function saveAs() {
  if (!window.lotusAPI) return
  const currentName = appStore.currentFile?.split('\\').pop()?.replace(/\.[^.]+$/, '') || appStore.selectedBoard?.id || 'sketch'
  const filePath = await window.lotusAPI.fs.saveDialog({ filters: [{ name: 'Lotus Workspace', extensions: ['json'] }], defaultPath: `${currentName}.json` })
  if (!filePath) return
  const result = await window.lotusAPI.fs.writeFile(filePath, appStore.workspaceJson)
  if (!result?.error) { appStore.currentFile = filePath; appStore.isDirty = false; appStore.log(`Saved: ${filePath.split('\\').pop()}`, 'success') }
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
  appStore.log('Lotus IDE v1.0.0 — ArduiBot Version — Learning by Doing — www.lotus-arduibot.com', 'info')
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
