// Manage Boards: installs board packages alongside the bundled ones.
//
// Bundled boards live at <app>/public/boards/<id>/ and are read-only.
// User-installed boards live at <userData>/boards/<id>/ and follow the same
// folder layout (config.js, block/*.js, static/display.*, optional context.json).
//
// We expose:
//   boards:userRoot      → absolute path of the user boards folder
//   boards:userList      → list of installed board IDs + manifest
//   boards:installZip    → unpack a base64-zip into <userData>/boards/<id>/
//   boards:uninstall     → remove a user board folder
//   boards:downloadFromGithub → fetch a release asset, then install it
//
// Bundled boards are NOT touched by these handlers.

const { app, ipcMain, dialog, net } = require('electron')
const fs   = require('fs')
const fsp  = require('fs/promises')
const path = require('path')

function userBoardsRoot() {
  const dir = path.join(app.getPath('userData'), 'boards')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function safeBoardDir(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{2,}$/.test(id)) {
    throw new Error('Invalid board id')
  }
  const root = userBoardsRoot()
  const dir  = path.resolve(path.join(root, id))
  if (!dir.startsWith(path.resolve(root) + path.sep)) {
    throw new Error('Board id escapes user boards root')
  }
  return dir
}

// Resolve a boardId to its on-disk folder. Checks user-installed first so the
// user can supply a newer version of a bundled board if they really want to —
// boards:list logs a warning when this happens.
function resolveBoardDir(boardId, bundledRoot) {
  const userDir = path.join(userBoardsRoot(), boardId)
  if (fs.existsSync(path.join(userDir, 'config.js'))) return { dir: userDir, source: 'user' }
  const bundledDir = path.join(bundledRoot, boardId)
  if (fs.existsSync(path.join(bundledDir, 'config.js'))) return { dir: bundledDir, source: 'bundled' }
  return null
}

function listUserBoardIds() {
  const root = userBoardsRoot()
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(root, d.name, 'config.js')))
    .map(d => d.name)
}

ipcMain.handle('boards:userRoot', () => userBoardsRoot())

ipcMain.handle('boards:userList', () => {
  const ids = listUserBoardIds()
  return ids.map(id => {
    try {
      const cfgCode = fs.readFileSync(path.join(userBoardsRoot(), id, 'config.js'), 'utf8')
      const mod = { exports: {} }
      // eslint-disable-next-line no-new-func
      new Function('module', 'exports', cfgCode)(mod, mod.exports)
      return { id, ok: true, manifest: mod.exports }
    } catch (e) {
      return { id, ok: false, error: e.message }
    }
  })
})

