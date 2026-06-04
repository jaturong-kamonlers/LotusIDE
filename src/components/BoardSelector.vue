<template>
  <v-dialog v-model="appStore.showBoardSelector" max-width="680" scrollable>
    <v-card class="board-dialog">
      <v-card-title class="board-dialog-header">
        <v-icon class="mr-2">mdi-cpu-64-bit</v-icon>
        Select Board
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="appStore.showBoardSelector = false" />
      </v-card-title>

      <v-text-field
        v-model="search" placeholder="Search boards..." density="compact"
        hide-details prepend-inner-icon="mdi-magnify" variant="outlined"
        class="mx-4 mb-2 mt-1"
      />

      <v-card-text class="pa-2">
        <div v-for="group in groupedBoards" :key="group.name" class="board-group">
          <div class="group-label">{{ group.name }}</div>
          <div class="board-grid">
            <div
              v-for="board in group.boards" :key="board.id"
              class="board-card"
              :class="{ selected: appStore.selectedBoard?.id === board.id }"
              @click="appStore.selectBoard(board)"
            >
              <div class="board-img-wrap">
                <img v-if="board.image" :src="board.image" class="board-img" :alt="board.title" />
                <v-icon v-else size="32" color="primary">mdi-developer-board</v-icon>
              </div>
              <div class="board-info">
                <div class="board-title">{{ board.title }}</div>
                <div class="board-desc">{{ board.description }}</div>
                <v-chip size="x-small" class="mt-1" :color="platformColor(board.platform)">
                  {{ board.platform }}
                </v-chip>
              </div>
              <v-icon v-if="appStore.selectedBoard?.id === board.id" color="primary" class="selected-check">mdi-check-circle</v-icon>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const search = ref('')

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return appStore.boards.filter(b => !q || b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
})

const groupedBoards = computed(() => {
  const groups = {}
  filtered.value.forEach(b => {
    if (!groups[b.group]) groups[b.group] = []
    groups[b.group].push(b)
  })
  return Object.entries(groups).map(([name, boards]) => ({ name, boards }))
})

function platformColor(platform) {
  const map = { 'arduino-esp32': 'orange', 'arduino-avr': 'blue', 'arduino-sam': 'purple' }
  return map[platform] || 'grey'
}
</script>

<style scoped>
.board-dialog { max-height: 80vh; }
.board-dialog-header { display: flex; align-items: center; padding: 12px 16px; }
.board-group { margin-bottom: 12px; }
.group-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; padding: 4px 8px; }
.board-grid { display: flex; flex-direction: column; gap: 4px; }
.board-card {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  border-radius: 8px; cursor: pointer; position: relative;
  border: 1px solid rgba(255,255,255,0.06); transition: all 0.15s;
}
.board-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(240,165,0,0.3); }
.board-card.selected { background: rgba(240,165,0,0.08); border-color: rgba(240,165,0,0.5); }
.board-img-wrap {
  flex-shrink: 0; width: 72px; height: 54px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px; overflow: hidden;
  background: rgba(255,255,255,0.04);
}
.board-img { width: 100%; height: 100%; object-fit: contain; padding: 4px; border-radius: 6px; }
.board-info { flex: 1; min-width: 0; }
.board-title { font-size: 14px; font-weight: 600; }
.board-desc { font-size: 12px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.selected-check { flex-shrink: 0; }
</style>
