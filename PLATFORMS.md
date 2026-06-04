# Lotus IDE — Multi-platform build notes

## Targets

- **Windows** → NSIS installer (`E:/LotusIDE-build/dist-electron/Lotus IDE Setup *.exe`)
- **Linux**   → AppImage + .deb (added 2026-06-04)
- **macOS**   → not yet (would need `mac` block in `package.json` + Apple notarisation)

## Building for Linux

From a Linux host (or Docker/WSL):

```bash
npm install
npm run build
```

electron-builder picks the `linux` target from `package.json`. Output goes to the
configured `directories.output` (currently `E:/LotusIDE-build/dist-electron`,
which is fine on WSL — adjust to a Linux-native path if cross-building from
Windows is undesirable).

## Native modules

`serialport` (v12) ships with prebuilt binaries for win32-x64, darwin-x64,
darwin-arm64, linux-x64, linux-arm64. electron-builder runs `electron-rebuild`
automatically against the target's ABI during packaging, so no extra steps are
needed in CI.

## Known open items for Linux support

1. **`installer.nsh` is Windows-only** — no action needed; electron-builder
   ignores it for non-NSIS targets.
2. **USB-to-serial driver installers (CH340 / CP210x)** — these are Windows
   `.exe`/`.inf` flows. On Linux the driver is in the kernel; the MenuBar
   should hide the *Install USB Drivers* sub-menu when
   `process.platform !== 'win32'` (TODO).
3. **`dialout` group** — on Ubuntu the user must be in the `dialout` group to
   open `/dev/ttyUSB*`. Document this in a first-run check (TODO).
4. **udev rules** — for ESP32 reset to work without sudo, ship a `99-lotus.rules`
   file under `/etc/udev/rules.d/` from the .deb postinst (TODO).
5. **CP210x driver source** — same chip is `cp210x` kernel module; nothing to
   install.

## Already fixed

- `.exe` suffix is gated behind `process.platform === 'win32'` (see `EXE`
  constant in `electron/ipc/arduino.js`).
- `kbide://` protocol falls back to `public/` when `C:\KBIDE_Lotus` is absent.
- `os.tmpdir()` used everywhere instead of `%TEMP%`.
- Plugins + user-installed boards live under `app.getPath('userData')`, which
  resolves correctly on every platform.
