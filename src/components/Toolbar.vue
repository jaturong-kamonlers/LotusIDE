<template>
  <div class="toolbar">
    <!-- File actions -->
    <v-btn class="tool-btn" icon="mdi-file-plus-outline" variant="text" size="small" title="New File" @click="newFile" />
    <v-btn class="tool-btn" icon="mdi-folder-open-outline" variant="text" size="small" title="Open File" @click="openFile" />
    <v-btn class="tool-btn" icon="mdi-content-save-outline" variant="text" size="small" title="Save" @click="saveFile" />

    <div class="toolbar-divider" />

    <!-- Board status chip -->
    <div
      class="status-chip"
      :class="appStore.selectedBoard ? 'chip-ok' : 'chip-warn'"
      @click="appStore.showBoardSelector = true"
      title="Click to select board"
    >
      <span class="chip-dot" />
      <v-icon size="13">mdi-chip</v-icon>
      {{ appStore.selectedBoard?.name ?? 'Select Board' }}
    </div>

    <!-- Port status chip + select -->
    <div class="port-chip-wrap">
      <div
        class="status-chip"
        :class="serialStore.selectedPort ? 'chip-ok' : 'chip-warn'"
        style="cursor: default"
      >
        <span class="chip-dot" />
        <v-icon size="13">mdi-usb</v-icon>
        {{ serialStore.selectedPort || 'USB Port' }}
      </div>
      <v-select
        v-model="serialStore.selectedPort"
        :items="serialStore.ports"
        item-title="path" item-value="path"
        density="compact" hide-details variant="outlined"
        placeholder="USB Port"
        class="port-select"
        @update:menu="(open) => open && refreshPorts()"
      />
      <v-btn class="tool-btn" icon="mdi-refresh" variant="text" size="small" @click="refreshPorts" title="Refresh ports" />
    </div>

    <div class="toolbar-divider" />

    <!-- Compile & Upload -->
    <v-btn
      class="action-btn compile-btn"
      variant="flat" size="small" prepend-icon="mdi-check-circle"
      :loading="appStore.compiling" @click="compile"
      :disabled="!appStore.selectedBoard"
    >Compile</v-btn>

    <v-btn
      class="action-btn upload-btn"
      variant="flat" size="small" prepend-icon="mdi-upload-circle"
      :loading="appStore.uploading" @click="upload"
      :disabled="!appStore.canUpload"
    >Upload</v-btn>

    <div class="toolbar-spacer" />

    <!-- View Code (C) -->
    <button
      class="svg-icon-btn"
      :class="{ 'svg-icon-active': appStore.showCode }"
      title="View Code"
      @click="appStore.showCode = !appStore.showCode"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12.5" fill="#00979D" stroke="#00b9c0" stroke-width="1.5"/>
        <text x="14" y="20" text-anchor="middle" font-family="monospace" font-size="15" font-weight="700" fill="#ffffff">C</text>
      </svg>
    </button>

    <!-- View JSON (J) -->
    <button
      class="svg-icon-btn"
      :class="{ 'svg-icon-active': appStore.showJson }"
      title="View JSON"
      @click="appStore.showJson = !appStore.showJson"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12.5" fill="#f9a825" stroke="#ffd54f" stroke-width="1.5"/>
        <text x="14" y="20" text-anchor="middle" font-family="monospace" font-size="15" font-weight="700" fill="#1a1a1a">J</text>
      </svg>
    </button>

    <!-- MQTT Websocket (W) -->
    <button
      class="svg-icon-btn"
      title="Open MQTT Websocket"
      @click="openMqttWebsocket"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12.5" fill="#d32f2f" stroke="#ef5350" stroke-width="1.5"/>
        <text x="14" y="20" text-anchor="middle" font-family="monospace" font-size="15" font-weight="700" fill="#ffffff">W</text>
      </svg>
    </button>

    <!-- MQTT IoT Workstation (S) -->
    <button
      class="svg-icon-btn"
      title="Open RAIL MQTT IoT Workstation"
      @click="openMqttWorkstation"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12.5" fill="#795548" stroke="#a1887f" stroke-width="1.5"/>
        <text x="14" y="20" text-anchor="middle" font-family="monospace" font-size="15" font-weight="700" fill="#ffffff">S</text>
      </svg>
    </button>

    <!-- RAIL AIoT (A) -->
    <button
      class="svg-icon-btn"
      title="Open RAIL AIoT"
      @click="openRailAiot"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12.5" fill="#1976d2" stroke="#64b5f6" stroke-width="1.5"/>
        <text x="14" y="20" text-anchor="middle" font-family="monospace" font-size="15" font-weight="700" fill="#ffffff">A</text>
      </svg>
    </button>

    <!-- Sound on/off toggle — affects splash open.mp3 + upload sucess.mp3.
         State persists across restarts via localStorage in app store. -->
    <button
      class="svg-icon-btn"
      :title="appStore.soundEnabled ? 'Sound: ON (click to mute)' : 'Sound: OFF (click to unmute)'"
      @click="appStore.soundEnabled = !appStore.soundEnabled"
    >
      <svg v-if="appStore.soundEnabled" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12.5" fill="#00897B" stroke="#26A69A" stroke-width="1.5"/>
        <path d="M 7 11.5 L 10.5 11.5 L 13.5 8.5 L 13.5 19.5 L 10.5 16.5 L 7 16.5 Z" fill="#ffffff"/>
        <path d="M 16 11 Q 18 14 16 17" stroke="#ffffff" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M 18.5 9 Q 21.5 14 18.5 19" stroke="#ffffff" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </svg>
      <svg v-else width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12.5" fill="#616161" stroke="#9E9E9E" stroke-width="1.5"/>
        <path d="M 7 11.5 L 10.5 11.5 L 13.5 8.5 L 13.5 19.5 L 10.5 16.5 L 7 16.5 Z" fill="#ffffff"/>
        <line x1="16.5" y1="10.5" x2="22" y2="17.5" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round"/>
        <line x1="22" y1="10.5" x2="16.5" y2="17.5" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round"/>
      </svg>
    </button>

    <div class="toolbar-divider" />

    <!-- Serial Monitor toggle -->
    <v-btn
      class="serial-btn"
      :class="{ 'serial-active': appStore.showSerial }"
      variant="tonal" size="small" prepend-icon="mdi-monitor-dashboard"
      @click="appStore.showSerial = !appStore.showSerial"
    >Serial Monitor</v-btn>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { useSerialStore } from '../stores/serial'

