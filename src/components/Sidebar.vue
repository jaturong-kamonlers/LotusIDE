<template>
  <div class="sidebar">
    <div class="sidebar-bottom">
      <v-btn icon="mdi-help-circle-outline" variant="text" size="small" title="ช่วยเหลือ" />
      <span class="version-text">v1.0.0</span>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '../stores/app'
const appStore = useAppStore()
</script>

<style scoped>
.sidebar {
  width: 48px; min-width: 48px;
  background: rgb(var(--v-theme-sidebar));
  border-right: 1px solid rgba(255,255,255,0.07);
  display: flex; flex-direction: column;
  padding: 4px 0; overflow: hidden;
}
.sidebar-bottom {
  margin-top: auto; padding: 6px 4px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.version-text { font-size: 9px; opacity: 0.35; }
</style>
