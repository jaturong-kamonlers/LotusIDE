const { ipcMain, BrowserWindow, dialog, app } = require('electron')
const { execFile } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

// All assets bundled inside LotusIDE — no KBIDE dependency at runtime.
//
// Two location domains in production builds with asar enabled:
//   * "In-asar" code + small static assets (electron/, dist/, public/) live
//     inside <install>/resources/app.asar/. Electron's fs reads them
//     transparently so __dirname-relative joins still work.
//   * extraResources (resources/, including arduino-cli + avr-toolchain) are
//     unpacked to <install>/resources/app/resources/ — they need real on-disk
//     paths because they're handed to execFile() and to external programs.
//
// In dev there's no asar — both domains share the project root.
const electronApp = require('electron').app
const isPackaged  = !!(electronApp && electronApp.isPackaged)
const isDev       = process.env.NODE_ENV === 'development' || !isPackaged
const LOTUS_ROOT  = path.join(__dirname, '../../')

// Base of unpacked extraResources. The package.json `extraResources.to` is
// `app/resources`, so in a packaged build the on-disk path is
// <install>/resources/app/resources/. In dev it's just <project>/resources/.
const RESOURCES_BASE = isPackaged
  ? path.join(process.resourcesPath, 'app', 'resources')
  : path.join(LOTUS_ROOT, 'resources')

// Executable suffix — Windows binaries end in .exe; Linux/macOS don't.
const EXE = process.platform === 'win32' ? '.exe' : ''

// public/boards/ is listed in asarUnpack so native compilers (avr-g++ et al.)
// can read the .cpp/.h files from a real on-disk path rather than the asar
// archive that they can't open. In dev nothing is asar-packed; just point at
// the project tree. In production redirect any `app.asar` segment to
// `app.asar.unpacked` so handlers below feed gcc a path it can actually open.
const BOARDS_DIR   = isPackaged
  ? path.join(LOTUS_ROOT, 'public/boards').replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`)
  : path.join(LOTUS_ROOT, 'public/boards')
const AVR_DIR      = path.join(RESOURCES_BASE, 'avr-toolchain')
const AVR_TOOLS    = path.join(AVR_DIR, 'tools', 'bin')
const AVR_CORES    = path.join(AVR_DIR, 'sdk', 'cores', 'arduino')
const AVR_GCC      = path.join(AVR_TOOLS, `avr-gcc${EXE}`)
const AVR_GPP      = path.join(AVR_TOOLS, `avr-g++${EXE}`)
const AVR_OBJCOPY  = path.join(AVR_TOOLS, `avr-objcopy${EXE}`)
const AVR_DUDE     = path.join(AVR_TOOLS, `avrdude${EXE}`)
const AVR_DUDE_CONF = path.join(AVR_DIR, 'tools', 'etc', 'avrdude.conf')

// arduino-cli binary lives at the install path (read-only in Program Files —
// fine, arduino-cli only reads the .exe). Working dirs (data + downloads +
// user + cache) MUST be writable for `core install` / `lib install` to work
// at runtime, so they live under userData.
const ARDUINO_CLI_DIR        = path.join(RESOURCES_BASE, 'arduino-cli')
const ARDUINO_CLI            = path.join(ARDUINO_CLI_DIR, `arduino-cli${EXE}`)

// Writable dirs live under userData (%APPDATA%\Lotus IDE\ in production, the
// project dir in dev). Putting them under the install path causes EPERM in
// C:\Program Files where regular users can't write.
const USER_WRITABLE_BASE     = app && app.isReady() ? app.getPath('userData') : path.join(ARDUINO_CLI_DIR)
const ARDUINO_CLI_DATA       = path.join(USER_WRITABLE_BASE, 'arduino-cli', 'data')
const ARDUINO_CLI_DOWNLOADS  = path.join(USER_WRITABLE_BASE, 'arduino-cli', 'staging')
const ARDUINO_CLI_USER       = path.join(USER_WRITABLE_BASE, 'arduino-cli', 'user')
const ARDUINO_CLI_CACHE      = path.join(USER_WRITABLE_BASE, 'arduino-cli', 'cache')

// Bundled cores (currently AVR + SAM) ship inside the installer at
// <install>/resources/arduino-cli-bundled/data/. On first launch we seed
// userData with these so users can compile AVR/SAM sketches immediately
// without any download. ESP32 is NOT bundled — it lazy-installs via
// `ensureCoreInstalled()` on first ESP32 compile (or a Manage Boards
// pre-download), saving ~600 MB compressed in the installer.
const BUNDLED_DATA_DIR       = path.join(ARDUINO_CLI_DIR, 'data')

// Seed userData's arduino-cli data dir from the bundled installer copy if
// userData has no packages yet. Idempotent — no-op once seeded. Runs at
// require time which is after app.whenReady() (arduino.js is required from
// main.js's whenReady block).
function seedArduinoCliData() {
  try {
    if (!fs.existsSync(BUNDLED_DATA_DIR)) return
    const userPkgs = path.join(ARDUINO_CLI_DATA, 'packages')
    const bundledPkgs = path.join(BUNDLED_DATA_DIR, 'packages')
    if (!fs.existsSync(bundledPkgs)) return
    if (fs.existsSync(userPkgs) && fs.readdirSync(userPkgs).length > 0) return
    fs.mkdirSync(ARDUINO_CLI_DATA, { recursive: true })
    copyRecursiveSync(BUNDLED_DATA_DIR, ARDUINO_CLI_DATA)
    // The bundled arduino-cli.yaml was generated on the CI runner and bakes
    // in `D:\a\LotusIDE\LotusIDE\...` paths for build_cache + directories.
    // Runtime env vars in ARDUINO_CLI_ENV override every directory entry,
    // but any direct arduino-cli call that forgets an env var would fail
    // with "device is not ready". Drop the seeded yaml so arduino-cli
    // regenerates a fresh one against ENV the first time it needs to.
    try { fs.unlinkSync(path.join(ARDUINO_CLI_DATA, 'arduino-cli.yaml')) } catch { /* ok */ }
  } catch (e) {
    console.warn('[arduino] seed failed:', e.message)
  }
}
function copyRecursiveSync(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry))
    }
  } else {
    fs.copyFileSync(src, dest)
  }
}
seedArduinoCliData()

// Env block applied to every arduino-cli invocation. arduino-cli reads these
// before falling back to its default %LOCALAPPDATA%\Arduino15 location.
// `BUILD_CACHE_PATH` replaces the deprecated --build-cache-path flag (removed
// in arduino-cli >=1.x) for pinning the persistent core-archive cache.
const ARDUINO_CLI_ENV = {
  ...process.env,
  ARDUINO_DIRECTORIES_DATA:      ARDUINO_CLI_DATA,
  ARDUINO_DIRECTORIES_DOWNLOADS: ARDUINO_CLI_DOWNLOADS,
  ARDUINO_DIRECTORIES_USER:      ARDUINO_CLI_USER,
  ARDUINO_BUILD_CACHE_PATH:      ARDUINO_CLI_CACHE,
}

// Default FQBN per platform. Boards may override via context.json "fqbn" field.
const PLATFORM_FQBN = {
  'arduino-esp32': 'esp32:esp32:esp32',
  'arduino-sam':   'arduino:sam:arduino_due_x_dbg',
  'arduino-avr':   'arduino:avr:uno',
}

// FQBN → platform package id (used to drive `arduino-cli core install`).
function fqbnToPackage(fqbn) {
  const parts = String(fqbn).split(':')
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : null
}

// Auto-install Arduino libraries that don't ship with the board's include/
// folder. Keyed by include header name → library name expected by arduino-cli's
// library manager. Add entries here whenever a generator emits `#include <X.h>`
// for a header not present in the local board library.
const AUTO_INSTALL_LIBRARIES = {
  'PubSubClient.h': 'PubSubClient',
}