const appStore = useAppStore()
const serialStore = useSerialStore()

async function refreshPorts() {
  if (window.lotusAPI) {
    serialStore.ports = await window.lotusAPI.serial.list()
  }
}

onMounted(refreshPorts)

const INITIAL_WORKSPACE = { blocks: { languageVersion: 0, blocks: [{ type: 'lotus_setup', x: 30, y: 30 }, { type: 'lotus_loop', x: 30, y: 180 }] } }

function newFile() {
  appStore.currentFile = null
  appStore.isDirty = false
  appStore.loadWorkspaceRequest = JSON.parse(JSON.stringify(INITIAL_WORKSPACE))
}

async function openFile() {
  if (!window.lotusAPI) return
  const paths = await window.lotusAPI.fs.openDialog({
    filters: [{ name: 'Lotus Workspace', extensions: ['json'] }]
  })
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
  const filePath = appStore.currentFile || await window.lotusAPI.fs.saveDialog({
    filters: [{ name: 'Lotus Workspace', extensions: ['json'] }],
    defaultPath: `${currentName}.json`,
  })
  if (!filePath) return
  const result = await window.lotusAPI.fs.writeFile(filePath, appStore.workspaceJson)
  if (!result?.error) {
    appStore.currentFile = filePath
    appStore.isDirty = false
    appStore.log(`Saved: ${filePath.split(/[\\/]/).pop()}`, 'success')
  } else {
    appStore.log(result.error, 'error')
  }
}

async function compile() {
  if (!appStore.selectedBoard) return
  appStore.compiling = true
  appStore.clearLog()
  try {
    const board = appStore.selectedBoard
    const code = appStore.arduinoCode
    const result = await window.lotusAPI?.arduino.compile({ code, fqbn: board.fqbn, boardId: board.id })
    if (result?.error) appStore.log(result.error, 'error')
    else appStore.log('Compile success!', 'success')
  } finally {
    appStore.compiling = false
  }
}

function openExternal(url) {
  if (window.lotusAPI?.shell?.openExternal) window.lotusAPI.shell.openExternal(url)
  else window.open(url, '_blank')
}
function openMqttWebsocket() {
  openExternal('https://rail.kls.ac.th/main-rail/mqtt_websocket.html')
}
function openMqttWorkstation() {
  openExternal('https://rail.kls.ac.th/main-rail/RAIL_MQTT_IoT_Workstation.html')
}
function openRailAiot() {
  openExternal('https://rail.kls.ac.th/rail_aiot/')
}

async function upload() {
  if (!appStore.canUpload) return
  appStore.uploading = true
  try {
    const board = appStore.selectedBoard
    const result = await window.lotusAPI?.arduino.upload({
      code: appStore.arduinoCode,
      fqbn: board.fqbn,
      port: serialStore.selectedPort,
      boardId: board.id,
      touchBaudrate: board.touchBaudrate,
    })
    if (result?.error) appStore.log(result.error, 'error')
    else {
      appStore.log('Upload complete!', 'success')
      if (appStore.soundEnabled) new Audio(`sounds/sucess.mp3?t=${Date.now()}`).play().catch(() => {})
    }
  } finally {
    appStore.uploading = false
  }
}
</script>

