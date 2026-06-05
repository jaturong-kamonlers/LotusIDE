# scripts/setup-resources.ps1
#
# Populate resources/ on a fresh clone of LotusIDE.
#
# Run after `git clone` + `npm install`:
#
#   .\scripts\setup-resources.ps1
#
# What it does:
#   1. Download arduino-cli (Windows x64) → resources/arduino-cli/
#   2. Install arduino:avr + arduino:sam cores via arduino-cli (lands under
#      resources/arduino-cli/data/packages/, ~250 MB on disk). Pass -WithEsp32
#      to also bundle esp32:esp32 (~5 GB more). Default: ESP32 NOT bundled —
#      it lazy-installs at runtime so the installer stays ~200 MB.
#   3. Restore resources/avr-toolchain/ (188 MB bundled avr-gcc + avrdude)
#      from EITHER a URL you supply OR a local backup folder.
#
# Step 3 needs a one-time decision because the bundled avr-gcc is a custom
# build (not the one arduino:avr core ships). Either:
#   - Zip resources/avr-toolchain/ from your primary machine and host the
#     zip somewhere (OneDrive share link, GitHub release asset, etc.) then:
#         $env:LOTUS_AVR_TOOLCHAIN_URL = '<your-zip-url>'
#         .\scripts\setup-resources.ps1
#   - Or copy the folder directly via USB/network share to resources/.
#
# Flags:
#   -SkipArduinoCli      don't download arduino-cli (assume it's already there)
#   -SkipCores           don't install platforms (long step — skip if already done)
#   -WithEsp32           ALSO bundle the ESP32 core (~5 GB on disk, ~600 MB in
#                        installer). Default behavior since v1.3 is to leave
#                        ESP32 out — it lazy-installs to userData at first ESP32
#                        compile (or via Lotus → Manage Boards → Pre-download
#                        Cores). Keeps the installer at ~200 MB instead of
#                        ~780 MB and trims CI build time roughly in half.
#   -AvrToolchainUrl X   override LOTUS_AVR_TOOLCHAIN_URL env var
#   -AvrToolchainZip X   path to a local zip to expand (no download)

[CmdletBinding()]
param(
  [switch]$SkipArduinoCli,
  [switch]$SkipCores,
  [switch]$WithEsp32,
  [string]$AvrToolchainUrl = $env:LOTUS_AVR_TOOLCHAIN_URL,
  [string]$AvrToolchainZip
)

$ErrorActionPreference = 'Stop'

$RepoRoot         = Split-Path $PSScriptRoot -Parent
$ResourcesRoot    = Join-Path $RepoRoot 'resources'
$ArduinoCliRoot   = Join-Path $ResourcesRoot 'arduino-cli'
$ArduinoCliExe    = Join-Path $ArduinoCliRoot 'arduino-cli.exe'
$AvrToolchainRoot = Join-Path $ResourcesRoot 'avr-toolchain'
$AvrGccExe        = Join-Path $AvrToolchainRoot 'tools\bin\avr-gcc.exe'

