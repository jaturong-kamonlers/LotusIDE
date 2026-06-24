const { ipcMain, app } = require('electron')
const { execFile } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

// ESP32 compile health check. Mirrors scripts/diagnose-esp32.ps1 but runs
// in-process so the UI can render results inline and offer one-click fixes.
// Read-only by default; mutating ops live behind their own IPCs.

const IS_WIN = process.platform === 'win32'
const IS_LINUX = process.platform === 'linux'
const EXE = IS_WIN ? '.exe' : ''

// Run a short shell command (best-effort, never throws). Used on Linux for
// dialout / brltty / udev checks. Each call has a 4s timeout so the dialog
// can't hang. Returns trimmed stdout or null on any error/timeout.
function sh(cmd) {
  return new Promise((resolve) => {
    const { exec } = require('child_process')
    exec(cmd, { timeout: 4000, windowsHide: true, maxBuffer: 1024 * 1024 },
      (err, stdout) => resolve(err ? null : String(stdout || '').trim()))
  })
}

// arduino-cli data dir (writable, under userData) — same calculation as
// electron/ipc/arduino.js. The lazy require of `app` here is safe because
// this module is loaded after app.whenReady().
function paths() {
  const userData      = app.getPath('userData')
  const cliData       = path.join(userData, 'arduino-cli', 'data')
  const esp32Hardware = path.join(cliData, 'packages', 'esp32', 'hardware', 'esp32')
  const esp32Tools    = path.join(cliData, 'packages', 'esp32', 'tools')
  const esp32Pkg      = path.join(cliData, 'packages', 'esp32')
  const buildCache    = path.join(os.tmpdir(), 'lotus_build')
  return { userData, cliData, esp32Pkg, esp32Hardware, esp32Tools, buildCache }
}

function safeListDirs(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isDirectory()).map(e => e.name)
  } catch { return [] }
}

function dirStats(dir) {
  let files = 0, bytes = 0, oldestMs = Date.now()
  function walk(d) {
    let entries = []
    try { entries = fs.readdirSync(d, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.isFile()) {
        files++
        try {
          const s = fs.statSync(p)
          bytes += s.size
          if (s.mtimeMs < oldestMs) oldestMs = s.mtimeMs
        } catch { /* skip */ }
      }
    }
  }
  walk(dir)
  return { files, bytes, oldestMs }
}

// Run a powershell expression and return stdout (or null on failure).
// We invoke powershell only for Windows-only registry / PnP / Defender
// queries. Each call has a hard 8s timeout — the diagnostics dialog must
// not hang.
function ps(expr) {
  return new Promise((resolve) => {
    if (!IS_WIN) return resolve(null)
    execFile('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-Command', expr,
    ], { timeout: 8000, windowsHide: true }, (err, stdout) => {
      if (err) return resolve(null)
      resolve(String(stdout || '').trim())
    })
  })
}

async function defenderInfo(P) {
  if (!IS_WIN) return { available: false }
  const out = await ps(
    '$p = Get-MpPreference -ErrorAction Stop; ' +
    '[PSCustomObject]@{ExclusionPath=@($p.ExclusionPath);ExclusionProcess=@($p.ExclusionProcess);Realtime=(-not $p.DisableRealtimeMonitoring)} | ConvertTo-Json -Compress'
  )
  if (!out) return { available: false }
  try {
    const j = JSON.parse(out)
    const paths = Array.isArray(j.ExclusionPath) ? j.ExclusionPath : (j.ExclusionPath ? [j.ExclusionPath] : [])
    const procs = Array.isArray(j.ExclusionProcess) ? j.ExclusionProcess : (j.ExclusionProcess ? [j.ExclusionProcess] : [])
    const matchPath = paths.filter(p =>
      /Lotus IDE/i.test(p) || /esp32/i.test(p) || /arduino-cli/i.test(p)
    )
    const matchProc = procs.filter(p => /xtensa/i.test(p) || /esp32/i.test(p))
    return { available: true, realtime: !!j.Realtime, matchedPaths: matchPath, matchedProcs: matchProc }
  } catch { return { available: false } }
}

