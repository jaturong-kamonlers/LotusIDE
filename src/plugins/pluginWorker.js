// Lotus IDE plugin sandbox worker.
//
// This file is the entry shell that runs inside a Web Worker BEFORE the
// plugin's own code. It installs the `lotus` global, captures the
// `lotus.register(...)` payload, then importScripts the plugin entry. After
// registration completes (or fails) it posts the result to the host and the
// host terminates the worker — there is no long-running plugin code.
//
// The worker scope is intentionally hostile to escape attempts: Node is
// unreachable (Workers have no `require`), `importScripts` is locked to the
// single plugin URL the host passes in, and globals like `XMLHttpRequest` and
// `fetch` are deleted before plugin code runs.

/* eslint-env worker */

let registered = null

// Strip dangerous host globals so plugin code cannot reach back out.
// (Workers don't have DOM/Node, but they do get XHR/fetch by default.)
;['fetch', 'XMLHttpRequest', 'WebSocket', 'importScripts'].forEach(k => {
  if (k === 'importScripts') return // we need it once; deleted after use
  try { delete self[k] } catch { /* ignore non-configurable */ }
})

self.lotus = {
  register(payload) {
    if (registered) throw new Error('lotus.register may only be called once')
    if (!payload || typeof payload !== 'object') throw new Error('register payload must be an object')
    registered = payload
  },
}

self.onmessage = (e) => {
  const msg = e.data
  if (msg?.kind !== 'load') return

  try {
    // Single, host-provided plugin URL. After this call, importScripts is gone.
    self.importScripts(msg.pluginUrl)
    delete self.importScripts

    if (!registered) {
      throw new Error('Plugin did not call lotus.register(...)')
    }
    self.postMessage({ kind: 'registered', payload: registered })
  } catch (err) {
    self.postMessage({ kind: 'error', message: err?.message || String(err) })
  }
}