<style scoped>
.toolbar {
  height: 48px; display: flex; align-items: center; gap: 3px;
  padding: 0 10px; background: var(--lotus-navy) !important;
  border-bottom: 1px solid rgba(0,0,0,0.25); flex-shrink: 0;
}

/* Icon-only ghost buttons */
.tool-btn { color: rgba(255,255,255,0.75) !important; border-radius: 8px !important; }
.tool-btn:hover { background: rgba(255,255,255,0.12) !important; color: #fff !important; }
.toolbar :deep(.v-icon) { color: inherit !important; }

/* COM port dropdown */
.port-select { width: 108px; font-size: 12px; }
.toolbar :deep(.port-select .v-field__input) { color: rgba(255,255,255,0.9) !important; font-size: 12px; }
.toolbar :deep(.port-select .v-field__outline) { --v-field-border-color: rgba(255,255,255,0.3) !important; border-radius: 8px !important; }
.toolbar :deep(.port-select .v-label) { color: rgba(255,255,255,0.5) !important; }
.toolbar :deep(.port-select .v-select__selection-text) { color: rgba(255,255,255,0.9) !important; }
.toolbar :deep(.port-select .v-field-prepend-inner .v-icon) { color: rgba(255,255,255,0.6) !important; }

/* Compile button — teal */
.compile-btn {
  background: #00897B !important; color: #fff !important;
  border-radius: 10px !important; font-weight: 600; font-size: 13px;
  letter-spacing: 0.3px; padding: 0 14px !important;
  box-shadow: 0 2px 6px rgba(0,137,123,0.45) !important;
}
.compile-btn:hover { background: #00695C !important; box-shadow: 0 3px 10px rgba(0,137,123,0.6) !important; }

/* Upload button — vivid blue */
.upload-btn {
  background: #1565C0 !important; color: #fff !important;
  border-radius: 10px !important; font-weight: 600; font-size: 13px;
  letter-spacing: 0.3px; padding: 0 14px !important;
  box-shadow: 0 2px 6px rgba(21,101,192,0.45) !important;
}
.upload-btn:hover { background: #0D47A1 !important; box-shadow: 0 3px 10px rgba(21,101,192,0.6) !important; }

/* Disabled state */
.action-btn:deep(.v-btn--disabled) { opacity: 0.45 !important; box-shadow: none !important; }

/* Serial Monitor */
.serial-btn {
  color: rgba(255,255,255,0.75) !important; border-radius: 10px !important;
  border: 1px solid rgba(255,255,255,0.2) !important;
}
.serial-btn:hover { background: rgba(255,255,255,0.1) !important; color: #fff !important; }
.serial-active { background: #1565C0 !important; color: #fff !important; border-color: #1565C0 !important; }

.toolbar-divider { width: 1px; height: 22px; background: rgba(255,255,255,0.15); margin: 0 5px; flex-shrink: 0; }
.toolbar-spacer { flex: 1; }

.svg-icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px;
  background: transparent; border: none; border-radius: 8px;
  color: rgba(255,255,255,0.65);
  cursor: pointer; padding: 0; flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}
.svg-icon-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
.svg-icon-active { background: rgba(21,101,192,0.35) !important; color: #90caf9 !important; }

/* Status chips */
.status-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 20px;
  font-size: 11.5px; font-weight: 500; cursor: pointer;
  border: 1px solid; white-space: nowrap;
  transition: background 0.15s;
  user-select: none;
}
.chip-warn {
  background: rgba(239,68,68,0.12);
  border-color: rgba(239,68,68,0.45);
  color: #fca5a5;
}
.chip-warn:hover { background: rgba(239,68,68,0.22); }
.chip-ok {
  background: rgba(34,197,94,0.12);
  border-color: rgba(34,197,94,0.45);
  color: #86efac;
}
.chip-ok:hover { background: rgba(34,197,94,0.22); }
.chip-dot {
  width: 7px; height: 7px; border-radius: 50%;
  flex-shrink: 0;
}
.chip-warn .chip-dot { background: #ef4444; box-shadow: 0 0 5px #ef4444; }
.chip-ok  .chip-dot { background: #22c55e; box-shadow: 0 0 5px #22c55e; }

/* Port chip wrapper — select โปร่งใสซ้อนทับ chip ให้คลิกได้ */
.port-chip-wrap {
  display: flex; align-items: center; gap: 2px;
  position: relative;
}
.port-chip-wrap .port-select {
  position: absolute; inset: 0;
  width: 100%; opacity: 0; z-index: 1;
  cursor: pointer;
}
</style>
