// Manage Arduino libraries via arduino-cli's built-in library manager.
//
// Libraries install to <userData>/arduino-cli/user/libraries/<name>/ — the same
// directory arduino-cli uses when compiling, so an installed library Just Works
// at the next compile without any extra plumbing.
//
// We expose:
//   libraries:userRoot   → absolute path of the user libraries folder
//   libraries:list       → installed libraries (folder name + library.properties)
//   libraries:search     → query the Arduino Library Index by keyword
//   libraries:install    → `arduino-cli lib install <name>[@version]`
//   libraries:installFromGit → `arduino-cli lib install --git-url <url>`
//   libraries:installFromZip → `arduino-cli lib install --zip-path <path>`
//   libraries:pickZip    → file picker for a local .zip
//   libraries:uninstall  → `arduino-cli lib uninstall <name>`
//   libraries:updateIndex → `arduino-cli lib update-index`
//
// Background: arduino-cli refuses git/zip installs unless
// library.enable_unsafe_install is true. We set it via env so the setting is
// scoped to LotusIDE (no global config mutation).

const { app, ipcMain, dialog, BrowserWindow } = require('electron')
const { execFile } = require('child_process')
const fs   = require('fs')
const fsp  = require('fs/promises')
const path = require('path')

const isPackaged = () => !!(app && app.isPackaged)
const LOTUS_ROOT = path.join(__dirname, '../../')
const EXE = process.platform === 'win32' ? '.exe' : ''

const ARDUINO_CLI_DIR  = path.join(LOTUS_ROOT, 'resources', 'arduino-cli')
const ARDUINO_CLI      = path.join(ARDUINO_CLI_DIR, `arduino-cli${EXE}`)
const ARDUINO_CLI_DATA = path.join(ARDUINO_CLI_DIR, 'data')

function userWritableBase() {
  return app.isReady() ? app.getPath('userData') : ARDUINO_CLI_DIR
}
function arduinoUser()      { return path.join(userWritableBase(), 'arduino-cli', 'user') }
function arduinoDownloads() { return path.join(userWritableBase(), 'arduino-cli', 'staging') }
function arduinoCache()     { return path.join(userWritableBase(), 'arduino-cli', 'cache') }
function librariesRoot()    { return path.join(arduinoUser(), 'libraries') }

function cliEnv() {
  return {
    ...process.env,
    ARDUINO_DIRECTORIES_DATA:           ARDUINO_CLI_DATA,
    ARDUINO_DIRECTORIES_DOWNLOADS:      arduinoDownloads(),
    ARDUINO_DIRECTORIES_USER:           arduinoUser(),
    ARDUINO_BUILD_CACHE_PATH:           arduinoCache(),
    ARDUINO_LIBRARY_ENABLE_UNSAFE_INSTALL: 'true',
  }
}

function sendProgress(msg) {
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('arduino:progress', msg))
}

// Validate a library name we are about to hand to arduino-cli on a shell-ish
// path. arduino-cli accepts spaces in names ("Adafruit GFX Library"), so we
// only block characters that could break the spawn or escape into options.
function safeLibName(name) {
  if (typeof name !== 'string' || name.length === 0 || name.length > 200) return false
  // Reject control chars, quotes, NUL, and a leading dash (which would look
  // like a flag to arduino-cli).
  if (/[\x00-\x1f"'`]/.test(name)) return false
  if (name.startsWith('-')) return false
  return true
}

function runCli(args, { maxBuffer = 20 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    const proc = execFile(ARDUINO_CLI, args, { env: cliEnv(), maxBuffer })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', d => { stdout += d.toString() })
    proc.stderr.on('data', d => { stderr += d.toString() })
    proc.on('close', code => {
      if (code === 0) resolve({ stdout, stderr })
      else reject(new Error(stderr.split('\n').filter(Boolean).slice(-5).join('\n') || `exit ${code}`))
    })
    proc.on('error', reject)
  })
}

// Stream output as Arduino-progress messages so the user sees what is happening
// during long-running installs.
function runCliWithProgress(args, label) {
  return new Promise((resolve, reject) => {
    const proc = execFile(ARDUINO_CLI, args, { env: cliEnv(), maxBuffer: 40 * 1024 * 1024 })
    let stderr = ''
    if (label) sendProgress(label)
    proc.stdout.on('data', d => {
      d.toString().split('\n').forEach(line => {
        const t = line.trim()
        if (t) sendProgress(t)
      })
    })
    proc.stderr.on('data', d => { stderr += d.toString() })
    proc.on('close', code => {
      if (code === 0) resolve({ ok: true })
      else resolve({ ok: false, error: stderr.split('\n').filter(Boolean).slice(-5).join('\n') || `exit ${code}` })
    })
    proc.on('error', err => resolve({ ok: false, error: err.message }))
  })
}

function parsePropertiesFile(text) {
  const out = {}
  text.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eq = trimmed.indexOf('=')
    if (eq < 0) return
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  })
  return out
}

