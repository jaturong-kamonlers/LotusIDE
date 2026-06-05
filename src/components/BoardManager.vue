<template>
  <v-dialog v-model="appStore.showBoardManager" max-width="780" scrollable>
    <v-card class="bm-dialog">
      <v-card-title class="bm-header">
        <v-icon class="mr-2">mdi-developer-board</v-icon>
        Manage Boards
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="appStore.showBoardManager = false" />
      </v-card-title>

      <v-tabs v-model="tab" density="compact" color="primary">
        <v-tab value="installed">Installed</v-tab>
        <v-tab value="catalog">Available</v-tab>
        <v-tab value="github">From GitHub</v-tab>
        <v-tab value="cores">Cores</v-tab>
        <v-tab value="settings">Settings</v-tab>
      </v-tabs>

      <v-card-text class="pa-3">
        <!-- INSTALLED -->
        <div v-if="tab === 'installed'">
          <div class="row-actions">
            <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-upload" @click="installFromFile">
              Install from .zip
            </v-btn>
            <v-spacer />
            <v-btn size="small" variant="text" :loading="store.busy" prepend-icon="mdi-refresh" @click="store.refresh">
              Refresh
            </v-btn>
          </div>

          <div v-if="store.installed.length === 0" class="empty">
            <v-icon size="48" color="grey-lighten-1">mdi-developer-board</v-icon>
            <div class="empty-text">No user-installed boards.</div>
            <div class="empty-hint">Built-in boards remain available regardless.</div>
            <code class="path">{{ store.userRoot }}</code>
          </div>

          <div v-else class="row-list">
            <div v-for="b in store.installed" :key="b.id" class="board-row">
              <v-icon size="28">mdi-developer-board</v-icon>
              <div class="row-meta">
                <div class="row-title">
                  {{ b.manifest?.title || b.manifest?.name || b.id }}
                  <span v-if="b.manifest?.version" class="row-ver">v{{ b.manifest.version }}</span>
                </div>
                <div class="row-desc">{{ b.manifest?.description || b.id }}</div>
                <div v-if="!b.ok" class="row-err">
                  <v-icon size="14" color="error">mdi-alert-circle-outline</v-icon>
                  {{ b.error }}
                </div>
              </div>
              <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" @click="confirmUninstall(b)" />
            </div>
          </div>
        </div>

        <!-- CATALOG -->
        <div v-else-if="tab === 'catalog'">
          <div class="row-actions">
            <v-btn size="small" variant="tonal" :loading="store.busy" prepend-icon="mdi-cloud-download-outline" @click="store.fetchCatalog">
              Fetch catalog
            </v-btn>
            <v-spacer />
            <code class="path">{{ store.catalogUrl }}</code>
          </div>

          <div v-if="store.catalog.length === 0" class="empty">
            <v-icon size="48" color="grey-lighten-1">mdi-cloud-search-outline</v-icon>
            <div class="empty-text">No catalog loaded.</div>
            <div class="empty-hint">Click <b>Fetch catalog</b> to download the list of available boards.</div>
          </div>

          <div v-else class="row-list">
            <div v-for="e in store.catalog" :key="e.id" class="board-row">
              <v-icon size="28">mdi-package-down</v-icon>
              <div class="row-meta">
                <div class="row-title">
                  {{ e.name || e.id }}
                  <span v-if="e.version" class="row-ver">v{{ e.version }}</span>
                </div>
                <div class="row-desc">{{ e.description || '' }}</div>
              </div>
              <v-btn
                size="small" variant="tonal" color="primary"
                :loading="downloading === e.id"
                @click="install(e)"
              >
                Install
              </v-btn>
            </div>
          </div>
        </div>

        <!-- FROM GITHUB -->
        <div v-else-if="tab === 'github'">
          <div class="row-title">Install board package from GitHub</div>
          <div class="row-desc">
            Paste a GitHub URL or <code>owner/repo</code>. The latest release's
            <code>.zip</code> asset will be downloaded and installed as a board.
          </div>
          <v-text-field
            v-model="repoSpec"
            density="compact" variant="outlined" hide-details
            placeholder="https://github.com/owner/lotus-my-board   or   owner/lotus-my-board"
            class="mt-3"
            @keydown.enter="installFromGithub"
          />
          <div class="row-actions mt-2">
            <v-spacer />
            <v-btn
              size="small" variant="tonal" color="primary"
              :loading="store.busy"
              prepend-icon="mdi-github"
              @click="installFromGithub"
            >
              Install latest release
            </v-btn>
          </div>
          <v-alert type="info" density="compact" variant="tonal" class="mt-3">
            The board package zip must contain <code>config.js</code> at the
            root (KBIDE-format). It will be installed under the repo name as the
            board id.
          </v-alert>
        </div>

        <!-- CORES (Arduino platform cores, e.g. ESP32) -->
        <div v-else-if="tab === 'cores'">
          <div class="row-title">Arduino cores</div>
          <div class="row-desc">
            Cores are the compiler toolchains for each board family. AVR and
            SAM ship with LotusIDE. ESP32 is downloaded on demand to keep the
            installer small — install it here ahead of time if you're prepping
            a classroom or know you'll be offline.
          </div>

          <div v-if="cores.length === 0" class="empty">
            <v-icon size="48" color="grey-lighten-1">mdi-chip</v-icon>
            <div class="empty-text">Loading core list…</div>
          </div>

          <div v-else class="row-list mt-3">
            <div v-for="c in cores" :key="c.pkg" class="board-row">
              <v-icon size="28">mdi-chip</v-icon>
              <div class="row-meta">
                <div class="row-title">
                  {{ c.label }}
                  <span class="row-ver">{{ c.pkg }}</span>
                </div>
                <div class="row-desc">
                  Download ~{{ c.downloadMb }} MB · on disk ~{{ c.diskMb }} MB
                </div>
              </div>
              <v-chip v-if="c.installed" size="small" color="success" variant="tonal">
                <v-icon start size="14">mdi-check</v-icon>
                Installed
              </v-chip>
              <v-btn
                v-else
                size="small" variant="tonal" color="primary"
                :loading="installingCore === c.pkg"
                prepend-icon="mdi-cloud-download-outline"
                @click="installCore(c)"
              >
                Download
              </v-btn>
            </div>
          </div>

          <v-alert type="info" density="compact" variant="tonal" class="mt-4">
            ESP32 takes ~20–25 min on a typical home connection. The progress
            dialog will show live arduino-cli output.
          </v-alert>
        </div>

        <!-- SETTINGS -->
        <div v-else-if="tab === 'settings'" class="settings-pane">
          <div class="row-title">Catalog URL</div>
          <div class="row-desc">JSON array of entries: <code>{ id, name, version, description, downloadUrl }</code></div>
          <v-text-field
            v-model="catalogUrlInput"
            density="compact" variant="outlined" hide-details
            class="mt-2"
          />
          <div class="row-actions mt-2">
            <v-btn size="small" variant="tonal" color="primary" @click="saveCatalogUrl">Save</v-btn>
            <v-btn size="small" variant="text" @click="resetCatalogUrl">Reset to default</v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { useBoardManagerStore } from '../stores/boardManager'