// Ensure a single library is present in our local user libraries dir.
function ensureLibraryInstalled(libName) {
  const libDir = path.join(ARDUINO_CLI_USER, 'libraries', libName)
  if (fs.existsSync(libDir)) return Promise.resolve()
  sendProgress(`Installing ${libName} library...`)
  return new Promise((resolve, reject) => {
    const proc = execFile(ARDUINO_CLI, ['lib', 'install', libName, '--no-color'],
      { env: ARDUINO_CLI_ENV, maxBuffer: 20 * 1024 * 1024 })
    let stderr = ''
    proc.stdout.on('data', d => {
      d.toString().split('\n').forEach(line => {
        const t = line.trim()
        if (t) sendProgress(t)
      })
    })
    proc.stderr.on('data', d => { stderr += d.toString() })
    proc.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(stderr.split('\n').filter(Boolean).slice(-5).join('\n') || `lib install exit ${code}`))
    })
    proc.on('error', err => reject(err))
  })
}

// Scan the wrapped sketch source for `#include <X.h>` headers that map to
// known external libraries, and install any that are missing.
async function ensureSketchLibraries(sourceCode) {
  for (const [header, libName] of Object.entries(AUTO_INSTALL_LIBRARIES)) {
    const re = new RegExp('#include\\s*[<"]' + header.replace(/\./g, '\\.') + '[>"]')
    if (re.test(sourceCode)) await ensureLibraryInstalled(libName)
  }
}

// Ensure the platform required by `fqbn` is installed in our local data dir.
// Returns when the install is finished (or already present).
// Approximate compressed download size of each core. Used to set expectations
// in the core-install progress dialog. Real disk usage post-extract is
// typically 2-3× larger; we show the download size since that's what the user
// is waiting on.
const CORE_SIZE_HINT = {
  'esp32:esp32':   { mb: 600,  diskMb: 5000 },
  'arduino:avr':   { mb: 50,   diskMb: 120  },
  'arduino:sam':   { mb: 50,   diskMb: 150  },
}

function sendCoreStatus(payload) {
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('arduino:coreStatus', payload))
}

// Tools that MUST be on disk for a core to actually compile/upload. The
// platform folder alone isn't enough — earlier releases of LotusIDE shipped a
// version where an interrupted `core install` left the platform sources on
// disk but with the tool downloads missing, then `isCoreInstalled` returned
// true forever after and the first compile failed with
//   "The system cannot find the path specified."
// (the recipe's {runtime.tools.esptool_py.path} placeholder never expanded).
//
// Pattern matches handle Espressif's chip-variant tool names: e.g. the libs
// package is `esp32-arduino-libs` in some index versions and `esp32-libs` /
// `esp32s3-libs` in others — any folder ending in `-libs` counts.
const REQUIRED_TOOL_PATTERNS = {
  'esp32:esp32': [/^esptool_py$/, /-libs$/],
}

function isCoreInstalled(pkg) {
  if (!pkg) return false
  const [vendor, platform] = pkg.split(':')
  if (!vendor || !platform) return false
  const platformDir = path.join(ARDUINO_CLI_DATA, 'packages', vendor, 'hardware', platform)
  try {
    if (!fs.existsSync(platformDir) || fs.readdirSync(platformDir).length === 0) return false
  } catch { return false }

  const patterns = REQUIRED_TOOL_PATTERNS[pkg]
  if (patterns) {
    const toolsDir = path.join(ARDUINO_CLI_DATA, 'packages', vendor, 'tools')
    let toolFolders = []
    try {
      toolFolders = fs.existsSync(toolsDir) ? fs.readdirSync(toolsDir) : []
    } catch { return false }
    for (const pattern of patterns) {
      const match = toolFolders.find(name => {
        if (!pattern.test(name)) return false
        try {
          return fs.readdirSync(path.join(toolsDir, name)).length > 0
        } catch { return false }
      })
      if (!match) return false
    }
  }
  return true
}

// Install a core, streaming output through arduino:progress and announcing
// start/end through arduino:coreStatus so a UI dialog can show a real
// progress modal. Idempotent — if already installed, resolves immediately
// without emitting coreStatus events.
function installCore(pkg) {
  if (!pkg) return Promise.resolve({ skipped: true })
  if (isCoreInstalled(pkg)) return Promise.resolve({ skipped: true })

  const hint = CORE_SIZE_HINT[pkg] || { mb: 500, diskMb: 1500 }
  sendCoreStatus({ state: 'start', pkg, sizeMb: hint.mb, diskMb: hint.diskMb })
  sendProgress(`Installing ${pkg} core (~${hint.mb} MB download, ~${hint.diskMb} MB on disk) — one-time`)

  return new Promise((resolve, reject) => {
    const proc = execFile(ARDUINO_CLI, ['core', 'install', pkg, '--no-color'],
      { env: ARDUINO_CLI_ENV, maxBuffer: 80 * 1024 * 1024 })
    let stderr = ''
    proc.stdout.on('data', d => {
      d.toString().split('\n').forEach(line => {
        const t = line.trim()
        if (t) sendProgress(t)
      })
    })
    proc.stderr.on('data', d => { stderr += d.toString() })
    proc.on('close', code => {
      if (code === 0) {
        sendCoreStatus({ state: 'done', pkg })
        resolve({ ok: true })
      } else {
        const err = stderr.split('\n').filter(Boolean).slice(-5).join('\n') || `core install exit ${code}`
        sendCoreStatus({ state: 'error', pkg, error: err })
        reject(new Error(err))
      }
    })
    proc.on('error', err => {
      sendCoreStatus({ state: 'error', pkg, error: err.message })
      reject(err)
    })
  })
}

function ensureCoreInstalled(fqbn) {
  const pkg = fqbnToPackage(fqbn)
  return installCore(pkg)
}

// Boards that use the bundled AVR toolchain (compileAVR). Anything else falls
// through to arduino-cli, which handles ESP32, SAM, and other platforms.
const AVR_BOARD_IDS = new Set([
  'arduino-uno', 'arduino-nano', 'arduino-mega',
  'LotusNanoBot', 'LotusMegaBot', 'LotusMegaBotPlus',
])

function sendProgress(msg) {
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('arduino:progress', msg))
}

