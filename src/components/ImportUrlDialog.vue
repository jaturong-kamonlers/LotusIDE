<template>
  <v-dialog v-model="appStore.showImportUrl" max-width="560">
    <v-card>
      <v-card-title class="iu-header">
        <v-icon class="mr-2">mdi-link-variant</v-icon>
        Import sketch from URL
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="appStore.showImportUrl = false" />
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="row-desc">
          Paste a Gist link, a GitHub file URL, or a raw URL pointing at a
          Lotus IDE workspace JSON.
        </div>

        <v-text-field
          v-model="urlInput" density="compact" variant="outlined" hide-details
          placeholder="https://gist.github.com/…  or  https://github.com/owner/repo/blob/main/sketch.json"
          class="mt-3"
          @keydown.enter="doImport"
        />

        <div class="row-desc mt-2">
          <b>Supported:</b>
          <ul class="format-list">
            <li><code>gist.github.com/&lt;user&gt;/&lt;id&gt;</code></li>
            <li><code>github.com/&lt;owner&gt;/&lt;repo&gt;/blob/&lt;branch&gt;/&lt;path&gt;.json</code></li>
            <li><code>raw.githubusercontent.com/…</code></li>
            <li>plain gist id (32-character hex)</li>
          </ul>
        </div>

        <div class="row-actions mt-3">
          <v-spacer />
          <v-btn size="small" variant="text" @click="appStore.showImportUrl = false">Cancel</v-btn>
          <v-btn
            size="small" variant="tonal" color="primary"
            :loading="loading"
            prepend-icon="mdi-download"
            @click="doImport"
          >
            Import
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const urlInput = ref('')
const loading = ref(false)

// Resolve the user-pasted reference to a URL that returns the workspace
// JSON body directly. Returns null if we don't understand it.
function resolveToRawUrl(input) {
  const s = input.trim()
  if (!s) return null

  // Plain 32-hex gist id
  if (/^[a-f0-9]{20,40}$/i.test(s)) {
    return { kind: 'gist', gistId: s }
  }

  // Gist URL
  const gistMatch = s.match(/^https?:\/\/gist\.github\.com\/[^/]+\/([a-f0-9]+)/i)
  if (gistMatch) return { kind: 'gist', gistId: gistMatch[1] }

  // raw.githubusercontent — fetch directly
  if (/^https?:\/\/raw\.githubusercontent\.com\//i.test(s)) {
    return { kind: 'raw', url: s }
  }

  // github.com/owner/repo/blob/<branch>/<path> → rewrite to raw.githubusercontent
  const blob = s.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/)
  if (blob) {
    const [, owner, repo, branch, path] = blob
    return { kind: 'raw', url: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}` }
  }

  // Generic http(s) URL — try fetching as raw text
  if (/^https?:\/\//i.test(s)) {
    return { kind: 'raw', url: s }
  }

  return null
}

async function doImport() {
  const ref = resolveToRawUrl(urlInput.value)
  if (!ref) {
    appStore.log('Could not parse URL — see supported formats list', 'error')
    return
  }
  loading.value = true
  try {
    let body
    if (ref.kind === 'gist') {
      if (!window.lotusAPI?.github) { appStore.log('Sign in to GitHub first to load a private/auth-required gist', 'error'); return }
      const res = await window.lotusAPI.github.readGist(ref.gistId)
      if (!res?.ok) { appStore.log(res?.error || 'Gist read failed', 'error'); return }
      const files = res.gist.files || {}
      const fname = Object.keys(files).find(n => n.endsWith('.json')) || Object.keys(files)[0]
      if (!fname) { appStore.log('Gist has no usable file', 'error'); return }
      body = files[fname].content
    } else {
      const res = await window.lotusAPI.marketplace.fetchUrl(ref.url)
      if (!res?.ok) { appStore.log(res?.error || 'Fetch failed', 'error'); return }
      body = res.text
    }

    let parsed
    try { parsed = JSON.parse(body) }
    catch (e) { appStore.log(`Not valid JSON: ${e.message}`, 'error'); return }

    appStore.loadWorkspaceRequest = parsed
    appStore.currentFile = null
    appStore.editorMode = 'blockly'
    appStore.isDirty = false
    appStore.log('Imported sketch from URL', 'success')
    urlInput.value = ''
    appStore.showImportUrl = false
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.iu-header { display: flex; align-items: center; padding: 12px 16px; }
.row-desc { font-size: 12px; opacity: 0.8; line-height: 1.6; }
.row-actions { display: flex; gap: 8px; }
.format-list { margin: 6px 0 0 20px; padding: 0; }
.format-list li { font-size: 11px; opacity: 0.75; }
.format-list code { font-family: 'Fira Code', 'Consolas', monospace; font-size: 11px; }
</style>
