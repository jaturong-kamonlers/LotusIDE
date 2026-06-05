# Changelog

All notable changes to LotusIDE are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

## [Unreleased]

## [1.3.2] — 2026-06-05

CI fix-up so the Full SKU actually builds.

### Fixed

- `.github/workflows/release.yml` — the splat into setup-resources used
  `$args`, which is a PowerShell automatic variable. Custom assignment
  to it silently dropped the `-WithEsp32` flag in v1.3.1's Full job,
  causing that build to run the slim setup and then fail at a later
  step. Renamed to `$setupArgs` and added a debug log line so the
  effective args are visible in the run output.
- `scripts/setup-resources.ps1` — the AVR-toolchain download now
  retries on transient DNS / connection failures (linear back-off:
  5 s, 15 s, 30 s). GitHub-hosted runners occasionally lose the first
  DNS lookup before the resolver settles — Slim and Full hit the same
  URL on different runners and only Full saw "No such host is known"
  in v1.3.1.

## [1.3.1] — 2026-06-05

Install-speed fix.

### Changed

- **Installer extracts ~3–5× faster.** `package.json` `build.asar` flipped
  from `false` to `true`, so the thousands of small electron + node_modules
  files now ship as a single `app.asar` blob instead of being written
  individually onto the user's disk. The dominant cost during NSIS
  install — per-file Windows file-system overhead + per-file Defender
  scan — collapses to a single big-blob write. The installer download
  size barely changes (~285 MB → ~270 MB) because LZMA was already
  compressing the small files; the win is install-time, not download-size.
- `node_modules/serialport`, `node_modules/@serialport`, `node-gyp-build`,
  `bindings`, and `drivers/` are listed in `asarUnpack` so they stay on
  disk. serialport has a native `.node` binding that Node can't load
  from inside asar; CH341SER.EXE and the CP210x .inf are spawned via
  `child_process` and pnputil which need real on-disk paths.
- `electron/ipc/arduino.js` + `electron/ipc/libraries-manage.js` —
  resource paths (arduino-cli, avr-toolchain, bundled cores) now resolve
  via `process.resourcesPath` in packaged builds instead of
  `path.join(__dirname, '../../resources')`. With asar enabled the
  former gave `<asar>/resources/` which doesn't exist; the new path
  points at the extraResources copy on disk where execFile / spawn can
  find arduino-cli.exe and avr-gcc.exe.
- `electron/main.js` — `DRIVERS_DIR` translates `app.asar` →
  `app.asar.unpacked` so child_process.spawn finds the actual `.exe` /
  `.inf` files.

### Added

- **Dual-SKU release pipeline** — `release.yml` now matrix-builds two
  installers per tag: the default **Slim** (`Lotus-IDE-Setup-x.exe`,
  ~200 MB, lazy ESP32) and **Full** (`Lotus-IDE-Full-Setup-x.exe`, ~1 GB,
  bundled ESP32). Slim and Full have distinct `productName`, `appId`,
  and `publish.channel` (`latest.yml` vs `latest-full.yml`) so they sit
  side-by-side on the same machine and auto-update within their own
  channel. Sequential matrix (`max-parallel: 1`) avoids two
  electron-builder processes racing to create the same draft.
- **End-user install guide** at the top of `SETUP.md` — install time
  per scenario (AVR/SAM users ~2-5 min, ESP32 first-compile ~17-27 min),
  disk requirements, what gets bundled vs lazy-downloaded, classroom
  pre-download instructions, and the Slim-vs-Full SKU comparison.

## [1.3.0] — 2026-06-05

Community/sharing trio, library manager, and a much smaller installer.

(v1.2.0 was drafted internally then superseded by this release before any
public installer was published; the v1.2.0 git tag was retired to avoid
implying a release that never reached users.)

### Added

- **Manage Libraries** (Sketch → Include Library → Manage Libraries…) —
  the last "coming soon" item in the Lotus menu is now wired up. Backed
  by `arduino-cli lib`, so the install set is the full Arduino Library
  Index (10 000+ libs). Tabs: Installed (list/uninstall), Search (the
  Arduino index), From Git/Zip (clones or unzips into the user lib
  dir), and Settings (update-index + show install path). Libraries land
  at `<userData>/arduino-cli/user/libraries/` — the same dir arduino-cli
  uses when compiling, so installs are picked up automatically without
  re-plumbing the build path.
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
- **Share sketch as public link** — Gists tab has a new button that
  always creates a NEW public gist (point-in-time snapshot) and copies
  the URL to the clipboard.
- **Import from URL** (File → Import from URL…) — paste a gist URL, a
  github.com blob URL, a raw.githubusercontent.com URL, or a plain gist
  id; the dialog resolves it and loads the workspace.
- **Report Bug** (Help → Report Bug…) — opens GitHub Issues in a
  browser with a pre-filled template that includes OS, board, and the
  last 10 console log lines.
- **GitHub Actions release pipeline** (`.github/workflows/release.yml`)
  — push a `v*` tag and CI builds the NSIS installer on a Windows
  runner, then uploads it as a draft GitHub Release with `latest.yml`
  for auto-update. Auth-aware downloader handles private-repo release
  assets. See `CI.md` for the end-to-end browser workflow.
- **Core download dialog** — `CoreDownloadDialog.vue` shows a real
  progress modal when arduino-cli installs a new core (instead of just
  streaming lines into the console panel). Triggered both by the first
  ESP32 compile and by the explicit Pre-download button in Manage
  Boards.
- **Cores tab in Manage Boards** — list AVR/SAM/ESP32 with their install
  status + a Download button. Lets teachers preload ESP32 before class.
- IPC: `arduino:coreList`, `arduino:installCore`, broadcast event
  `arduino:coreStatus` (`start` / `done` / `error`).

### Changed

- **Installer is ~4× smaller** (~200 MB vs ~780 MB). ESP32 core is no
  longer bundled — it lazy-installs to userData on the first ESP32
  compile, or ahead of time via `Lotus → Manage Boards → Cores →
  Download`. AVR and SAM are still bundled so Uno/Nano/Mega/Due/Lotus
  AVR boards work immediately after install with no network.
- `electron/ipc/arduino.js` — `ARDUINO_DIRECTORIES_DATA` moved from
  `<install>/resources/arduino-cli/data` (read-only in `C:\Program
  Files`) to `<userData>/arduino-cli/data`. On first launch we seed it
  from the bundled AVR+SAM copy so existing users see no behaviour
  change beyond a one-time ~150 MB copy.
- `package.json` `build.nsis.differentialPackage` now `true` — future
  auto-updates download only the delta (typically 30–100 MB) instead of
  the full installer.
- `scripts/setup-resources.ps1` — new `-WithEsp32` flag to opt into the
  old "full" bundle. CI uses the default lean build.
- `electron/ipc/github.js` `ghRequest` now exposes response headers so
  status can read `x-oauth-scopes`.
- `electron/ipc/marketplace.js` adds `fetchUrl` — generic HTTPS text
  fetcher used by Import-from-URL.
- `package.json` `build.directories.output` is now relative
  (`dist-electron`) instead of an absolute `E:/…` path, so CI runners
  and fresh clones build without manual config. Local devs who want
  builds off the system drive can `mklink /J dist-electron E:\…` per
  `RELEASE.md`.

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