// Recursively collect source files with given extensions
function walkDir(dir, exts) {
  if (!fs.existsSync(dir)) return []
  const results = []
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f)
    if (fs.statSync(full).isDirectory()) {
      results.push(...walkDir(full, exts))
    } else if (exts.some(e => f.endsWith(e))) {
      results.push(full)
    }
  }
  return results
}

// Run a tool and collect stderr; resolve on exit 0, reject on non-zero
function runTool(exe, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = execFile(exe, args, { cwd, maxBuffer: 20 * 1024 * 1024 })
    let stdout = '', stderr = ''
    proc.stdout.on('data', d => { stdout += d.toString() })
    proc.stderr.on('data', d => { stderr += d.toString() })
    proc.on('close', code => {
      if (code === 0) resolve({ stdout, stderr })
      else {
        // Collapse avrdude noise: keep only the first meaningful error line
        const raw = stderr || stdout || `Exit code ${code}`
        const firstError = raw.split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('avrdude.exe: ser_') && !l.startsWith('avrdude.exe: stk500'))
          .slice(0, 4)
          .join('\n')
        reject(new Error(firstError || raw.split('\n')[0]))
      }
    })
    proc.on('error', err => reject(err))
  })
}

async function compileAVR(code, boardId, buildDir) {
  const boardDir = path.join(BOARDS_DIR, boardId)
  const boardCtxFile = path.join(boardDir, 'context.json')

  if (!fs.existsSync(boardCtxFile)) {
    throw new Error(`Board config not found for: ${boardId}`)
  }

  const boardCtx = JSON.parse(fs.readFileSync(boardCtxFile, 'utf8'))
  const mcu = (boardCtx.mcu || 'atmega328p').toLowerCase()
  const cpuClock = boardCtx.cpu_clock || 16000000
  const arch = boardCtx.arch || 'AVR'
  const protocol = boardCtx.protocol || 'arduino'
  const baudrate = boardCtx.baudrate || 115200
  const boardSetup = boardCtx.board_setup || ''

  const variantMap = { 'atmega2560': 'mega', 'atmega1280': 'mega', 'atmega32u4': 'leonardo' }
  const variantDir = variantMap[mcu] ?? 'standard'

  const mcuDefines = [
    `-mmcu=${mcu}`,
    `-DF_CPU=${cpuClock}L`,
    `-DARDUINO=189`,
    `-DARDUINO_${arch}`,
    `-DARDUINO_ARCH_AVR`,
  ]

  // Build include dirs: cores + each library dir + its src/ subdir + variants + board headers
  const libsDir = path.join(AVR_DIR, 'sdk', 'libraries')
  const libIncludes = fs.existsSync(libsDir)
    ? fs.readdirSync(libsDir).flatMap(lib => {
        const libPath = path.join(libsDir, lib)
        if (!fs.statSync(libPath).isDirectory()) return []
        const entries = [`-I${libPath}`]
        const srcPath = path.join(libPath, 'src')
        if (fs.existsSync(srcPath)) entries.push(`-I${srcPath}`)
        return entries
      })
    : []

  const includeDirs = [
    `-I${AVR_CORES}`,
    ...libIncludes,
    `-I${path.join(AVR_DIR, 'sdk', 'variants', variantDir)}`,
    `-I${path.join(boardDir, 'include')}`,
  ]

  const cFlags = [
    '-Os', '-std=gnu11', '-ffunction-sections', '-fdata-sections', '-fno-fat-lto-objects',
    ...mcuDefines, ...includeDirs,
  ]
  const cppFlags = [
    '-Os', '-std=gnu++11', '-fpermissive', '-fno-exceptions',
    '-ffunction-sections', '-fdata-sections', '-fno-threadsafe-statics', '-Wno-error=narrowing',
    ...mcuDefines, ...includeDirs,
  ]

  // Collect all sources: Arduino core + platform include libs + board include libs + user sketch
  const coreFiles = walkDir(AVR_CORES, ['.cpp', '.c', '.S'])
  const platformLibFiles = walkDir(path.join(AVR_DIR, 'sdk', 'libraries'), ['.cpp', '.c'])
  const boardLibFiles = walkDir(path.join(boardDir, 'include'), ['.cpp', '.c'])

  // Auto-detect board header (e.g. LotusNanoBot.h, LotusDevkit.h) from include dir
  const includeDir = path.join(boardDir, 'include')
  let boardHeader = null
  if (fs.existsSync(includeDir)) {
    const files = fs.readdirSync(includeDir)
    // Prefer exact match {boardId}.h, fall back to any Lotus*.h
    boardHeader = files.find(f => f === boardId + '.h')
              ?? files.find(f => f.startsWith('Lotus') && f.endsWith('.h'))
              ?? null
  }

  // Wrap sketch: Arduino.h + board header + inject board_setup at top of setup()
  const boardInclude = boardHeader ? `#include "${boardHeader}"\n` : ''
  const codeWithInit = boardSetup
    ? code.replace(/void\s+setup\s*\(\s*\)\s*\{/, `void setup() {\n  ${boardSetup}`)
    : code
  const wrappedCode = `#include <Arduino.h>\n${boardInclude}\n${codeWithInit}`
  const userFile = path.join(buildDir, 'user_app.cpp')
  fs.writeFileSync(userFile, wrappedCode, 'utf8')

  const allSources = [...coreFiles, ...platformLibFiles, ...boardLibFiles, userFile]
  const objFiles = []

  // Compile phase
  for (const file of allSources) {
    const basename = path.basename(file)
    const objFile = path.join(buildDir, basename + '.o')
    objFiles.push(objFile)

    const isC = file.endsWith('.c') || file.endsWith('.S')
    const compiler = isC ? AVR_GCC : AVR_GPP
    const flags = isC ? cFlags : cppFlags

    sendProgress(`Compiling ${basename}...`)
    try {
      await runTool(compiler, [...flags, '-c', file, '-o', objFile], buildDir)
    } catch (e) {
      throw new Error(`Error in ${basename}:\n${e.message}`)
    }
  }

  // Link phase
  const elfFile = path.join(buildDir, 'sketch.elf')
  sendProgress('Linking...')
  await runTool(AVR_GCC, [
    `-mmcu=${mcu}`, '-Os', '-Wl,--gc-sections',
    ...objFiles, '-o', elfFile, '-lm',
  ], buildDir)

  // Create Intel HEX
  const hexFile = path.join(buildDir, 'sketch.hex')
  sendProgress('Creating hex image...')
  await runTool(AVR_OBJCOPY, ['-O', 'ihex', '-R', '.eeprom', elfFile, hexFile], buildDir)

  return { hexFile, mcu, protocol, baudrate }
}

// ── arduino-cli build path (ESP32 / SAM / non-AVR) ────────────────────────────

function readBoardConfigSync(boardId) {
  const boardDir = path.join(BOARDS_DIR, boardId)
  const configFile = path.join(boardDir, 'config.js')
  if (!fs.existsSync(configFile)) throw new Error(`Board config not found: ${boardId}`)
  const mod = { exports: {} }
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', fs.readFileSync(configFile, 'utf8'))(mod, mod.exports)
  return { cfg: mod.exports, boardDir }
}

function findBoardHeader(boardDir, boardId) {
  const includeDir = path.join(boardDir, 'include')
  if (!fs.existsSync(includeDir)) return null
  const files = fs.readdirSync(includeDir)
  return files.find(f => f === boardId + '.h')
      ?? files.find(f => f.startsWith('Lotus') && f.endsWith('.h'))
      ?? null
}

function copyDirContents(srcDir, dstDir) {
  for (const f of fs.readdirSync(srcDir)) {
    const src = path.join(srcDir, f)
    const dst = path.join(dstDir, f)
    if (fs.statSync(src).isDirectory()) {
      fs.mkdirSync(dst, { recursive: true })
      copyDirContents(src, dst)
    } else {
      fs.copyFileSync(src, dst)
    }
  }
}

// Newest mtime among all files under dir (recursive). Used to detect whether a
// cached library copy is still up to date with its source.
function maxMtimeMs(dir) {
  if (!fs.existsSync(dir)) return 0
  let m = fs.statSync(dir).mtimeMs
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f)
    const st = fs.statSync(full)
    if (st.isDirectory()) m = Math.max(m, maxMtimeMs(full))
    else                  m = Math.max(m, st.mtimeMs)
  }
  return m
}