async function longPathInfo() {
  if (!IS_WIN) return { enabled: true, available: true }
  const out = await ps(
    "(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem' -Name LongPathsEnabled -ErrorAction SilentlyContinue).LongPathsEnabled"
  )
  if (out === null) return { enabled: false, available: false }
  return { available: true, enabled: out === '1' }
}

async function usbSerialInfo() {
  if (!IS_WIN) return { available: false, names: [] }
  const out = await ps(
    "Get-PnpDevice -Class Ports -Status OK -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FriendlyName"
  )
  if (!out) return { available: true, names: [] }
  return { available: true, names: out.split(/\r?\n/).map(s => s.trim()).filter(Boolean) }
}

// Linux-only: is the current user in the `dialout` group? Without it,
// /dev/ttyUSB*  and  /dev/ttyACM*  are root-only, esptool upload fails with
// `permission denied`. The fix is `sudo usermod -a -G dialout $USER` then
// log out + back in (group membership is loaded on session start). Check
// uses `id -nG` which returns space-separated group names for the current
// user — no sudo needed.
async function dialoutInfo() {
  if (!IS_LINUX) return { available: false }
  const out = await sh('id -nG')
  if (out === null) return { available: false }
  const groups = out.split(/\s+/).filter(Boolean)
  return { available: true, inGroup: groups.includes('dialout'), groups }
}

// Linux-only: Ubuntu's `brltty` service (braille display support) grabs any
// CH341 USB-serial as a braille device on plug-in, leaving /dev/ttyUSB0
// disconnected within ~5s — esptool then can't open the port. This breaks
// virtually every ESP32 board with a CH340 chip out of the box on Ubuntu
// 20.04+. The cure is `sudo systemctl mask brltty` (or apt remove brltty
// brltty-x11). Detection: systemctl is-active brltty.
async function brlttyInfo() {
  if (!IS_LINUX) return { available: false }
  const status = await sh('systemctl is-active brltty 2>&1')
  if (status === null) return { available: true, present: false }
  // is-active returns "active" / "inactive" / "failed" / "unknown" — only
  // "active" is dangerous; inactive means brltty might exist as a unit but
  // is masked or stopped so it won't interfere with udev.
  return { available: true, present: true, active: status === 'active', status }
}

// Linux-only: ttyUSB/ttyACM devices currently present + their detected
// driver (extracted from /sys via udevadm). Used to surface "your ESP32 is
// plugged in as /dev/ttyUSB0 (cp210x)" or to confirm "no serial devices
// visible right now".
async function ttyInfo() {
  if (!IS_LINUX) return { available: false, devices: [] }
  const ls = await sh('ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null')
  if (!ls) return { available: true, devices: [] }
  const paths = ls.split(/\s+/).filter(Boolean)
  const devices = []
  for (const p of paths) {
    const info = await sh(`udevadm info --query=property --name=${p} 2>/dev/null | grep -E '^ID_(VENDOR|MODEL|USB_DRIVER)=' | sort`)
    devices.push({ path: p, info: info || '' })
  }
  return { available: true, devices }
}

// ESP32 core 2.x used folder names like `xtensa-esp32-elf-gcc/`. Core 3.x
// consolidated them into `esp-x32/` (Xtensa) and `esp-rv32/` (RISC-V), each
// containing all gcc binaries under bin/. Match both layouts.
const GCC_DIR_RE = /elf-gcc|esp32.*gcc|^esp-(x32|rv32)$/i

