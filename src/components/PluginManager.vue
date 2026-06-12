<template>
  <v-dialog v-model="appStore.showPluginManager" max-width="780" scrollable>
    <v-card class="plugin-dialog">
      <v-card-title class="plugin-dialog-header">
        <v-icon class="mr-2">mdi-puzzle-outline</v-icon>
        Plugin Setup
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="appStore.showPluginManager = false" />
      </v-card-title>

      <v-tabs v-model="tab" density="compact" color="primary">
        <v-tab value="setup">Plugins</v-tab>
        <v-tab value="github">From GitHub</v-tab>
        <v-tab value="settings">Settings</v-tab>
      </v-tabs>

      <v-card-text class="pa-3">
        <!-- UNIFIED PLUGIN LIST: installed + available -->
        <div v-if="tab === 'setup'">
          <div class="row-actions">
            <v-btn
              size="small" variant="tonal" color="primary"
              prepend-icon="mdi-upload"
              :loading="installing"
              @click="installFromFile"
            >
              Install from .zip
            </v-btn>
            <v-btn size="small" variant="tonal" :loading="market.busy" prepend-icon="mdi-cloud-download-outline" @click="market.fetchCatalog">
              Fetch catalog
            </v-btn>
            <v-spacer />
            <v-btn size="small" variant="text" :loading="pluginStore.busy" prepend-icon="mdi-refresh" @click="refreshAll">
              Refresh
            </v-btn>
          </div>

          <div v-if="unifiedPlugins.length === 0" class="empty">
            <v-icon size="48" color="grey-lighten-1">mdi-puzzle-outline</v-icon>
            <div class="empty-text">No plugins yet.</div>
            <div class="empty-hint">Click <b>Fetch catalog</b> to browse, or <b>Install from .zip</b>.</div>
            <code class="plugin-path">{{ pluginsRoot }}</code>
          </div>

          <div v-else class="plugin-list">
            <div v-for="row in unifiedPlugins" :key="row.id" class="plugin-row">
              <div class="plugin-icon">
                <img v-if="row.icon" :src="row.icon" alt="" />
                <v-icon v-else size="28">{{ row.kind === 'available' ? 'mdi-package-down' : 'mdi-puzzle-outline' }}</v-icon>
              </div>
              <div class="plugin-meta">
                <div class="plugin-name">
                  {{ row.name || row.id }}
                  <span v-if="row.version" class="plugin-version">v{{ row.version }}</span>
                  <v-chip
                    v-if="row.kind === 'update'" size="x-small" variant="tonal" color="warning" class="ml-2"
                  >Update v{{ row.catalogVersion }}</v-chip>
                  <v-chip
                    v-else-if="row.kind === 'installed'" size="x-small" variant="tonal"
                    :color="row.status === 'loaded' ? 'success' : 'error'" class="ml-2"
                  >{{ row.status === 'loaded' ? 'Installed' : row.status }}</v-chip>
                  <v-chip
                    v-if="row.category" size="x-small" variant="tonal"
                    color="primary" class="ml-1"
                  >{{ row.category }}</v-chip>
                  <v-chip
                    v-for="p in (row.platforms || [])" :key="p"
                    size="x-small" variant="outlined" class="ml-1"
                    :color="appStore.selectedBoard?.platform === p ? 'success' : undefined"
                  >{{ p.replace('arduino-', '') }}</v-chip>
                </div>
                <div class="plugin-desc">{{ row.description || '' }}</div>
                <div v-if="row.error" class="plugin-error">
                  <v-icon size="14" color="error">mdi-alert-circle-outline</v-icon>
                  {{ row.error }}
                </div>
                <div v-else-if="row.kind === 'installed' && row.blockTypes !== undefined" class="plugin-blocks">
                  {{ row.blockTypes?.length || 0 }} block(s) registered
                </div>
                <div v-else-if="row.author" class="plugin-blocks">by {{ row.author }}</div>
              </div>
              <!-- Available → Install -->
              <v-btn
                v-if="row.kind === 'available'"
                size="small" variant="tonal" color="primary"
                :loading="installingId === row.id"
                :disabled="!isCompatible(row)"
                :title="isCompatible(row) ? '' : `Requires: ${(row.platforms || []).join(', ')}`"
                @click="installFromCatalog(row.catalogEntry)"
              >{{ isCompatible(row) ? 'Install' : 'Incompatible' }}</v-btn>
              <!-- Update available → Update -->
              <v-btn
                v-else-if="row.kind === 'update'"
                size="small" variant="tonal" color="warning"
                :loading="installingId === row.id"
                @click="installFromCatalog(row.catalogEntry)"
              >Update</v-btn>
              <!-- Installed → publish + uninstall -->
              <template v-else-if="row.kind === 'installed'">
                <v-btn
                  icon="mdi-github" size="small" variant="text"
                  color="primary"
                  :title="row.status === 'loaded' ? 'Publish to GitHub' : 'Plugin must load before publishing'"
                  :disabled="row.status !== 'loaded'"
                  @click="openPublishDialog(row.installed)"
                />
                <v-btn
                  icon="mdi-delete-outline" size="small" variant="text"
                  color="error"
                  @click="confirmUninstall(row.installed)"
                />
              </template>
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

    <!-- PUBLISH DIALOG (sibling of the main plugin-manager dialog, not inside
         the v-if/v-else-if tab chain — Vue's v-else-if requires the previous
         sibling to be the matching v-if). -->
    <v-dialog v-model="publishDialog" max-width="540" persistent>
      <v-card v-if="publishTarget">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-github</v-icon>
          Publish {{ publishTarget.manifest.name }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" :disabled="publishing" @click="publishDialog = false" />
        </v-card-title>
        <v-card-text>
          <div class="text-body-2 mb-3">
            Bundle this plugin and push it to your GitHub as a versioned release.
            Anyone can then install it via <b>Lotus → Plugins → From GitHub</b> using the
            <code>owner/repo</code> spec.
          </div>
          <v-text-field
            v-model="publishRepoName"
            label="Repository name"
            density="compact" variant="outlined" hide-details
            class="mb-3" :disabled="publishing"
          />
          <v-radio-group v-model="publishPrivate" hide-details density="compact" :disabled="publishing">
            <v-radio :value="false" label="Public — anyone can install" color="primary" />
            <v-radio :value="true"  label="Private — only you can install" color="primary" />
          </v-radio-group>
          <v-alert v-if="publishError" type="error" density="compact" variant="tonal" class="mt-3">
            {{ publishError }}
          </v-alert>
          <v-alert v-if="publishResult" type="success" density="compact" variant="tonal" class="mt-3">
            <div class="mb-1">Published to <a :href="publishResult.repoUrl" target="_blank">{{ publishResult.installSpec }}</a> as tag {{ publishResult.tag }}.</div>
            <div>Share spec to install: <code>{{ publishResult.installSpec }}</code></div>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="publishing" @click="publishDialog = false">{{ publishResult ? 'Close' : 'Cancel' }}</v-btn>
          <v-btn
            v-if="!publishResult"
            color="primary" variant="flat"
            :loading="publishing"
            :disabled="!publishRepoName.trim()"
            @click="publishPlugin"
          >Publish</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { usePluginStore } from '../stores/plugins'
import { usePluginMarketplaceStore } from '../stores/pluginMarketplace'
import JSZip from 'jszip'

const appStore = useAppStore()
const pluginStore = usePluginStore()
const market = usePluginMarketplaceStore()

const tab = ref('setup')
const installing = ref(false)
const installingId = ref(null)
const pluginsRoot = ref('')
const repoSpec = ref('')
const catalogUrlInput = ref(market.catalogUrl)

function compareVersions(a, b) {
  const ap = String(a || '0').split('.').map(n => parseInt(n, 10) || 0)
  const bp = String(b || '0').split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    const d = (ap[i] || 0) - (bp[i] || 0)
    if (d !== 0) return d
  }
  return 0
}

