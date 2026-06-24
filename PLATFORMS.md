# Lotus IDE — Multi-platform build notes

## Targets

| Platform | Architecture | Format | Status |
|----------|--------------|--------|--------|
| Windows | x64 | NSIS + zip | ✅ shipping (v1.7.2) |
| Linux | x64 | AppImage + deb | 🚧 code-complete, awaiting CI runner + hardware test |
| Linux | arm64 (Jetson Nano) | AppImage + deb | 🚧 code-complete, awaiting ARM64 CI runner + hardware test |
| macOS | Intel + Apple Silicon | dmg | ⏸ deferred — needs Apple Dev cert ($99/yr) |

## Minimum supported versions

- **Windows:** 10 / 11 (x64)
- **Linux:** Ubuntu 20.04+ (glibc 2.31+). Electron 30 will not run on Ubuntu 18.04 (glibc 2.27) — this rules out **stock JetPack 4 on Jetson Nano**. Users must upgrade their Nano to Ubuntu 20.04 manually (Q-engineering image, etc.) before installing LotusIDE.
- **macOS:** 10.13+ when shipped (electron-30 default support)

## Building for Linux

From a Linux host (or Docker / WSL):

```bash
npm install
./scripts/setup-resources.sh
npm run build
```

`setup-resources.sh` (Linux/macOS path) auto-bootstraps `resources/avr-toolchain/` from the `arduino:avr` core that step 2 installs — no separate avr-toolchain zip is needed on Linux/macOS. Windows still uses its custom 188 MB avr-toolchain bundle.

`electron-builder` picks the `linux` target from `package.json` which now produces:

- `Lotus IDE-x.y.z.AppImage` (x64)
- `Lotus IDE-x.y.z-arm64.AppImage` (arm64)
- `lotus-ide_x.y.z_amd64.deb`
- `lotus-ide_x.y.z_arm64.deb`

The deb postinst (`build/linux/after-install.sh`) installs `/etc/udev/rules.d/99-lotus.rules` and triggers `udevadm`, so plugging in an ESP32/Arduino board works without sudo immediately after install.

## Native modules

`serialport` (v12) ships with prebuilt binaries for `win32-x64`, `darwin-x64`, `darwin-arm64`, `linux-x64`, `linux-arm64`. electron-builder runs `electron-rebuild` automatically against the target's ABI during packaging, so no extra steps are needed in CI.

## ESP32 fast-path Linux gating

`electron/ipc/arduino.js` gates the ESP32 fast-path (replays captured arduino-cli commands for ~10× incremental speedup) to `process.platform === 'win32'`. The recipe parser was written against Windows-quoted `.exe` paths in arduino-cli verbose output; Linux/macOS output is unquoted and lacks the suffix. Until Phase 5 hardware tests re-validate the parser cross-platform, Linux/macOS always run the full arduino-cli pipeline (~30s–3 min vs ~18s fast-path). Correct but slower.

## Resolved Linux portability items (Phase 1 — 2026-06-16)

1. ✅ `installer.nsh` is Windows-only — electron-builder ignores it for non-NSIS targets.
2. ✅ USB-to-serial driver installer submenu hidden when `process.platform !== 'win32'` (Menu Bar, `src/components/MenuBar.vue`). The `drivers:install` IPC returns a helpful note on Linux/macOS explaining that the CH340 / CP210x kernel modules are in-tree.
3. ✅ `dialout` group check on Linux first-run — `diagnostics:linuxStartupCheck` IPC runs from `App.vue` `onMounted` and logs the `sudo usermod -a -G dialout $USER` fix to the console panel if the user isn't in the group.
4. ✅ `udev` rules — `build/linux/99-lotus.rules` installed by the deb postinst, covering CH340 (1a86), CP210x (10c4), FTDI (0403), Arduino native CDC (2341), Adafruit (239a), Espressif native USB (303a). Each rule TAG+="uaccess" + ENV{ID_MM_DEVICE_IGNORE}="1" so ModemManager doesn't grab the port for 5s at plug-in.
5. ✅ `brltty` detection — Ubuntu's braille service grabs CH340 within 5s of plug-in. The startup check warns + suggests `sudo systemctl mask brltty.path`.
6. ✅ Path separator handling in Vue components — `appStore.currentFile?.split('\\')` would return the full path on Linux instead of the filename. Replaced with `split(/[\\/]/)` in CodeEditor, MenuBar, TitleBar, Toolbar.
7. ✅ Cross-platform npm scripts — `dev` + `kill` previously used `taskkill /F /IM electron.exe`. Replaced with `node scripts/kill-electron.js` which dispatches to `taskkill` on Windows and `pkill` elsewhere.

## Already fixed in earlier work

- `.exe` suffix is gated behind `process.platform === 'win32'` (see `EXE` constant in `electron/ipc/arduino.js`).
- `kbide://` protocol falls back to `public/` when `C:\KBIDE_Lotus` is absent.
- `os.tmpdir()` used everywhere instead of `%TEMP%`.
- Plugins + user-installed boards live under `app.getPath('userData')`, which resolves correctly on every platform.

## Open items — Phase 4 (CI) + Phase 5 (testing)

1. **CI matrix expansion** — add `ubuntu-latest` (x64) and `ubuntu-22.04-arm` (arm64) runners alongside the existing `windows-latest` job in `.github/workflows/release.yml`. GitHub Actions added free public-repo ARM64 runners in January 2025.
2. **Jetson Nano smoke test** — `npm install` + `setup-resources.sh` + `npm run build` on a Nano running Ubuntu 20.04 to validate the cross-compile path, then install the resulting .deb and verify:
   - Electron 30 launches under Maxwell GPU (may need `--disable-gpu` software fallback)
   - 4 GB RAM is enough for editor + arduino-cli compile
   - ESP32 upload works through `/dev/ttyUSB*`
3. **macOS bring-up** — add `mac` block in `package.json`, Apple Developer ID cert + notarization workflow. Deferred pending budget approval ($99/yr Apple Developer + macOS CI runner cost).

## macOS bring-up checklist (when scoping resumes)

- Add `mac.target: ['dmg']` + `mac.hardenedRuntime: true` + `mac.gatekeeperAssess: false` to `package.json`.
- Register an Apple Developer ID Application certificate; store in CI as `CSC_LINK` + `CSC_KEY_PASSWORD`.
- Set up `notarize` via `electron-builder`'s built-in notarytool path or `@electron/notarize` plugin.
- Add a self-hosted macOS runner OR purchase macOS minutes on GitHub Actions ($0.08 / min × 30 min / build = ~$2.40 per release).
- Test on both Intel and Apple Silicon Macs (universal binary via `mac.target: { target: 'dmg', arch: ['x64', 'arm64'] }`).
