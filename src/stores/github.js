import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAppStore } from './app'

export const useGithubStore = defineStore('github', () => {
  const status = ref({ hasToken: false, login: null, scopes: null, clientId: null, encryptionAvailable: false })
  const flow = ref(null)            // { userCode, verificationUri, expiresAt }
  const gists = ref([])
  const repos = ref([])             // user's repos for picker
  const repoContents = ref([])      // current folder listing during browse
  const currentBrowsing = ref(null) // { owner, repo, path }
  const fileHistory = ref([])
  const busy = ref(false)
  let pollTimer = null

  const appStore = useAppStore()

  // True only when the token actually has `repo` scope.
  const hasRepoScope = computed(() => {
    if (!status.value.scopes) return false
    return status.value.scopes.split(',').map(s => s.trim()).includes('repo')
  })

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
    repos.value = []
    repoContents.value = []
    currentBrowsing.value = null
    fileHistory.value = []
    await refresh()
  }

  // ── Gists ──
  async function fetchGists() {
    busy.value = true
    try {
      const res = await window.lotusAPI.github.listGists()
      if (res?.ok) gists.value = res.gists
      else appStore.log(res?.error || 'Failed to list gists', 'error')
    } finally { busy.value = false }
  }
  async function saveSketchAsGist(opts) { return window.lotusAPI.github.saveSketchAsGist(opts) }
  async function readGist(id)            { return window.lotusAPI.github.readGist(id) }

  // ── Repos ──
  async function fetchRepos() {
    busy.value = true
    try {
      const res = await window.lotusAPI.github.listRepos({ visibility: 'all', sort: 'updated', perPage: 100 })
      if (res?.ok) repos.value = res.repos
      else appStore.log(res?.error || 'Failed to list repos', 'error')
    } finally { busy.value = false }
  }

  async function browseRepo(owner, repo, path = '', ref = null) {
    busy.value = true
    try {
      const res = await window.lotusAPI.github.listRepoContents({ owner, repo, path, ref })
      if (res?.ok) {
        repoContents.value = res.entries.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
          return a.name.localeCompare(b.name)
        })
        currentBrowsing.value = { owner, repo, path }
      } else {
        appStore.log(res?.error || 'Failed to list contents', 'error')
        repoContents.value = []
      }
    } finally { busy.value = false }
  }

  async function readRepoFile(owner, repo, path, ref = null) {
    return window.lotusAPI.github.readRepoFile({ owner, repo, path, ref })
  }

  async function saveSketchToRepo({ owner, repo, path, content, message, branch = null, sha = null }) {
    return window.lotusAPI.github.saveSketchAsRepoFile({ owner, repo, path, content, message, branch, sha })
  }

  async function fetchFileHistory(owner, repo, path) {
    busy.value = true
    try {
      const res = await window.lotusAPI.github.listFileCommits({ owner, repo, path, perPage: 30 })
      if (res?.ok) fileHistory.value = res.commits
      else { appStore.log(res?.error || 'Failed to list commits', 'error'); fileHistory.value = [] }
    } finally { busy.value = false }
  }

  async function createRepo({ name, description, private: isPrivate = true }) {
    return window.lotusAPI.github.createRepo({ name, description, private: isPrivate, autoInit: true })
  }

  return {
    // state
    status, flow, gists, repos, repoContents, currentBrowsing, fileHistory, busy,
    // computed
    hasRepoScope,
    // auth
    refresh, setClientId, startDeviceFlow, stopPolling,
    openVerificationUri, signOut,
    // gists
    fetchGists, saveSketchAsGist, readGist,
    // repos
    fetchRepos, browseRepo, readRepoFile, saveSketchToRepo, fetchFileHistory, createRepo,
  }
})
