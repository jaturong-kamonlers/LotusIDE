import { defineStore } from 'pinia'
import { ref, computed, onScopeDispose } from 'vue'

// Mirrors the state shape emitted by electron/ipc/updater.js.
// status: 'idle' | 'disabled' | 'checking' | 'available' | 'up-to-date'
//       | 'downloading' | 'downloaded' | 'error'
const EMPTY_STATE = { status: 'idle', message: null, version: null, percent: 0, releaseNotes: null }

export const useUpdaterStore = defineStore('updater', () => {
  const state = ref({ ...EMPTY_STATE })
  const listening = ref(false)

  const isAvailable    = computed(() => state.value.status === 'available')
  const isDownloading  = computed(() => state.value.status === 'downloading')
  const isDownloaded   = computed(() => state.value.status === 'downloaded')
  const isDisabled     = computed(() => state.value.status === 'disabled')

  function setupListener() {
    if (listening.value || !window.lotusAPI?.updater) return
    window.lotusAPI.updater.onState((s) => { state.value = s })
    listening.value = true
    onScopeDispose(() => {
      window.lotusAPI?.updater?.removeStateListener?.()
      listening.value = false
    })
  }

  async function refresh() {
    if (!window.lotusAPI?.updater) return
    state.value = await window.lotusAPI.updater.state()
  }

  async function check() {
    if (!window.lotusAPI?.updater) return
    state.value = await window.lotusAPI.updater.check()
  }

  async function download() {
    if (!window.lotusAPI?.updater) return
    await window.lotusAPI.updater.download()
  }

  async function install() {
    if (!window.lotusAPI?.updater) return
    await window.lotusAPI.updater.install()
  }

  return {
    state, isAvailable, isDownloading, isDownloaded, isDisabled,
    setupListener, refresh, check, download, install,
  }
})
