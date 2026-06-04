<template>
  <v-dialog v-model="appStore.showUpdater" max-width="560">
    <v-card>
      <v-card-title class="up-header">
        <v-icon class="mr-2">mdi-cloud-download-outline</v-icon>
        Software Update
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="appStore.showUpdater = false" />
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- Status row -->
        <div class="status-row">
          <v-icon :color="statusColor" size="28">{{ statusIcon }}</v-icon>
          <div class="status-text">
            <div class="status-title">{{ statusTitle }}</div>
            <div v-if="store.state.message" class="status-msg">{{ store.state.message }}</div>
          </div>
        </div>

        <!-- Download progress -->
        <v-progress-linear
          v-if="store.isDownloading"
          :model-value="store.state.percent"
          color="primary"
          height="8"
          rounded
          class="mt-3"
        />

        <!-- Release notes -->
        <div v-if="store.state.releaseNotes" class="release-notes">
          <div class="release-title">Release notes (v{{ store.state.version }})</div>
          <pre class="release-body">{{ store.state.releaseNotes }}</pre>
        </div>

        <!-- Action buttons -->
        <div class="actions">
          <v-spacer />
          <v-btn
            v-if="['idle', 'up-to-date', 'error'].includes(store.state.status)"
            :loading="store.state.status === 'checking'"
            variant="tonal" color="primary"
            prepend-icon="mdi-refresh"
            @click="store.check"
          >
            Check now
          </v-btn>

          <v-btn
            v-if="store.isAvailable"
            variant="tonal" color="primary"
            prepend-icon="mdi-download"
            @click="store.download"
          >
            Download v{{ store.state.version }}
          </v-btn>

          <v-btn
            v-if="store.isDownloaded"
            variant="flat" color="success"
            prepend-icon="mdi-restart"
            @click="confirmInstall"
          >
            Restart and install
          </v-btn>
        </div>

        <!-- Dev hint -->
        <v-alert
          v-if="store.isDisabled"
          type="info" density="compact" variant="tonal" class="mt-3"
        >
          Auto-update runs only in installed builds. Use <code>npm run build</code>
          and install the resulting .exe to test the update flow.
        </v-alert>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { useUpdaterStore } from '../stores/updater'

const appStore = useAppStore()
const store = useUpdaterStore()

onMounted(() => { store.setupListener(); store.refresh() })

const statusIcon = computed(() => ({
  idle:        'mdi-information-outline',
  disabled:    'mdi-cloud-off-outline',
  checking:    'mdi-cloud-sync-outline',
  available:   'mdi-cloud-download-outline',
  'up-to-date':'mdi-check-circle-outline',
  downloading: 'mdi-progress-download',
  downloaded:  'mdi-package-down',
  error:       'mdi-alert-circle-outline',
})[store.state.status] || 'mdi-information-outline')

const statusColor = computed(() => ({
  available:   'primary',
  'up-to-date':'success',
  downloaded:  'success',
  error:       'error',
  disabled:    'grey',
})[store.state.status] || 'primary')

const statusTitle = computed(() => ({
  idle:        'Ready to check',
  disabled:    'Auto-update disabled (dev mode)',
  checking:    'Checking GitHub Releases…',
  available:   `Update available: v${store.state.version}`,
  'up-to-date':'You are up to date',
  downloading: `Downloading… ${store.state.percent}%`,
  downloaded:  'Update ready — restart to apply',
  error:       'Update error',
})[store.state.status] || store.state.status)

function confirmInstall() {
  if (!confirm('Restart Lotus IDE to install the update now?')) return
  store.install()
}
</script>

<style scoped>
.up-header { display: flex; align-items: center; padding: 12px 16px; }

.status-row { display: flex; align-items: center; gap: 14px; padding: 8px 0; }
.status-text { flex: 1; min-width: 0; }
.status-title { font-size: 14px; font-weight: 600; }
.status-msg { font-size: 12px; opacity: 0.75; }

.release-notes { margin-top: 16px; padding: 12px; background: rgba(0,0,0,0.08); border-radius: 8px; }
.release-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; }
.release-body { font-family: 'Fira Code', 'Consolas', monospace; font-size: 12px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; margin-top: 6px; max-height: 200px; overflow: auto; }

.actions { display: flex; gap: 8px; margin-top: 16px; }
</style>