// Count files under dir (recursive). Sanity check: catches incomplete caches
// left by older code paths that filtered by extension. mtime check alone can't
// detect "marker is fresh but copy is missing files."
function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0
  let n = 0
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f)
    if (fs.statSync(full).isDirectory()) n += countFiles(full)
    else                                  n++
  }
  return n
}

// Only rewrite the file when contents differ. Avoids bumping mtime so
// arduino-cli's incremental compile cache stays valid.
function writeIfChanged(file, content) {
  if (fs.existsSync(file)) {
    const existing = fs.readFileSync(file, 'utf8')
    if (existing === content) return false
  }
  fs.writeFileSync(file, content, 'utf8')
  return true
}

// ── ESP32 fast incremental build ─────────────────────────────────────────────
// arduino-cli costs 30s-3min per compile mostly on its own overhead (sketch
// preprocessing, library discovery, dep-graph build). After a successful build
// we capture the exact gcc/link/esptool commands it ran, save them to
// .lotus_recipe.json, and on subsequent incremental builds replay those
// commands directly — skipping arduino-cli entirely. Falls back to the full
// arduino-cli path on any cache miss or recipe mismatch.

const crypto = require('crypto')

// Hash the set of #include directives in the wrapped code. If this changes
// between builds, library discovery may yield different libs → fast path is
// unsafe and we fall back to arduino-cli.
function hashIncludes(code) {
  const includes = code.split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('#include'))
    .sort()
    .join('\n')
  return crypto.createHash('sha256').update(includes).digest('hex').slice(0, 16)
}

// Build wrappedCode + sketchDir layout that the recipe expects. Extracted so
// the fast path can produce the same wrappedCode the recipe was captured for.
function prepareSketch({ code, boardDir, boardId, buildDir }) {
  const ctxFile = path.join(boardDir, 'context.json')
  const ctx = fs.existsSync(ctxFile) ? JSON.parse(fs.readFileSync(ctxFile, 'utf8')) : {}
  const boardHeader = findBoardHeader(boardDir, boardId)
  const effectiveHeader = boardHeader ? boardId + '_LotusIDE.h' : null
  const boardInclude = effectiveHeader ? `#include "${effectiveHeader}"\n` : ''
  const boardSetup = ctx.board_setup || ''
  const codeWithInit = boardSetup
    ? code.replace(/void\s+setup\s*\(\s*\)\s*\{/, `void setup() {\n  ${boardSetup}`)
    : code
  const wrappedCode = `${boardInclude}\n${codeWithInit}`
  const sketchDir = path.join(buildDir, 'sketch')
  return { wrappedCode, sketchDir, ctx, boardHeader, effectiveHeader }
}

// Pluck the four commands we need to replay (sketch compile, link, elf2image,
// merge-bin) out of arduino-cli --verbose stdout. arduino-cli emits tool
// invocations as plain shell lines — unquoted absolute paths to the toolchain
// binary, followed by all flags on the same line. esptool invocations are
// often wrapped in `cmd /c ...` IF/ELSE wrappers.
function extractRecipeFromVerbose(verboseOutput) {
  const recipe = { sketchCompile: null, link: null, elf2image: null, merge: null }
  for (const raw of verboseOutput.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    // sketch compile: g++ ... sketch.ino.cpp -o ...sketch.ino.cpp.o
    // (not the .merged.libsdetect.d preprocess passes — those write to nul).
    // Paths can contain spaces (e.g. "user KLS"), so plain includes() checks
    // beat regex with \S anchors.
    if (line.includes('xtensa-esp32-elf-g++') &&
        line.includes('sketch.ino.cpp"') &&
        line.includes('sketch.ino.cpp.o"') &&
        line.includes('-o ') &&
        !line.includes('-o nul')) {
      recipe.sketchCompile = line
    }
    // link: gcc/g++ producing sketch.ino.elf (not elf2image, which consumes it)
    else if ((line.includes('xtensa-esp32-elf-gcc') || line.includes('xtensa-esp32-elf-g++')) &&
             line.includes('sketch.ino.elf"') &&
             line.includes('-o ') &&
             !line.includes('elf2image')) {
      recipe.link = line
    }
    // elf2image for the app (input is sketch.ino.elf, NOT bootloader_*.elf)
    else if (line.includes('elf2image') && line.includes('sketch.ino.elf') &&
             !line.includes('bootloader')) {
      recipe.elf2image = line
    }
    // merge-bin assembles bootloader + partitions + app into single image
    else if (line.includes('merge-bin') || line.includes('merge_bin')) {
      recipe.merge = line
    }
  }
  return recipe
}

// Run a ready-quoted shell command (as captured from arduino-cli verbose).
function runShellCmd(cmdStr, env) {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process')
    exec(cmdStr, { env, maxBuffer: 80 * 1024 * 1024, shell: true, windowsHide: true },
      (err, stdout, stderr) => {
        if (err) {
          const msg = (stderr || stdout || err.message).split('\n').slice(-10).join('\n')
          return reject(new Error(msg))
        }
        resolve({ stdout, stderr })
      })
  })
}

