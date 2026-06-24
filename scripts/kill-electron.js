// Kill stray Electron processes left over from a previous `npm run dev`.
// Cross-platform replacement for the original `taskkill /F /IM electron.exe`.
// Best-effort: never throws — if no process matches or the platform-specific
// helper isn't installed, we exit 0 so the next command in the chain still
// runs.

const { exec } = require('child_process')

const isWin = process.platform === 'win32'
const cmd = isWin
  ? 'taskkill /F /IM electron.exe /T'
  : "pkill -f 'electron/.*Lotus' || pkill -f electron"

exec(cmd, { windowsHide: true }, () => {
  process.exit(0)
})
