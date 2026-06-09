import { defineStore } from 'pinia'
import { ref } from 'vue'
import JSZip from 'jszip'
import { useAppStore } from './app'

// Default catalog URL — a JSON array of available boards, hosted on the
// Lotus IDE GitHub. Users can override this if they want to point at a
// different vendor catalog. The URL is intentionally a plain raw.githubusercontent
// URL so anyone can host their own.
const DEFAULT_CATALOG = 'https://raw.githubusercontent.com/jaturong-kamonlers/lotus-boards/main/catalog.json'

export const useBoardManagerStore = defineStore('boardManager', () => {
  const installed = ref([])    // user-installed boards (from userList)
  const catalog = ref([])      // available remote entries
  const userRoot = ref('')
  const busy = ref(false)
  const catalogUrl = ref(localStorage.getItem('lotus.boardCatalogUrl') || DEFAULT_CATALOG)

  const appStore = useAppStore()

  async function refresh() {
    if (!window.lotusAPI?.boards) return
    busy.value = true
    try {
      if (!userRoot.value) userRoot.value = await window.lotusAPI.boards.userRoot()
      installed.value = await window.lotusAPI.boards.userList()
      // After install / uninstall, ask the app to reload its board list so the
      // BoardSelector sees the change.
      await appStore.loadBoards(true)
    } finally {
      busy.value = false
    }
  }

  async function fetchCatalog() {
    if (!window.lotusAPI?.boards) return
    busy.value = true
    try {
      const res = await window.lotusAPI.boards.fetchCatalog(catalogUrl.value)
      if (res?.ok) catalog.value = res.entries
      else { appStore.log(`Catalog fetch failed: ${res?.error || 'unknown'}`, 'error'); catalog.value = [] }
    } finally {
      busy.value = false
    }
  }

  function setCatalogUrl(url) {
    catalogUrl.value = url
    localStorage.setItem('lotus.boardCatalogUrl', url)
  }

  async function installFromZipBase64(id, base64) {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const zip = await JSZip.loadAsync(bytes)

    // Try to read manifest id from config.js; if not present, fall back to the
    // caller-provided id.
    const files = {}
    let manifestId = id
    for (const [name, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue
      if (path.isAbsolute?.(name) || name.includes('..')) throw new Error(`Unsafe filename: ${name}`)
      const ext = name.toLowerCase().split('.').pop()
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bin', 'hex'].includes(ext)) {
        files[name + '?base64'] = await entry.async('base64')
      } else {
        files[name] = await entry.async('text')
      }
    }
    if (!files['config.js']) throw new Error('Board zip missing config.js at root')

    // Pull `name`/`id` out of config.js if the caller didn't supply one.
    if (!manifestId) {
      const m = /name\s*=\s*['"]([^'"]+)['"]/.exec(files['config.js'])
      if (m) manifestId = m[1]
    }
    if (!manifestId) throw new Error('Could not determine board id (no caller id and config.js has no name)')

    return window.lotusAPI.boards.installFromFiles({ id: manifestId, files })
  }

  async function installFromFile() {
    const picked = await window.lotusAPI.boards.pickPackage()
    if (picked.canceled) return { canceled: true }
    return installFromZipBase64(null, picked.base64)
  }

  async function downloadAndInstall(entry) {
    const res = await window.lotusAPI.boards.downloadAndInstall({ id: entry.id, url: entry.downloadUrl })
    if (!res?.ok) return res
    return installFromZipBase64(entry.id, res.base64)
  }

  async function installFromGithubRepo(repoSpec) {
    if (!window.lotusAPI?.marketplace) return { error: 'Marketplace API not available' }
    busy.value = true
    try {
      const meta = await window.lotusAPI.marketplace.resolveGithubRelease(repoSpec)
      if (!meta?.ok) { appStore.log(`Resolve failed: ${meta?.error}`, 'error'); return meta }
      const dl = await window.lotusAPI.marketplace.downloadZip(meta.downloadUrl)
      if (!dl?.ok) { appStore.log(`Download failed: ${dl?.error}`, 'error'); return dl }
      // Use the repo name as the board id if the catalog entry doesn't supply one.
      const res = await installFromZipBase64(meta.repo, dl.base64)
      if (res?.ok) { appStore.log(`Installed board: ${meta.repo} (${meta.version})`, 'success'); await refresh() }
      else        appStore.log(`Install failed: ${res?.error || 'unknown'}`, 'error')
      return res
    } catch (e) {
      appStore.log(`Install failed: ${e.message}`, 'error')
      return { ok: false, error: e.message }
    } finally { busy.value = false }
  }

  async function uninstall(id) {
    return window.lotusAPI.boards.uninstall(id)
  }

  return {
    installed, catalog, userRoot, busy, catalogUrl,
    refresh, fetchCatalog, setCatalogUrl,
    installFromFile, downloadAndInstall, installFromGithubRepo, uninstall,
  }
})

// browser-side path stub — JSZip provides the keys; we only check for absolute
// paths and `..` traversal. `path.isAbsolute` is Node-only, so we polyfill:
const path = {
  isAbsolute(p) { return p.startsWith('/') || /^[A-Za-z]:[\\/]/.test(p) },
}
