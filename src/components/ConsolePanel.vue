<template>
  <div class="console-panel">
    <!-- Header row -->
    <div class="console-header" @click="appStore.showConsole = !appStore.showConsole">
      <span class="console-title">
        <v-icon size="14" class="mr-1">mdi-console-line</v-icon>Output
      </span>
      <div class="console-header-actions">
        <v-btn
          v-if="appStore.showConsole"
          icon size="x-small" variant="text"
          :color="copied ? 'success' : undefined"
          @click.stop="copyLog"
          :title="copied ? 'Copied!' : 'Copy log'"
        >
          <v-icon size="15">{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
        </v-btn>
        <v-btn
          v-if="appStore.showConsole"
          icon="mdi-trash-can-outline" size="x-small" variant="text"
          @click.stop="appStore.clearLog()"
          title="Clear log"
        />
        <v-icon size="16" class="chevron">
          {{ appStore.showConsole ? 'mdi-chevron-down' : 'mdi-chevron-up' }}
        </v-icon>
      </div>
    </div>

    <!-- Status line -->
    <div class="console-status">
      <div class="status-item" v-if="appStore.selectedBoard">
        <v-icon size="11" class="mr-1">mdi-chip</v-icon>
        <span>{{ appStore.selectedBoard.name }}</span>
      </div>
      <div class="status-item" v-else>
        <v-icon size="11" class="mr-1">mdi-chip</v-icon>
        <span class="status-empty">No board selected</span>
      </div>
      <div class="status-divider" />
      <div class="status-item" v-if="serialStore.selectedPort">
        <v-icon size="11" class="mr-1">mdi-usb</v-icon>
        <span>{{ serialStore.selectedPort }}</span>
      </div>
      <div class="status-item" v-else>
        <v-icon size="11" class="mr-1">mdi-usb</v-icon>
        <span class="status-empty">No port selected</span>
      </div>
    </div>

    <!-- Log body -->
    <div v-if="appStore.showConsole" class="console-body" ref="consoleBody">
      <div
        v-for="(entry, i) in appStore.consoleLog" :key="i"
        :class="['log-line', 'log-' + entry.type]"
      >
        <span class="log-time">{{ entry.time }}</span>
        <span class="log-msg">{{ entry.msg }}</span>
      </div>
      <div v-if="appStore.consoleLog.length === 0" class="log-empty">No output yet</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { useSerialStore } from '../stores/serial'

const appStore = useAppStore()
const serialStore = useSerialStore()
const consoleBody = ref(null)
const copied = ref(false)

watch(() => appStore.consoleLog.length, () => {
  if (appStore.consoleLog.length > 0) appStore.showConsole = true
  if (consoleBody.value) {
    consoleBody.value.scrollTop = consoleBody.value.scrollHeight
  }
})

function copyLog() {
  const text = appStore.consoleLog.map(e => `${e.time}  ${e.msg}`).join('\n')
  navigator.clipboard.writeText(text).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}
</script>

<style scoped>
.console-panel {
  display: flex; flex-direction: column;
  border-top: 1px solid rgba(0,0,0,0.2);
  flex-shrink: 0;
}

/* Header */
.console-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 3px 10px; border-bottom: 1px solid rgba(255,255,255,0.06);
  background: #0a1628; cursor: pointer; user-select: none; min-height: 26px;
}
.console-header:hover { background: #0d1e38; }
.console-header-actions { display: flex; align-items: center; gap: 2px; }
.console-header :deep(.v-btn) { color: rgba(255,255,255,0.75) !important; }
.chevron { color: rgba(255,255,255,0.45) !important; }
.console-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.75); }

/* Status line */
.console-status {
  display: flex; align-items: center; gap: 6px;
  padding: 3px 10px; background: #e8e8e8;
  border-bottom: 1px solid rgba(0,0,0,0.12);
  min-height: 22px;
}
.status-item { display: flex; align-items: center; font-size: 11px; color: #1a1a1a; }
.status-item :deep(.v-icon) { color: #444444 !important; }
.status-empty { color: #888888; font-style: italic; }
.status-divider { width: 1px; height: 12px; background: rgba(0,0,0,0.2); margin: 0 2px; }

/* Log body — white background like Arduino IDE */
.console-body {
  height: 110px; overflow-y: auto; padding: 4px 10px;
  font-family: 'Consolas', 'Courier New', monospace; font-size: 12px;
  background: #ffffff;
  border-top: none;
}
.log-line { display: flex; gap: 8px; line-height: 1.6; }
.log-time { flex-shrink: 0; color: #888888; }
.log-msg { word-break: break-word; }
.log-info  .log-msg { color: #1a1a1a; }
.log-build .log-msg { color: #1a1a1a; }
.log-success .log-msg { color: #007700; font-weight: 600; }
.log-error .log-msg { color: #cc0000; font-weight: 600; }
.log-empty { color: #aaaaaa; font-size: 12px; padding: 4px; font-style: italic; }
</style>
