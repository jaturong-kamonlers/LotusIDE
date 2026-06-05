import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useSerialStore } from './serial'
import { BOARDS as FALLBACK_BOARDS } from '../boards'

export const useAppStore = defineStore('app', () => {
  const serialStore = useSerialStore()

  const boards = ref([])
  const boardsLoaded = ref(false)
  const selectedBoard = ref(null)
  const theme = ref('light')
  const editorMode = ref('blockly') // 'blockly' | 'code'
  const currentFile = ref(null)
  const isDirty = ref(false)
  const compiling = ref(false)
  const uploading = ref(false)
  const consoleLog = ref([])
  const showSerial = ref(false)
  const showBoardSelector = ref(false)
  const showPluginManager = ref(false)
  const showBoardManager = ref(false)
  const showLibraryManager = ref(false)
  const showGithubManager = ref(false)
  const showUpdater = ref(false)
  const showImportUrl = ref(false)
  const arduinoCode = ref('void setup() {\n}\n\nvoid loop() {\n}\n')
  const showConsole = ref(false)
  const workspaceJson = ref('')          // Blockly workspace JSON kept in sync by BlocklyEditor
  const loadWorkspaceRequest = ref(null) // set to parsed JSON object → BlocklyEditor loads it → resets to null
  const showCode = ref(false)            // toggles Arduino code preview panel in BlocklyEditor
  const showJson = ref(false)            // toggles workspace JSON editor dialog in BlocklyEditor

  // Sound on/off — persisted to localStorage so the choice survives restart.
  // Reads at store init (default ON); writes whenever toggled.
  const soundEnabled = ref(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('lotus.soundEnabled') !== 'false'
      : true,
  )
  watch(soundEnabled, (v) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('lotus.soundEnabled', String(v))
  })

  const boardPlatform = computed(() => selectedBoard.value?.platform || null)
  const canUpload = computed(() => selectedBoard.value && serialStore.selectedPort && !compiling.value && !uploading.value)

  function log(msg, type = 'info') {
    consoleLog.value.push({ msg, type, time: new Date().toLocaleTimeString() })
    if (consoleLog.value.length > 500) consoleLog.value.shift()
  }

  function clearLog() { consoleLog.value = [] }

  function selectBoard(board) {
    selectedBoard.value = board
    showBoardSelector.value = false
  }

  async function loadBoards(force = false) {
    if (boardsLoaded.value && !force) return
    try {
      if (window.lotusAPI?.boards?.list) {
        const list = await window.lotusAPI.boards.list()
        if (list && list.length > 0) { boards.value = list; boardsLoaded.value = true; return }
      }
    } catch (e) {
      console.warn('[app] boards:list failed:', e)
    }
    boards.value = FALLBACK_BOARDS
    boardsLoaded.value = true
  }

  return {
    boards, selectedBoard, theme, editorMode,
    currentFile, isDirty, compiling, uploading,
    consoleLog, showSerial, showBoardSelector, showPluginManager, showBoardManager, showLibraryManager, showGithubManager, showUpdater, showImportUrl, arduinoCode, showConsole,
    workspaceJson, loadWorkspaceRequest, showCode, showJson, soundEnabled,
    boardPlatform, canUpload,
    log, clearLog, selectBoard, loadBoards,
  }
})