function checkGccPresent(esp32Tools) {
  const tools = safeListDirs(esp32Tools)
  const gccDirs = tools.filter(n => GCC_DIR_RE.test(n))
  for (const g of gccDirs) {
    const versions = safeListDirs(path.join(esp32Tools, g))
    for (const v of versions) {
      const base = path.join(esp32Tools, g, v)
      const candidates = [
        path.join(base, 'bin', 'xtensa-esp32-elf-gcc' + EXE),
        path.join(base, 'xtensa-esp32-elf', 'bin', 'xtensa-esp32-elf-gcc' + EXE),
        path.join(base, 'bin', 'xtensa-esp-elf-gcc' + EXE),
        path.join(base, 'xtensa-esp-elf', 'bin', 'xtensa-esp-elf-gcc' + EXE),
      ]
      for (const c of candidates) {
        if (fs.existsSync(c)) return { found: true, dir: base, exe: c }
      }
    }
  }
  return { found: gccDirs.length === 0 ? null : false, dir: null, exe: null }
}

function fmtMB(bytes) { return (bytes / 1048576).toFixed(1) + ' MB' }
function ageDays(ms)  { return Math.round((Date.now() - ms) / 86400000) }

ipcMain.handle('diagnostics:runEsp32Check', async () => {
  const P = paths()
  const checks = []
  const add = (id, label, status, detail, fix) => checks.push({ id, label, status, detail, fix: fix || null })

  // 1. userData
  if (fs.existsSync(P.userData)) {
    add('userData', 'ข้อมูล LotusIDE', 'ok', P.userData)
  } else {
    add('userData', 'ข้อมูล LotusIDE', 'fail', P.userData,
      { kind: 'manual', text: 'รีสตาร์ท LotusIDE เพื่อสร้าง userData ใหม่' })
    return { ok: false, paths: P, checks, hasFixes: false }
  }

  // 2. arduino-cli data dir
  if (fs.existsSync(P.cliData)) {
    add('cliData', 'arduino-cli data', 'ok', P.cliData)
  } else {
    add('cliData', 'arduino-cli data', 'fail', P.cliData,
      { kind: 'manual', text: 'ลอง compile บอร์ด AVR หนึ่งครั้งเพื่อให้ระบบสร้าง data folder' })
  }

  // 3. ESP32 hardware
  const hwVersions = safeListDirs(P.esp32Hardware)
  if (hwVersions.length > 0) {
    add('esp32Hw', 'ESP32 core (ฮาร์ดแวร์)', 'ok', 'version: ' + hwVersions.join(', '))
  } else {
    add('esp32Hw', 'ESP32 core (ฮาร์ดแวร์)', 'fail', P.esp32Hardware,
      { kind: 'manual', text: 'เปิด Lotus > Manage Boards > Cores แล้วกด Download ESP32' })
  }

  // 4. ESP32 tools completeness
  const toolDirs = safeListDirs(P.esp32Tools)
  const hasEsptool = toolDirs.includes('esptool_py')
  const libsCount   = toolDirs.filter(n => /-libs/.test(n)).length
  const toolchains  = toolDirs.filter(n => GCC_DIR_RE.test(n))
  const tcLabel     = toolchains.length > 0 ? ' (' + toolchains.join(', ') + ')' : ''
  const detail = `${toolDirs.length} tool folders (${libsCount} *-libs, ${toolchains.length} toolchains${tcLabel})`
  if (toolDirs.length === 0) {
    add('esp32Tools', 'ESP32 tools (toolchain)', 'fail', 'tools/ ว่างเปล่า',
      { kind: 'reinstallEsp32', text: 'ลบ ESP32 core ที่ติดตั้งไม่ครบ แล้วติดตั้งใหม่' })
  } else if (!hasEsptool || libsCount === 0 || toolchains.length === 0 || toolDirs.length < 5) {
    add('esp32Tools', 'ESP32 tools (toolchain)', 'fail', detail + ' (ติดตั้งไม่ครบ)',
      { kind: 'reinstallEsp32', text: 'ลบ ESP32 core ที่ติดตั้งไม่ครบ แล้วติดตั้งใหม่' })
  } else {
    add('esp32Tools', 'ESP32 tools (toolchain)', 'ok', detail)
  }

  // 4b. gcc.exe actually present
  if (toolDirs.length > 0) {
    const g = checkGccPresent(P.esp32Tools)
    if (g.found === true) {
      add('esp32Gcc', 'xtensa-esp32-elf-gcc' + EXE, 'ok', g.dir)
    } else if (g.found === false) {
      add('esp32Gcc', 'xtensa-esp32-elf-gcc' + EXE, 'fail', 'มี folder gcc แต่ไม่เจอตัว .exe',
        { kind: 'manual', text: 'อาจถูก Defender quarantined — เพิ่ม exclusion ก่อน แล้วลบ + ติดตั้ง ESP32 core ใหม่' })
    }
  }

  // 5. Build cache
  if (fs.existsSync(P.buildCache)) {
    const s = dirStats(P.buildCache)
    const days = ageDays(s.oldestMs)
    const sizeMB = s.bytes / 1048576
    const det = `${s.files} ไฟล์, ${fmtMB(s.bytes)}, เก่าสุด ${days} วัน`
    if (sizeMB > 2000) {
      add('buildCache', 'Build cache', 'warn', det + ' (ใหญ่มาก)',
        { kind: 'clearCache', text: 'ล้าง cache เพื่อคืนพื้นที่' })
    } else if (days > 30) {
      add('buildCache', 'Build cache', 'warn', det + ' (มีไฟล์เก่า >30 วัน)',
        { kind: 'clearCache', text: 'ล้าง cache ที่ค้างนาน' })
    } else {
      add('buildCache', 'Build cache', 'ok', det)
    }
  } else {
    add('buildCache', 'Build cache', 'ok', 'ยังไม่มี cache')
  }

  // 6. Defender (Windows only)
  if (IS_WIN) {
    const d = await defenderInfo(P)
    if (!d.available) {
      add('defender', 'Windows Defender', 'info', 'ตรวจไม่ได้ (อาจใช้ AV ตัวอื่น)',
        { kind: 'manual', text: 'ถ้าใช้ Kaspersky/Avast/Norton: เพิ่ม exclusion ให้ ' + P.cliData })
    } else {
      const hits = [...d.matchedPaths, ...d.matchedProcs]
      if (hits.length > 0) {
        add('defender', 'Windows Defender', 'ok', 'มี exclusion: ' + hits.join('; '))
      } else if (d.realtime) {
        add('defender', 'Windows Defender', 'warn', 'realtime เปิดอยู่ และยังไม่มี exclusion ของ Lotus',
          { kind: 'addDefenderExclusion', text: 'เพิ่ม exclusion ให้ Defender ข้าม folder LotusIDE' })
      } else {
        add('defender', 'Windows Defender', 'ok', 'realtime ปิดอยู่')
      }
    }
  }

  // 7. Long paths — intentionally kept as a manual fix (reboot + system-wide)
  const lp = await longPathInfo()
  if (lp.available) {
    if (lp.enabled) add('longPath', 'รองรับ path ยาว', 'ok', 'LongPathsEnabled=1')
    else add('longPath', 'รองรับ path ยาว', 'warn', 'LongPathsEnabled=0 (ต้องเปิดและ reboot)',
      { kind: 'manual', text: 'เปิด PowerShell (Run as administrator) แล้วรัน: New-ItemProperty "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWord -Force  จากนั้น restart เครื่อง' })
  }

  // userData path depth — only relevant on Windows where some toolchains
  // hit MAX_PATH=260 when the chain of nested .o paths goes deep. Linux/macOS
  // have effectively unlimited path lengths (PATH_MAX 4096) so the check
  // adds noise without value.
  if (IS_WIN) {
    if (P.cliData.length > 80) {
      add('pathDepth', 'ความยาว path', 'warn', `${P.cliData.length} ตัวอักษร: ` + P.cliData,
        { kind: 'manual', text: 'เปิด long path support หรือย้าย Lotus IDE ไปติดตั้งใน path สั้นๆ เช่น C:\\Lotus' })
    } else {
      add('pathDepth', 'ความยาว path', 'ok', `${P.cliData.length} ตัวอักษร`)
    }
  }

  // 8. USB-Serial (info only — affects upload, not compile)
  if (IS_WIN) {
    const u = await usbSerialInfo()
    const ch = u.names.filter(n => /CH340|CH341|USB-SERIAL/i.test(n))
    const cp = u.names.filter(n => /CP210/i.test(n))
    const all = [...ch, ...cp]
    if (all.length > 0) {
      add('usbSerial', 'ไดรเวอร์ USB-Serial', 'ok', all.join(', '))
    } else if (u.names.length > 0) {
      add('usbSerial', 'ไดรเวอร์ USB-Serial', 'info', u.names.join(', '),
        { kind: 'manual', text: 'ยังไม่พบ CH340/CP210x — ถ้าบอร์ดใช้ชิปเหล่านี้ลองเสียบ USB แล้วตรวจใหม่' })
    } else {
      add('usbSerial', 'ไดรเวอร์ USB-Serial', 'info', 'ไม่พบ serial port ใดๆ',
        { kind: 'manual', text: 'เสียบบอร์ดเข้า USB ก่อน (ใช้ตอน Upload เท่านั้น)' })
    }
  }

  // 9-11. Linux-specific upload chain (dialout, brltty, /dev/tty*).
  // These three are the cause of ~95% of "ESP32 upload fails on Ubuntu"
  // reports: user not in dialout group (PermissionError on port), brltty
  // grabbing CH340 within 5s of plug-in, or no /dev/ttyUSB* at all.
  if (IS_LINUX) {
    const d = await dialoutInfo()
    if (d.available) {
      if (d.inGroup) {
        add('dialout', 'กลุ่ม dialout', 'ok', 'ผู้ใช้อยู่ในกลุ่ม dialout แล้ว')
      } else {
        add('dialout', 'กลุ่ม dialout', 'fail',
          'ผู้ใช้ปัจจุบันไม่ได้อยู่ในกลุ่ม dialout — upload จะ permission denied',
          { kind: 'manual',
            text: 'รัน: sudo usermod -a -G dialout $USER  แล้ว log out และ log in ใหม่ (group จะโหลดตอน session ใหม่)' })
      }
    }

    const b = await brlttyInfo()
    if (b.available && b.active) {
      add('brltty', 'brltty (braille service)', 'fail',
        'กำลังทำงาน — จะแย่ง CH340/CH341 ใน 5 วินาทีหลังเสียบ USB',
        { kind: 'manual',
          text: 'รัน: sudo systemctl mask brltty.path && sudo systemctl stop brltty  (หรือ sudo apt remove brltty brltty-x11)' })
    } else if (b.available) {
      add('brltty', 'brltty (braille service)', 'ok', 'ไม่ทำงาน — ไม่รบกวน USB-Serial')
    }

    const t = await ttyInfo()
    if (t.available) {
      if (t.devices.length > 0) {
        const summary = t.devices.map(d => {
          const m = (d.info.match(/ID_MODEL=(\S+)/) || [])[1] || ''
          return m ? `${d.path} (${m})` : d.path
        }).join(', ')
        add('ttyDevice', 'USB-Serial devices', 'ok', summary)
      } else {
        add('ttyDevice', 'USB-Serial devices', 'info', 'ไม่พบ /dev/ttyUSB* หรือ /dev/ttyACM*',
          { kind: 'manual', text: 'เสียบบอร์ดก่อน — ถ้าเสียบแล้วยังไม่เห็นให้รัน `dmesg | tail -20` ดู kernel log' })
      }
    }
  }

  const hasFixes = checks.some(c => c.fix && ['clearCache', 'reinstallEsp32', 'addDefenderExclusion'].includes(c.fix.kind))
  const ok = checks.every(c => c.status === 'ok' || c.status === 'info')
  return { ok, paths: P, checks, hasFixes, generatedAt: new Date().toISOString() }
})

