const { ipcMain, BrowserWindow } = require('electron')
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')

let activePort = null
let activeParser = null

ipcMain.handle('serial:list', async () => {
  const ports = await SerialPort.list()
  return ports.map(p => ({ path: p.path, manufacturer: p.manufacturer || '' }))
})

ipcMain.handle('serial:connect', async (event, portPath, baudrate) => {
  if (activePort && activePort.isOpen) {
    await new Promise(r => activePort.close(r))
  }
  return new Promise((resolve, reject) => {
    const port = new SerialPort({ path: portPath, baudRate: baudrate || 115200 }, (err) => {
      if (err) return reject(err.message)
      activePort = port
      activeParser = port.pipe(new ReadlineParser({ delimiter: '\n' }))
      activeParser.on('data', (line) => {
        const wins = BrowserWindow.getAllWindows()
        wins.forEach(w => w.webContents.send('serial:data', line))
      })
      port.on('close', () => {
        const wins = BrowserWindow.getAllWindows()
        wins.forEach(w => w.webContents.send('serial:status', 'disconnected'))
        activePort = null
      })
      resolve({ ok: true })
    })
  })
})

ipcMain.handle('serial:disconnect', async () => {
  if (activePort && activePort.isOpen) {
    await new Promise(r => activePort.close(r))
  }
  activePort = null
  return { ok: true }
})

ipcMain.handle('serial:send', async (event, data) => {
  if (!activePort || !activePort.isOpen) return { error: 'Not connected' }
  return new Promise((resolve) => {
    activePort.write(data + '\n', (err) => {
      resolve(err ? { error: err.message } : { ok: true })
    })
  })
})
