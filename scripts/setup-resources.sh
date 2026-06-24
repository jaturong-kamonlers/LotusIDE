#!/usr/bin/env bash
# scripts/setup-resources.sh
#
# Linux/macOS counterpart of setup-resources.ps1. Populates resources/ on a
# fresh clone of LotusIDE. Run after `git clone` + `npm install`:
#
#   ./scripts/setup-resources.sh
#
# What it does:
#   1. Download arduino-cli (auto-detect Linux/macOS, x86_64/arm64).
#   2. Install esp32, arduino:avr, arduino:sam cores via arduino-cli.
#   3. Restore resources/avr-toolchain/ from a URL or local zip.
#
# Env vars / flags:
#   LOTUS_AVR_TOOLCHAIN_URL=<url>   download avr-toolchain.zip from a URL
#   --skip-arduino-cli              keep existing arduino-cli.exe
#   --skip-cores                    don't reinstall platforms
#   --avr-toolchain-zip=<path>      expand a local zip instead of download
#
# The bundled avr-gcc is a custom build not on the public internet — Option A
# in SETUP.md (copy resources/avr-toolchain/ from another machine) is the
# easiest path the first time.

set -euo pipefail

SKIP_ARDUINO_CLI=0
SKIP_CORES=0
WITH_ESP32=1   # 1=install esp32 core (Full SKU / dev default); 0=skip (Slim SKU CI)
AVR_TOOLCHAIN_URL="${LOTUS_AVR_TOOLCHAIN_URL:-}"
AVR_TOOLCHAIN_ZIP=""

for arg in "$@"; do
  case "$arg" in
    --skip-arduino-cli)     SKIP_ARDUINO_CLI=1 ;;
    --skip-cores)           SKIP_CORES=1 ;;
    --no-esp32)             WITH_ESP32=0 ;;
    --with-esp32)           WITH_ESP32=1 ;;
    --avr-toolchain-zip=*)  AVR_TOOLCHAIN_ZIP="${arg#*=}" ;;
    --avr-toolchain-url=*)  AVR_TOOLCHAIN_URL="${arg#*=}" ;;
    *) echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESOURCES_ROOT="$REPO_ROOT/resources"
ARDUINO_CLI_ROOT="$RESOURCES_ROOT/arduino-cli"
ARDUINO_CLI_BIN="$ARDUINO_CLI_ROOT/arduino-cli"
AVR_TOOLCHAIN_ROOT="$RESOURCES_ROOT/avr-toolchain"
AVR_GCC_BIN="$AVR_TOOLCHAIN_ROOT/tools/bin/avr-gcc"

cyan()  { printf "\033[36m%s\033[0m\n" "$*"; }
gray()  { printf "\033[90m  · %s\033[0m\n" "$*"; }
green() { printf "\033[32m  ✓ %s\033[0m\n" "$*"; }
yellow(){ printf "\033[33m  → %s\033[0m\n" "$*"; }

echo
cyan "  LotusIDE — resources setup"
echo  "  Repo: $REPO_ROOT"

mkdir -p "$RESOURCES_ROOT"

# ── Step 1: arduino-cli binary ───────────────────────────────────────────────
echo; cyan "▶ Step 1/3: arduino-cli binary"
if [[ $SKIP_ARDUINO_CLI -eq 1 ]]; then
  gray "skipped via --skip-arduino-cli"
elif [[ -x "$ARDUINO_CLI_BIN" ]]; then
  gray "already present at $ARDUINO_CLI_BIN"
else
  mkdir -p "$ARDUINO_CLI_ROOT"
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64)   asset="arduino-cli_latest_Linux_64bit.tar.gz" ;;
    Linux-aarch64)  asset="arduino-cli_latest_Linux_ARM64.tar.gz" ;;
    Darwin-x86_64)  asset="arduino-cli_latest_macOS_64bit.tar.gz" ;;
    Darwin-arm64)   asset="arduino-cli_latest_macOS_ARM64.tar.gz" ;;
    *) echo "Unsupported platform $(uname -s)-$(uname -m)" >&2; exit 1 ;;
  esac
  url="https://downloads.arduino.cc/arduino-cli/$asset"
  tmp="$(mktemp -t arduino-cli.XXXXXX.tar.gz)"
  yellow "downloading $url"
  curl -fsSL -o "$tmp" "$url"
  yellow "extracting to $ARDUINO_CLI_ROOT"
  tar -xzf "$tmp" -C "$ARDUINO_CLI_ROOT" arduino-cli
  rm -f "$tmp"
  chmod +x "$ARDUINO_CLI_BIN"
  green "arduino-cli installed"
fi