// Install from a base64-encoded zip. Caller (renderer) unzips with JSZip and
// passes us a map of relative-path → text (or `name?base64` for binary).
ipcMain.handle('boards:installFromFiles', async (_e, { id, files }) => {
  try {
    if (!files || typeof files !== 'object') throw new Error('files map required')
    if (!files['config.js']) throw new Error('config.js missing (is this a board package?)')

    const dir = safeBoardDir(id)
    await fsp.mkdir(dir, { recursive: true })

    for (const [name, content] of Object.entries(files)) {
      if (path.isAbsolute(name) || name.includes('..')) throw new Error(`Unsafe filename: ${name}`)
      const isBase64 = name.endsWith('?base64')
      const realName = isBase64 ? name.slice(0, -'?base64'.length) : name
      const dest = path.resolve(dir, realName)
      if (!dest.startsWith(dir + path.sep) && dest !== dir) throw new Error(`Filename escapes board dir: ${realName}`)
      await fsp.mkdir(path.dirname(dest), { recursive: true })
      if (isBase64) await fsp.writeFile(dest, Buffer.from(content, 'base64'))
      else          await fsp.writeFile(dest, content, 'utf8')
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// Walk a user board folder and return a flat files map suitable for the
// installFromFiles flow on the receiving side — text files as utf-8 strings
// and binary files (images, fonts, .a archives, etc.) as base64 with a
// "?base64" suffix on the key. This is the input the publish-to-GitHub flow
// hands to JSZip to rebuild a redistributable package.
ipcMain.handle('boards:exportFiles', async (_e, id) => {
  try {
    const dir = safeBoardDir(id)
    if (!fs.existsSync(dir)) return { ok: false, error: 'Board not installed under user dir' }

    const TEXT_EXT = new Set(['.js','.json','.h','.hpp','.c','.cpp','.ino','.txt','.md','.css','.html','.svg','.csv','.properties'])
    const files = {}
    async function walk(rel) {
      const abs = path.join(dir, rel)
      const ents = await fsp.readdir(abs, { withFileTypes: true })
      for (const ent of ents) {
        const childRel = rel ? rel + '/' + ent.name : ent.name
        if (ent.isDirectory()) { await walk(childRel); continue }
        if (!ent.isFile()) continue
        const buf = await fsp.readFile(path.join(dir, childRel))
        const ext = path.extname(ent.name).toLowerCase()
        if (TEXT_EXT.has(ext)) files[childRel] = buf.toString('utf8')
        else files[childRel + '?base64'] = buf.toString('base64')
      }
    }
    await walk('')
    return { ok: true, files }
  } catch (e) { return { ok: false, error: e.message } }
})

ipcMain.handle('boards:uninstall', async (_e, id) => {
  try {
    const dir = safeBoardDir(id)
    await fsp.rm(dir, { recursive: true, force: true })
    return { ok: true }
  } catch (e) { return { ok: false, error: e.message } }
})

ipcMain.handle('boards:pickPackage', async () => {
  const res = await dialog.showOpenDialog({
    title: 'Select Lotus board package (.zip)',
    filters: [{ name: 'Lotus Board', extensions: ['zip'] }],
    properties: ['openFile'],
  })
  if (res.canceled || !res.filePaths[0]) return { canceled: true }
  const buf = await fsp.readFile(res.filePaths[0])
  return { canceled: false, base64: buf.toString('base64'), name: path.basename(res.filePaths[0]) }
})

// Fetch board catalog (a JSON index) from a GitHub raw URL. The catalog is a
// list of { id, name, version, description, downloadUrl, sha256? } so the
// renderer can show available boards without us having to bake in any one
// vendor's release page.
ipcMain.handle('boards:fetchCatalog', async (_e, catalogUrl) => {
  try {
    if (typeof catalogUrl !== 'string' || !/^https?:\/\//i.test(catalogUrl)) {
      throw new Error('catalogUrl must be an http(s) URL')
    }
    // Strip a UTF-8 BOM — same defensive parsing as marketplace.js (community
    // catalogs published from PowerShell may carry a BOM that JSON.parse rejects).
    const body = (await fetchText(catalogUrl)).replace(/^﻿/, '')
    const json = JSON.parse(body)
    if (!Array.isArray(json)) throw new Error('Catalog must be a JSON array')
    return { ok: true, entries: json }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// Download a board zip from a URL and install it. Renderer hands us the URL
// and the expected id; we do the network IO so plugin/board downloads share a
// consistent path through the main process.
ipcMain.handle('boards:downloadAndInstall', async (_e, { id, url }) => {
  try {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) throw new Error('url must be http(s)')
    const buf = await fetchBuffer(url)
    return { ok: true, base64: buf.toString('base64'), expectedId: id }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// Minimal HTTP helpers using Electron's net module (respects system proxy)
function fetchText(url) {
  return fetchBuffer(url).then(b => b.toString('utf8'))
}
function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    // Cache-Control: no-cache bypasses Chromium's HTTP cache so an updated
    // catalog or asset is fetched fresh — mirrors marketplace.js's fix.
    const req = net.request({ url, redirect: 'follow', useSessionCookies: false })
    req.setHeader('User-Agent', 'LotusIDE/1.0')
    req.setHeader('Cache-Control', 'no-cache')
    req.setHeader('Pragma', 'no-cache')
    const chunks = []
    req.on('response', (res) => {
      if (res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.end()
  })
}

module.exports = { resolveBoardDir, userBoardsRoot, listUserBoardIds }
