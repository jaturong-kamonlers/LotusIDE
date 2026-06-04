<template>
  <v-dialog v-model="appStore.showGithubManager" max-width="820" scrollable>
    <v-card class="gh-dialog">
      <v-card-title class="gh-header">
        <v-icon class="mr-2">mdi-github</v-icon>
        GitHub
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="appStore.showGithubManager = false" />
      </v-card-title>

      <v-card-text class="pa-3">
        <!-- Encryption check -->
        <v-alert v-if="!store.status.encryptionAvailable" type="warning" density="compact" class="mb-3">
          OS keychain not available — token cannot be stored securely. Sign-in is disabled.
        </v-alert>

        <!-- Need client_id -->
        <div v-if="!store.status.clientId" class="setup">
          <div class="row-title">GitHub OAuth client_id required</div>
          <div class="row-desc">
            Register a GitHub OAuth App
            <a href="#" @click.prevent="openHelp">at github.com/settings/developers</a>
            (any redirect URI works — we use Device Flow). Paste the <b>Client ID</b> below.
          </div>
          <v-text-field
            v-model="clientIdInput" density="compact" variant="outlined" hide-details
            placeholder="Iv1.xxxxxxxxxxxxxxxx" class="mt-2"
          />
          <div class="mt-2"><v-btn size="small" variant="tonal" color="primary" @click="saveClientId">Save</v-btn></div>
        </div>

        <!-- Have client_id, not signed in -->
        <div v-else-if="!store.status.hasToken && !store.flow" class="setup">
          <div class="row-title">Not connected</div>
          <div class="row-desc">Click Sign in to authorize Lotus IDE on your GitHub account.</div>
          <div class="row-desc mt-2">Scopes requested: <code>repo</code>, <code>gist</code>.</div>
          <div class="mt-3">
            <v-btn
              size="small" variant="tonal" color="primary"
              prepend-icon="mdi-github"
              :loading="store.busy"
              :disabled="!store.status.encryptionAvailable"
              @click="store.startDeviceFlow"
            >
              Sign in with GitHub
            </v-btn>
            <v-btn size="small" variant="text" class="ml-2" @click="resetClientId">Change client_id</v-btn>
          </div>
        </div>

        <!-- Device flow in progress -->
        <div v-else-if="store.flow" class="device-flow">
          <div class="row-title">Waiting for authorization…</div>
          <div class="row-desc">
            1. Open: <a href="#" @click.prevent="store.openVerificationUri">{{ store.flow.verificationUri }}</a><br/>
            2. Enter this code:
          </div>
          <div class="user-code">{{ store.flow.userCode }}</div>
          <v-progress-linear indeterminate color="primary" class="mt-3" />
          <div class="mt-2"><v-btn size="small" variant="text" @click="cancelFlow">Cancel</v-btn></div>
        </div>

        <!-- Signed in — main UI -->
        <div v-else class="signed-in">
          <div class="account-row">
            <v-icon color="success">mdi-check-circle</v-icon>
            <span class="ml-2">
              Connected as <b>{{ store.status.login || 'unknown' }}</b>
              <span v-if="store.status.scopes" class="scopes">({{ store.status.scopes }})</span>
            </span>
            <v-spacer />
            <v-btn size="small" variant="text" @click="store.signOut">Sign out</v-btn>
          </div>

          <v-alert
            v-if="!store.hasRepoScope" type="info" density="compact" variant="tonal" class="my-2"
          >
            Your token has scope <code>gist</code> only. Repo sync is disabled.
            <v-btn size="x-small" variant="tonal" class="ml-2" @click="reauth">Re-authorize</v-btn>
          </v-alert>

          <v-tabs v-model="tab" density="compact" color="primary" class="mt-2">
            <v-tab value="gists">Gists</v-tab>
            <v-tab value="repos" :disabled="!store.hasRepoScope">Repos</v-tab>
            <v-tab value="new" :disabled="!store.hasRepoScope">New repo</v-tab>
          </v-tabs>

          <!-- ── GISTS TAB (existing flow) ──────────────────────────── -->
          <div v-if="tab === 'gists'">
            <div class="row-actions mt-2">
              <div class="row-title">Save current sketch as Gist</div>
              <v-spacer />
              <v-btn size="small" variant="tonal" color="primary" :loading="saving" @click="saveCurrentAsGist">
                Save to Gist
              </v-btn>
            </div>
            <v-text-field
              v-model="gistDescription"
              label="Description" density="compact" variant="outlined" hide-details
              class="mt-2"
            />
            <v-checkbox v-model="gistPublic" label="Public gist" density="compact" hide-details class="mt-1" />

            <v-divider class="my-3" />

            <div class="row-actions">
              <div class="row-title">Your gists</div>
              <v-spacer />
              <v-btn size="small" variant="text" :loading="store.busy" prepend-icon="mdi-refresh" @click="store.fetchGists">
                Refresh
              </v-btn>
            </div>
            <div v-if="store.gists.length === 0" class="row-desc mt-2">No gists yet — click Refresh to load.</div>
            <div v-else class="row-list">
              <div v-for="g in store.gists" :key="g.id" class="entry-row">
                <v-icon size="20">mdi-note-text-outline</v-icon>
                <div class="entry-meta">
                  <div class="entry-title">{{ g.description || g.files[0] || g.id }}</div>
                  <div class="entry-sub">{{ g.files.join(', ') }} · {{ formatDate(g.updatedAt) }}</div>
                </div>
                <v-btn size="x-small" variant="tonal" prepend-icon="mdi-download" @click="loadGist(g)">Load</v-btn>
              </div>
            </div>
          </div>

          <!-- ── REPOS TAB (new) ──────────────────────────────────────── -->
          <div v-else-if="tab === 'repos'">
            <!-- Repo picker -->
            <div v-if="!store.currentBrowsing">
              <div class="row-actions mt-2">
                <div class="row-title">Pick a repository</div>
                <v-spacer />
                <v-btn size="small" variant="text" :loading="store.busy" prepend-icon="mdi-refresh" @click="store.fetchRepos">
                  Refresh
                </v-btn>
              </div>
              <v-text-field
                v-model="repoFilter" placeholder="Filter…" density="compact"
                variant="outlined" hide-details prepend-inner-icon="mdi-magnify"
                class="mt-2"
              />
              <div v-if="filteredRepos.length === 0 && !store.busy" class="row-desc mt-3">
                No repos to show — click Refresh.
              </div>
              <div v-else class="row-list mt-2">
                <div
                  v-for="r in filteredRepos" :key="r.fullName"
                  class="entry-row clickable"
                  @click="openRepo(r)"
                >
                  <v-icon size="20">{{ r.private ? 'mdi-lock' : 'mdi-source-repository' }}</v-icon>
                  <div class="entry-meta">
                    <div class="entry-title">{{ r.fullName }}</div>
                    <div class="entry-sub">{{ r.description || '(no description)' }} · updated {{ formatDate(r.updatedAt) }}</div>
                  </div>
                  <v-icon size="18" class="entry-arrow">mdi-chevron-right</v-icon>
                </div>
              </div>
            </div>

            <!-- File browser inside a repo -->
            <div v-else>
              <div class="row-actions mt-2">
                <v-btn size="x-small" variant="text" prepend-icon="mdi-arrow-left" @click="leaveRepo">
                  Back to repos
                </v-btn>
                <v-spacer />
                <div class="row-title">{{ store.currentBrowsing.owner }}/{{ store.currentBrowsing.repo }}</div>
              </div>

              <div class="breadcrumb mt-2">
                <a href="#" @click.prevent="browseInto('')">/</a>
                <template v-for="(seg, i) in pathSegments" :key="i">
                  <span> / </span>
                  <a href="#" @click.prevent="browseInto(pathSegments.slice(0, i + 1).join('/'))">{{ seg }}</a>
                </template>
              </div>

              <div v-if="store.busy" class="row-desc mt-2">Loading…</div>
              <div v-else-if="store.repoContents.length === 0" class="row-desc mt-2">(empty folder)</div>
              <div v-else class="row-list mt-2">
                <div
                  v-for="e in store.repoContents" :key="e.path"
                  class="entry-row" :class="{ clickable: e.type === 'dir' }"
                  @click="e.type === 'dir' && browseInto(e.path)"
                >
                  <v-icon size="20">
                    {{ e.type === 'dir' ? 'mdi-folder' : 'mdi-file-document-outline' }}
                  </v-icon>
                  <div class="entry-meta">
                    <div class="entry-title">{{ e.name }}</div>
                    <div v-if="e.type === 'file'" class="entry-sub">{{ formatSize(e.size) }}</div>
                  </div>
                  <template v-if="e.type === 'file'">
                    <v-btn
                      v-if="e.name.endsWith('.json')"
                      size="x-small" variant="tonal" prepend-icon="mdi-download"
                      @click.stop="loadRepoFile(e)"
                    >
                      Load
                    </v-btn>
                    <v-btn
                      size="x-small" variant="text" icon="mdi-history"
                      :title="'View history'"
                      @click.stop="showFileHistory(e)"
                    />
                  </template>
                </div>
              </div>

              <v-divider class="my-3" />

              <div class="row-title">Save current sketch to this repo</div>
              <v-text-field
                v-model="saveTargetPath"
                label="File path (e.g. sketches/blink.json)"
                density="compact" variant="outlined" hide-details class="mt-2"
              />
              <v-text-field
                v-model="commitMessage"
                label="Commit message"
                density="compact" variant="outlined" hide-details class="mt-2"
              />
              <div class="row-actions mt-2">
                <v-spacer />
                <v-btn
                  size="small" variant="tonal" color="primary"
                  :loading="saving"
                  prepend-icon="mdi-content-save"
                  @click="saveCurrentToRepo"
                >
                  Commit to {{ store.currentBrowsing.repo }}
                </v-btn>
              </div>
            </div>
          </div>

          <!-- ── NEW REPO TAB ─────────────────────────────────────────── -->
          <div v-else-if="tab === 'new'" class="new-repo-pane">
            <div class="row-title mt-2">Create a new repository</div>
            <div class="row-desc">A bare repo (auto-init with README). Sketch files can be committed in afterwards.</div>
            <v-text-field
              v-model="newRepoName"
              label="Repo name (e.g. lotus-sketches)"
              density="compact" variant="outlined" hide-details class="mt-3"
            />
            <v-text-field
              v-model="newRepoDescription"
              label="Description (optional)"
              density="compact" variant="outlined" hide-details class="mt-2"
            />
            <v-checkbox v-model="newRepoPrivate" label="Private" density="compact" hide-details class="mt-1" />
            <div class="row-actions mt-2">
              <v-spacer />
              <v-btn
                size="small" variant="tonal" color="primary"
                :loading="creating" prepend-icon="mdi-plus"
                @click="createRepo"
              >
                Create repo
              </v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- File history dialog -->
    <v-dialog v-model="historyOpen" max-width="640">
      <v-card>
        <v-card-title class="gh-header">
          <v-icon class="mr-2">mdi-history</v-icon>
          History — {{ historyPath }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="historyOpen = false" />
        </v-card-title>
        <v-card-text class="pa-3">
          <div v-if="store.fileHistory.length === 0" class="row-desc">No commits found.</div>
          <div v-else class="row-list">
            <div v-for="c in store.fileHistory" :key="c.sha" class="entry-row">
              <v-icon size="20">mdi-source-commit</v-icon>
              <div class="entry-meta">
                <div class="entry-title">{{ truncateFirstLine(c.message) }}</div>
                <div class="entry-sub">{{ c.author }} · {{ formatDate(c.date) }} · {{ c.sha.slice(0, 7) }}</div>
              </div>
              <v-btn
                size="x-small" variant="tonal" prepend-icon="mdi-download"
                @click="loadHistoricFile(c)"
              >
                Load this version
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../stores/app'
import { useGithubStore } from '../stores/github'

const appStore = useAppStore()
const store = useGithubStore()

// auth / setup
const clientIdInput = ref('')

// gists
const tab = ref('gists')
const gistDescription = ref('')
const gistPublic = ref(false)

// repos
const repoFilter = ref('')
const saveTargetPath = ref('')
const commitMessage = ref('')
const saving = ref(false)

// new repo
const newRepoName = ref('')
const newRepoDescription = ref('')
const newRepoPrivate = ref(true)
const creating = ref(false)

// history dialog
const historyOpen = ref(false)
const historyPath = ref('')
const historyFile = ref(null)   // { name, path }

const filteredRepos = computed(() => {
  const q = repoFilter.value.trim().toLowerCase()
  if (!q) return store.repos
  return store.repos.filter(r =>
    r.fullName.toLowerCase().includes(q) ||
    (r.description || '').toLowerCase().includes(q)
  )
})

const pathSegments = computed(() => {
  const p = store.currentBrowsing?.path || ''
  return p ? p.split('/').filter(Boolean) : []
})

onMounted(() => store.refresh())
onUnmounted(() => store.stopPolling?.())

watch(() => appStore.showGithubManager, (v) => { if (v) store.refresh() })
watch(() => tab.value, (v) => {
  if (v === 'repos' && store.repos.length === 0 && store.hasRepoScope) {
    store.fetchRepos()
  }
})

// ── auth ──
async function saveClientId() {
  if (!clientIdInput.value.trim()) return
  const res = await store.setClientId(clientIdInput.value.trim())
  if (res?.error) appStore.log(res.error, 'error')
  else appStore.log('GitHub client_id saved', 'success')
}
function resetClientId() {
  clientIdInput.value = ''
  store.setClientId('')
}
function cancelFlow() {
  store.flow = null
  store.stopPolling?.()
}
async function reauth() {
  await store.signOut()
  await store.startDeviceFlow()
}

// ── gists ──
async function saveCurrentAsGist() {
  if (!appStore.workspaceJson) { appStore.log('Nothing to save (workspace empty)', 'error'); return }
  saving.value = true
  try {
    const filename = (appStore.currentFile?.split(/[\\/]/).pop()) || `${appStore.selectedBoard?.id || 'sketch'}.json`
    const res = await store.saveSketchAsGist({
      filename,
      description: gistDescription.value || `Lotus IDE sketch — ${new Date().toISOString()}`,
      content: appStore.workspaceJson,
      isPublic: gistPublic.value,
    })
    if (res?.ok) { appStore.log(`Saved gist: ${res.gist.htmlUrl}`, 'success'); store.fetchGists() }
    else appStore.log(res?.error || 'Failed to save', 'error')
  } finally { saving.value = false }
}
async function loadGist(g) {
  const res = await store.readGist(g.id)
  if (!res?.ok) { appStore.log(res?.error || 'Failed to read gist', 'error'); return }
  const files = res.gist.files || {}
  const fname = Object.keys(files).find(n => n.endsWith('.json')) || Object.keys(files)[0]
  if (!fname) { appStore.log('Gist has no files', 'error'); return }
  try {
    const parsed = JSON.parse(files[fname].content)
    applyWorkspace(parsed, `Loaded gist: ${fname}`)
  } catch (e) { appStore.log(`Gist is not valid workspace JSON: ${e.message}`, 'error') }
}

// ── repos ──
async function openRepo(r) {
  await store.browseRepo(r.owner, r.name, '')
  // default save path = current filename or board id
  const fname = (appStore.currentFile?.split(/[\\/]/).pop()) || `${appStore.selectedBoard?.id || 'sketch'}.json`
  saveTargetPath.value = `sketches/${fname}`
  commitMessage.value = `Update ${fname} via Lotus IDE`
}
function leaveRepo() {
  store.currentBrowsing = null
  store.repoContents = []
}
async function browseInto(path) {
  if (!store.currentBrowsing) return
  await store.browseRepo(store.currentBrowsing.owner, store.currentBrowsing.repo, path)
}
async function loadRepoFile(entry) {
  const { owner, repo } = store.currentBrowsing
  const res = await store.readRepoFile(owner, repo, entry.path)
  if (!res?.ok) { appStore.log(res?.error || 'Failed to read', 'error'); return }
  try {
    const parsed = JSON.parse(res.content)
    applyWorkspace(parsed, `Loaded ${entry.name} from ${owner}/${repo}`)
  } catch (e) {
    appStore.log(`File is not valid workspace JSON: ${e.message}`, 'error')
  }
}
async function saveCurrentToRepo() {
  if (!appStore.workspaceJson) { appStore.log('Nothing to save', 'error'); return }
  if (!saveTargetPath.value.trim()) { appStore.log('Set a target file path', 'error'); return }
  const { owner, repo } = store.currentBrowsing
  saving.value = true
  try {
    // If a file already exists at that path, we need its sha to update it.
    let sha = null
    const existing = store.repoContents.find(e => e.path === saveTargetPath.value.trim() && e.type === 'file')
    if (existing) sha = existing.sha
    else {
      const probe = await store.readRepoFile(owner, repo, saveTargetPath.value.trim())
      if (probe?.ok) sha = probe.sha
    }
    const res = await store.saveSketchToRepo({
      owner, repo,
      path: saveTargetPath.value.trim(),
      content: appStore.workspaceJson,
      message: commitMessage.value || `Update ${saveTargetPath.value} via Lotus IDE`,
      sha,
    })
    if (res?.ok) {
      appStore.log(`Committed ${saveTargetPath.value} → ${res.commit.htmlUrl}`, 'success')
      // refresh current dir so the new file appears
      const dir = saveTargetPath.value.includes('/')
        ? saveTargetPath.value.slice(0, saveTargetPath.value.lastIndexOf('/'))
        : ''
      await store.browseRepo(owner, repo, dir)
    } else {
      appStore.log(res?.error || 'Commit failed', 'error')
    }
  } finally { saving.value = false }
}

async function showFileHistory(entry) {
  const { owner, repo } = store.currentBrowsing
  historyPath.value = entry.path
  historyFile.value = entry
  historyOpen.value = true
  await store.fetchFileHistory(owner, repo, entry.path)
}
async function loadHistoricFile(commit) {
  if (!historyFile.value || !store.currentBrowsing) return
  const { owner, repo } = store.currentBrowsing
  const res = await store.readRepoFile(owner, repo, historyFile.value.path, commit.sha)
  if (!res?.ok) { appStore.log(res?.error || 'Failed to read', 'error'); return }
  try {
    const parsed = JSON.parse(res.content)
    applyWorkspace(parsed, `Loaded ${historyFile.value.name} @ ${commit.sha.slice(0, 7)}`)
    historyOpen.value = false
  } catch (e) {
    appStore.log(`File is not valid workspace JSON: ${e.message}`, 'error')
  }
}

// ── new repo ──
async function createRepo() {
  if (!newRepoName.value.trim()) return
  creating.value = true
  try {
    const res = await store.createRepo({
      name: newRepoName.value.trim(),
      description: newRepoDescription.value,
      private: newRepoPrivate.value,
    })
    if (res?.ok) {
      appStore.log(`Created repo: ${res.repo.htmlUrl}`, 'success')
      await store.fetchRepos()
      newRepoName.value = ''
      newRepoDescription.value = ''
      tab.value = 'repos'
    } else {
      appStore.log(res?.error || 'Create failed', 'error')
    }
  } finally { creating.value = false }
}

// ── shared ──
function applyWorkspace(parsed, message) {
  appStore.loadWorkspaceRequest = parsed
  appStore.currentFile = null
  appStore.editorMode = 'blockly'
  appStore.isDirty = false
  appStore.log(message, 'success')
  appStore.showGithubManager = false
}

function openHelp() {
  window.lotusAPI?.shell?.openExternal('https://github.com/settings/developers')
}
function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString() } catch { return iso }
}
function formatSize(bytes) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
function truncateFirstLine(s) {
  if (!s) return ''
  const first = s.split('\n')[0]
  return first.length > 80 ? first.slice(0, 80) + '…' : first
}
</script>