# ── Step 2: cores ────────────────────────────────────────────────────────────
echo; cyan "▶ Step 2/3: install cores (esp32, arduino:avr, arduino:sam)"
if [[ $SKIP_CORES -eq 1 ]]; then
  gray "skipped via --skip-cores"
elif [[ ! -x "$ARDUINO_CLI_BIN" ]]; then
  gray "arduino-cli not present — re-run without --skip-arduino-cli"
else
  export ARDUINO_DIRECTORIES_DATA="$ARDUINO_CLI_ROOT/data"
  export ARDUINO_DIRECTORIES_DOWNLOADS="$ARDUINO_CLI_ROOT/staging"
  export ARDUINO_DIRECTORIES_USER="$ARDUINO_CLI_ROOT/user"
  export ARDUINO_BUILD_CACHE_PATH="$ARDUINO_CLI_ROOT/cache"

  yellow "config init"
  "$ARDUINO_CLI_BIN" config init --overwrite >/dev/null

  yellow "register ESP32 board manager URL"
  "$ARDUINO_CLI_BIN" config add board_manager.additional_urls \
    'https://espressif.github.io/arduino-esp32/package_esp32_index.json' 2>/dev/null || true

  yellow "core update-index"
  "$ARDUINO_CLI_BIN" core update-index

  if [[ $WITH_ESP32 -eq 1 ]]; then
    cores=(arduino:avr arduino:sam esp32:esp32)
  else
    cores=(arduino:avr arduino:sam)
    gray "skipping esp32:esp32 (--no-esp32 / Slim SKU)"
  fi
  for core in "${cores[@]}"; do
    yellow "installing $core"
    "$ARDUINO_CLI_BIN" core install "$core"
  done
  green "cores installed under resources/arduino-cli/data/packages/"
fi

# ── Step 3: avr-toolchain ────────────────────────────────────────────────────
echo; cyan "▶ Step 3/3: avr-toolchain"
if [[ -x "$AVR_GCC_BIN" ]]; then
  gray "already present at $AVR_GCC_BIN"
elif [[ -n "$AVR_TOOLCHAIN_ZIP" ]]; then
  [[ -f "$AVR_TOOLCHAIN_ZIP" ]] || { echo "Zip not found: $AVR_TOOLCHAIN_ZIP" >&2; exit 1; }
  yellow "expanding local zip $AVR_TOOLCHAIN_ZIP"
  unzip -q -o "$AVR_TOOLCHAIN_ZIP" -d "$RESOURCES_ROOT"
  [[ -x "$AVR_GCC_BIN" ]] || { echo "Zip didn't contain expected layout" >&2; exit 1; }
  green "avr-toolchain extracted"
elif [[ -n "$AVR_TOOLCHAIN_URL" ]]; then
  tmp="$(mktemp -t avr-toolchain.XXXXXX.zip)"
  yellow "downloading $AVR_TOOLCHAIN_URL"
  # Private-repo release assets need auth — LOTUS_AVR_TOOLCHAIN_TOKEN
  # (or generic GH_TOKEN) gets added as a Bearer header when present.
  auth_token="${LOTUS_AVR_TOOLCHAIN_TOKEN:-${GH_TOKEN:-}}"
  if [[ -n "$auth_token" ]]; then
    yellow "using auth token from env"
    curl -fsSL -o "$tmp" \
      -H "Authorization: token $auth_token" \
      -H "Accept: application/octet-stream" \
      "$AVR_TOOLCHAIN_URL"
  else
    curl -fsSL -o "$tmp" "$AVR_TOOLCHAIN_URL"
  fi
  yellow "extracting to $RESOURCES_ROOT"
  unzip -q -o "$tmp" -d "$RESOURCES_ROOT"
  rm -f "$tmp"
  [[ -x "$AVR_GCC_BIN" ]] || { echo "Zip didn't contain expected layout" >&2; exit 1; }
  green "avr-toolchain installed from URL"
