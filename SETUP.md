# LotusIDE — Setup guide

This file has two parts:

1. **End-user install** — for students and teachers who downloaded the
   `.exe` installer. Just want to use LotusIDE? Start here.
2. **Developer multi-machine setup** — for working on LotusIDE source
   from more than one computer. Skip to the [Developer setup](#developer-setup--multi-machine)
   section.

---

# End-user install

## TL;DR

Download `Lotus-IDE-Setup-<version>.exe` from the
[Releases page](https://github.com/jaturong-kamonlers/LotusIDE-Releases/releases),
double-click it. **Done in 2-5 minutes** for Arduino Uno / Nano / Mega /
Due / Lotus AVR boards.

ESP32 boards (Lotus DevKit) need an extra ~600 MB download the first
time you compile for them (one-time, ~15-25 min). You can also do this
download ahead of time from inside LotusIDE — see [ESP32 pre-download](#esp32-pre-download-for-classrooms).

## Install time + disk requirements

### If you use AVR / SAM boards (Uno, Nano, Mega, Due, Lotus AVR boards)

| Step | Time | What happens |
|------|------|--------------|
| Download installer | 30 s – 2 min | `Lotus-IDE-Setup-x.y.z.exe` (~200 MB) |
| Run NSIS installer | **1–3 min** | Extracts to `C:\Program Files\Lotus IDE\` (~600 MB on disk) |
| First launch | **10–30 s** | Seeds AVR + SAM cores into `%APPDATA%\Lotus IDE\arduino-cli\data\` (~150 MB) |
| **Total** | **~2–5 min** | Ready to compile + upload immediately |

### If you ALSO use ESP32 (Lotus DevKit etc.) — first time only

Everything above, plus:

| Extra step | Time | What happens |
|------------|------|--------------|
| First ESP32 compile triggers lazy install | 0 s | LotusIDE detects ESP32 core missing |
| Download ESP32 core | **15–25 min** | arduino-cli pulls ~600 MB from `espressif.github.io` (at 30 Mbps) |
| Extract + setup | 1–2 min | Expands to ~5 GB at `%APPDATA%\Lotus IDE\arduino-cli\data\packages\esp32\` |
| Compile resumes | normal | Subsequent ESP32 compiles take ~30 s |

The progress dialog (`CoreDownloadDialog`) shows live arduino-cli output
the whole time. Keep LotusIDE open. After the first compile, every
later ESP32 compile is fast.

## Disk space needed

| Scenario | Disk used |
|----------|-----------|
| Fresh install (just installed, never launched) | ~600 MB |
| AVR / SAM user after using LotusIDE | ~750 MB |
| ESP32 user after first compile | ~5.7 GB |
| Above + ~10 typical Arduino libraries | +50–100 MB |

## What gets installed

### Bundled inside the installer (no network needed):

- LotusIDE app (~150 MB) — Electron + Vue + Blockly editor
- `avr-toolchain` (~188 MB) — custom-built `avr-gcc` + `avrdude` for fast AVR builds
- `arduino-cli.exe` (~50 MB) — used for SAM + lazy ESP32 install
- `arduino:avr` core seed (~50 MB) — Uno / Nano / Mega works offline
- `arduino:sam` core seed (~50 MB) — Due works offline
- Lotus board definitions (~10 MB)
- USB-serial driver launchers (CP210x, CH340)

### NOT bundled — downloaded on demand:

- `esp32:esp32` core (~600 MB → ~5 GB on disk) — only when you compile an ESP32 board
- Arduino Library Index (~5 MB) — when you first use Manage Libraries → Search
- Third-party plugins / extra boards — opt-in via Manage Plugins / Manage Boards

## ESP32 pre-download (for classrooms)

If you're a teacher prepping a classroom that may have spotty internet,
or you just don't want to wait at the first ESP32 compile:

1. Open LotusIDE
2. Menu: **Lotus → Manage Boards → Cores tab**
3. Find `ESP32 (Espressif)` → click **Download**
4. Wait ~15-25 min — the same `CoreDownloadDialog` shows progress

After it's done, every user (and every ESP32 compile) on this machine
will use the cached copy. Repeat on each classroom PC, or roll it out
via a deployment image.

## Things that can slow installation down

- **Windows Defender real-time scan** — can add ~30 s during NSIS
  extraction. Temporarily disabling real-time protection during the install
  shaves a noticeable chunk on slower disks. Re-enable it after.
- **Network firewall** blocking `espressif.github.io` or
  `downloads.arduino.cc` — the lazy ESP32 install will fail. Either
  whitelist these or pre-download ESP32 from a machine that can reach
  them and copy `%APPDATA%\Lotus IDE\arduino-cli\data\packages\esp32\`
  manually.
- **Disabled Long Path support** — ESP32's toolchain paths get very
  long. If compile fails with `path too long` errors, enable long paths:
  ```powershell
  # Run elevated PowerShell:
  Set-ItemProperty HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem `
    -Name LongPathsEnabled -Value 1
  ```
  then restart Windows.

## Installer variants

LotusIDE ships in two SKUs × two formats on the
[Releases page](https://github.com/jaturong-kamonlers/LotusIDE-Releases/releases):

| File pattern | Size | Format | ESP32 bundled? | When to pick |
|--------------|------|--------|----------------|--------------|
| `Lotus-IDE-Setup-x.y.z.exe` | ~260 MB | NSIS installer | ❌ lazy-install | Most users — students at home, devs with internet |
| `Lotus-IDE-x.y.z-win.zip` | ~260 MB | Portable zip | ❌ lazy-install | No admin rights / portable USB |
| `Lotus-IDE-Full-Setup-x.y.z.exe` | ~1 GB | NSIS installer | ✅ bundled | Classrooms / offline labs |
| `Lotus-IDE-Full-x.y.z-win.zip` | ~1 GB | Portable zip | ✅ bundled | USB-stick deployment to many classroom PCs |

The Slim SKU does NOT prevent ESP32 use — it just defers the ~600 MB
download to first ESP32 compile (or to the Pre-download button). The
Full SKU is identical software with the ESP32 toolchain pre-baked, so
the first ESP32 compile on a fresh machine works without internet.

**Portable zip:** extract and double-click `Lotus IDE.exe` — no admin
prompt, no installer, no registry changes. Best for school computer labs
where students can't run installers. Auto-update does NOT work in the
portable build — to update, download a fresh zip and replace the folder.

**Install speed (v1.3.6+):** the NSIS installer uses uncompressed (store)
mode, trading ~30% more download for ~2× faster extract. Slim now installs
in roughly 30–90 seconds on most hardware (was 1–3 min in v1.3.5).

Both SKUs share the same auto-update channel — if you installed Slim,
auto-update keeps you on Slim; same for Full.

---

# Developer setup — multi-machine

This guide is for when you work on LotusIDE from more than one computer
(e.g. morning at home, evening at the office).

## What syncs via Git vs. what doesn't

| Path | Synced? | How to get it on a new machine |
|------|---------|--------------------------------|
| Source code (`src/`, `electron/`, `public/boards/`, etc.) | ✅ Git | `git clone` + `git pull` |
| `node_modules/` | ❌ | `npm install` (reproducible from `package-lock.json`) |
| `resources/arduino-cli/` (~8.3 GB toolchain + cores) | ❌ | `scripts/setup-resources.ps1` — re-fetches via arduino-cli |
| `resources/avr-toolchain/` (~188 MB bundled avr-gcc) | ❌ | Copy manually OR set `$env:LOTUS_AVR_TOOLCHAIN_URL` once |
| Build artifacts (`E:\LotusIDE-build\dist-electron\`) | ❌ | Build locally with `npm run build`, or use GitHub Releases |
| User-installed plugins/boards (`%APPDATA%\Lotus IDE\`) | ❌ | Per-machine, set up as needed |

## Setting up a new machine

### 1. Clone the repo

```powershell
cd C:\
git clone https://github.com/jaturong-kamonlers/LotusIDE.git
cd LotusIDE
```

### 2. Install Node dependencies

```powershell
npm install
```

This reads `package-lock.json` and reproduces the exact dependency tree.

### 3. Populate `resources/`

```powershell
.\scripts\setup-resources.ps1
```

This downloads `arduino-cli` (~50 MB) and installs the ESP32/AVR/SAM cores
(~8 GB total). **First run takes 30–60 minutes** depending on connection.

For the `avr-toolchain` folder (188 MB, custom build not on the public
internet), see the on-screen prompt at the end of the script. Options:

#### Option A — Copy from your primary machine (recommended for first setup)

On the primary machine:
```powershell
Compress-Archive C:\LotusIDE\resources\avr-toolchain `
  -DestinationPath C:\Users\<you>\Desktop\avr-toolchain.zip -Force
```
Move that zip to the second machine (OneDrive, USB, etc.) then:
```powershell
.\scripts\setup-resources.ps1 -SkipArduinoCli -SkipCores `
  -AvrToolchainZip C:\Users\<you>\Desktop\avr-toolchain.zip
```

#### Option B — Host the zip somewhere durable

Upload `avr-toolchain.zip` to:
- A GitHub Release asset (on a private repo: needs PAT to download)
- OneDrive direct link (use `…&download=1` in the URL)
- An S3 / R2 bucket

Then on each new machine:
```powershell
[Environment]::SetEnvironmentVariable("LOTUS_AVR_TOOLCHAIN_URL", "<your-url>", "User")
# close + re-open PowerShell
.\scripts\setup-resources.ps1
```

### 4. Set `GH_TOKEN` (only if you'll publish releases from this machine)

```powershell
setx GH_TOKEN "ghp_yourtoken"
```
See [RELEASE.md](RELEASE.md) for the release workflow.

### 5. Run

```powershell
npm run dev
```

If the Blockly editor loads and you can switch boards without "header not found"
errors, the setup is complete.

## Daily workflow across machines

Treat git as the single source of truth.

### End of session on machine A

```powershell
git add .
git commit -m "WIP: <what you were working on>"
git push
```

### Start of session on machine B

```powershell
cd C:\LotusIDE
git pull
npm run dev
```

If `package.json` changed since last `git pull`, also run:
```powershell
npm install
```

`resources/` never changes from day-to-day work, so once it's set up on a
machine you don't touch it again.

## Branching tip — keep `main` clean

For longer-running work that you don't want sitting on `main`:

```powershell
git checkout -b feature/my-thing      # at start of feature
# … work, commit, push (`git push -u origin feature/my-thing`) …
git checkout main && git merge feature/my-thing && git push   # when done
```

You can also push WIP branches between machines to hand off without
contaminating `main`.

## Why isn't `resources/` in git?

It's 8.5 GB of binary toolchain blobs (avr-gcc, esp32 xtensa cores, esptool,
etc.). Git is bad at large binaries — clones would be slow and storage costs
balloon. The `.gitignore` excludes the whole `resources/` tree; this setup
script reconstitutes it from upstream sources (arduino-cli + the AVR bundle).

## Linux setup (planned)

`scripts/setup-resources.sh` will follow the same pattern once Ubuntu builds
are wired up. See [PLATFORMS.md](PLATFORMS.md) for the multi-OS roadmap.
