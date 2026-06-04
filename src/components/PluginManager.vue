<template>
  <v-dialog v-model="appStore.showPluginManager" max-width="780" scrollable>
    <v-card class="plugin-dialog">
      <v-card-title class="plugin-dialog-header">
        <v-icon class="mr-2">mdi-puzzle-outline</v-icon>
        Plugins
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="appStore.showPluginManager = false" />
      </v-card-title>

      <v-tabs v-model="tab" density="compact" color="primary">
        <v-tab value="installed">Installed</v-tab>
        <v-tab value="catalog">Available</v-tab>
        <v-tab value="github">From GitHub</v-tab>
        <v-tab value="settings">Settings</v-tab>
      </v-tabs>

      <v-card-text class="pa-3">
        <!-- INSTALLED -->
        <div v-if="tab === 'installed'">
          <div class="row-actions">
            <v-btn
              size="small" variant="tonal" color="primary"
              prepend-icon="mdi-upload"
              :loading="installing"
              @click="installFromFile"
            >
              Install from .zip
            </v-btn>
            <v-spacer />
            <v-btn size="small" variant="text" :loading="pluginStore.busy" prepend-icon="mdi-refresh" @click="pluginStore.refresh">
              Refresh
            </v-btn>
          </div>

          <div v-if="pluginStore.installed.length === 0" class="empty">
            <v-icon size="48" color="grey-lighten-1">mdi-puzzle-outline</v-icon>
            <div class="empty-text">No plugins installed yet.</div>
            <div class="empty-hint">Use <b>Available</b> or <b>From GitHub</b> tab to install one.</div>
            <code class="plugin-path">{{ pluginsRoot }}</code>
          </div>

          <div v-else class="plugin-list">
            <div v-for="p in pluginStore.installed" :key="p.manifest.id" class="plugin-row">
              <div class="plugin-icon">
                <img v-if="p.iconUrl" :src="p.iconUrl" alt="" />
                <v-icon v-else size="28">mdi-puzzle-outline</v-icon>
              </div>
              <div class="plugin-meta">
                <div class="plugin-name">
                  {{ p.manifest.name }}
                  <span class="plugin-version">v{{ p.manifest.version }}</span>
                </div>
                <div class="plugin-desc">{{ p.manifest.description || p.manifest.id }}</div>
                <div v-if="p.status === 'error'" class="plugin-error">
                  <v-icon size="14" color="error">mdi-alert-circle-outline</v-icon>
                  {{ p.error }}
                </div>
                <div v-else class="plugin-blocks">
                  {{ p.blockTypes?.length || 0 }} block(s) registered
                </div>
              </div>
              <v-chip
                size="x-small"
                :color="p.status === 'loaded' ? 'success' : 'error'"
                variant="tonal" class="status-chip"
              >
                {{ p.status }}
              </v-chip>
              <v-btn
                icon="mdi-delete-outline" size="small" variant="text"
                color="error"
                @click="confirmUninstall(p)"
              />
            </div>
          </div>
        </div>

        <!-- CATALOG -->
        <div v-else-if="tab === 'catalog'">
          <div class="row-actions">
            <v-btn size="small" variant="tonal" :loading="market.busy" prepend-icon="mdi-cloud-download-outline" @click="market.fetchCatalog">
              Fetch catalog
            </v-btn>
            <v-spacer />
            <code class="plugin-path">{{ market.catalogUrl }}</code>
          </div>

          <div v-if="market.catalog.length === 0" class="empty">
            <v-icon size="48" color="grey-lighten-1">mdi-cloud-search-outline</v-icon>
            <div class="empty-text">No catalog loaded.</div>
            <div class="empty-hint">Click <b>Fetch catalog</b> above.</div>
          </div>

          <div v-else class="plugin-list">
            <div v-for="e in market.catalog" :key="e.id" class="plugin-row">
              <div class="plugin-icon">
                <img v-if="e.icon" :src="e.icon" alt="" />
                <v-icon v-else size="28">mdi-package-down</v-icon>
              </div>
              <div class="plugin-meta">
                <div class="plugin-name">
                  {{ e.name || e.id }}
                  <span v-if="e.version" class="plugin-version">v{{ e.version }}</span>
                </div>
                <div class="plugin-desc">{{ e.description || '' }}</div>
                <div v-if="e.author" class="plugin-blocks">by {{ e.author }}</div>
              </div>
              <v-btn
                size="small" variant="tonal" color="primary"
                :loading="installingId === e.id"
                @click="installFromCatalog(e)"
              >
                Install
              </v-btn>
            </div>
          </div>
        </div>

        <!-- FROM GITHUB -->
        <div v-else-if="tab === 'github'">
          <div class="row-title">Install from GitHub repository</div>
          <div class="row-desc">
            Paste a GitHub URL or <code>owner/repo</code>. The latest release's
            <code>.zip</code> asset will be downloaded and installed.
          </div>

          <v-text-field
            v-model="repoSpec"
            density="compact" variant="outlined" hide-details
            placeholder="https://github.com/owner/lotus-my-plugin   or   owner/lotus-my-plugin"
            class="mt-3"
            @keydown.enter="installFromGithub"
          />

          <div class="row-actions mt-2">
            <v-spacer />
            <v-btn
              size="small" variant="tonal" color="primary"
              :loading="market.busy"
              prepend-icon="mdi-github"
              @click="installFromGithub"
            >
              Install latest release
            </v-btn>
          </div>

          <v-alert type="info" density="compact" variant="tonal" class="mt-3">
            The plugin maintainer needs to attach a <b>.zip</b> file to their
            GitHub release. The zip must contain <code>lotus-plugin.json</code>
            and <code>index.js</code> at its root.
          </v-alert>
        </div>

        <!-- SETTINGS -->
        <div v-else-if="tab === 'settings'" class="settings-pane">
          <div class="row-title">Plugin catalog URL</div>
          <div class="row-desc">JSON array of plugin entries with <code>downloadUrl</code>.</div>
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
import { ref, onMounted, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { usePluginStore } from '../stores/plugins'
import { usePluginMarketplaceStore } from '../stores/pluginMarketplace'
import JSZip from 'jszip'

const appStore = useAppStore()
const pluginStore = usePluginStore()
const market = usePluginMarketplaceStore()

const tab = ref('installed')
const installing = ref(false)
const installingId = ref(null)
const pluginsRoot = ref('')
const repoSpec = ref('')
const catalogUrlInput = ref(market.catalogUrl)

onMounted(async () => {
  if (window.lotusAPI?.plugins) pluginsRoot.value = await window.lotusAPI.plugins.root()
})

watch(() => appStore.showPluginManager, (v) => {
  if (v) catalogUrlInput.value = market.catalogUrl
})

async function installFromFile() {
  if (!window.lotusAPI?.plugins) { appStore.log('Plugin API not available', 'error'); return }
  installing.value = true
  try {
    const picked = await window.lotusAPI.plugins.pickPackage()
    if (picked.canceled) return

    const zip = await JSZip.loadAsync(Uint8Array.from(atob(picked.base64), c => c.charCodeAt(0)))
    const manifestEntry = zip.file('lotus-plugin.json')
    if (!manifestEntry) throw new Error('lotus-plugin.json missing in archive')

    const manifestText = await manifestEntry.async('text')
    const manifest = JSON.parse(manifestText)

    const files = { 'lotus-plugin.json': manifestText }
    for (const [name, entry] of Object.entries(zip.files)) {
      if (entry.dir || name === 'lotus-plugin.json') continue
      const ext = name.toLowerCase().split('.').pop()
      if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
        files[name + '?base64'] = await entry.async('base64')
      } else {
        files[name] = await entry.async('text')
      }
    }

    const res = await pluginStore.installFromFiles(manifest.id, files)
    if (res?.ok) appStore.log(`Installed plugin: ${manifest.name}`, 'success')
    else appStore.log(`Install failed: ${res?.error || 'unknown'}`, 'error')
  } catch (e) {
    appStore.log(`Install failed: ${e.message}`, 'error')
  } finally {
    installing.value = false
  }
}