// Quick Linux-only startup check. Returns the small set of issues that
// reliably break ESP32 upload on Ubuntu (and silently confuse users —
// "everything compiles but the port permission_denied's"). Renderer calls
// this once per launch on Linux from App.vue's onMounted; it logs results
// into the console panel and never blocks the UI.
//
// Returns: { skipped?: true } on non-Linux, or
//          { ok: bool, issues: [{kind, severity, message, fix}], devicesCount }
ipcMain.handle('diagnostics:linuxStartupCheck', async () => {
  if (!IS_LINUX) return { skipped: true }
  const issues = []
  const d = await dialoutInfo()
  if (d.available && !d.inGroup) {
    issues.push({
      kind: 'dialout',
      severity: 'blocking',
      message: 'ผู้ใช้ปัจจุบันไม่อยู่ในกลุ่ม dialout — esptool จะ permission denied ตอน upload',
      fix: 'sudo usermod -a -G dialout $USER  แล้ว log out + log in ใหม่',
    })
  }
  const b = await brlttyInfo()
  if (b.available && b.active) {
    issues.push({
      kind: 'brltty',
      severity: 'blocking',
      message: 'brltty (braille service) กำลังทำงาน — มันจะแย่ง CH340/CH341 ภายใน 5s หลังเสียบ USB',
      fix: 'sudo systemctl mask brltty.path && sudo systemctl stop brltty',
    })
  }
  const t = await ttyInfo()
  return {
    ok: issues.length === 0,
    issues,
    devicesCount: t.available ? t.devices.length : 0,
  }
})

