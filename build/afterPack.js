// electron-builder afterPack hook.
//
// Purpose: re-run rcedit on the unpacked `Lotus IDE.exe` so the embedded icon
// always reflects public/logo/lotus.ico. electron-builder itself runs rcedit
// during pack with 3 retries, but historically the inner exe was left with the
// default Electron atom icon on Windows builds where Defender briefly locks
// the freshly extracted exe. This hook adds 5 more retries with backoff so
// the icon almost always makes it in.
//
// Failure is non-fatal: we log a warning and let the build succeed without
// the icon rather than block a release.

const path = require('path')
const { execFile } = require('child_process')

const APP_BUILDER = path.join(
  __dirname, '..',
  'node_modules', 'app-builder-bin', 'win', 'x64', 'app-builder.exe'
)

function runRcedit(exePath, iconPath) {
  return new Promise((resolve, reject) => {
    const args = ['--executable', exePath, '--icon', iconPath]
    execFile(
      APP_BUILDER,
      ['rcedit', '--args', JSON.stringify(args)],
      { windowsHide: true },
      (err, stdout, stderr) => {
        if (err) reject(new Error(stderr || err.message))
        else resolve(stdout)
      },
    )
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return

  const productName = context.packager.appInfo.productFilename
  const exePath = path.join(context.appOutDir, `${productName}.exe`)
  const iconPath = path.resolve(__dirname, '..', 'public', 'logo', 'lotus.ico')

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await runRcedit(exePath, iconPath)
      console.log(`  • afterPack: icon embedded into ${productName}.exe (attempt ${attempt})`)
      return
    } catch (e) {
      const lastTry = attempt === 5
      console.warn(`  • afterPack: rcedit attempt ${attempt} failed — ${e.message.trim().slice(0, 200)}`)
      if (lastTry) {
        console.warn(`  • afterPack: giving up — exe will keep its current icon`)
        return
      }
      await sleep(2000 * attempt)
    }
  }
}