const unifiedPlugins = computed(() => {
  const rows = new Map()
  const catalogById = new Map((market.catalog || []).map(e => [e.id, e]))

  for (const p of (pluginStore.installed || [])) {
    const id = p.manifest?.id
    if (!id) continue
    const ce = catalogById.get(id)
    const upgradable = ce && compareVersions(ce.version, p.manifest.version) > 0
    rows.set(id, {
      id,
      name: p.manifest.name,
      description: p.manifest.description,
      version: p.manifest.version,
      icon: p.iconUrl,
      category: ce?.category,
      platforms: ce?.platforms,
      kind: upgradable ? 'update' : 'installed',
      status: p.status,
      error: p.error,
      blockTypes: p.blockTypes,
      catalogVersion: ce?.version,
      catalogEntry: ce,
      installed: p,
    })
  }

  for (const e of (market.catalog || [])) {
    if (rows.has(e.id)) continue
    rows.set(e.id, {
      id: e.id,
      name: e.name || e.id,
      description: e.description,
      version: e.version,
      icon: e.icon,
      category: e.category,
      platforms: e.platforms,
      author: e.author,
      kind: 'available',
      catalogEntry: e,
    })
  }

  const ORDER = { update: 0, installed: 1, available: 2 }
  return [...rows.values()].sort((a, b) => {
    const od = ORDER[a.kind] - ORDER[b.kind]
    return od !== 0 ? od : (a.name || a.id).localeCompare(b.name || b.id)
  })
})

async function refreshAll() {
  await pluginStore.refresh()
  await market.fetchCatalog()
}

