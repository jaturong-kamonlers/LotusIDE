// GitHub integration — OAuth Device Flow + Gist sync.
//
// Why Device Flow? Electron desktop apps don't have a stable redirect URL,
// and we don't want to ship a local HTTP server just to catch a callback.
// Device Flow gives the user a short code, they paste it on github.com,
// and we poll for the resulting token.
//
// The access token is stored encrypted via Electron's safeStorage (which
// uses the OS keychain — Credential Manager on Windows, Keychain on macOS,
// libsecret/kwallet on Linux). The encrypted blob lives at
// <userData>/github-token.bin so it does NOT sync via roaming profiles.
//
// Scopes requested: `repo gist`. `repo` covers both public and private repos
// (and grants full write access — needed to commit sketches back). `gist`
// keeps the old Gist sync working. If a user already authorized with only
// `gist`, the UI prompts them to re-auth so repo operations become available.

const { app, ipcMain, net, safeStorage, shell } = require('electron')
const fs   = require('fs')
const fsp  = require('fs/promises')
const path = require('path')

const TOKEN_PATH = () => path.join(app.getPath('userData'), 'github-token.bin')

// The user supplies their own OAuth App client_id. We ship none by default —
// store it under a settings file the user can edit, or via the renderer UI.
const SETTINGS_PATH = () => path.join(app.getPath('userData'), 'github-settings.json')

function readSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_PATH(), 'utf8')) } catch { return {} }
}
function writeSettings(obj) {
  fs.writeFileSync(SETTINGS_PATH(), JSON.stringify(obj, null, 2))
}

function saveToken(token) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS keychain unavailable — refusing to store token in plaintext')
  }
  fs.writeFileSync(TOKEN_PATH(), safeStorage.encryptString(token))
}
function loadToken() {
  try {
    if (!fs.existsSync(TOKEN_PATH())) return null
    return safeStorage.decryptString(fs.readFileSync(TOKEN_PATH()))
  } catch { return null }
}
function clearToken() {
  try { fs.unlinkSync(TOKEN_PATH()) } catch {}
}

// ── HTTP helpers (use Electron's net for system proxy support) ────────────

function ghRequest({ method, url, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const req = net.request({ method, url, redirect: 'follow' })
    req.setHeader('User-Agent', 'LotusIDE/1.0')
    req.setHeader('Accept', 'application/json')
    for (const [k, v] of Object.entries(headers)) req.setHeader(k, v)
    const chunks = []
    req.on('response', (res) => {
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        const buf = Buffer.concat(chunks).toString('utf8')
        const result = { status: res.statusCode, headers: res.headers || {} }
        try { result.body = JSON.parse(buf) }
        catch { result.body = buf }
        resolve(result)
      })
      res.on('error', reject)
    })
    req.on('error', reject)
    if (body != null) {
      req.setHeader('Content-Type', 'application/json')
      req.write(typeof body === 'string' ? body : JSON.stringify(body))
    }
    req.end()
  })
}

// ── Device Flow ───────────────────────────────────────────────────────────

let pollingState = null  // { deviceCode, interval, expiresAt }

ipcMain.handle('github:status', async () => {
  const settings = readSettings()
  const hasToken = !!loadToken()
  let scopes = null
  let login = null
  // Probe /user to read the granted scopes header — null when no token.
  if (hasToken) {
    try {
      const token = loadToken()
      const res = await ghRequest({
        method: 'GET', url: 'https://api.github.com/user',
        headers: { Authorization: `token ${token}` },
      })
      if (res.status === 200) {
        login = res.body?.login || null
        // GitHub headers are case-insensitive; net.IncomingMessage exposes them
        // as lowercase keys via res.body — but here we use req's response
        // headers field which is also lowercase.
        scopes = res.headers?.['x-oauth-scopes'] ?? null
      }
    } catch { /* ignore — keep scopes null */ }
  }
  return {
    hasToken,
    login,
    scopes,
    clientId: settings.clientId || null,
    encryptionAvailable: safeStorage.isEncryptionAvailable(),
  }
})

ipcMain.handle('github:setClientId', (_e, clientId) => {
  if (typeof clientId !== 'string' || clientId.length < 6) {
    return { error: 'clientId looks invalid' }
  }
  const s = readSettings()
  s.clientId = clientId.trim()
  writeSettings(s)
  return { ok: true }
})

