const { ipcMain, BrowserWindow } = require('electron')

// Resolve which window the IPC call came from so the same handlers serve every
// frameless window (main IDE + MQTT wrapper + future popups) without each
// needing its own channel name.
function senderWin(event) {
  return BrowserWindow.fromWebContents(event.sender)
}

module.exports = function registerWindowIPC(_mainWindow) {
  ipcMain.handle('window:minimize', (e) => senderWin(e)?.minimize())
  ipcMain.handle('window:maximize', (e) => {
    const w = senderWin(e)
    if (!w) return
    if (w.isMaximized()) w.unmaximize()
    else w.maximize()
  })
  ipcMain.handle('window:close', (e) => senderWin(e)?.close())
  ipcMain.handle('window:isMaximized', (e) => senderWin(e)?.isMaximized() ?? false)
}
