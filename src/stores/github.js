import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAppStore } from './app'

export const useGithubStore = defineStore('github', () => {
  const status = ref({ hasToken: false, clientId: null, encryptionAvailable: false })
  const flow = ref(null)            // { userCode, verificationUri, expiresAt }
  const gists = ref([])
  const busy = ref(false)
  let pollTimer = null

  const appStore = useAppStore()

  async function refresh() {
    if (!window.lotusAPI?.github) return
    status.value = await window.lotusAPI.github.status()
  }

  async function setClientId(id) {
    const res = await window.lotusAPI.github.setClientId(id)
    await refresh()
    return res
  }

  async function startDeviceFlow() {
    stopPolling()
    busy.value = true
    try {
      const res = await window.lotusAPI.github.startDeviceFlow()
      if (res?.error) { appStore.log(res.error, 'error'); return res }
      flow.value = { ...res, expiresAt: Date.now() + (res.expiresIn || 900) * 1000 }
      startPolling()
      return res
    } finally { busy.value = false }
  }

  function startPolling() {
    stopPolling()
    pollTimer = setInterval(async () => {
      const res = await window.lotusAPI.github.pollDeviceFlow()
      if (res?.pending) return
      if (res?.ok) {
        appStore.log('Connected to GitHub', 'success')
        flow.value = null
        stopPolling()
        await refresh()
        return
      }
      if (res?.error) {
        appStore.log(res.error, 'error')
        flow.value = null
        stopPolling()
      }
    }, 5000)
  }

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }

  async function openVerificationUri() {
    if (!flow.value) return
    await window.lotusAPI.github.openVerificationUri(flow.value.verificationUri)
  }

  async function signOut() {
    await window.lotusAPI.github.signOut()
    gists.value = []
    await refresh()
  }

  async function fetchGists() {
    busy.value = true
    try {
      const res = await window.lotusAPI.github.listGists()
      if (res?.ok) gists.value = res.gists
      else appStore.log(res?.error || 'Failed to list gists', 'error')
    } finally { busy.value = false }
  }

  async function saveSketchAsGist({ gistId, filename, description, content, isPublic }) {
    return window.lotusAPI.github.saveSketchAsGist({ gistId, filename, description, content, isPublic })
  }

  async function readGist(id) {
    return window.lotusAPI.github.readGist(id)
  }

  return {
    status, flow, gists, busy,
    refresh, setClientId, startDeviceFlow, stopPolling,
    openVerificationUri, signOut,
    fetchGists, saveSketchAsGist, readGist,
  }
})
