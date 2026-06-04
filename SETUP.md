# LotusIDE — Multi-machine setup

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
