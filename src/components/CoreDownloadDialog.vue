<template>
  <v-dialog
    v-model="open"
    max-width="560"
    :persistent="state !== 'done' && state !== 'error'"
  >
    <v-card class="cd-card">
      <v-card-title class="cd-header">
        <v-icon class="mr-2" :color="state === 'error' ? 'error' : 'primary'">
          {{ icon }}
        </v-icon>
        {{ title }}
        <v-spacer />
        <v-btn
          v-if="state === 'done' || state === 'error'"
          icon="mdi-close" variant="text" size="small"
          @click="close"
        />
      </v-card-title>

      <v-card-text class="pa-4">
        <div v-if="state === 'installing'" class="installing-pane">
          <v-progress-linear
            indeterminate color="primary" height="6" rounded
            class="mb-3"
          />
          <div class="size-row">
            <span>Download: <b>~{{ sizeMb }} MB</b></span>
            <span>On disk after install: <b>~{{ diskMb }} MB</b></span>
          </div>
          <p class="hint">
            This is a one-time download. Keep LotusIDE open until it finishes.
            The progress log below comes straight from arduino-cli.
          </p>
          <div ref="logEl" class="log-pane">
            <div v-for="(line, i) in tail" :key="i" class="log-line">{{ line }}</div>
          </div>
        </div>

        <div v-else-if="state === 'done'" class="done-pane">
          <v-icon size="48" color="success">mdi-check-circle</v-icon>
          <div class="result-text">{{ pkg }} installed.</div>
          <div class="result-hint">You can compile or upload sketches for this board now.</div>
        </div>

        <div v-else-if="state === 'error'" class="error-pane">
          <v-icon size="48" color="error">mdi-alert-circle-outline</v-icon>
          <div class="result-text">Install failed.</div>
          <code class="error-msg">{{ errorMsg || 'Unknown error' }}</code>
          <div class="result-hint">
            You can retry from <b>Lotus → Manage Boards → Pre-download Cores</b>,
            or pick a different board.
          </div>
        </div>
      </v-card-text>

      <v-card-actions v-if="state === 'done' || state === 'error'" class="pa-3">
        <v-spacer />
        <v-btn variant="tonal" color="primary" @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const open = ref(false)
const state = ref('idle')        // 'idle' | 'installing' | 'done' | 'error'
const pkg = ref('')
const sizeMb = ref(0)
const diskMb = ref(0)
const errorMsg = ref('')
const logLines = ref([])
const logEl = ref(null)

// Show only the last ~12 progress lines so the dialog doesn't grow unbounded.
const tail = computed(() => logLines.value.slice(-12))

const title = computed(() => {
  if (state.value === 'installing') return `Installing ${friendlyName(pkg.value)}…`
  if (state.value === 'done')       return 'Install complete'
  if (state.value === 'error')      return 'Install failed'
  return ''
})

const icon = computed(() => {
  if (state.value === 'done')  return 'mdi-check-circle'
  if (state.value === 'error') return 'mdi-alert-circle-outline'
  return 'mdi-cloud-download-outline'
})

function friendlyName(p) {
  if (p === 'esp32:esp32')  return 'ESP32 core'
  if (p === 'arduino:avr')  return 'Arduino AVR core'
  if (p === 'arduino:sam')  return 'Arduino SAM core'
  return p || 'core'
}

function close() {
  open.value = false
  // Reset only after the dialog has visually closed, so a quick re-trigger
  // doesn't flicker the previous state into view.
  setTimeout(() => {
    if (!open.value) {
      state.value = 'idle'
      pkg.value = ''
      logLines.value = []
      errorMsg.value = ''
    }
  }, 250)
}

function onCoreStatus(payload) {
  if (!payload || typeof payload !== 'object') return
  if (payload.state === 'start') {
    pkg.value = payload.pkg
    sizeMb.value = payload.sizeMb || 0
    diskMb.value = payload.diskMb || 0
    logLines.value = []
    errorMsg.value = ''
    state.value = 'installing'
    open.value = true
  } else if (payload.state === 'done') {
    pkg.value = payload.pkg
    state.value = 'done'
    open.value = true
  } else if (payload.state === 'error') {
    pkg.value = payload.pkg
    errorMsg.value = payload.error || ''
    state.value = 'error'
    open.value = true
  }
}

function onProgress(msg) {
  // Only capture progress lines while we're actively installing — otherwise
  // we'd accumulate compile output too.
  if (state.value !== 'installing') return
  if (typeof msg !== 'string') return
  logLines.value.push(msg)
  nextTick(() => {
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
  })
}

onMounted(() => {
  if (!window.lotusAPI?.arduino) return
  window.lotusAPI.arduino.onCoreStatus(onCoreStatus)
  window.lotusAPI.arduino.onProgress(onProgress)
})

onBeforeUnmount(() => {
  if (!window.lotusAPI?.arduino) return
  window.lotusAPI.arduino.removeCoreStatusListener?.()
  // Note: don't remove the global progress listener — other components also
  // listen via the same channel. The state-guard in onProgress is enough.
})
</script>

<style scoped>
.cd-card { background: rgb(var(--v-theme-surface)); }
.cd-header { display: flex; align-items: center; padding: 12px 16px; font-size: 16px; font-weight: 600; }

.installing-pane { display: flex; flex-direction: column; gap: 6px; }
.size-row { display: flex; justify-content: space-between; font-size: 13px; opacity: 0.85; }
.hint { font-size: 12px; opacity: 0.7; margin: 8px 0; }
.log-pane {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 11px;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  padding: 8px 10px;
  height: 180px;
  overflow-y: auto;
  line-height: 1.5;
}
.log-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.85; }

.done-pane, .error-pane {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 20px 8px; text-align: center;
}
.result-text { font-size: 16px; font-weight: 600; }
.result-hint { font-size: 12px; opacity: 0.7; }
.error-msg {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 11px;
  background: rgba(255, 0, 0, 0.08);
  padding: 6px 10px; border-radius: 4px;
  display: block;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 100%;
}
</style>
