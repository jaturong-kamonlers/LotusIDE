<template>
  <div class="serial-overlay">
    <v-card class="serial-card" elevation="20">
      <v-card-title class="serial-header">
        <v-icon class="mr-2">mdi-console</v-icon>
        Serial Monitor
        <v-spacer />
        <v-btn-toggle v-model="serialStore.showPlotter" mandatory density="compact" color="primary" size="small">
          <v-btn :value="false" prepend-icon="mdi-format-list-text" size="small">Monitor</v-btn>
          <v-btn :value="true" prepend-icon="mdi-chart-line" size="small">Plotter</v-btn>
        </v-btn-toggle>
        <v-btn icon="mdi-close" variant="text" size="small" class="ml-2" @click="appStore.showSerial = false" />
      </v-card-title>

      <v-card-text class="serial-body pa-0">
        <!-- Connection bar -->
        <div class="conn-bar">
          <v-select
            v-model="serialStore.selectedPort" :items="serialStore.ports"
            item-title="path" item-value="path"
            density="compact" hide-details variant="outlined"
            placeholder="COM Port" style="max-width: 160px; font-size: 12px;"
            @update:menu="(open) => open && refreshPorts()"
          />
          <v-select
            v-model="serialStore.baudrate" :items="serialStore.baudrates"
            density="compact" hide-details variant="outlined"
            style="max-width: 120px; font-size: 12px;"
          />
          <v-btn
            :color="serialStore.connected ? 'error' : 'success'"
            size="small" variant="flat"
            :prepend-icon="serialStore.connected ? 'mdi-link-off' : 'mdi-link'"
            @click="toggleConnect"
          >{{ serialStore.connected ? 'Disconnect' : 'Connect' }}</v-btn>
          <v-btn icon="mdi-refresh" variant="text" size="small" @click="refreshPorts" />
          <v-spacer />
          <v-switch v-model="serialStore.autoScroll" label="Auto scroll" hide-details density="compact" color="primary" />
          <v-btn icon="mdi-trash-can-outline" variant="text" size="small" @click="serialStore.clearLog()" />
        </div>

        <!-- Monitor / Plotter -->
        <div class="serial-content">
          <div v-if="!serialStore.showPlotter" ref="logDiv" class="serial-log">
            <div v-for="(line, i) in serialStore.receivedLines" :key="i" class="serial-line">
              <span class="serial-time">{{ line.time }}</span>
              <span>{{ line.text }}</span>
            </div>
          </div>
          <div v-else class="plotter-area">
            <canvas ref="plotCanvas" class="plot-canvas" />
          </div>
        </div>

        <!-- Send bar -->
        <div class="send-bar">
          <v-text-field
            v-model="sendText" density="compact" hide-details variant="outlined"
            placeholder="Type and press Enter to send"
            @keydown.enter="sendData" style="font-size: 13px;"
          />
          <v-select
            v-model="serialStore.lineEnding"
            :items="['\\n', '\\r\\n', '\\r', 'none']"
            density="compact" hide-details variant="outlined"
            style="max-width: 90px; font-size: 12px;"
          />
          <v-btn color="primary" variant="flat" size="small" @click="sendData">Send</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { useSerialStore } from '../stores/serial'

const appStore = useAppStore()
const serialStore = useSerialStore()
const sendText = ref('')
const logDiv = ref(null)

async function refreshPorts() {
  if (window.lotusAPI) serialStore.ports = await window.lotusAPI.serial.list()
}

async function toggleConnect() {
  if (!window.lotusAPI) return
  if (serialStore.connected) {
    await window.lotusAPI.serial.disconnect()
    serialStore.connected = false
  } else {
    const result = await window.lotusAPI.serial.connect(serialStore.selectedPort, serialStore.baudrate)
    if (!result?.error) serialStore.connected = true
    else appStore.log(result.error, 'error')
  }
}

async function sendData() {
  if (!sendText.value || !window.lotusAPI) return
  await window.lotusAPI.serial.send(sendText.value)
  sendText.value = ''
}

watch(() => serialStore.receivedLines.length, () => {
  if (serialStore.autoScroll && logDiv.value) {
    logDiv.value.scrollTop = logDiv.value.scrollHeight
  }
})

onMounted(refreshPorts)
</script>

<style scoped>
.serial-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.5); display: flex; align-items: flex-end;
}
.serial-card { width: 100%; height: 50vh; border-radius: 16px 16px 0 0 !important; display: flex; flex-direction: column; }
.serial-header { display: flex; align-items: center; padding: 8px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
.serial-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.conn-bar { display: flex; gap: 8px; align-items: center; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
.serial-content { flex: 1; overflow: hidden; }
.serial-log { height: 100%; overflow-y: auto; padding: 6px 12px; font-family: monospace; font-size: 12px; }
.serial-line { display: flex; gap: 8px; line-height: 1.6; word-break: break-word; }
.serial-time { opacity: 0.4; flex-shrink: 0; }
.plotter-area { height: 100%; padding: 6px 12px; }
.plot-canvas { width: 100%; height: 100%; }
.send-bar { display: flex; gap: 8px; padding: 8px 12px; border-top: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
</style>
