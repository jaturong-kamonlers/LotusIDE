<template>
  <v-dialog v-model="appStore.showGithubManager" max-width="720" scrollable>
    <v-card class="gh-dialog">
      <v-card-title class="gh-header">
        <v-icon class="mr-2">mdi-github</v-icon>
        GitHub
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="appStore.showGithubManager = false" />
      </v-card-title>

      <v-card-text class="pa-3">
        <!-- 1. Encryption check -->
        <v-alert v-if="!store.status.encryptionAvailable" type="warning" density="compact" class="mb-3">
          OS keychain not available — token cannot be stored securely. Sign-in is disabled.
        </v-alert>

        <!-- 2. Need client_id -->
        <div v-if="!store.status.clientId" class="setup">
          <div class="row-title">GitHub OAuth client_id required</div>
          <div class="row-desc">
            Register a GitHub OAuth App
            <a href="#" @click.prevent="openHelp">at github.com/settings/developers</a>
            (any redirect URI works — we use Device Flow). Paste the <b>Client ID</b> below.
          </div>
          <v-text-field
            v-model="clientIdInput"
            density="compact" variant="outlined" hide-details
            placeholder="Iv1.xxxxxxxxxxxxxxxx"
            class="mt-2"
          />
          <div class="mt-2"><v-btn size="small" variant="tonal" color="primary" @click="saveClientId">Save</v-btn></div>
        </div>

        <!-- 3. Have client_id, not signed in -->
        <div v-else-if="!store.status.hasToken && !store.flow" class="setup">
          <div class="row-title">Not connected</div>
          <div class="row-desc">Click Sign in to authorize Lotus IDE on your GitHub account.</div>
          <div class="mt-2">
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

        <!-- 4. Device flow in progress -->
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

        <!-- 5. Signed in -->
        <div v-else class="signed-in">
          <div class="row-actions">
            <v-icon color="success">mdi-check-circle</v-icon>
            <span class="ml-2">Connected to GitHub</span>
            <v-spacer />
            <v-btn size="small" variant="text" @click="store.signOut">Sign out</v-btn>
          </div>

          <v-divider class="my-3" />

          <div class="row-actions">
            <div class="row-title">Save current sketch as Gist</div>
            <v-spacer />
            <v-btn size="small" variant="tonal" color="primary" :loading="saving" @click="saveCurrent">
              Save to GitHub
            </v-btn>
          </div>
          <v-text-field
            v-model="description"
            label="Description" density="compact" variant="outlined" hide-details
            class="mt-2"
          />
          <v-checkbox v-model="isPublic" label="Public gist" density="compact" hide-details class="mt-1" />

          <v-divider class="my-3" />

          <div class="row-actions">
            <div class="row-title">Your gists</div>
            <v-spacer />
            <v-btn size="small" variant="text" :loading="store.busy" prepend-icon="mdi-refresh" @click="store.fetchGists">
              Refresh
            </v-btn>
          </div>
          <div v-if="store.gists.length === 0" class="row-desc mt-2">No gists yet.</div>
          <div v-else class="gist-list">
            <div v-for="g in store.gists" :key="g.id" class="gist-row">
              <v-icon size="20">mdi-note-text-outline</v-icon>
              <div class="gist-meta">
                <div class="gist-title">{{ g.description || g.files[0] || g.id }}</div>
                <div class="gist-sub">{{ g.files.join(', ') }} · {{ formatDate(g.updatedAt) }}</div>
              </div>
              <v-btn size="x-small" variant="tonal" prepend-icon="mdi-download" @click="loadGist(g)">Load</v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../stores/app'
import { useGithubStore } from '../stores/github'

const appStore = useAppStore()
const store = useGithubStore()
const clientIdInput = ref('')
const description = ref('')
const isPublic = ref(false)
const saving = ref(false)

onMounted(() => store.refresh())
onUnmounted(() => store.stopPolling?.())

watch(() => appStore.showGithubManager, (v) => {
  if (v) store.refresh()
})

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

async function saveCurrent() {
  if (!appStore.workspaceJson) { appStore.log('Nothing to save (workspace empty)', 'error'); return }
  saving.value = true
  try {
    const filename = (appStore.currentFile?.split(/[\\/]/).pop()) || `${appStore.selectedBoard?.id || 'sketch'}.json`
    const res = await store.saveSketchAsGist({
      filename,
      description: description.value || `Lotus IDE sketch — ${new Date().toISOString()}`,
      content: appStore.workspaceJson,
      isPublic: isPublic.value,
    })
    if (res?.ok) { appStore.log(`Saved gist: ${res.gist.htmlUrl}`, 'success'); store.fetchGists() }
    else appStore.log(res?.error || 'Failed to save', 'error')
  } finally { saving.value = false }
}

async function loadGist(g) {
  const res = await store.readGist(g.id)
  if (!res?.ok) { appStore.log(res?.error || 'Failed to read gist', 'error'); return }
  // Find first .json file with workspace data
  const files = res.gist.files || {}
  const fname = Object.keys(files).find(n => n.endsWith('.json')) || Object.keys(files)[0]
  if (!fname) { appStore.log('Gist has no files', 'error'); return }
  try {
    const parsed = JSON.parse(files[fname].content)
    appStore.loadWorkspaceRequest = parsed
    appStore.currentFile = null
    appStore.editorMode = 'blockly'
    appStore.isDirty = false
    appStore.log(`Loaded gist: ${fname}`, 'success')
    appStore.showGithubManager = false
  } catch (e) {
    appStore.log(`Gist is not valid workspace JSON: ${e.message}`, 'error')
  }
}

function openHelp() {
  window.lotusAPI?.shell?.openExternal('https://github.com/settings/developers')
}

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString() } catch { return iso }
}
</script>

<style scoped>
.gh-dialog { max-height: 80vh; }
.gh-header { display: flex; align-items: center; padding: 12px 16px; }
.setup, .device-flow, .signed-in { padding: 4px; }
.row-title { font-size: 14px; font-weight: 600; }
.row-desc { font-size: 12px; opacity: 0.75; line-height: 1.5; }
.row-actions { display: flex; align-items: center; gap: 8px; padding: 4px 0; }

.user-code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 28px; font-weight: 700; letter-spacing: 4px;
  background: rgba(0,0,0,0.15); padding: 12px 20px; border-radius: 8px;
  text-align: center; margin-top: 12px;
}

.gist-list { display: flex; flex-direction: column; gap: 6px; }
.gist-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; }
.gist-meta { flex: 1; min-width: 0; }
.gist-title { font-size: 13px; font-weight: 600; }
.gist-sub { font-size: 11px; opacity: 0.6; }
</style>
