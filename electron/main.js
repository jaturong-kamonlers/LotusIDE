const { app, BrowserWindow, ipcMain, shell, protocol } = require('electron')
const path = require('path')
const fs = require('fs')
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Must be registered before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'kbide', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } },
])

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    icon: path.join(__dirname, '../public/logo/lotus.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  // Serve KBIDE static assets via kbide:// — read file directly, set correct MIME
  // kbide:// originally pointed at C:\KBIDE_Lotus for ingesting upstream KBIDE
  // assets during development. Production / non-Windows installs don't have
  // that folder — so we fall back to the bundled <app>/public/boards directory.
  const KBIDE_DEV_ROOT = process.platform === 'win32' ? 'C:\\KBIDE_Lotus' : null
  const KBIDE_FALLBACK = path.join(__dirname, '..', 'public')
  protocol.handle('kbide', (request) => {
    const url = new URL(request.url)
    const candidates = [
      KBIDE_DEV_ROOT && path.join(KBIDE_DEV_ROOT, url.hostname, url.pathname),
      path.join(KBIDE_FALLBACK, url.hostname, url.pathname),
    ].filter(Boolean)
    for (const absPath of candidates) {
      try {
        const data = fs.readFileSync(absPath)
        const ext = path.extname(absPath).toLowerCase()
        const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }
        return new Response(data, { headers: { 'Content-Type': mime[ext] || 'application/octet-stream' } })
      } catch { /* try next candidate */ }
    }
    return new Response('Not Found', { status: 404 })
  })

  createWindow()
  require('./ipc/serial')
  require('./ipc/arduino')
  require('./ipc/window')(mainWindow)
  require('./ipc/plugins')
  require('./ipc/github')
  require('./ipc/updater')
  require('./ipc/marketplace')
  require('./ipc/libraries-manage')

  // Open URL in the user's default browser. Only allow http(s) so a malicious
  // renderer call can't launch arbitrary `file:` / shell handlers.
  ipcMain.handle('shell:openExternal', (_e, url) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      return shell.openExternal(url)
    }
  })

  // USB-to-serial driver launcher. Drivers ship in <install>/resources/app/drivers/.
  // CP210x is extracted (uses pnputil for silent install); CH340 is a regular
  // .exe installer launched directly.
  ipcMain.handle('drivers:install', (_e, name) => {
    const DRIVERS_DIR = path.join(__dirname, '..', 'drivers')
    if (name === 'open-folder') {
      shell.openPath(DRIVERS_DIR)
      return { note: `Drivers folder opened: ${DRIVERS_DIR}` }
    }
    if (name === 'cp210x') {
      const inf = path.join(DRIVERS_DIR, 'CP210x_extract', 'silabser.inf')
      if (!fs.existsSync(inf)) return { error: `CP210x driver not bundled. Expected: ${inf}` }
      // pnputil ships with Windows; /install elevates via UAC if needed
      require('child_process').exec(`pnputil /add-driver "${inf}" /install`, (err, stdout, stderr) => {
        if (err) console.warn('[drivers] CP210x pnputil error:', err.message)
      })
      return { note: 'CP210x install started (UAC may prompt). Reconnect device after install completes.' }
    }
    if (name === 'ch340') {
      const exe = path.join(DRIVERS_DIR, 'CH341SER.EXE')
      if (!fs.existsSync(exe)) return {
        error: 'CH340 driver not bundled. Download CH341SER.EXE from https://www.wch-ic.com/downloads/CH341SER_EXE.html and place it in the Drivers folder (use "Open Drivers Folder").',
      }
      require('child_process').spawn(exe, [], { detached: true, stdio: 'ignore' }).unref()
      return { note: 'CH340 installer launched.' }
    }
    return { error: `Unknown driver: ${name}` }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
