import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAppStore } from './app'

export const useLibraryManagerStore = defineStore('libraryManager', () => {
  const installed = ref([])     // installed libraries under user dir
  const searchResults = ref([]) // last search response
  const searchTruncated = ref(false)
  const userRoot = ref('')
  const busy = ref(false)
  const searching = ref(false)

  const appStore = useAppStore()

  async function refresh() {
    if (!window.lotusAPI?.libraries) return
    busy.value = true
    try {
      if (!userRoot.value) userRoot.value = await window.lotusAPI.libraries.userRoot()
      installed.value = await window.lotusAPI.libraries.list()
    } finally {
      busy.value = false
    }
  }

  async function search(query) {
    if (!window.lotusAPI?.libraries) return
    searching.value = true
    try {
      const res = await window.lotusAPI.libraries.search(query || '')
      if (res?.ok) {
        searchResults.value = res.entries
        searchTruncated.value = !!res.truncated
      } else {
        appStore.log(`Search failed: ${res?.error || 'unknown'}`, 'error')
        searchResults.value = []
        searchTruncated.value = false
      }
    } finally {
      searching.value = false
    }
  }

  async function install(name, version) {
    busy.value = true
    try {
      const res = await window.lotusAPI.libraries.install({ name, version })
      if (res?.ok) { appStore.log(`Installed library: ${name}`, 'success'); await refresh() }
      else        appStore.log(`Install failed: ${res?.error || 'unknown'}`, 'error')
      return res
    } finally { busy.value = false }
  }

  async function installFromGit(url) {
    busy.value = true
    try {
      const res = await window.lotusAPI.libraries.installFromGit(url)
      if (res?.ok) { appStore.log(`Installed library from git: ${url}`, 'success'); await refresh() }
      else        appStore.log(`Install failed: ${res?.error || 'unknown'}`, 'error')
      return res
    } finally { busy.value = false }
  }

  async function installFromZip() {
    const picked = await window.lotusAPI.libraries.pickZip()
    if (picked?.canceled) return { canceled: true }
    busy.value = true
    try {
      const res = await window.lotusAPI.libraries.installFromZip(picked.path)
      if (res?.ok) { appStore.log(`Installed library from zip`, 'success'); await refresh() }
      else        appStore.log(`Install failed: ${res?.error || 'unknown'}`, 'error')
      return res
    } finally { busy.value = false }
  }

  async function uninstall(name) {
    busy.value = true
    try {
      const res = await window.lotusAPI.libraries.uninstall(name)
      if (res?.ok) { appStore.log(`Uninstalled: ${name}`, 'info'); await refresh() }
      else        appStore.log(`Uninstall failed: ${res?.error || 'unknown'}`, 'error')
      return res
    } finally { busy.value = false }
  }

  async function updateIndex() {
    busy.value = true
    try {
      const res = await window.lotusAPI.libraries.updateIndex()
      if (res?.ok) appStore.log('Library index updated', 'success')
      else         appStore.log(`Index update failed: ${res?.error || 'unknown'}`, 'error')
      return res
    } finally { busy.value = false }
  }

  return {
    installed, searchResults, searchTruncated, userRoot, busy, searching,
    refresh, search, install, installFromGit, installFromZip, uninstall, updateIndex,
  }
})
