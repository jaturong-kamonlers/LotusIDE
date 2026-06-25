<template>
  <v-dialog v-model="open" max-width="760" :persistent="busy">
    <v-card class="dx-card">
      <v-card-title class="dx-header">
        <v-icon class="mr-2" color="primary">mdi-stethoscope</v-icon>
        {{ t('diag.title') }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" :disabled="busy" @click="close" />
      </v-card-title>

      <v-card-text class="pa-4">
        <p class="dx-intro">
          {{ t('diag.intro') }}
        </p>

        <div v-if="state === 'idle'" class="dx-cta">
          <v-btn color="primary" variant="flat" size="large" @click="runCheck">
            <v-icon start>mdi-play</v-icon>{{ t('diag.start') }}
          </v-btn>
        </div>

        <div v-else-if="state === 'running'" class="dx-running">
          <v-progress-circular indeterminate color="primary" size="36" />
          <div class="dx-running-text">{{ t('diag.running') }}</div>
        </div>

        <div v-else-if="state === 'done'">
          <div class="dx-summary" :class="report.ok ? 'ok' : 'fail'">
            <v-icon size="28" :color="report.ok ? 'success' : 'error'">
              {{ report.ok ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
            <div>
              <div class="dx-summary-line">
                {{ report.ok ? t('diag.summary_ok') : t('diag.summary_problems', failCount) }}
              </div>
              <div class="dx-summary-sub">
                {{ t('diag.checked_at', formatTime(report.generatedAt)) }}
              </div>
            </div>
            <v-spacer />
            <v-btn variant="tonal" size="small" @click="copyReport">
              <v-icon start>mdi-content-copy</v-icon>{{ t('diag.copy_report') }}
            </v-btn>
          </div>

          <div class="dx-table">
            <div
              v-for="c in report.checks" :key="c.id"
              class="dx-row" :class="'sev-' + c.status"
            >
              <div class="dx-row-status">
                <v-icon size="20" :color="statusColor(c.status)">
                  {{ statusIcon(c.status) }}
                </v-icon>
              </div>
              <div class="dx-row-body">
                <div class="dx-row-label">{{ c.label }}</div>
                <div class="dx-row-detail">{{ c.detail }}</div>
                <div v-if="c.fix" class="dx-row-fix">
                  <template v-if="c.fix.kind === 'clearCache'">
                    <v-btn size="x-small" variant="flat" color="warning"
                      :loading="busyKind === 'clearCache'" :disabled="busy"
                      @click="doClearCache">
                      <v-icon start size="14">mdi-broom</v-icon>{{ t('diag.clear_cache_btn') }}
                    </v-btn>
                  </template>
                  <template v-else-if="c.fix.kind === 'reinstallEsp32'">
                    <v-btn size="x-small" variant="flat" color="error"
                      :loading="busyKind === 'reinstallEsp32'" :disabled="busy"
                      @click="doRemoveEsp32">
                      <v-icon start size="14">mdi-refresh</v-icon>{{ t('diag.reinstall_core_btn') }}
                    </v-btn>
                  </template>
                  <template v-else-if="c.fix.kind === 'addDefenderExclusion'">
                    <v-btn size="x-small" variant="flat" color="primary"
                      :loading="busyKind === 'addDefenderExclusion'" :disabled="busy"
                      @click="doAddDefenderExclusion">
                      <v-icon start size="14">mdi-shield-check-outline</v-icon>{{ t('diag.defender_btn') }}
                    </v-btn>
                  </template>
                  <template v-else>
                    <v-icon size="14" class="dx-fix-ico">mdi-information-outline</v-icon>
                    <span>{{ c.fix.text }}</span>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <v-alert
            v-if="fixNote"
            type="info" variant="tonal" density="compact"
            class="mt-3"
          >
            {{ fixNote }}
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions v-if="state === 'done'" class="pa-3">
        <v-btn variant="text" :disabled="busy" @click="runCheck">
          <v-icon start>mdi-refresh</v-icon>{{ t('diag.recheck') }}
        </v-btn>
        <v-spacer />
        <v-btn variant="tonal" color="primary" :disabled="busy" @click="close">{{ t('diag.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/app'
import { useT } from '../i18n/useT'

const appStore = useAppStore()
const t = useT()
const open = computed({
  get: () => appStore.showDiagnoseEsp32,
  set: (v) => { appStore.showDiagnoseEsp32 = v },
})

const state = ref('idle')      // 'idle' | 'running' | 'done'
const report = ref(null)
const busyKind = ref(null)     // null | 'clearCache' | 'reinstallEsp32'
const fixNote = ref('')

const busy = computed(() => state.value === 'running' || busyKind.value !== null)
const failCount = computed(() => report.value?.checks.filter(c => c.status === 'fail').length || 0)

function statusIcon(s) {
  return s === 'ok'   ? 'mdi-check'
       : s === 'fail' ? 'mdi-close-circle'
       : s === 'warn' ? 'mdi-alert'
       : 'mdi-information-outline'
}
function statusColor(s) {
  return s === 'ok'   ? 'success'
       : s === 'fail' ? 'error'
       : s === 'warn' ? 'warning'
       : 'info'
}

async function runCheck() {
  if (!window.lotusAPI?.diagnostics) {
    appStore.log('Diagnostics IPC unavailable — please rebuild', 'error')
    return
  }
  state.value = 'running'
  fixNote.value = ''
  try {
    report.value = await window.lotusAPI.diagnostics.runEsp32Check()
  } catch (e) {
    appStore.log('Diagnostics failed: ' + (e?.message || e), 'error')
    report.value = { ok: false, checks: [], generatedAt: new Date().toISOString() }
  }
  state.value = 'done'
}

async function doClearCache() {
  busyKind.value = 'clearCache'
  try {
    const r = await window.lotusAPI.diagnostics.clearBuildCache()
    fixNote.value = r?.ok ? t('diag.cleared_ok') : t('diag.cleared_fail')
    appStore.log(fixNote.value, r?.ok ? 'success' : 'error')
    await runCheck()
  } finally {
    busyKind.value = null
  }
}

async function doAddDefenderExclusion() {
  busyKind.value = 'addDefenderExclusion'
  try {
    const r = await window.lotusAPI.diagnostics.addDefenderExclusion()
    if (r?.ok) {
      fixNote.value = t('diag.defender_ok')
      appStore.log(fixNote.value, 'success')
    } else if (r?.cancelled) {
      fixNote.value = t('diag.defender_cancel')
      appStore.log(fixNote.value, 'info')
    } else {
      fixNote.value = t('diag.defender_fail', r?.error || 'unknown')
      appStore.log(fixNote.value, 'error')
    }
    // Defender preferences sometimes need a beat to propagate.
    await new Promise(r => setTimeout(r, 1500))
    await runCheck()
  } finally {
    busyKind.value = null
  }
}

async function doRemoveEsp32() {
  if (!window.confirm(t('diag.confirm_remove_core'))) return
  busyKind.value = 'reinstallEsp32'
  try {
    const r = await window.lotusAPI.diagnostics.removeEsp32Core()
    if (r?.ok) {
      fixNote.value = t('diag.removed_core_ok')
      appStore.log(fixNote.value, 'success')
    } else {
      fixNote.value = t('diag.removed_core_fail')
      appStore.log(fixNote.value, 'error')
    }
    await runCheck()
  } finally {
    busyKind.value = null
  }
}

function formatTime(iso) {
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

async function copyReport() {
  if (!report.value) return
  const lines = [
    `Lotus IDE ESP32 health check — ${formatTime(report.value.generatedAt)}`,
    '',
    ...report.value.checks.map(c =>
      `[${c.status.toUpperCase().padEnd(4)}] ${c.label}\n        ${c.detail}` +
      (c.fix ? `\n        Fix: ${c.fix.text}` : '')
    ),
  ]
  const text = lines.join('\n')
  try {
    await navigator.clipboard.writeText(text)
    appStore.log(t('diag.copy_success'), 'success')
  } catch {
    appStore.log(t('diag.copy_fail'), 'error')
  }
}

function close() { open.value = false }
</script>

<style scoped>
.dx-card { border-radius: 8px; }
.dx-header {
  display: flex; align-items: center;
  font-weight: 600;
  background: rgba(var(--v-theme-primary), 0.06);
}
.dx-intro { font-size: 13px; color: rgba(0,0,0,0.6); margin-bottom: 16px; }
.dx-cta { display: flex; justify-content: center; padding: 24px 0; }
.dx-running {
  display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 36px 0;
}
.dx-running-text { font-size: 14px; color: rgba(0,0,0,0.6); }
.dx-summary {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  border-radius: 6px;
  background: rgba(0,0,0,0.03);
  margin-bottom: 12px;
}
.dx-summary.ok   { background: rgba(76, 175, 80, 0.08); }
.dx-summary.fail { background: rgba(244, 67, 54, 0.08); }
.dx-summary-line { font-weight: 600; font-size: 15px; }
.dx-summary-sub  { font-size: 11px; color: rgba(0,0,0,0.55); }

.dx-table { display: flex; flex-direction: column; gap: 4px; }
.dx-row {
  display: flex; gap: 10px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0,0,0,0.025);
}
.dx-row.sev-fail { background: rgba(244, 67, 54, 0.07); }
.dx-row.sev-warn { background: rgba(255, 152, 0, 0.07); }
.dx-row-status   { padding-top: 2px; }
.dx-row-body     { flex: 1; min-width: 0; }
.dx-row-label    { font-weight: 500; font-size: 13px; }
.dx-row-detail   {
  font-size: 11px; color: rgba(0,0,0,0.6);
  font-family: ui-monospace, Consolas, monospace;
  word-break: break-all;
  margin-top: 2px;
}
.dx-row-fix {
  margin-top: 6px;
  font-size: 11px; color: rgba(0,0,0,0.7);
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.dx-fix-ico { opacity: 0.6; }
</style>