function Write-Step    ($msg) { Write-Host ""; Write-Host "▶ $msg" -ForegroundColor Cyan }
function Write-Skip    ($msg) { Write-Host "  · $msg" -ForegroundColor DarkGray }
function Write-Success ($msg) { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Action  ($msg) { Write-Host "  → $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "  LotusIDE — resources setup" -ForegroundColor Cyan
Write-Host "  Repo: $RepoRoot"

New-Item -ItemType Directory -Force -Path $ResourcesRoot | Out-Null

# ─── Step 1: arduino-cli binary ───────────────────────────────────────────────
Write-Step "Step 1/3: arduino-cli binary"

if ($SkipArduinoCli)         { Write-Skip "skipped via -SkipArduinoCli" }
elseif (Test-Path $ArduinoCliExe) { Write-Skip "already present at $ArduinoCliExe" }
else {
  New-Item -ItemType Directory -Force -Path $ArduinoCliRoot | Out-Null
  $url = 'https://downloads.arduino.cc/arduino-cli/arduino-cli_latest_Windows_64bit.zip'
  $tmp = Join-Path $env:TEMP "arduino-cli-windows-$(Get-Random).zip"
  Write-Action "downloading $url"
  Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing
  Write-Action "extracting to $ArduinoCliRoot"
  Expand-Archive -Path $tmp -DestinationPath $ArduinoCliRoot -Force
  Remove-Item $tmp -ErrorAction SilentlyContinue
  if (-not (Test-Path $ArduinoCliExe)) { throw "arduino-cli.exe missing after extract — bad download?" }
  Write-Success "arduino-cli installed"
}

# ─── Step 2: install bundled cores ────────────────────────────────────────────
$coreLabel = if ($WithEsp32) { 'arduino:avr, arduino:sam, esp32:esp32' } else { 'arduino:avr, arduino:sam' }
Write-Step "Step 2/3: install cores ($coreLabel)"

if ($SkipCores) { Write-Skip "skipped via -SkipCores" }
elseif (-not (Test-Path $ArduinoCliExe)) { Write-Skip "arduino-cli not present — re-run without -SkipArduinoCli" }
else {
  # Match the env that electron/ipc/arduino.js sets in production. NOTE: in
  # production, arduino.js points DATA at <userData>/arduino-cli/data and
  # seeds it from the bundled resources/arduino-cli/data on first launch —
  # so installing cores here writes to the bundle that becomes the seed.
  $env:ARDUINO_DIRECTORIES_DATA      = Join-Path $ArduinoCliRoot 'data'
  $env:ARDUINO_DIRECTORIES_DOWNLOADS = Join-Path $ArduinoCliRoot 'staging'
  $env:ARDUINO_DIRECTORIES_USER      = Join-Path $ArduinoCliRoot 'user'
  $env:ARDUINO_BUILD_CACHE_PATH      = Join-Path $ArduinoCliRoot 'cache'

  Write-Action "config init"
  & $ArduinoCliExe config init --overwrite | Out-Null

  if ($WithEsp32) {
    Write-Action "register ESP32 board manager URL"
    & $ArduinoCliExe config add board_manager.additional_urls `
      'https://espressif.github.io/arduino-esp32/package_esp32_index.json' 2>$null
  }

  Write-Action "core update-index (downloads ~5 MB of indexes)"
  & $ArduinoCliExe core update-index

  $cores = @(
    @{ Name = 'arduino:avr'; ApproxMB = 50 }
    @{ Name = 'arduino:sam'; ApproxMB = 50 }
  )
  if ($WithEsp32) {
    $cores += @{ Name = 'esp32:esp32'; ApproxMB = 5800 }
  } else {
    Write-Skip "esp32:esp32 will be lazy-installed at first ESP32 compile (saves ~600 MB in installer)"
  }
  foreach ($c in $cores) {
    Write-Action "installing $($c.Name) (~$($c.ApproxMB) MB)"
    & $ArduinoCliExe core install $c.Name
  }
  Write-Success "cores installed under resources\arduino-cli\data\packages\"
}

# ─── Step 3: avr-toolchain (bundled, custom-built) ────────────────────────────
Write-Step "Step 3/3: avr-toolchain"

if (Test-Path $AvrGccExe) {
  Write-Skip "already present at $AvrGccExe"
}
elseif ($AvrToolchainZip) {
  if (-not (Test-Path $AvrToolchainZip)) { throw "Zip not found: $AvrToolchainZip" }
  Write-Action "expanding local zip $AvrToolchainZip"
  Expand-Archive -Path $AvrToolchainZip -DestinationPath $ResourcesRoot -Force
  if (-not (Test-Path $AvrGccExe)) { throw "Zip did not contain avr-toolchain/tools/bin/avr-gcc.exe at the expected path" }
  Write-Success "avr-toolchain extracted"
}
elseif ($AvrToolchainUrl) {
  $tmp = Join-Path $env:TEMP "avr-toolchain-$(Get-Random).zip"
  Write-Action "downloading $AvrToolchainUrl"
  # Private-repo release assets return 404 unless the request carries an
  # auth token; LOTUS_AVR_TOOLCHAIN_TOKEN (or a generic GH_TOKEN) lets us
  # use the same URL on private + public repos with consistent behavior.
  $dlHeaders = @{}
  $authToken = if ($env:LOTUS_AVR_TOOLCHAIN_TOKEN) { $env:LOTUS_AVR_TOOLCHAIN_TOKEN } elseif ($env:GH_TOKEN) { $env:GH_TOKEN } else { $null }
  if ($authToken) {
    $dlHeaders['Authorization'] = "token $authToken"
    $dlHeaders['Accept']        = 'application/octet-stream'
    Write-Action "using auth token from env"
  }
  # Retry transient DNS / connection failures — GitHub-hosted runners
  # occasionally lose their first lookup before the resolver settles.
  # Linear back-off (5 s, 15 s, 30 s) is enough for the runner network
  # stack to recover in practice.
  $maxAttempts = 4
  $delays = @(0, 5, 15, 30)
  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    if ($delays[$attempt - 1] -gt 0) {
      Write-Action "retry $($attempt-1) — waiting $($delays[$attempt-1])s"
      Start-Sleep -Seconds $delays[$attempt - 1]
    }
    try {
      Invoke-WebRequest -Uri $AvrToolchainUrl -OutFile $tmp -Headers $dlHeaders -UseBasicParsing -ErrorAction Stop
      break
    } catch {
      if ($attempt -eq $maxAttempts) { throw }
      Write-Host "  ! download attempt $attempt failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }
  Write-Action "extracting to $ResourcesRoot"
  Expand-Archive -Path $tmp -DestinationPath $ResourcesRoot -Force
  Remove-Item $tmp -ErrorAction SilentlyContinue
  if (-not (Test-Path $AvrGccExe)) { throw "Zip did not contain avr-toolchain/tools/bin/avr-gcc.exe at the expected path" }
  Write-Success "avr-toolchain installed from URL"
}
else {
  Write-Host "  ! avr-toolchain not found and no URL/zip supplied." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "    The bundled avr-gcc (custom build, ~188 MB) is not on the public" -ForegroundColor Yellow
  Write-Host "    internet. Pick one:" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "      A) Copy resources\avr-toolchain\ from another LotusIDE machine" -ForegroundColor Yellow
  Write-Host "         (via OneDrive share, USB stick, etc.) into:" -ForegroundColor Yellow
  Write-Host "           $AvrToolchainRoot" -ForegroundColor White
  Write-Host ""
  Write-Host "      B) On your primary machine, zip the folder:" -ForegroundColor Yellow
  Write-Host "           Compress-Archive resources\avr-toolchain `\" -ForegroundColor White
  Write-Host "             -DestinationPath avr-toolchain.zip" -ForegroundColor White
  Write-Host "         Upload it (OneDrive direct link, GitHub Release asset, etc.)" -ForegroundColor Yellow
  Write-Host "         then on this machine:" -ForegroundColor Yellow
  Write-Host "           `$env:LOTUS_AVR_TOOLCHAIN_URL = '<url>'" -ForegroundColor White
  Write-Host "           .\scripts\setup-resources.ps1 -SkipArduinoCli -SkipCores" -ForegroundColor White
  Write-Host ""
  Write-Host "      C) Already have the zip locally? Re-run with:" -ForegroundColor Yellow
  Write-Host "           .\scripts\setup-resources.ps1 -SkipArduinoCli -SkipCores `\" -ForegroundColor White
  Write-Host "             -AvrToolchainZip path\to\avr-toolchain.zip" -ForegroundColor White
  Write-Host ""
}

# ─── Summary ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  arduino-cli.exe : $(if (Test-Path $ArduinoCliExe) { 'OK' } else { 'MISSING' })"
Write-Host "  arduino:avr     : $(if (Test-Path (Join-Path $ArduinoCliRoot 'data\packages\arduino')) { 'OK' } else { 'MISSING' })"
$esp32Status = if (Test-Path (Join-Path $ArduinoCliRoot 'data\packages\esp32')) { 'OK (bundled)' } else { 'NOT BUNDLED (lazy-install at runtime)' }
Write-Host "  esp32 core      : $esp32Status"
Write-Host "  avr-toolchain   : $(if (Test-Path $AvrGccExe) { 'OK' } else { 'MISSING — see step 3 above' })"
Write-Host ""
Write-Host "Next: npm run dev" -ForegroundColor Green
