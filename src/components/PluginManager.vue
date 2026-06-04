<template>
  <v-dialog v-model="appStore.showPluginManager" max-width="720" scrollable>
    <v-card class="plugin-dialog">
      <v-card-title class="plugin-dialog-header">
        <v-icon class="mr-2">mdi-puzzle-outline</v-icon>
        Plugins
        <v-spacer />
        <v-btn
          size="small" variant="tonal" color="primary"
          prepend-icon="mdi-upload"
          :loading="installing"
          @click="installFromFile"
        >
          Install from .zip
        </v-btn>
        <v-btn icon="mdi-close" variant="text" size="small" class="ml-2" @click="appStore.showPluginManager = false" />
      </v-card-title>

      <v-card-text class="pa-3">
        <div v-if="pluginStore.installed.length === 0" class="empty">
          <v-icon size="48" color="grey-lighten-1">mdi-puzzle-outline</v-icon>
          <div class="empty-text">No plugins installed yet.</div>
          <div class="empty-hint">Click <b>Install from .zip</b> above, or drop a plugin folder into:</div>
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
              variant="tonal"
              class="status-chip"
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
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { usePluginStore } from '../stores/plugins'
import JSZip from 'jszip'

const appStore = useAppStore()
const pluginStore = usePluginStore()
const installing = ref(false)
const pluginsRoot = ref('')

onMounted(async () => {
  if (window.lotusAPI?.plugins) pluginsRoot.value = await window.lotusAPI.plugins.root()
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
    // Pack remaining files — text by default, base64 marker for binary
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

async function confirmUninstall(p) {
  if (!confirm(`Uninstall "${p.manifest.name}"?`)) return
  const res = await pluginStore.uninstall(p.manifest.id)
  if (res?.ok) appStore.log(`Uninstalled: ${p.manifest.name}`, 'info')
  else appStore.log(`Uninstall failed: ${res?.error || 'unknown'}`, 'error')
}
</script>

<style scoped>
.plugin-dialog { max-height: 80vh; }
.plugin-dialog-header { display: flex; align-items: center; padding: 12px 16px; }

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
</style>