// ── Publish-to-GitHub state ────────────────────────────────────────────────
const publishDialog = ref(false)
const publishTarget = ref(null)        // { manifest, ... } of the plugin row clicked
const publishRepoName = ref('')        // editable, prefilled with the plugin id
const publishPrivate = ref(false)
const publishing = ref(false)
const publishError = ref(null)
const publishResult = ref(null)        // { owner, repoName, tag, releaseUrl, downloadUrl, repoUrl, installSpec }

function openPublishDialog(p) {
  publishTarget.value = p
  publishRepoName.value = `lotus-plugin-${p.manifest.id.replace(/^com\.lotus\./, '').replace(/[^a-z0-9_-]/gi, '-')}`
  publishPrivate.value = false
  publishing.value = false
  publishError.value = null
  publishResult.value = null
  publishDialog.value = true
}

async function publishPlugin() {
  if (!publishTarget.value) return
  if (!window.lotusAPI?.plugins || !window.lotusAPI?.github) {
    publishError.value = 'Plugin or GitHub API not available'
    return
  }

  publishing.value = true
  publishError.value = null
  publishResult.value = null

  try {
    // Pull the live files for this plugin from disk so the zip we upload
    // matches exactly what the IDE has installed. plugins.get returns the
    // manifest, the entrySource (index.js) and the icon data URI — we then
    // walk the plugin directory by re-listing for any extra files (src/*).
    // The Web Plugin Loader's install path uses the same files map, so the
    // round-trip is install → publish → re-install with identical content.
    const pluginId = publishTarget.value.manifest.id
    const get = await window.lotusAPI.plugins.get(pluginId)
    if (!get?.ok) throw new Error(get?.error || 'Could not read plugin from disk')

    // Build the zip. JSZip mirrors plugins:installFromFiles' files map
    // convention — keys ending with `?base64` are binary.
    const zip = new JSZip()
    zip.file('lotus-plugin.json', JSON.stringify(get.manifest, null, 2))
    // entrySource is the plain-text JS we feed to the worker — write back as
    // the main file declared in the manifest (defaults to index.js).
    zip.file(get.manifest.main || 'index.js', get.entrySource)
    if (get.manifest.icon && get.iconDataUri) {
      // iconDataUri is `data:image/<type>;base64,<payload>` — extract payload.
      const m = /^data:[^;]+;base64,(.*)$/.exec(get.iconDataUri)
      if (m) zip.file(get.manifest.icon, m[1], { base64: true })
    }

    // The IDE's plugin folder may also contain src/ C++ headers and other
    // files (library.properties, README, etc). plugins.get only surfaces the
    // bits the loader needs, so for everything else we'd have to walk the
    // filesystem. For v1 of this feature we ship what plugins.get returns;
    // that covers the manifest + JS + icon, which is the minimum a plugin
    // needs to install. Users with C++ src/ should publish from the source
    // repo manually for now — a TODO marker for the next iteration.

    const zipBlob = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
    let zipBase64 = ''
    const chunk = 0x8000
    for (let i = 0; i < zipBlob.length; i += chunk) {
      zipBase64 += String.fromCharCode.apply(null, zipBlob.subarray(i, i + chunk))
    }
    zipBase64 = btoa(zipBase64)

    const res = await window.lotusAPI.github.publishPackage({
      repoName: publishRepoName.value.trim(),
      isPrivate: publishPrivate.value,
      description: get.manifest.description || '',
      packageVersion: get.manifest.version || '1.0.0',
      packageName: get.manifest.name || pluginId,
      zipBase64,
    })

    if (!res?.ok) throw new Error(res?.error || 'Publish failed')
    publishResult.value = res
    appStore.log(`Published ${pluginId} to ${res.installSpec} (${res.tag})`, 'success')
  } catch (e) {
    publishError.value = e.message
    appStore.log(`Publish failed: ${e.message}`, 'error')
  } finally {
    publishing.value = false
  }
}

// A catalog entry is compatible when its declared `platforms` array (if any)
// includes the active board's platform. Entries with no platforms field are
// treated as universal — the same convention the toolbox filter uses.
function isCompatible(e) {
  if (!Array.isArray(e.platforms) || e.platforms.length === 0) return true
  const p = appStore.selectedBoard?.platform
  if (!p) return true
  return e.platforms.includes(p)
}

onMounted(async () => {
  if (window.lotusAPI?.plugins) pluginsRoot.value = await window.lotusAPI.plugins.root()
})

watch(() => appStore.showPluginManager, (v) => {
  if (v) {
    catalogUrlInput.value = market.catalogUrl
    pluginStore.refresh()
    if (market.catalog.length === 0) market.fetchCatalog()
  }
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
  catalogUrlInput.value = 'https://raw.githubusercontent.com/jaturong-kamonlers/lotus-plugins/main/catalog.json'
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