// Destructive ops — gated by an explicit confirm in the dialog.
function rmrf(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); return true }
  catch { return false }
}

ipcMain.handle('diagnostics:clearBuildCache', async () => {
  const cache = path.join(os.tmpdir(), 'lotus_build')
  if (!fs.existsSync(cache)) return { ok: true, note: 'no cache' }
  return { ok: rmrf(cache) }
})

ipcMain.handle('diagnostics:removeEsp32Core', async () => {
  const P = paths()
  if (!fs.existsSync(P.esp32Pkg)) return { ok: true, note: 'nothing to remove' }
  const ok = rmrf(P.esp32Pkg)
  return { ok, removed: P.esp32Pkg }
})

// Add a Defender exclusion for the Lotus arduino-cli data folder. The actual
// Add-MpPreference call needs admin, so we launch an elevated powershell via
// `Start-Process -Verb RunAs` which triggers the standard Windows UAC prompt.
// If the user declines, no command runs and no exclusion is added — safe.
// We resolve as soon as the *outer* powershell exits (which is right after
// it dispatched RunAs), not when the elevated child finishes — the elevated
// shell exit isn't observable from here. The dialog re-runs the check after
// a short delay to confirm whether the exclusion landed.
ipcMain.handle('diagnostics:addDefenderExclusion', async () => {
  if (!IS_WIN) return { ok: false, error: 'Windows only' }
  const P = paths()
  // Single-quote the path inside PowerShell so spaces (e.g. "Lotus IDE") and
  // backslashes pass through literally. We also escape any single quotes by
  // doubling them per PowerShell literal-string rules — defensive only,
  // app.getPath('userData') doesn't normally contain quotes.
  const escaped = P.cliData.replace(/'/g, "''")
  const elevatedCmd = `Add-MpPreference -ExclusionPath '${escaped}'`
  // Outer command launches an elevated process and exits immediately. The
  // RunAs verb suppresses console window of the launcher (-WindowStyle Hidden
  // is on the inner shell so the UAC prompt is the only thing the user sees).
  const launcher = `Start-Process powershell -Verb RunAs -WindowStyle Hidden -ArgumentList @('-NoProfile','-NonInteractive','-Command',"${elevatedCmd.replace(/"/g, '\\"')}")`
  return await new Promise((resolve) => {
    execFile('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-Command', launcher,
    ], { timeout: 30000, windowsHide: true }, (err) => {
      // err code 1223 = "operation cancelled by user" (UAC No). Surface but
      // don't treat as a hard error — user just chose not to do it.
      if (err && err.code === 1223) return resolve({ ok: false, cancelled: true })
      if (err) return resolve({ ok: false, error: String(err.message || err) })
      resolve({ ok: true })
    })
  })
})