<style scoped>
.gh-dialog { max-height: 85vh; }
.gh-header { display: flex; align-items: center; padding: 12px 16px; }
.setup, .device-flow, .signed-in, .new-repo-pane { padding: 4px; }
.row-title { font-size: 14px; font-weight: 600; }
.row-desc { font-size: 12px; opacity: 0.75; line-height: 1.5; }
.row-actions { display: flex; align-items: center; gap: 8px; padding: 4px 0; }

.account-row { display: flex; align-items: center; padding: 4px 0; }
.scopes { font-size: 11px; opacity: 0.6; margin-left: 6px; font-family: 'Fira Code', monospace; }

.user-code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 28px; font-weight: 700; letter-spacing: 4px;
  background: rgba(0,0,0,0.15); padding: 12px 20px; border-radius: 8px;
  text-align: center; margin-top: 12px;
}

.row-list { display: flex; flex-direction: column; gap: 6px; }
.entry-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
}
.entry-row.clickable { cursor: pointer; }
.entry-row.clickable:hover { background: rgba(240,165,0,0.08); }
.entry-meta { flex: 1; min-width: 0; }
.entry-title { font-size: 13px; font-weight: 600; word-break: break-all; }
.entry-sub { font-size: 11px; opacity: 0.6; }
.entry-arrow { opacity: 0.4; }

.breadcrumb { font-size: 12px; opacity: 0.8; padding: 4px 0; }
.breadcrumb a { color: rgb(var(--v-theme-primary)); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
</style>
