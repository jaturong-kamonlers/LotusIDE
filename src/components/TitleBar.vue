<template>
  <div class="titlebar" :class="theme">
    <div class="titlebar-drag">
      <img src="/logo/lotus.jpg" class="titlebar-logo" />
      <span class="titlebar-name">Lotus IDE</span>
      <span class="titlebar-version">ArduiBot v1.0</span>
      <span class="titlebar-sep">|</span>
      <span class="titlebar-file">{{ fileName }}</span>
      <span v-if="appStore.isDirty" class="titlebar-dirty" title="Unsaved changes">●</span>
    </div>
    <div class="titlebar-controls">
      <button class="tc-btn" @click="minimize"><v-icon size="14">mdi-minus</v-icon></button>
      <button class="tc-btn" @click="maximize"><v-icon size="14">mdi-square-outline</v-icon></button>
      <button class="tc-btn tc-close" @click="closeApp"><v-icon size="14">mdi-close</v-icon></button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/app'
const appStore = useAppStore()
const theme = computed(() => appStore.theme)
const fileName = computed(() => {
  if (!appStore.currentFile) return `${appStore.selectedBoard?.id || 'sketch'}.json`
  return appStore.currentFile.split('\\').pop()
})

function minimize() { window.lotusAPI?.window.minimize() }
function maximize() { window.lotusAPI?.window.maximize() }
function closeApp() { window.lotusAPI?.window.close() }
</script>

<style scoped>
.titlebar {
  height: 36px; display: flex; align-items: center;
  background: #0a1628 !important;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  -webkit-app-region: drag; user-select: none; flex-shrink: 0;
}
.titlebar-drag { display: flex; align-items: center; gap: 8px; flex: 1; padding: 0 12px; }
.titlebar-logo { width: 20px; height: 20px; border-radius: 4px; object-fit: contain; }
.titlebar-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.95); }
.titlebar-version { font-size: 11px; opacity: 0.45; color: rgba(255,255,255,0.7); }
.titlebar-sep { font-size: 11px; opacity: 0.25; color: rgba(255,255,255,0.5); margin: 0 2px; }
.titlebar-file { font-size: 12px; color: rgba(255,255,255,0.65); font-family: monospace; }
.titlebar-dirty { font-size: 10px; color: #f0a500; margin-left: 2px; line-height: 1; }
.titlebar-controls { display: flex; -webkit-app-region: no-drag; }
.tc-btn {
  width: 46px; height: 36px; border: none; background: transparent;
  color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.tc-btn:hover { background: rgba(255,255,255,0.1); }
.tc-close:hover { background: #e81123; color: white; }
</style>
