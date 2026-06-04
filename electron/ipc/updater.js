// Auto-update via electron-updater + GitHub Releases.
//
// The renderer drives the flow through three IPC calls:
//   updater:check    → triggers a background check, returns current state
//   updater:download → starts downloading an available update
//   updater:install  → quitAndInstall (restart into the new version)
//
// State is also pushed to the renderer via `updater:state` events so the UI
// can show progress bars / "Restart to update" prompts without polling.
//
// Why electron-updater? It speaks the same `latest.yml` format that
// electron-builder emits when `--publish always` is set, and it auto-resolves
// asset URLs from the configured GitHub release. No server-side code needed.
//
// In dev mode `app.isPackaged === false` so autoUpdater would refuse to do
// anything — we short-circuit and return a stub state. That keeps the UI
// testable without needing to build an installer first.

const { app, ipcMain, BrowserWindow } = require('electron')

let autoUpdater = null
let lastState = { status: 'idle', message: null, version: null, percent: 0, releaseNotes: null }

function getWin() {
  return BrowserWindow.getAllWindows()[0] || null
}

function broadcastState() {
  const win = getWin()
  if (win && !win.isDestroyed()) win.webContents.send('updater:state', lastState)
}

function setState(patch) {
  lastState = { ...lastState, ...patch }
  broadcastState()
}

function initUpdater() {
  if (!app.isPackaged) {
    setState({ status: 'disabled', message: 'Auto-update only runs in packaged builds.' })
    return
  }
  if (autoUpdater) return autoUpdater

  // Lazy require so dev builds don't pull in the native logger dependency.
  ;({ autoUpdater } = require('electron-updater'))

  // Don't auto-download — let the user decide. This avoids surprising
  // bandwidth usage on metered connections.
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => setState({ status: 'checking', message: 'Checking for updates…' }))
  autoUpdater.on('update-available',    (info) => setState({
    status: 'available',
    version: info.version,
    releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : null,
    message: `Update available: v${info.version}`,
  }))
  autoUpdater.on('update-not-available', (info) => setState({
    status: 'up-to-date',
    version: info?.version || null,
    message: 'You are on the latest version.',
  }))
  autoUpdater.on('error',               (err)  => setState({
    status: 'error',
    message: err?.message || String(err),
  }))
  autoUpdater.on('download-progress',   (p)    => setState({
    status: 'downloading',
    percent: Math.round(p.percent || 0),
    message: `Downloading… ${Math.round(p.percent || 0)}%`,
  }))
  autoUpdater.on('update-downloaded',   (info) => setState({
    status: 'downloaded',
    version: info.version,
    message: `Ready to install v${info.version}. Restart to apply.`,
  }))

  return autoUpdater
}

ipcMain.handle('updater:state', () => lastState)

ipcMain.handle('updater:check', async () => {
  try {
    const u = initUpdater()
    if (!u) return lastState
    await u.checkForUpdates()
    return lastState
  } catch (e) {
    setState({ status: 'error', message: e.message })
    return lastState
  }
})

ipcMain.handle('updater:download', async () => {
  try {
    if (!autoUpdater) return { error: 'Updater not initialised — run check first' }
    await autoUpdater.downloadUpdate()
    return { ok: true }
  } catch (e) {
    setState({ status: 'error', message: e.message })
    return { error: e.message }
  }
})

ipcMain.handle('updater:install', () => {
  if (!autoUpdater) return { error: 'No update downloaded' }
  // isSilent=false (show installer UI on Win), forceRunAfter=true (restart)
  setImmediate(() => autoUpdater.quitAndInstall(false, true))
  return { ok: true }
})

// First check 3 seconds after window load — gives the splash time to clear
// and avoids hitting GitHub before the user has anything to look at.
app.whenReady().then(() => {
  if (!app.isPackaged) return
  setTimeout(() => {
    try { initUpdater()?.checkForUpdates() } catch { /* ignore */ }
  }, 3000)
})
