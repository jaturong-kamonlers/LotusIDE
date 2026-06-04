# Changelog

All notable changes to LotusIDE are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

## [Unreleased]

### Added

- **Full GitHub repo sync** in the GitHub Manager. Pick a repo, browse
  folders with a breadcrumb, load any `.json` workspace, commit the
  current sketch with a custom path + message, and inspect per-file
  commit history (load any historic version into the editor). New repo
  creation has its own tab. Uses the GitHub Contents API — no local git,
  no isomorphic-git, no working copy. Trade-off: no offline edits, no
  merges.
- OAuth scope upgraded from `gist` → `repo gist`. A re-auth prompt shows
  when an existing token only has `gist`.
- GitHub status now reports `login` and granted `scopes` so the UI can
  gate features and show "Connected as @user (repo, gist)".

### Changed

- `electron/ipc/github.js` `ghRequest` now exposes response headers so
  status can read `x-oauth-scopes`.

## [1.1.0] — 2026-06-04

First release with auto-update and a community plugin/board pipeline.

### Added

- **Auto-update** via `electron-updater` + GitHub Releases provider.
  Check Help → Check for Updates. Background poll on launch (packaged builds
  only). Manual download / "Restart and install" flow keeps the user in
  control.
- **Plugin system** with sandboxed Web Worker execution. Each plugin is a
  zip containing `lotus-plugin.json` + `index.js`; the worker has no Node
  access, no `fetch`, no `XMLHttpRequest`. See `src/plugins/PLUGIN_API.md`.
- **Plugin manager UI** (Lotus → Plugins). Tabs for Installed, Available
  (catalog), From GitHub (paste `owner/repo`), and Settings.
- **Board manager UI** (Lotus → Manage Boards). Mirrors the plugin manager:
  Installed / Available / From GitHub / Settings. User-installed boards
  live at `%APPDATA%\Lotus IDE\boards\` and merge with the bundled
  `public/boards/` list (user-installed wins on id collision).
- **GitHub Gist sync** (Lotus → GitHub) for sketches. OAuth Device Flow —
  no local HTTP server required. Token stored via Electron `safeStorage`
  (OS keychain).
- **Marketplace IPC** (`electron/ipc/marketplace.js`) — generic catalog
  fetcher + GitHub release resolver, shared by the plugin and board
  managers.
- **Multi-machine setup tooling** — `scripts/setup-resources.ps1` and
  `SETUP.md` so the toolchain (8.5 GB) is reproducible on a fresh clone.
- **Docs**: `RELEASE.md` (publishing the app), `PUBLISHING.md` (community
  plugin/board guide), `PLATFORMS.md` (Linux/Ubuntu prep), `SETUP.md`
  (multi-machine workflow).

### Changed

- `electron/ipc/arduino.js` — `boards:list` now merges
  `%APPDATA%/Lotus IDE/boards/` with `public/boards/`. `getBlockFiles` and
  `getConfig` resolve through a shared helper so user boards work the same
  as bundled ones.
- `electron/main.js` — `kbide://` protocol now falls back to `public/`
  when `C:\KBIDE_Lotus` isn't present (so non-Windows / non-dev installs
  still resolve board assets).
- Executable suffix is gated by `process.platform === 'win32'` (constant
  `EXE` in `electron/ipc/arduino.js`). Pre-work for Ubuntu builds.
- `package.json` adds `build.publish` (GitHub provider), `build.linux`
  target (AppImage + .deb), `author`, `repository`, `homepage`.

### Known issues (carried from v1.0.0)

- Inner `Lotus IDE.exe` still uses Electron's default icon (installer + main
  window icons are correct). See `project_lotus_ide_build` memory.
- Windows Defender may slow rebuilds — disable real-time protection before
  large builds, then re-enable.

## [1.0.0] — 2026-05-29

Initial Windows installer build.

### Added

- Electron 30 + Vue 3 + Vuetify 3 shell.
- Blockly editor with Lotus block sets (GPIO, Time, Serial, Math, Logic,
  Loops, Text, Task) and per-board categories sourced from
  `public/boards/<id>/block/`.
- Arduino CLI integration for ESP32, AVR, SAM cores.
- USB-to-serial driver launchers (CP210x, CH340) bundled where licensing
  permits.
- NSIS installer (`Lotus IDE Setup 1.0.0.exe`, ~779 MB).
