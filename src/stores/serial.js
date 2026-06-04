import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSerialStore = defineStore('serial', () => {
  const ports = ref([])
  const connected = ref(false)
  const selectedPort = ref('')
  const baudrate = ref(115200)
  const receivedLines = ref([])
  const plotData = ref([])
  const showPlotter = ref(false)
  const autoScroll = ref(true)
  const lineEnding = ref('\\n')
  const baudrates = [9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000, 500000, 1000000, 2000000]

  function addLine(line) {
    receivedLines.value.push({ text: line, time: new Date().toLocaleTimeString() })
    if (receivedLines.value.length > 1000) receivedLines.value.shift()

    // Try to parse for plotter (comma-separated numbers)
    const nums = line.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
    if (nums.length > 0) {
      const t = Date.now()
      if (plotData.value.length === 0) {
        nums.forEach((_, i) => plotData.value.push([]))
      }
      nums.forEach((v, i) => {
        if (!plotData.value[i]) plotData.value[i] = []
        plotData.value[i].push({ t, v })
        if (plotData.value[i].length > 200) plotData.value[i].shift()
      })
    }
  }

  function clearLog() {
    receivedLines.value = []
    plotData.value = []
  }

  return {
    ports, connected, selectedPort, baudrate, receivedLines,
    plotData, showPlotter, autoScroll, lineEnding, baudrates,
    addLine, clearLog,
  }
})