ipcMain.handle('github:startDeviceFlow', async () => {
  const settings = readSettings()
  if (!settings.clientId) return { error: 'GitHub OAuth client_id not configured. Set it in GitHub settings first.' }

  const res = await ghRequest({
    method: 'POST',
    url: 'https://github.com/login/device/code',
    body: { client_id: settings.clientId, scope: 'repo gist' },
  })
  if (res.status !== 200 || !res.body?.device_code) {
    return { error: `GitHub returned ${res.status}: ${JSON.stringify(res.body)}` }
  }
  pollingState = {
    deviceCode: res.body.device_code,
    interval:   (res.body.interval || 5) * 1000,
    expiresAt:  Date.now() + (res.body.expires_in || 900) * 1000,
    clientId:   settings.clientId,
  }
  return {
    userCode:        res.body.user_code,
    verificationUri: res.body.verification_uri,
    expiresIn:       res.body.expires_in,
  }
})

ipcMain.handle('github:openVerificationUri', (_e, url) => {
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) shell.openExternal(url)
})

ipcMain.handle('github:pollDeviceFlow', async () => {
  if (!pollingState) return { error: 'No device flow in progress' }
  if (Date.now() > pollingState.expiresAt) { pollingState = null; return { error: 'Device flow expired — start again' } }

  const res = await ghRequest({
    method: 'POST',
    url: 'https://github.com/login/oauth/access_token',
    body: {
      client_id:   pollingState.clientId,
      device_code: pollingState.deviceCode,
      grant_type:  'urn:ietf:params:oauth:grant-type:device_code',
    },
  })
  // GitHub returns 200 even on pending — distinguish via body.error
  const b = res.body || {}
  if (b.error === 'authorization_pending') return { pending: true }
  if (b.error === 'slow_down')             return { pending: true, slowDown: true }
  if (b.error === 'expired_token')         { pollingState = null; return { error: 'Token expired' } }
  if (b.error === 'access_denied')         { pollingState = null; return { error: 'Access denied' } }
  if (b.error)                             { return { error: b.error_description || b.error } }
  if (b.access_token) {
    try { saveToken(b.access_token) } catch (e) { return { error: e.message } }
    pollingState = null
    return { ok: true }
  }
  return { error: 'Unexpected response: ' + JSON.stringify(b) }
})

ipcMain.handle('github:signOut', () => {
  clearToken()
  pollingState = null
  return { ok: true }
})

// ── Authenticated API helpers ─────────────────────────────────────────────