// Replay a previously-captured build recipe — recompile sketch only, relink,
// regenerate .bin + .merged.bin. Returns { ok, reason, ms }. Caller falls
// back to arduino-cli on { ok: false }.
async function tryEsp32FastBuild({ wrappedCode, sketchDir, buildDir }) {
  const buildArtifactDir = path.join(buildDir, '.build')
  const recipePath = path.join(buildArtifactDir, '.lotus_recipe.json')
  if (!fs.existsSync(recipePath)) return { ok: false, reason: 'no recipe yet' }

  let recipe
  try { recipe = JSON.parse(fs.readFileSync(recipePath, 'utf8')) }
  catch { return { ok: false, reason: 'recipe parse error' } }

  const cmds = recipe.commands || {}
  if (!cmds.sketchCompile || !cmds.link || !cmds.elf2image || !cmds.merge) {
    return { ok: false, reason: 'recipe incomplete' }
  }

  const currentHash = hashIncludes(wrappedCode)
  if (recipe.includeHash !== currentHash) {
    return { ok: false, reason: 'includes changed (lib set may differ)' }
  }

  // Required cache artifacts must still exist.
  if (!fs.existsSync(path.join(buildArtifactDir, 'core', 'core.a'))) {
    return { ok: false, reason: 'core.a missing' }
  }

  // Keep sketch.ino in sync so a future arduino-cli fallback sees fresh source.
  fs.mkdirSync(sketchDir, { recursive: true })
  writeIfChanged(path.join(sketchDir, 'sketch.ino'), wrappedCode)

  // arduino-cli's sketch.ino.cpp is the preprocessed source (.ino with
  // #include <Arduino.h> + auto prototypes added). Blockly output rarely needs
  // prototypes (functions defined before use); for the cases that do, the
  // gcc step will fail and we'll fall back to arduino-cli, which preprocesses
  // properly.
  const sketchCppPath = path.join(buildArtifactDir, 'sketch', 'sketch.ino.cpp')
  fs.mkdirSync(path.dirname(sketchCppPath), { recursive: true })
  fs.writeFileSync(sketchCppPath, `#include <Arduino.h>\n${wrappedCode}\n`, 'utf8')

  const t0 = Date.now()
  try {
    const tCompile = Date.now()
    sendProgress('[fast-path] Compiling sketch...')
    await runShellCmd(cmds.sketchCompile, ARDUINO_CLI_ENV)
    sendProgress(`[fast-path] sketch compiled (${((Date.now() - tCompile) / 1000).toFixed(2)}s)`)

    const tLink = Date.now()
    sendProgress('[fast-path] Linking...')
    await runShellCmd(cmds.link, ARDUINO_CLI_ENV)
    sendProgress(`[fast-path] linked (${((Date.now() - tLink) / 1000).toFixed(2)}s)`)

    const tBin = Date.now()
    sendProgress('[fast-path] elf2image...')
    await runShellCmd(cmds.elf2image, ARDUINO_CLI_ENV)
    await runShellCmd(cmds.merge, ARDUINO_CLI_ENV)
    sendProgress(`[fast-path] bin + merged (${((Date.now() - tBin) / 1000).toFixed(2)}s)`)

    const totalMs = Date.now() - t0
    sendProgress(`[fast-path] TOTAL ${(totalMs / 1000).toFixed(2)}s`)
    return { ok: true, ms: totalMs }
  } catch (e) {
    return { ok: false, reason: `fast-path step failed: ${e.message.split('\n')[0]}` }
  }
}

