<template>
  <v-dialog v-model="appStore.showLibraryManager" max-width="820" scrollable>
    <v-card class="lm-dialog">
      <v-card-title class="lm-header">
        <v-icon class="mr-2">mdi-package-variant</v-icon>
        Manage Libraries
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="appStore.showLibraryManager = false" />
      </v-card-title>

      <v-tabs v-model="tab" density="compact" color="primary">
        <v-tab value="installed">Installed</v-tab>
        <v-tab value="search">Search</v-tab>
        <v-tab value="github">From Git / Zip</v-tab>
        <v-tab value="settings">Settings</v-tab>
      </v-tabs>

      <v-card-text class="pa-3">
        <!-- INSTALLED -->
        <div v-if="tab === 'installed'">
          <div class="row-actions">
            <v-spacer />
            <v-btn size="small" variant="text" :loading="store.busy" prepend-icon="mdi-refresh" @click="store.refresh">
              Refresh
            </v-btn>
          </div>

          <div v-if="store.installed.length === 0" class="empty">
            <v-icon size="48" color="grey-lighten-1">mdi-package-variant</v-icon>
            <div class="empty-text">No user-installed libraries.</div>
            <div class="empty-hint">Headers bundled with the board's <code>include/</code> folder are always available.</div>
            <code class="path">{{ store.userRoot }}</code>
          </div>

          <div v-else class="row-list">
            <div v-for="lib in store.installed" :key="lib.id" class="lib-row">
              <v-icon size="28">mdi-package-variant-closed</v-icon>
              <div class="row-meta">
                <div class="row-title">
                  {{ lib.manifest.name }}
                  <span v-if="lib.manifest.version" class="row-ver">v{{ lib.manifest.version }}</span>
                </div>
                <div v-if="lib.manifest.sentence" class="row-desc">{{ lib.manifest.sentence }}</div>
                <div v-if="lib.manifest.author" class="row-sub">
                  by {{ lib.manifest.author }}
                  <span v-if="lib.manifest.architectures"> · {{ lib.manifest.architectures }}</span>
                </div>
              </div>
              <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" @click="confirmUninstall(lib)" />
            </div>
          </div>
        </div>

        <!-- SEARCH -->
        <div v-else-if="tab === 'search'">
          <div class="row-actions">
            <v-text-field
              v-model="searchQuery"
              density="compact" variant="outlined" hide-details
              placeholder="Search Arduino Library Index (e.g. Servo, OneWire)"
              prepend-inner-icon="mdi-magnify"
              @keydown.enter="doSearch"
              style="flex: 1;"
            />
            <v-btn size="small" variant="tonal" color="primary" :loading="store.searching" @click="doSearch">
              Search
            </v-btn>
          </div>

          <div v-if="store.searchResults.length === 0 && !store.searching" class="empty">
            <v-icon size="48" color="grey-lighten-1">mdi-cloud-search-outline</v-icon>
            <div class="empty-text">No results.</div>
            <div class="empty-hint">Enter a library name above and press Enter, or update the index in Settings.</div>
          </div>

          <div v-else class="row-list">
            <div v-if="store.searchTruncated" class="truncated">Showing first 500 results — refine your search.</div>
            <div v-for="entry in store.searchResults" :key="entry.name" class="lib-row">
              <v-icon size="28">mdi-package-down</v-icon>
              <div class="row-meta">
                <div class="row-title">
                  {{ entry.name }}
                  <span v-if="entry.version" class="row-ver">v{{ entry.version }}</span>
                </div>
                <div v-if="entry.sentence" class="row-desc">{{ entry.sentence }}</div>
                <div v-if="entry.author || entry.architectures" class="row-sub">
                  <span v-if="entry.author">by {{ entry.author }}</span>
                  <span v-if="entry.architectures"> · {{ entry.architectures }}</span>
                </div>
              </div>
              <v-btn
                size="small" variant="tonal" color="primary"
                :loading="installingName === entry.name"
                :disabled="installedNames.has(entry.name)"
                @click="install(entry)"
              >
                {{ installedNames.has(entry.name) ? 'Installed' : 'Install' }}
              </v-btn>
            </div>
          </div>
        </div>

        <!-- FROM GIT / ZIP -->
        <div v-else-if="tab === 'github'">
          <div class="row-title">Install from a Git repository</div>
          <div class="row-desc">
            Paste a git URL (e.g. <code>https://github.com/owner/repo.git</code>).
            The repository's HEAD will be cloned as a library.
          </div>
          <v-text-field
            v-model="gitUrl"
            density="compact" variant="outlined" hide-details
            placeholder="https://github.com/owner/some-arduino-library.git"
            class="mt-3"
            @keydown.enter="doInstallFromGit"
          />
          <div class="row-actions mt-2">
            <v-spacer />
            <v-btn
              size="small" variant="tonal" color="primary"
              :loading="store.busy"
              prepend-icon="mdi-git"
              @click="doInstallFromGit"
            >
              Install from Git
            </v-btn>
          </div>

          <v-divider class="my-4" />

          <div class="row-title">Install from a local .zip</div>
          <div class="row-desc">
            Choose a downloaded Arduino library zip. The archive's top-level
            folder will be installed under that folder name.
          </div>
          <div class="row-actions mt-2">
            <v-spacer />
            <v-btn
              size="small" variant="tonal" color="primary"
              :loading="store.busy"
              prepend-icon="mdi-upload"
              @click="doInstallFromZip"
            >
              Pick zip and install
            </v-btn>
          </div>

          <v-alert type="info" density="compact" variant="tonal" class="mt-3">
            Git / zip installs require <code>library.enable_unsafe_install</code>
            to be true — LotusIDE sets this automatically and the change is
            scoped to LotusIDE only.
          </v-alert>
        </div>

        <!-- SETTINGS -->
        <div v-else-if="tab === 'settings'" class="settings-pane">
          <div class="row-title">Library index</div>
          <div class="row-desc">
            arduino-cli caches the Arduino Library Index. Refresh it to see
            newly published libraries.
          </div>
          <div class="row-actions mt-2">
            <v-btn size="small" variant="tonal" color="primary" :loading="store.busy" @click="store.updateIndex">
              Update library index
            </v-btn>
          </div>

          <v-divider class="my-4" />

          <div class="row-title">Install location</div>
          <div class="row-desc">
            All installs go here. Survives across LotusIDE versions; safe to
            back up.
          </div>
          <code class="path mt-2 d-inline-block">{{ store.userRoot }}</code>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { useLibraryManagerStore } from '../stores/libraryManager'

const appStore = useAppStore()
const store = useLibraryManagerStore()
const tab = ref('installed')
const searchQuery = ref('')
const gitUrl = ref('')
const installingName = ref(null)

const installedNames = computed(() => new Set(store.installed.map(l => l.manifest.name || l.id)))

async function doSearch() {
  await store.search(searchQuery.value)
}

async function install(entry) {
  installingName.value = entry.name
  try {
    await store.install(entry.name, entry.version)
  } finally {
    installingName.value = null
  }
}

async function doInstallFromGit() {
  if (!gitUrl.value.trim()) return
  const res = await store.installFromGit(gitUrl.value.trim())
  if (res?.ok) gitUrl.value = ''
}

async function doInstallFromZip() {
  await store.installFromZip()
}

async function confirmUninstall(lib) {
  const name = lib.manifest.name || lib.id
  if (!confirm(`Uninstall library "${name}"?`)) return
  await store.uninstall(name)
}

watch(() => appStore.showLibraryManager, (v) => {
  if (v) store.refresh()
})
</script>

<style scoped>
.lm-dialog { max-height: 80vh; }
.lm-header { display: flex; align-items: center; padding: 12px 16px; }

.row-actions { display: flex; align-items: center; gap: 8px; padding: 8px 4px; }
.path { font-family: 'Fira Code', 'Consolas', monospace; font-size: 11px; background: rgba(0,0,0,0.1); padding: 4px 8px; border-radius: 4px; word-break: break-all; max-width: 460px; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 32px 16px; gap: 8px; }
.empty-text { font-size: 14px; opacity: 0.7; }
.empty-hint { font-size: 12px; opacity: 0.6; text-align: center; }

.row-list { display: flex; flex-direction: column; gap: 6px; }
.lib-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; }
.row-meta { flex: 1; min-width: 0; }
.row-title { font-size: 14px; font-weight: 600; }
.row-ver { font-size: 11px; opacity: 0.5; font-weight: 400; margin-left: 6px; }
.row-desc { font-size: 12px; opacity: 0.75; line-height: 1.4; }
.row-sub { font-size: 11px; opacity: 0.55; margin-top: 2px; }

.truncated { font-size: 11px; opacity: 0.6; padding: 4px 8px; font-style: italic; }
.settings-pane { padding: 8px 4px; }
</style>