async function api(method, urlPath, body = null) {
  const token = loadToken()
  if (!token) throw new Error('Not signed in')
  const res = await ghRequest({
    method,
    url: 'https://api.github.com' + urlPath,
    headers: { Authorization: `token ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
    body,
  })
  if (res.status >= 400) throw new Error(`GitHub ${res.status}: ${JSON.stringify(res.body)}`)
  return res.body
}

ipcMain.handle('github:listGists', async () => {
  try {
    const list = await api('GET', '/gists?per_page=50')
    const out = (list || []).map(g => ({
      id:          g.id,
      description: g.description || '',
      updatedAt:   g.updated_at,
      files:       Object.keys(g.files || {}),
      htmlUrl:     g.html_url,
    }))
    return { ok: true, gists: out }
  } catch (e) { return { ok: false, error: e.message } }
})

ipcMain.handle('github:readGist', async (_e, gistId) => {
  try {
    const g = await api('GET', `/gists/${encodeURIComponent(gistId)}`)
    return { ok: true, gist: g }
  } catch (e) { return { ok: false, error: e.message } }
})

ipcMain.handle('github:saveSketchAsGist', async (_e, { gistId, filename, description, content, isPublic }) => {
  try {
    const files = { [filename || 'sketch.json']: { content } }
    if (gistId) {
      const g = await api('PATCH', `/gists/${encodeURIComponent(gistId)}`, { description, files })
      return { ok: true, gist: { id: g.id, htmlUrl: g.html_url } }
    } else {
      const g = await api('POST', '/gists', { description, public: !!isPublic, files })
      return { ok: true, gist: { id: g.id, htmlUrl: g.html_url } }
    }
  } catch (e) { return { ok: false, error: e.message } }
})

// ── Repo operations (Contents API — no local working copy, no isomorphic-git) ─
//
// LotusIDE treats a GitHub repo as a "project folder" holding many sketches.
// Each sketch is a single .json file at any path inside the repo. We read
// and write files through GitHub's Contents API:
//   GET    /repos/:owner/:repo/contents/:path   — read or list
//   PUT    /repos/:owner/:repo/contents/:path   — create or update (needs sha for update)
// History comes from the Commits API filtered by path. This gives us
// "version history" without needing a local clone.

ipcMain.handle('github:listRepos', async (_e, { visibility = 'all', sort = 'updated', perPage = 50 } = {}) => {
  try {
    const list = await api('GET', `/user/repos?visibility=${visibility}&sort=${sort}&per_page=${perPage}`)
    return { ok: true, repos: (list || []).map(r => ({
      fullName:    r.full_name,
      owner:       r.owner?.login,
      name:        r.name,
      description: r.description || '',
      private:     r.private,
      defaultBranch: r.default_branch,
      updatedAt:   r.updated_at,
      htmlUrl:     r.html_url,
    })) }
  } catch (e) { return { ok: false, error: e.message } }
})

ipcMain.handle('github:listRepoContents', async (_e, { owner, repo, path: dirPath = '', ref = null }) => {
  try {
    const safe = encodeURI(dirPath || '').replace(/#/g, '%23')
    let url = `/repos/${owner}/${repo}/contents/${safe}`
    if (ref) url += `?ref=${encodeURIComponent(ref)}`
    const data = await api('GET', url)
    // Single-file responses come back as an object, dirs as an array
    const entries = Array.isArray(data) ? data : [data]
    return { ok: true, entries: entries.map(e => ({
      name: e.name,
      path: e.path,
      type: e.type,            // 'file' | 'dir' | 'submodule' | 'symlink'
      sha:  e.sha,
      size: e.size,
      downloadUrl: e.download_url,
    })) }
  } catch (e) { return { ok: false, error: e.message } }
})

ipcMain.handle('github:readRepoFile', async (_e, { owner, repo, path: filePath, ref = null }) => {
  try {
    const safe = encodeURI(filePath || '').replace(/#/g, '%23')
    let url = `/repos/${owner}/${repo}/contents/${safe}`
    if (ref) url += `?ref=${encodeURIComponent(ref)}`
    const data = await api('GET', url)
    if (data?.type !== 'file') throw new Error('Path is not a file')
    const content = Buffer.from(data.content || '', 'base64').toString('utf8')
    return { ok: true, sha: data.sha, content, encoding: data.encoding }
  } catch (e) { return { ok: false, error: e.message } }
})

ipcMain.handle('github:saveSketchAsRepoFile', async (_e, { owner, repo, path: filePath, content, message, branch = null, sha = null }) => {
  try {
    const safe = encodeURI(filePath || '').replace(/#/g, '%23')
    const body = {
      message: message || `Update ${filePath} via Lotus IDE`,
      content: Buffer.from(content, 'utf8').toString('base64'),
    }
    if (sha)    body.sha = sha
    if (branch) body.branch = branch
    const data = await api('PUT', `/repos/${owner}/${repo}/contents/${safe}`, body)
    return { ok: true, commit: { sha: data.commit?.sha, htmlUrl: data.commit?.html_url }, sha: data.content?.sha }
  } catch (e) { return { ok: false, error: e.message } }
})

ipcMain.handle('github:listFileCommits', async (_e, { owner, repo, path: filePath, perPage = 20 }) => {
  try {
    const safe = encodeURI(filePath || '').replace(/#/g, '%23')
    const data = await api('GET', `/repos/${owner}/${repo}/commits?path=${safe}&per_page=${perPage}`)
    return { ok: true, commits: (data || []).map(c => ({
      sha:     c.sha,
      message: c.commit?.message,
      author:  c.commit?.author?.name,
      date:    c.commit?.author?.date,
      htmlUrl: c.html_url,
    })) }
  } catch (e) { return { ok: false, error: e.message } }
})

ipcMain.handle('github:createRepo', async (_e, { name, description, private: isPrivate = true, autoInit = true }) => {
  try {
    const data = await api('POST', '/user/repos', {
      name, description: description || '',
      private: isPrivate,
      auto_init: autoInit,
    })
    return { ok: true, repo: {
      fullName: data.full_name,
      owner:    data.owner?.login,
      name:     data.name,
      defaultBranch: data.default_branch,
      htmlUrl:  data.html_url,
    } }
  } catch (e) { return { ok: false, error: e.message } }
})
