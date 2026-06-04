<template>
  <div class="code-editor-wrap">
    <div class="editor-tabs">
      <div class="tab active">
        <v-icon size="14">mdi-file-code-outline</v-icon>
        <span>{{ fileName }}</span>
        <span v-if="appStore.isDirty" class="dirty-dot"></span>
      </div>
    </div>
    <textarea
      ref="editorRef"
      v-model="code"
      class="raw-editor"
      spellcheck="false"
      @keydown.tab.prevent="insertTab"
      @input="appStore.isDirty = true"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const editorRef = ref(null)

// Two-way sync with the shared store so Blockly→Code and compile both use the same source
const code = computed({
  get: () => appStore.arduinoCode,
  set: (val) => { appStore.arduinoCode = val },
})

const fileName = computed(() => {
  if (!appStore.currentFile) return 'sketch.ino'
  return appStore.currentFile.split('\\').pop()
})

function insertTab() {
  const start = editorRef.value.selectionStart
  const end = editorRef.value.selectionEnd
  appStore.arduinoCode = appStore.arduinoCode.substring(0, start) + '  ' + appStore.arduinoCode.substring(end)
  appStore.isDirty = true
  // Restore cursor after Vue updates the DOM
  requestAnimationFrame(() => {
    editorRef.value.selectionStart = editorRef.value.selectionEnd = start + 2
  })
}
</script>

<style scoped>
.code-editor-wrap { display: flex; flex-direction: column; width: 100%; height: 100%; }
.editor-tabs {
  display: flex; height: 32px; background: rgb(var(--v-theme-surface-variant));
  border-bottom: 1px solid rgba(0,0,0,0.08);
}
.tab {
  display: flex; align-items: center; gap: 6px; padding: 0 14px;
  font-size: 12px; background: rgb(var(--v-theme-surface)); border-right: 1px solid rgba(0,0,0,0.08);
  color: rgb(var(--v-theme-on-surface));
}
.dirty-dot { width: 6px; height: 6px; border-radius: 50%; background: #f0a500; }
.raw-editor {
  flex: 1; background: rgb(var(--v-theme-background)); color: rgb(var(--v-theme-on-background));
  border: none; outline: none; resize: none; padding: 16px;
  font-family: 'Fira Code', 'Consolas', monospace; font-size: 14px; line-height: 1.6;
  tab-size: 2;
}
</style>
