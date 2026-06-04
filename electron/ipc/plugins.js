// Plugin file management — installed plugins live in
//   app.getPath('userData') / plugins / <plugin-id> /
// On first run the directory is created empty. Each plugin is a folder
// containing lotus-plugin.json, index.js, and optional icon.png.
//
// We only do file-system work here. Parsing / sandbox execution stays in
// the renderer (see src/plugins/pluginLoader.js) so this process never
// runs untrusted JS.

const { app, ipcMain, dialog } = require('electron')
const fs   = require('fs')
const fsp  = require('fs/promises')
const path = require('path')

function pluginsRoot() {
  const dir = path.join(app.getPath('userData'), 'plugins')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

// Defence-in-depth: refuse any id that would escape the plugins root.
function safePluginDir(id) {
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9_.-]{2,}$/i.test(id)) {
    throw new Error('Invalid plugin id')
  }
  const root = pluginsRoot()
  const dir  = path.join(root, id)
  // path.resolve to absolute, then prefix-check
  const resolved = path.resolve(dir)
  if (!resolved.startsWith(path.resolve(root) + path.sep)) {
    throw new Error('Plugin id escapes plugins root')
  }
  return resolved
}

async function readPluginPayload(id) {
  const dir = safePluginDir(id)
  const manifestPath = path.join(dir, 'lotus-plugin.json')
  const manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'))

  const entryRel = typeof manifest.main === 'string' ? manifest.main : 'index.js'
  // Guard against ../ in manifest.main
  const entryAbs = path.resolve(dir, entryRel)
  if (!entryAbs.startsWith(dir + path.sep)) throw new Error('manifest.main escapes plugin dir')
  const entrySource = await fsp.readFile(entryAbs, 'utf8')

  let iconDataUri = null
  if (typeof manifest.icon === 'string') {
    const iconAbs = path.resolve(dir, manifest.icon)
    if (iconAbs.startsWith(dir + path.sep) && fs.existsSync(iconAbs)) {
      const buf = await fsp.readFile(iconAbs)
      const ext = path.extname(iconAbs).toLowerCase()
      const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream'
      iconDataUri = `data:${mime};base64,${buf.toString('base64')}`
    }
  }

  return { manifest, entrySource, iconDataUri }
}

ipcMain.handle('plugins:root', () => pluginsRoot())

ipcMain.handle('plugins:list', async () => {
  const root = pluginsRoot()
  const entries = await fsp.readdir(root, { withFileTypes: true })
  const out = []
  for (const ent of entries) {
    if (!ent.isDirectory()) continue
    try {
      const payload = await readPluginPayload(ent.name)
      out.push({ ok: true, ...payload })
    } catch (e) {
      out.push({ ok: false, id: ent.name, error: e.message })
    }
  }
  return out
})

ipcMain.handle('plugins:get', async (_e, id) => {
  try { return { ok: true, ...(await readPluginPayload(id)) } }
  catch (e) { return { ok: false, error: e.message } }
})

ipcMain.handle('plugins:uninstall', async (_e, id) => {
  try {
    const dir = safePluginDir(id)
    await fsp.rm(dir, { recursive: true, force: true })
    return { ok: true }
  } catch (e) { return { ok: false, error: e.message } }
})

// Install from a plain JSON descriptor (used for direct paste / dev install).
// Files: { 'lotus-plugin.json': '...', 'index.js': '...', 'icon.png?base64': '...' }
ipcMain.handle('plugins:installFromFiles', async (_e, { id, files }) => {
  try {
    if (!files || typeof files !== 'object') throw new Error('files map required')
    if (!files['lotus-plugin.json']) throw new Error('lotus-plugin.json missing')

    const manifest = JSON.parse(files['lotus-plugin.json'])
    if (manifest.id !== id) throw new Error(`Manifest id "${manifest.id}" does not match install id "${id}"`)

    const dir = safePluginDir(id)
    await fsp.mkdir(dir, { recursive: true })

    for (const [name, content] of Object.entries(files)) {
      // Reject absolute paths and ../ in filenames
      if (path.isAbsolute(name) || name.includes('..')) throw new Error(`Unsafe filename: ${name}`)
      const dest = path.resolve(dir, name)
      if (!dest.startsWith(dir + path.sep) && dest !== dir) throw new Error(`Filename escapes plugin dir: ${name}`)
      await fsp.mkdir(path.dirname(dest), { recursive: true })

      // Convention: keys ending with `?base64` are written as binary
      if (name.endsWith('?base64')) {
        const realName = name.slice(0, -'?base64'.length)
        const realDest = path.resolve(dir, realName)
        if (!realDest.startsWith(dir + path.sep)) throw new Error(`Unsafe filename: ${realName}`)
        await fsp.writeFile(realDest, Buffer.from(content, 'base64'))
      } else {
        await fsp.writeFile(dest, content, 'utf8')
      }
    }

    return { ok: true, ...(await readPluginPayload(id)) }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// Pick a .zip file and unpack it into the plugins dir. We use the
// minimal-deps approach: read the zip with adm-zip if present, else fall
// back to telling the user to drop a folder instead. For now we accept a
// .zip path and use Node's built-in zlib only — proper zip needs a lib.
// Until we add adm-zip as a dep, the renderer-side flow uses
// `plugins:installFromFiles` after unpacking client-side with JSZip.
ipcMain.handle('plugins:pickPackage', async () => {
  const res = await dialog.showOpenDialog({
    title: 'Select Lotus plugin (.zip)',
    filters: [{ name: 'Lotus Plugin', extensions: ['zip'] }],
    properties: ['openFile'],
  })
  if (res.canceled || !res.filePaths[0]) return { canceled: true }
  const buf = await fsp.readFile(res.filePaths[0])
  return { canceled: false, base64: buf.toString('base64'), name: path.basename(res.filePaths[0]) }
})
