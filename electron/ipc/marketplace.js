// Marketplace IPC — generic catalog + GitHub-repo helpers used by BOTH the
// PluginManager and the BoardManager. Older code (boards-manage.js) has its
// own catalog handlers that we keep for backward compat; the renderer can
// migrate to the unified helpers here at its own pace.
//
// Catalog entry schema (JSON array hosted at any HTTPS URL):
//   {
//     "kind":         "plugin" | "board",
//     "id":           "<reverse-DNS or board folder name>",
//     "name":         "Display name",
//     "version":      "1.2.3",
//     "author":       "Optional",
//     "description":  "Optional",
//     "repo":         "https://github.com/owner/repo",   // optional
//     "downloadUrl":  "https://.../asset.zip",           // required
//     "icon":         "https://.../icon.png",            // optional
//     "tags":         ["servo", "actuator"]              // optional
//   }
//
// install-from-GitHub-repo flow:
//   1. Renderer passes "owner/repo" or full https URL.
//   2. We hit https://api.github.com/repos/{owner}/{repo}/releases/latest
//   3. Find the first .zip asset.
//   4. Download it. Return base64 to renderer for unzipping (JSZip).

const { ipcMain, net } = require('electron')

function fetchBuffer(url, headers = {}) {
  return new Promise((resolve, reject) => {
    // useSessionCookies: false + Cache-Control: no-cache forces a fresh fetch.
    // Without these, Chromium's HTTP cache may serve a stale response even
    // when the upstream file has changed — this bit us when a catalog was
    // re-uploaded to fix a BOM issue and the IDE kept returning the old bytes.
    const req = net.request({ url, redirect: 'follow', useSessionCookies: false })
    req.setHeader('User-Agent', 'LotusIDE/1.0')
    req.setHeader('Accept', 'application/vnd.github+json')
    req.setHeader('Cache-Control', 'no-cache')
    req.setHeader('Pragma', 'no-cache')
    for (const [k, v] of Object.entries(headers)) req.setHeader(k, v)
    const chunks = []
    req.on('response', (res) => {
      if (res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode} for ${url}`)); return }
      res.on('data', (c) => chunks.push(c))
      res.on('end',  ()    => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.end()
  })
}
const fetchText = (url, headers) => fetchBuffer(url, headers).then(b => b.toString('utf8'))

ipcMain.handle('marketplace:fetchCatalog', async (_e, catalogUrl) => {
  try {
    if (typeof catalogUrl !== 'string' || !/^https?:\/\//i.test(catalogUrl)) {
      throw new Error('catalogUrl must be an http(s) URL')
    }
    // Defensively strip a UTF-8 BOM — PowerShell's default `Out-File -Encoding
    // utf8` writes one, and JSON.parse rejects it ("Unexpected token '﻿'").
    // Authors of community catalogs may unknowingly publish a BOM'd file, so
    // we'd rather tolerate it than push the responsibility back to them.
    const body = (await fetchText(catalogUrl)).replace(/^﻿/, '')
    const json = JSON.parse(body)
    if (!Array.isArray(json)) throw new Error('Catalog must be a JSON array')
    return { ok: true, entries: json }
  } catch (e) { return { ok: false, error: e.message } }
})

// Accepts "owner/repo" or a full github.com URL. Returns { downloadUrl,
// version, manifest } so the renderer can show what's about to be installed
// before actually downloading.
ipcMain.handle('marketplace:resolveGithubRelease', async (_e, repoSpec) => {
  try {
    const { owner, repo } = parseRepoSpec(repoSpec)
    const release = JSON.parse(await fetchText(`https://api.github.com/repos/${owner}/${repo}/releases/latest`))
    const zipAsset = (release.assets || []).find(a => a.name?.toLowerCase().endsWith('.zip'))
    if (!zipAsset) throw new Error('Latest release has no .zip asset')
    return {
      ok: true,
      owner, repo,
      version:     release.tag_name || release.name || null,
      releaseUrl:  release.html_url,
      downloadUrl: zipAsset.browser_download_url,
      assetName:   zipAsset.name,
    }
  } catch (e) { return { ok: false, error: e.message } }
})

ipcMain.handle('marketplace:downloadZip', async (_e, url) => {
  try {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) throw new Error('url must be http(s)')
    const buf = await fetchBuffer(url)
    return { ok: true, base64: buf.toString('base64') }
  } catch (e) { return { ok: false, error: e.message } }
})

// Generic text fetch — used by "Import sketch from URL". Returns the raw
// body so the renderer can JSON.parse / route it as needed. Same proxy +
// timeout semantics as the other helpers here.
ipcMain.handle('marketplace:fetchUrl', async (_e, url) => {
  try {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) throw new Error('url must be http(s)')
    const text = await fetchText(url)
    return { ok: true, text }
  } catch (e) { return { ok: false, error: e.message } }
})

function parseRepoSpec(spec) {
  if (typeof spec !== 'string') throw new Error('Repo spec required')
  // Strip github.com URL prefix if present
  const m = spec.match(/^(?:https?:\/\/github\.com\/)?([^/\s]+)\/([^/\s#?]+)/i)
  if (!m) throw new Error(`Cannot parse repo from "${spec}" — expected "owner/repo" or github.com URL`)
  let [, owner, repo] = m
  repo = repo.replace(/\.git$/, '')
  return { owner, repo }
}