async function buildWithArduinoCli({ code, boardId, buildDir, port, upload }) {
  if (!fs.existsSync(ARDUINO_CLI)) {
    throw new Error(`arduino-cli not found at ${ARDUINO_CLI}`)
  }

  // Per-phase timing — emitted via sendProgress so the Output panel shows
  // exactly where each compile/upload spends its seconds.
  const t0 = Date.now()
  const phase = (label, startMs) => sendProgress(`[${((Date.now() - startMs) / 1000).toFixed(2)}s] ${label}`)

  const { cfg, boardDir } = readBoardConfigSync(boardId)
  const { wrappedCode, sketchDir, ctx, boardHeader, effectiveHeader } =
    prepareSketch({ code, boardDir, boardId, buildDir })

  const fqbn = ctx.fqbn || PLATFORM_FQBN[cfg.platform]
  if (!fqbn) {
    throw new Error(`No FQBN mapping for platform "${cfg.platform}" (board ${boardId})`)
  }

  // arduino-cli expects the .ino filename to match its parent folder. Rewriting
  // only when contents change preserves the sketch.ino mtime so arduino-cli's
  // incremental compile cache treats it as unchanged.
  fs.mkdirSync(sketchDir, { recursive: true })
  writeIfChanged(path.join(sketchDir, 'sketch.ino'), wrappedCode)

  // Expose the board's include/ as an Arduino 1.5-format library so arduino-cli
  // adds its src/ to the include path automatically — this sidesteps spaces in
  // paths (which break -I added via compiler.*.extra_flags) and gives arduino-cli
  // proper dependency tracking. The library is named "${boardId}Full" so it
  // can't collide with same-named libraries that ship in the platform package
  // (e.g. the "Lite" LotusDevkit in arduino-esp32). We only re-copy when the
  // source include/ is newer than our cached copy — otherwise mtimes stay put
  // and arduino-cli reuses every .o it built last time.
  const tLib = Date.now()
  const includeDir = path.join(boardDir, 'include')
  const libsRoot   = path.join(buildDir, 'libraries')
  const libArgs    = []
  let libCacheHit = true
  if (fs.existsSync(includeDir) && effectiveHeader) {
    const libName = boardId + 'Full'
    const libDir  = path.join(libsRoot, libName)
    const libSrc  = path.join(libDir, 'src')
    const markerFile = path.join(libDir, '.lotus_built')
    const markerMtime = fs.existsSync(markerFile) ? fs.statSync(markerFile).mtimeMs : 0
    // Rebuild when: source is newer than marker, OR the cached copy has fewer
    // files than source (older arduino.js used to filter by extension and left
    // headers behind — marker would lie about freshness forever).
    const srcCount   = countFiles(includeDir)
    const cacheCount = countFiles(libSrc)
    const cacheStale = maxMtimeMs(includeDir) > markerMtime
    const cacheShort = cacheCount < srcCount
    if (cacheStale || cacheShort) {
      // Source changed, first build, or cache copy is incomplete — rebuild.
      libCacheHit = false
      fs.rmSync(libDir, { recursive: true, force: true })
      fs.mkdirSync(libSrc, { recursive: true })
      copyDirContents(includeDir, libSrc)
      if (boardHeader && boardHeader !== effectiveHeader) {
        const from = path.join(libSrc, boardHeader)
        const to   = path.join(libSrc, effectiveHeader)
        if (fs.existsSync(from)) fs.renameSync(from, to)
      }
      fs.writeFileSync(path.join(libDir, 'library.properties'),
        `name=${libName}\nversion=1.0.0\nauthor=Lotus\nmaintainer=Lotus\n` +
        `sentence=Board library\nparagraph=Auto-generated by LotusIDE\n` +
        `category=Other\nurl=\narchitectures=*\n`, 'utf8')
      fs.writeFileSync(markerFile, '')
    }
    libArgs.push('--libraries', libsRoot)
  }
  phase(`Board library prep (cache ${libCacheHit ? 'hit' : 'rebuilt'})`, tLib)

  // Installed plugins can ship their own C++ sources under
  //   <userData>/plugins/<id>/src/*.{h,cpp,c}
  // Expose each as a separate Arduino library under the same libsRoot so a
  // sketch that does `#include <BH1750.h>` resolves cleanly. Each plugin gets
  // its own subdir under libsRoot so they don't collide with the board lib or
  // with each other. We re-copy on every compile because plugins are usually
  // small (a few KB) — premature mtime tracking here is not worth the bug
  // surface vs. just trusting fs.cpSync.
  try {
    const pluginsRoot = path.join(app.getPath('userData'), 'plugins')
    if (fs.existsSync(pluginsRoot)) {
      for (const pid of fs.readdirSync(pluginsRoot)) {
        const pluginSrc = path.join(pluginsRoot, pid, 'src')
        if (!fs.existsSync(pluginSrc) || !fs.statSync(pluginSrc).isDirectory()) continue
        // Keep the prefix to avoid collisions with the BoardIdFull library
        // arduino-cli already discovered under the same libsRoot.
        const libName = `plugin_${pid.replace(/[^a-zA-Z0-9_]/g, '_')}`
        const libDir  = path.join(libsRoot, libName)
        const libSrc  = path.join(libDir, 'src')
        fs.rmSync(libDir, { recursive: true, force: true })
        fs.mkdirSync(libSrc, { recursive: true })
        copyDirContents(pluginSrc, libSrc)
        fs.writeFileSync(path.join(libDir, 'library.properties'),
          `name=${libName}\nversion=1.0.0\nauthor=Lotus Plugin\nmaintainer=Lotus\n` +
          `sentence=Plugin source\nparagraph=Auto-extracted by LotusIDE plugin loader\n` +
          `category=Other\nurl=\narchitectures=*\n`, 'utf8')
      }
      // Make sure libArgs has --libraries libsRoot even if the board itself
      // doesn't have an include/ (rare, but possible for a code-only board).
      if (libArgs.length === 0) libArgs.push('--libraries', libsRoot)
    }
  } catch (e) {
    sendProgress(`[plugin libs] skipped: ${e.message}`)
  }

  // Stable build artifact dir → arduino-cli reuses cached .o files for unchanged
  // sources instead of recompiling Wi-Fi / BLE / etc. from scratch every time.
  const artifactDir = path.join(buildDir, '.build')
  fs.mkdirSync(artifactDir, { recursive: true })
  fs.mkdirSync(ARDUINO_CLI_CACHE, { recursive: true })

  // --jobs N: parallel compile across CPU cores (ESP32 core has hundreds of .c
  // files — single-threaded compile leaves most cores idle).
  const jobs = Math.max(1, os.cpus().length)

  // --verbose: print every gcc/link/esptool invocation. We hide these raw
  // command lines from the user (very noisy) but parse them on success to
  // build a recipe for fast incremental rebuilds.
  const args = ['compile', '--fqbn', fqbn, '--no-color', '--verbose',
    '--build-path', artifactDir,
    '--jobs', String(jobs),
    ...libArgs]
  if (upload && port) args.push('--upload', '-p', port)
  args.push(sketchDir)

  // Make sure the platform's core + any external libraries the sketch needs
  // are in our local data dir before compiling.
  const tCore = Date.now()
  await ensureCoreInstalled(fqbn)
  await ensureSketchLibraries(wrappedCode)
  phase('Core + library check', tCore)

  const tCli = Date.now()
  return new Promise((resolve, reject) => {
    const proc = execFile(ARDUINO_CLI, args, { env: ARDUINO_CLI_ENV, maxBuffer: 200 * 1024 * 1024 })
    let stderr = ''
    let verboseOut = ''
    proc.stdout.on('data', d => {
      const chunk = d.toString()
      verboseOut += chunk
      chunk.split('\n').forEach(line => {
        const t = line.trim()
        // Skip raw command lines (start with quoted absolute exe path) — they
        // flood the output panel. Everything else (Compiling X..., Linking...,
        // Used library, Sketch uses N bytes) still flows through.
        if (t && !(t.startsWith('"') && t.includes('.exe"'))) {
          sendProgress(t)
        }
      })
    })
    proc.stderr.on('data', d => { stderr += d.toString() })
    proc.on('close', exitCode => {
      phase(`arduino-cli ${upload ? 'compile+upload' : 'compile'} (jobs=${jobs})`, tCli)
      if (exitCode === 0) {
        // Persist recipe so next compile can take the fast path. arduino-esp32
        // is the only platform we currently replay; other platforms still go
        // through full arduino-cli every time.
        if (cfg.platform === 'arduino-esp32') {
          const cmds = extractRecipeFromVerbose(verboseOut)
          if (cmds.sketchCompile && cmds.link && cmds.elf2image && cmds.merge) {
            const recipe = {
              fqbn, boardId,
              includeHash: hashIncludes(wrappedCode),
              capturedAt: new Date().toISOString(),
              commands: cmds,
            }
            try {
              fs.writeFileSync(path.join(artifactDir, '.lotus_recipe.json'),
                JSON.stringify(recipe, null, 2), 'utf8')
              sendProgress('[fast-path] recipe captured for next compile')
            } catch (e) {
              sendProgress(`[fast-path] could not save recipe: ${e.message}`)
            }
          }
        }
        phase('TOTAL buildWithArduinoCli', t0)
        return resolve({ sketchDir })
      }
      const errMsg = stderr.split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .slice(-10)
        .join('\n') || `arduino-cli exit ${exitCode}`
      reject(new Error(errMsg))
    })
    proc.on('error', err => reject(err))
  })
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

// Per-board build dir. Stable across runs so arduino-cli + the AVR pipeline
// can reuse cached object files, turning subsequent compiles of an unchanged
// sketch from minutes into seconds.
function buildDirFor(boardId) {
  const safe = String(boardId).replace(/[^a-zA-Z0-9]/g, '_')
  // AVR builds run their own incremental setup; keep them on timestamped dirs
  // for now so behavior matches what the AVR pipeline expects.
  if (AVR_BOARD_IDS.has(boardId)) {
    return path.join(os.tmpdir(), `lotus_build_${Date.now()}`)
  }
  return path.join(os.tmpdir(), 'lotus_build', safe)
}

// Try the fast incremental path for arduino-esp32 boards. Returns true if
// the fast path produced fresh .bin files; false means caller should run the
// full arduino-cli pipeline. Reasons are reported through sendProgress so the
// user can see why a fallback happened.
async function tryFastPathIfEsp32(code, boardId, buildDir) {
  const { cfg, boardDir } = readBoardConfigSync(boardId)
  if (cfg.platform !== 'arduino-esp32') return false
  const { wrappedCode, sketchDir } = prepareSketch({ code, boardDir, boardId, buildDir })
  const fast = await tryEsp32FastBuild({ wrappedCode, sketchDir, buildDir })
  if (fast.ok) return true
  sendProgress(`[fast-path skipped: ${fast.reason}] falling back to arduino-cli...`)
  return false
}

// Public core-management IPC — backs the "Pre-download Cores" UI in Manage
// Boards so users (especially teachers prepping classrooms) can install
// ESP32 ahead of time instead of waiting at the first compile.
ipcMain.handle('arduino:coreList', () => {
  return Object.keys(CORE_SIZE_HINT).map(pkg => ({
    pkg,
    installed: isCoreInstalled(pkg),
    downloadMb: CORE_SIZE_HINT[pkg].mb,
    diskMb: CORE_SIZE_HINT[pkg].diskMb,
    label: pkg === 'esp32:esp32' ? 'ESP32 (Espressif)'
         : pkg === 'arduino:avr' ? 'Arduino AVR (Uno / Nano / Mega)'
         : pkg === 'arduino:sam' ? 'Arduino SAM (Due)'
         : pkg,
  }))
})

ipcMain.handle('arduino:installCore', async (_e, pkg) => {
  if (typeof pkg !== 'string' || !/^[a-z0-9_]+:[a-z0-9_]+$/i.test(pkg)) {
    return { ok: false, error: 'invalid core package id' }
  }
  if (!CORE_SIZE_HINT[pkg]) {
    return { ok: false, error: 'unknown core — only known cores can be installed via this handler' }
  }
  try {
    const res = await installCore(pkg)
    return res.skipped ? { ok: true, skipped: true } : { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('arduino:compile', async (event, { code, fqbn, boardId }) => {
  const buildDir = buildDirFor(boardId)
  fs.mkdirSync(buildDir, { recursive: true })
  sendProgress('Starting compile...')

  try {
    if (AVR_BOARD_IDS.has(boardId)) {
      await compileAVR(code, boardId, buildDir)
    } else {
      const fast = await tryFastPathIfEsp32(code, boardId, buildDir)
      if (!fast) await buildWithArduinoCli({ code, boardId, buildDir, upload: false })
    }
    sendProgress('Compile successful!')
    return { ok: true, buildDir }
  } catch (e) {
    sendProgress(`Error: ${e.message}`)
    return { error: e.message }
  }
})

ipcMain.handle('arduino:upload', async (event, { code, fqbn, port, boardId }) => {
  const buildDir = buildDirFor(boardId)
  fs.mkdirSync(buildDir, { recursive: true })

  try {
    if (AVR_BOARD_IDS.has(boardId)) {
      sendProgress('Compiling...')
      const { hexFile, mcu, protocol, baudrate } = await compileAVR(code, boardId, buildDir)

      sendProgress(`Uploading to ${port}...`)
      await runTool(AVR_DUDE, [
        '-C', AVR_DUDE_CONF,
        `-p${mcu}`,
        `-c${protocol}`,
        `-P${port}`,
        `-b${baudrate}`,
        '-D',
        `-Uflash:w:${hexFile}:i`,
      ], buildDir)
    } else {
      // For esp32 upload: try fast-path compile first, then run esptool
      // ourselves against the freshly-built .bin/.bootloader/.partitions files.
      // If fast-path declines, fall through to arduino-cli's compile+upload.
      const fast = await tryFastPathIfEsp32(code, boardId, buildDir)
      if (fast) {
        sendProgress(`Uploading to ${port}...`)
        await uploadEsp32WithRecipe({ buildDir, port })
      } else {
        sendProgress(`Compiling and uploading to ${port}...`)
        await buildWithArduinoCli({ code, boardId, buildDir, port, upload: true })
      }
    }

    sendProgress('Upload complete!')
    return { ok: true }
  } catch (e) {
    sendProgress(`Error: ${e.message}`)
    return { error: e.message }
  }
})

// After a fast-path compile, flash the resulting binaries with the bundled
// esptool.exe. Derives the esptool path from the recipe's elf2image command
// (same tool, same arduino-cli data dir).
async function uploadEsp32WithRecipe({ buildDir, port }) {
  const buildArtifactDir = path.join(buildDir, '.build')
  const recipePath = path.join(buildArtifactDir, '.lotus_recipe.json')
  if (!fs.existsSync(recipePath)) throw new Error('Fast-path upload needs a captured recipe')
  const recipe = JSON.parse(fs.readFileSync(recipePath, 'utf8'))
  // Pull esptool's path from the elf2image command (first quoted token).
  const m = recipe.commands.elf2image.match(/^"([^"]+esptool[^"]*\.exe)"/i)
  if (!m) throw new Error('Could not locate esptool in recipe')
  const esptoolExe = m[1]

  const proj = 'sketch.ino'
  const bootloader = path.join(buildArtifactDir, `${proj}.bootloader.bin`)
  const partitions = path.join(buildArtifactDir, `${proj}.partitions.bin`)
  const appBin     = path.join(buildArtifactDir, `${proj}.bin`)
  const bootApp0   = path.join(path.dirname(path.dirname(path.dirname(esptoolExe))),
                                '..', 'partitions', 'boot_app0.bin')
  // Resolve boot_app0.bin reliably: it lives at hardware/esp32/<ver>/tools/partitions/.
  // Fallback: search arduino-cli data for it.
  const bootApp0Real = fs.existsSync(bootApp0) ? bootApp0 : findBootApp0()

  const cmd = `"${esptoolExe}" --chip esp32 --port "${port}" --baud 921600 ` +
    `--before default-reset --after hard-reset write-flash -z ` +
    `--flash-mode keep --flash-freq keep --flash-size keep ` +
    `0x1000 "${bootloader}" 0x8000 "${partitions}" ` +
    `0xe000 "${bootApp0Real}" 0x10000 "${appBin}"`
  await runShellCmd(cmd, ARDUINO_CLI_ENV)
}

function findBootApp0() {
  const hwDir = path.join(ARDUINO_CLI_DATA, 'packages', 'esp32', 'hardware', 'esp32')
  if (!fs.existsSync(hwDir)) return null
  for (const ver of fs.readdirSync(hwDir)) {
    const p = path.join(hwDir, ver, 'tools', 'partitions', 'boot_app0.bin')
    if (fs.existsSync(p)) return p
  }
  return null
}

// ── Board discovery ───────────────────────────────────────────────────────────

const PLATFORM_DEFAULTS = {
  'arduino-avr':  { fqbn: 'arduino:avr:uno',                  protocol: 'arduino', baudrate: 115200 },
  'arduino-esp32': { fqbn: 'esp32:esp32:esp32',               protocol: 'esptool', baudrate: 921600 },
  'arduino-sam':  { fqbn: 'arduino:sam:arduino_due_x_dbg',    protocol: 'sam-ba',  baudrate: 115200 },
  'esp-idf':      { fqbn: null,                               protocol: null,       baudrate: 115200 },
}

function boardGroup(id) {
  if (id.startsWith('Lotus'))      return 'Lotus'
  if (id.startsWith('arduino-'))   return 'Arduino'
  if (id.startsWith('kidbright'))  return 'KidBright'
  return 'Other'
}

const { resolveBoardDir, userBoardsRoot, listUserBoardIds } = require('./boards-manage')

// Reads the on-disk config + metadata for one board folder. Returns null if
// the folder is malformed. Used by boards:list and indirectly by the user
// boards listing.
function readBoardSummary(boardId, boardPath, source) {
  const configFile = path.join(boardPath, 'config.js')
  if (!fs.existsSync(configFile)) return null
  try {
    const configCode = fs.readFileSync(configFile, 'utf8')
    const mod = { exports: {} }
    // eslint-disable-next-line no-new-func
    new Function('module', 'exports', configCode)(mod, mod.exports)
    const cfg = mod.exports

    let imageExt = 'jpg'
    for (const ext of ['jpg', 'png']) {
      if (fs.existsSync(path.join(boardPath, 'static', `display.${ext}`))) { imageExt = ext; break }
    }

    const platDef = PLATFORM_DEFAULTS[cfg.platform] || {}
    let protocol = platDef.protocol || 'arduino'
    let baudrate  = platDef.baudrate || 115200

    const ctxFile = path.join(boardPath, 'context.json')
    if (fs.existsSync(ctxFile)) {
      const ctx = JSON.parse(fs.readFileSync(ctxFile, 'utf8'))
      if (ctx.protocol) protocol = ctx.protocol
      if (ctx.baudrate) baudrate  = ctx.baudrate
    }

    // User-installed boards live outside the bundle. The renderer can't
    // reach them via the public/ static prefix, so we hand back a
    // file:// path for the display image.
    const image = source === 'user'
      ? 'file:///' + path.join(boardPath, 'static', `display.${imageExt}`).replace(/\\/g, '/')
      : `boards/${boardId}/static/display.${imageExt}`

    return {
      id:             boardId,
      name:           cfg.name        || boardId,
      title:          cfg.title       || boardId,
      description:    cfg.description || '',
      platform:       cfg.platform    || 'unknown',
      fqbn:           platDef.fqbn    || null,
      uploadProtocol: protocol,
      baudrate,
      group:          boardGroup(boardId),
      image,
      version:        cfg.version     || '1.0.0',
      source,
    }
  } catch (e) {
    console.warn(`[boards:list] skipping ${boardId} (${source}):`, e.message)
    return null
  }
}

ipcMain.handle('boards:list', async () => {
  const result = []
  const seen = new Set()

  // User-installed boards take priority (so a user can update a bundled board).
  const userRoot = userBoardsRoot()
  for (const id of listUserBoardIds()) {
    const summary = readBoardSummary(id, path.join(userRoot, id), 'user')
    if (summary) { result.push(summary); seen.add(id) }
  }

  // Bundled boards
  if (fs.existsSync(BOARDS_DIR)) {
    for (const boardId of fs.readdirSync(BOARDS_DIR)) {
      if (seen.has(boardId)) continue
      const boardPath = path.join(BOARDS_DIR, boardId)
      if (!fs.statSync(boardPath).isDirectory()) continue
      const summary = readBoardSummary(boardId, boardPath, 'bundled')
      if (summary) result.push(summary)
    }
  }

  const ORDER = { Lotus: 0, Arduino: 1, KidBright: 2, Other: 3 }
  result.sort((a, b) => {
    const gd = (ORDER[a.group] ?? 9) - (ORDER[b.group] ?? 9)
    return gd !== 0 ? gd : a.title.localeCompare(b.title)
  })
  return result
})

// ── Board block loaders ────────────────────────────────────────────────────────

ipcMain.handle('boards:getBlockFiles', async (event, boardId) => {
  const resolved = resolveBoardDir(boardId, BOARDS_DIR)
  if (!resolved) return {}
  const blockDir = path.join(resolved.dir, 'block')
  if (!fs.existsSync(blockDir)) return {}
  const result = {}
  for (const f of fs.readdirSync(blockDir)) {
    if ((f.startsWith('blocks') || f.startsWith('generators')) && f.endsWith('.js')) {
      result[f] = fs.readFileSync(path.join(blockDir, f), 'utf8')
    }
  }
  return result
})

ipcMain.handle('boards:getConfig', async (event, boardId) => {
  const resolved = resolveBoardDir(boardId, BOARDS_DIR)
  if (!resolved) return null
  const blockDir   = path.join(resolved.dir, 'block')
  const configFile = path.join(blockDir, 'config.js')
  if (!fs.existsSync(configFile)) return null

  const boardDirPath  = resolved.dir
  const boardDirSlash = boardDirPath.replace(/\\/g, '/')

  // Stub Vue so configs that read `Vue.prototype.$global.board.board_info.dir` get the real path
  const VueStub = { prototype: { $global: { board: { board_info: { dir: boardDirSlash } } } } }

  function makeRequire(baseDir) {
    return function boardRequire(modPath) {
      if (!modPath.startsWith('.')) return {}
      const resolved = path.resolve(baseDir, modPath.endsWith('.js') ? modPath : modPath + '.js')
      if (!fs.existsSync(resolved)) return {}
      try {
        const code = fs.readFileSync(resolved, 'utf8')
        const mod = { exports: {} }
        // eslint-disable-next-line no-new-func
        new Function('module', 'exports', 'require', 'Vue', code)(
          mod, mod.exports, makeRequire(path.dirname(resolved)), VueStub
        )
        return mod.exports
      } catch (e) {
        console.warn(`[boards:getConfig] require(${modPath}):`, e.message)
        return {}
      }
    }
  }

  try {
    const code = fs.readFileSync(configFile, 'utf8')
    const mod = { exports: {} }
    // eslint-disable-next-line no-new-func
    new Function('module', 'exports', 'require', 'Vue', code)(
      mod, mod.exports, makeRequire(blockDir), VueStub
    )
    const cfg = mod.exports
    const blocks = Array.isArray(cfg) ? cfg : (cfg.blocks || [])

    // Detect board header (e.g. LotusNanoBot.h) for prepending to generated code
    const includeDir = path.join(boardDirPath, 'include')
    let boardHeader = null
    if (fs.existsSync(includeDir)) {
      const hFiles = fs.readdirSync(includeDir)
      boardHeader = hFiles.find(f => f === boardId + '.h')
                 ?? hFiles.find(f => f.startsWith('Lotus') && f.endsWith('.h'))
                 ?? null
    }

    return { blocks, boardDir: boardDirPath, boardHeader }
  } catch (e) {
    console.warn(`[boards:getConfig] error for ${boardId}:`, e.message)
    return null
  }
})

// ── File system handlers ───────────────────────────────────────────────────────

ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    return { content: fs.readFileSync(filePath, 'utf8') }
  } catch (e) {
    return { error: e.message }
  }
})

ipcMain.handle('fs:readFileBase64', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath)
    const ext  = path.extname(filePath).toLowerCase()
    const mime = (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : 'image/png'
    return { content: `data:${mime};base64,${data.toString('base64')}` }
  } catch (e) {
    return { error: e.message }
  }
})

ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8')
    return { ok: true }
  } catch (e) {
    return { error: e.message }
  }
})

ipcMain.handle('fs:openDialog', async (event, opts) => {
  const { filePaths } = await dialog.showOpenDialog(opts || {})
  return filePaths || []
})

ipcMain.handle('fs:saveDialog', async (event, opts) => {
  const { filePath } = await dialog.showSaveDialog(opts || {})
  return filePath || null
})