ipcMain.handle('libraries:userRoot', () => librariesRoot())

ipcMain.handle('libraries:list', async () => {
  try {
    const root = librariesRoot()
    if (!fs.existsSync(root)) return []
    const entries = await fsp.readdir(root, { withFileTypes: true })
    const items = []
    for (const e of entries) {
      if (!e.isDirectory()) continue
      const libDir = path.join(root, e.name)
      const propsPath = path.join(libDir, 'library.properties')
      let manifest = {}
      try {
        if (fs.existsSync(propsPath)) {
          manifest = parsePropertiesFile(await fsp.readFile(propsPath, 'utf8'))
        }
      } catch { /* ignore unreadable properties */ }
      items.push({
        id: e.name,
        ok: true,
        manifest: {
          name:        manifest.name        || e.name,
          version:     manifest.version     || '',
          author:      manifest.author      || '',
          maintainer:  manifest.maintainer  || '',
          sentence:    manifest.sentence    || '',
          paragraph:   manifest.paragraph   || '',
          category:    manifest.category    || '',
          architectures: manifest.architectures || '',
          url:         manifest.url         || '',
        },
      })
    }
    items.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name))
    return items
  } catch (e) {
    return [{ id: '__error__', ok: false, error: e.message }]
  }
})

ipcMain.handle('libraries:search', async (_e, query) => {
  try {
    if (typeof query !== 'string') throw new Error('query must be a string')
    const q = query.trim()
    // `lib search ""` lists everything; allow it but cap the result count
    // client-side so the renderer doesn't choke on 5000+ rows.
    const args = q
      ? ['lib', 'search', q, '--format', 'json', '--no-color']
      : ['lib', 'search', '--format', 'json', '--no-color']
    const { stdout } = await runCli(args)
    const parsed = JSON.parse(stdout || '{}')
    // arduino-cli's shape: { libraries: [{ name, releases: { "1.2.3": {...} }, latest: {...} }] }
    const libs = Array.isArray(parsed.libraries) ? parsed.libraries : []
    const entries = libs.slice(0, 500).map(l => {
      const latest = l.latest || {}
      return {
        name:       l.name,
        version:    latest.version || '',
        author:     latest.author || '',
        maintainer: latest.maintainer || '',
        sentence:   latest.sentence || '',
        paragraph:  latest.paragraph || '',
        category:   latest.category || '',
        architectures: Array.isArray(latest.architectures) ? latest.architectures.join(', ') : '',
        website:    latest.website || '',
      }
    })
    return { ok: true, entries, truncated: libs.length > 500 }
  } catch (e) {
    return { ok: false, error: e.message, entries: [] }
  }
})

ipcMain.handle('libraries:install', async (_e, spec) => {
  // spec: { name, version? }
  if (!spec || !safeLibName(spec.name)) return { ok: false, error: 'invalid library name' }
  const arg = spec.version ? `${spec.name}@${spec.version}` : spec.name
  return runCliWithProgress(
    ['lib', 'install', arg, '--no-color'],
    `Installing library: ${arg}`,
  )
})

ipcMain.handle('libraries:installFromGit', async (_e, url) => {
  if (typeof url !== 'string' || !/^(https?:\/\/|git@)/i.test(url)) {
    return { ok: false, error: 'url must be http(s) or git@' }
  }
  return runCliWithProgress(
    ['lib', 'install', '--git-url', url, '--no-color'],
    `Installing from git: ${url}`,
  )
})

ipcMain.handle('libraries:installFromZip', async (_e, zipPath) => {
  if (typeof zipPath !== 'string' || !fs.existsSync(zipPath)) {
    return { ok: false, error: 'zip path does not exist' }
  }
  return runCliWithProgress(
    ['lib', 'install', '--zip-path', zipPath, '--no-color'],
    `Installing from zip: ${path.basename(zipPath)}`,
  )
})

ipcMain.handle('libraries:pickZip', async () => {
  const res = await dialog.showOpenDialog({
    title: 'Select Arduino library (.zip)',
    filters: [{ name: 'Arduino Library', extensions: ['zip'] }],
    properties: ['openFile'],
  })
  if (res.canceled || !res.filePaths[0]) return { canceled: true }
  return { canceled: false, path: res.filePaths[0] }
})

ipcMain.handle('libraries:uninstall', async (_e, name) => {
  if (!safeLibName(name)) return { ok: false, error: 'invalid library name' }
  return runCliWithProgress(
    ['lib', 'uninstall', name, '--no-color'],
    `Uninstalling library: ${name}`,
  )
})

ipcMain.handle('libraries:updateIndex', async () => {
  return runCliWithProgress(
    ['lib', 'update-index', '--no-color'],
    'Updating Arduino Library Index...',
  )
})

module.exports = { librariesRoot }
