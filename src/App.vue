<template>
  <v-app :theme="appStore.theme">
    <SplashScreen v-if="showSplash" @done="showSplash = false" />

    <template v-if="!showSplash">
      <div class="lotus-app">
        <TitleBar />
        <MenuBar />
        <div class="lotus-body">
          <Toolbar />
          <div class="lotus-editor-area">
            <BlocklyEditor v-if="appStore.editorMode === 'blockly'" />
            <CodeEditor v-else />
          </div>
          <ConsolePanel />
        </div>
      </div>
      <SerialMonitor v-if="appStore.showSerial" />
      <BoardSelector v-if="appStore.showBoardSelector" />
      <PluginManager v-if="appStore.showPluginManager" />
      <BoardManager v-if="appStore.showBoardManager" />
      <LibraryManager v-if="appStore.showLibraryManager" />
      <GitHubManager v-if="appStore.showGithubManager" />
      <UpdaterPanel v-if="appStore.showUpdater" />
      <ImportUrlDialog v-if="appStore.showImportUrl" />
    </template>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from './stores/app'
import { useSerialStore } from './stores/serial'
import { usePluginStore } from './stores/plugins'
import { useUpdaterStore } from './stores/updater'
import SplashScreen from './components/SplashScreen.vue'
import TitleBar from './components/TitleBar.vue'
import MenuBar from './components/MenuBar.vue'
import Toolbar from './components/Toolbar.vue'
import BlocklyEditor from './components/BlocklyEditor.vue'
import CodeEditor from './components/CodeEditor.vue'
import ConsolePanel from './components/ConsolePanel.vue'
import SerialMonitor from './components/SerialMonitor.vue'
import BoardSelector from './components/BoardSelector.vue'
import PluginManager from './components/PluginManager.vue'
import BoardManager from './components/BoardManager.vue'
import LibraryManager from './components/LibraryManager.vue'
import GitHubManager from './components/GitHubManager.vue'
import UpdaterPanel from './components/UpdaterPanel.vue'
import ImportUrlDialog from './components/ImportUrlDialog.vue'

const appStore = useAppStore()
const serialStore = useSerialStore()
const pluginStore = usePluginStore()
const updaterStore = useUpdaterStore()
const showSplash = ref(true)

onMounted(() => {
  appStore.loadBoards()
  pluginStore.refresh()
  updaterStore.setupListener()
  updaterStore.refresh()
  if (window.lotusAPI) {
    window.lotusAPI.serial.onData((line) => serialStore.addLine(line))
    window.lotusAPI.serial.onStatus((status) => {
      serialStore.connected = status === 'connected'
    })
    window.lotusAPI.arduino.onProgress((msg) => appStore.log(msg, 'build'))
  }
})
</script>

<style>
:root {
  --lotus-navy: #0a1628;
  --lotus-border: 7px;
}

/* ซ่อน native scrollbar ทุกที่ — Blockly มี scrollbar ของตัวเอง */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
* { scrollbar-width: none !important; }

html, body, #app {
  height: 100%; width: 100%;
  overflow: hidden;
  background: var(--lotus-navy);
}

.v-application {
  overflow: hidden !important;
  background: transparent !important;
  width: 100% !important;
  height: 100% !important;
}
.v-application--wrap {
  overflow: hidden !important;
  min-height: unset !important;
  height: 100% !important;
  background: transparent !important;
  padding: 0 !important;
  flex-direction: column !important;
  display: flex !important;
}

.lotus-app {
  display: flex; flex-direction: column;
  width: 100%; height: 100%; overflow: hidden;
  background: var(--lotus-navy);
  position: relative;
}
.lotus-app::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  box-shadow:
    inset 0 0 0 2px #ffffff,
    inset 0 0 0 4px #000000;
}
.lotus-body {
  display: flex; flex-direction: column;
  flex: 1; overflow: hidden;
  padding: 0 var(--lotus-border);
  background: transparent;
}
.lotus-editor-area {
  flex: 1; overflow: hidden; position: relative;
  box-shadow: inset 0 0 0 1px #ffffff, inset 0 0 0 2px #000000, inset 0 0 0 3px #ffffff;
  border-radius: 2px;
}
</style>