const appStore = useAppStore()
const store = useBoardManagerStore()
const tab = ref('installed')
const downloading = ref(null)
const catalogUrlInput = ref(store.catalogUrl)
const repoSpec = ref('')
const cores = ref([])
const installingCore = ref(null)

async function refreshCores() {
  if (!window.lotusAPI?.arduino?.coreList) return
  cores.value = await window.lotusAPI.arduino.coreList()
}

async function installCore(c) {
  installingCore.value = c.pkg
  try {
    const res = await window.lotusAPI.arduino.installCore(c.pkg)
    if (res?.ok) appStore.log(`Core ${c.pkg} ready`, 'success')
    else        appStore.log(`Core install failed: ${res?.error || 'unknown'}`, 'error')
  } catch (e) {
    appStore.log(`Core install failed: ${e.message}`, 'error')
  } finally {
    installingCore.value = null
    await refreshCores()
  }
}

async function installFromGithub() {
  if (!repoSpec.value.trim()) return
  const res = await store.installFromGithubRepo(repoSpec.value.trim())
  if (res?.ok) repoSpec.value = ''
}

watch(() => appStore.showBoardManager, (v) => {
  if (v) {
    store.refresh()
    refreshCores()
    catalogUrlInput.value = store.catalogUrl
  }
})

watch(tab, (v) => {
  if (v === 'cores') refreshCores()
})

async function installFromFile() {
  const res = await store.installFromFile()
  if (res?.canceled) return
  if (res?.ok) {
    appStore.log('Board installed', 'success')
    await store.refresh()
  } else {
    appStore.log(`Install failed: ${res?.error || 'unknown'}`, 'error')
  }
}

async function install(entry) {
  downloading.value = entry.id
  try {
    const res = await store.downloadAndInstall(entry)
    if (res?.ok) {
      appStore.log(`Installed board: ${entry.name || entry.id}`, 'success')
      await store.refresh()
    } else {
      appStore.log(`Install failed: ${res?.error || 'unknown'}`, 'error')
    }
  } catch (e) {
    appStore.log(`Install failed: ${e.message}`, 'error')
  } finally {
    downloading.value = null
  }
}

async function confirmUninstall(b) {
  if (!confirm(`Uninstall board "${b.manifest?.name || b.id}"?`)) return
  const res = await store.uninstall(b.id)
  if (res?.ok) { appStore.log(`Uninstalled: ${b.id}`, 'info'); await store.refresh() }
  else appStore.log(`Uninstall failed: ${res?.error || 'unknown'}`, 'error')
}

function saveCatalogUrl() {
  store.setCatalogUrl(catalogUrlInput.value.trim())
  appStore.log('Catalog URL saved', 'success')
}

function resetCatalogUrl() {
  catalogUrlInput.value = 'https://raw.githubusercontent.com/lotus-arduibot/lotus-boards/main/catalog.json'
  saveCatalogUrl()
}
</script>

<style scoped>
.bm-dialog { max-height: 80vh; }
.bm-header { display: flex; align-items: center; padding: 12px 16px; }

.row-actions { display: flex; align-items: center; gap: 8px; padding: 8px 4px; }
.path { font-family: 'Fira Code', 'Consolas', monospace; font-size: 11px; background: rgba(0,0,0,0.1); padding: 4px 8px; border-radius: 4px; word-break: break-all; max-width: 360px; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 32px 16px; gap: 8px; }
.empty-text { font-size: 14px; opacity: 0.7; }
.empty-hint { font-size: 12px; opacity: 0.6; }

.row-list { display: flex; flex-direction: column; gap: 6px; }
.board-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; }
.row-meta { flex: 1; min-width: 0; }
.row-title { font-size: 14px; font-weight: 600; }
.row-ver { font-size: 11px; opacity: 0.5; font-weight: 400; margin-left: 6px; }
.row-desc { font-size: 12px; opacity: 0.7; }
.row-err { font-size: 11px; color: rgb(var(--v-theme-error)); display: flex; align-items: center; gap: 4px; margin-top: 2px; }

.settings-pane { padding: 8px 4px; }
</style>
