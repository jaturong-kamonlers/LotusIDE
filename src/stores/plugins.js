import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadPlugin, unloadPlugin, listLoadedPlugins } from '../plugins/pluginLoader'

export const usePluginStore = defineStore('plugins', () => {
  // Each entry: { manifest, blockTypes, includes, toolbox, iconUrl, status, error? }
  const installed = ref([])
  const busy = ref(false)

  const loaded = computed(() => installed.value.filter(p => p.status === 'loaded'))

  function findIndex(id) { return installed.value.findIndex(p => p.manifest?.id === id) }

  async function refresh() {
    if (!window.lotusAPI?.plugins) return
    busy.value = true
    try {
      // First reset loader registry to keep it in sync with the new disk state.
      for (const p of listLoadedPlugins()) unloadPlugin(p.manifest.id)
      installed.value = []

      const list = await window.lotusAPI.plugins.list()
      for (const item of list) {
        if (!item.ok) {
          installed.value.push({
            manifest: { id: item.id, name: item.id, version: '?' },
            status: 'error',
            error: item.error,
          })
          continue
        }
        try {
          const desc = await loadPlugin({
            manifest: item.manifest,
            entrySource: item.entrySource,
            iconUrl: item.iconDataUri,
          })
          installed.value.push({ ...desc, status: 'loaded' })
        } catch (e) {
          installed.value.push({
            manifest: item.manifest,
            iconUrl: item.iconDataUri,
            status: 'error',
            error: e.message,
          })
        }
      }
    } finally {
      busy.value = false
    }
  }

  async function uninstall(id) {
    if (!window.lotusAPI?.plugins) return { error: 'Plugin API not available' }
    unloadPlugin(id)
    const res = await window.lotusAPI.plugins.uninstall(id)
    if (res?.ok) {
      const i = findIndex(id)
      if (i >= 0) installed.value.splice(i, 1)
    }
    return res
  }

  async function installFromFiles(id, files) {
    if (!window.lotusAPI?.plugins) return { error: 'Plugin API not available' }
    const res = await window.lotusAPI.plugins.installFromFiles({ id, files })
    if (res?.ok) await refresh()
    return res
  }

  return { installed, loaded, busy, refresh, uninstall, installFromFiles }
})