async function installFromCatalog(entry) {
  installingId.value = entry.id
  try { await market.installFromCatalog(entry) }
  finally { installingId.value = null }
}

async function installFromGithub() {
  if (!repoSpec.value.trim()) return
  const res = await market.installFromGithubRepo(repoSpec.value.trim())
  if (res?.ok) repoSpec.value = ''
}

async function confirmUninstall(p) {
  if (!confirm(`Uninstall "${p.manifest.name}"?`)) return
  const res = await pluginStore.uninstall(p.manifest.id)
  if (res?.ok) appStore.log(`Uninstalled: ${p.manifest.name}`, 'info')
  else appStore.log(`Uninstall failed: ${res?.error || 'unknown'}`, 'error')
}

function saveCatalogUrl() {
  market.setCatalogUrl(catalogUrlInput.value.trim())
  appStore.log('Plugin catalog URL saved', 'success')
}

function resetCatalogUrl() {
  catalogUrlInput.value = 'https://raw.githubusercontent.com/lotus-arduibot/lotus-plugins/main/catalog.json'
  saveCatalogUrl()
}
</script>

<style scoped>
.plugin-dialog { max-height: 80vh; }
.plugin-dialog-header { display: flex; align-items: center; padding: 12px 16px; }

.row-actions { display: flex; align-items: center; gap: 8px; padding: 8px 4px; }
.row-title { font-size: 14px; font-weight: 600; }
.row-desc { font-size: 12px; opacity: 0.75; line-height: 1.5; margin-top: 4px; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 32px 16px; gap: 8px; }
.empty-text { font-size: 14px; opacity: 0.7; }
.empty-hint { font-size: 12px; opacity: 0.6; margin-top: 8px; }
.plugin-path { font-family: 'Fira Code', 'Consolas', monospace; font-size: 11px; background: rgba(0,0,0,0.1); padding: 4px 8px; border-radius: 4px; word-break: break-all; max-width: 90%; }

.plugin-list { display: flex; flex-direction: column; gap: 6px; }
.plugin-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; }
.plugin-icon { width: 40px; height: 40px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 6px; }
.plugin-icon img { width: 32px; height: 32px; object-fit: contain; }
.plugin-meta { flex: 1; min-width: 0; }
.plugin-name { font-size: 14px; font-weight: 600; }
.plugin-version { font-size: 11px; opacity: 0.5; font-weight: 400; margin-left: 6px; }
.plugin-desc { font-size: 12px; opacity: 0.7; }
.plugin-blocks { font-size: 11px; opacity: 0.5; margin-top: 2px; }
.plugin-error { font-size: 11px; color: rgb(var(--v-theme-error)); display: flex; align-items: center; gap: 4px; margin-top: 2px; }
.status-chip { text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }

.settings-pane { padding: 8px 4px; }
</style>
