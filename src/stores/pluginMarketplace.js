import { defineStore } from 'pinia'
import { ref } from 'vue'
import JSZip from 'jszip'
import { useAppStore } from './app'
import { usePluginStore } from './plugins'

const DEFAULT_CATALOG = 'https://raw.githubusercontent.com/lotus-arduibot/lotus-plugins/main/catalog.json'

export const usePluginMarketplaceStore = defineStore('pluginMarketplace', () => {
  const catalog = ref([])
  const busy = ref(false)
  const catalogUrl = ref(localStorage.getItem('lotus.pluginCatalogUrl') || DEFAULT_CATALOG)

  const appStore = useAppStore()
  const pluginStore = usePluginStore()

  function setCatalogUrl(url) {
    catalogUrl.value = url
    localStorage.setItem('lotus.pluginCatalogUrl', url)
  }

  async function fetchCatalog() {
    if (!window.lotusAPI?.marketplace) return
    busy.value = true
    try {
      const res = await window.lotusAPI.marketplace.fetchCatalog(catalogUrl.value)
      if (res?.ok) {
        // Only show plugin entries — boards live in their own catalog/tab.
        catalog.value = res.entries.filter(e => (e.kind || 'plugin') === 'plugin')
      } else {
        appStore.log(`Plugin catalog fetch failed: ${res?.error || 'unknown'}`, 'error')
        catalog.value = []
      }
    } finally { busy.value = false }
  }

  // Unpack a zip (base64) → files map suitable for plugins:installFromFiles
  async function unpackZip(base64) {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const zip = await JSZip.loadAsync(bytes)
    const manifestEntry = zip.file('lotus-plugin.json')
    if (!manifestEntry) throw new Error('lotus-plugin.json missing at zip root')
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
    return { manifest, files }
  }

  async function installFromCatalog(entry) {
    if (!entry.downloadUrl) throw new Error('Catalog entry missing downloadUrl')
    busy.value = true
    try {
      const dl = await window.lotusAPI.marketplace.downloadZip(entry.downloadUrl)
      if (!dl?.ok) throw new Error(dl?.error || 'Download failed')
      const { manifest, files } = await unpackZip(dl.base64)
      const res = await pluginStore.installFromFiles(manifest.id, files)
      if (res?.ok) appStore.log(`Installed plugin: ${manifest.name}`, 'success')
      else appStore.log(`Install failed: ${res?.error || 'unknown'}`, 'error')
      return res
    } catch (e) {
      appStore.log(`Install failed: ${e.message}`, 'error')
      return { ok: false, error: e.message }
    } finally { busy.value = false }
  }

  async function installFromGithubRepo(repoSpec) {
    busy.value = true
    try {
      const meta = await window.lotusAPI.marketplace.resolveGithubRelease(repoSpec)
      if (!meta?.ok) throw new Error(meta?.error || 'Failed to resolve GitHub release')
      const dl = await window.lotusAPI.marketplace.downloadZip(meta.downloadUrl)
      if (!dl?.ok) throw new Error(dl?.error || 'Download failed')
      const { manifest, files } = await unpackZip(dl.base64)
      const res = await pluginStore.installFromFiles(manifest.id, files)
      if (res?.ok) appStore.log(`Installed plugin: ${manifest.name} (${meta.version})`, 'success')
      else appStore.log(`Install failed: ${res?.error || 'unknown'}`, 'error')
      return res
    } catch (e) {
      appStore.log(`Install failed: ${e.message}`, 'error')
      return { ok: false, error: e.message }
    } finally { busy.value = false }
  }

  return { catalog, busy, catalogUrl, fetchCatalog, setCatalogUrl, installFromCatalog, installFromGithubRepo }
})