elif [[ "$(uname -s)" != "MINGW"* && "$(uname -s)" != "CYGWIN"* ]]; then
  # Linux / macOS auto-bootstrap: synthesise resources/avr-toolchain/ from
  # the arduino:avr package that step 2 already installed. The Windows
  # build ships a custom avr-gcc (~10% faster, ~188 MB); on Linux/macOS we
  # accept the stock Arduino-distributed avr-gcc rather than maintaining a
  # second cross-compiled custom build. arduino.js doesn't care which one
  # is at $AVR_TOOLCHAIN_ROOT/tools/bin/ as long as the layout matches.
  yellow "synthesising avr-toolchain from arduino-cli avr package (Linux/macOS path)"
  pkg_root="$ARDUINO_CLI_ROOT/data/packages/arduino"
  if [[ ! -d "$pkg_root" ]]; then
    echo "  ! arduino:avr core not installed at $pkg_root" >&2
    echo "    (re-run without --skip-cores so step 2 installs it)" >&2
    exit 1
  fi
  # Pick the newest installed versions if multiple are present.
  avr_gcc_bin_dir="$(ls -d "$pkg_root"/tools/avr-gcc/*/bin 2>/dev/null | sort -V | tail -1)"
  avrdude_bin_dir="$(ls -d "$pkg_root"/tools/avrdude/*/bin 2>/dev/null | sort -V | tail -1)"
  avrdude_conf="$(ls "$pkg_root"/tools/avrdude/*/etc/avrdude.conf 2>/dev/null | sort -V | tail -1)"
  avr_hw_dir="$(ls -d "$pkg_root"/hardware/avr/* 2>/dev/null | sort -V | tail -1)"
  for need in "$avr_gcc_bin_dir/avr-gcc" "$avrdude_bin_dir/avrdude" "$avrdude_conf" "$avr_hw_dir/cores"; do
    if [[ ! -e "$need" ]]; then
      echo "  ! expected component missing: $need" >&2
      echo "    (arduino:avr install incomplete — try: arduino-cli core uninstall arduino:avr && re-run)" >&2
      exit 1
    fi
  done
  mkdir -p "$AVR_TOOLCHAIN_ROOT/tools/bin" "$AVR_TOOLCHAIN_ROOT/tools/etc" "$AVR_TOOLCHAIN_ROOT/sdk"
  # cp -r so electron-builder ships real files, not dangling symlinks. Disk
  # cost is ~150 MB which matches the Windows shipped toolchain.
  for tool in avr-gcc avr-g++ avr-objcopy avr-ar avr-ld avr-size; do
    [[ -f "$avr_gcc_bin_dir/$tool" ]] && cp -f "$avr_gcc_bin_dir/$tool" "$AVR_TOOLCHAIN_ROOT/tools/bin/$tool"
  done
  cp -f "$avrdude_bin_dir/avrdude" "$AVR_TOOLCHAIN_ROOT/tools/bin/avrdude"
  cp -f "$avrdude_conf" "$AVR_TOOLCHAIN_ROOT/tools/etc/avrdude.conf"
  # Also copy the libexec gcc support files (cc1, cc1plus, real-ld, etc.)
  # that avr-gcc spawns. Without these the bundled avr-gcc fails on the
  # first compile with "cc1: not found".
  for sup in "$avr_gcc_bin_dir/../libexec" "$avr_gcc_bin_dir/../avr"; do
    [[ -d "$sup" ]] && cp -rf "$sup" "$AVR_TOOLCHAIN_ROOT/tools/"
  done
  # SDK: cores, libraries, variants — arduino.js walks these directly.
  cp -rf "$avr_hw_dir/cores"     "$AVR_TOOLCHAIN_ROOT/sdk/cores"
  cp -rf "$avr_hw_dir/libraries" "$AVR_TOOLCHAIN_ROOT/sdk/libraries"
  cp -rf "$avr_hw_dir/variants"  "$AVR_TOOLCHAIN_ROOT/sdk/variants"
  chmod +x "$AVR_TOOLCHAIN_ROOT/tools/bin/"*
  green "avr-toolchain synthesised from arduino:avr ($(du -sh "$AVR_TOOLCHAIN_ROOT" | cut -f1))"
else
  cat <<'EOF'

  ! avr-toolchain not found and no URL/zip supplied.

    The bundled avr-gcc (custom build, ~188 MB) is not on the public
    internet. Pick one:

      A) Copy resources/avr-toolchain/ from another LotusIDE machine
         (via OneDrive / scp / USB).

      B) On your primary machine:
           cd resources && zip -r ../avr-toolchain.zip avr-toolchain
         Upload the zip somewhere reachable then on this machine:
           export LOTUS_AVR_TOOLCHAIN_URL='<url>'
           ./scripts/setup-resources.sh

      C) Re-run with --avr-toolchain-zip=path/to/avr-toolchain.zip

EOF
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo
cyan "Summary:"
[[ -x "$ARDUINO_CLI_BIN" ]] && echo "  arduino-cli     : OK" || echo "  arduino-cli     : MISSING"
[[ -d "$ARDUINO_CLI_ROOT/data/packages/esp32"   ]] && echo "  esp32 core      : OK" || echo "  esp32 core      : MISSING"
[[ -d "$ARDUINO_CLI_ROOT/data/packages/arduino" ]] && echo "  arduino cores   : OK" || echo "  arduino cores   : MISSING"
[[ -x "$AVR_GCC_BIN" ]] && echo "  avr-toolchain   : OK" || echo "  avr-toolchain   : MISSING — see step 3 above"
echo
green "Next: npm run dev"
