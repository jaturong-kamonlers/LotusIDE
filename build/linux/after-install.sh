#!/bin/bash
# electron-builder deb afterInstall hook.
#
# Runs as root via dpkg during `apt install lotus-ide_*.deb`. Two jobs:
#   1. Drop our udev rules into /etc/udev/rules.d/ so the next plug-in of
#      a CH340/CP210x/FT232 device is openable without sudo.
#   2. Trigger udev to re-evaluate already-connected devices — without this
#      the new permissions only apply after replug or reboot, which would
#      confuse a teacher running through "open LotusIDE, upload to the
#      board already plugged in" the first time.
#
# Failures are non-fatal: a missing udevadm (rare on a desktop install
# but possible on a stripped container) just means the user has to
# replug their board. We still log so the install log shows what happened.

set -e

INSTALL_DIR="/opt/Lotus IDE"
RULES_SRC="$INSTALL_DIR/resources/udev/99-lotus.rules"
RULES_DST="/etc/udev/rules.d/99-lotus.rules"

if [ -f "$RULES_SRC" ]; then
  echo "lotus-ide: installing udev rules → $RULES_DST"
  cp "$RULES_SRC" "$RULES_DST"
  chmod 0644 "$RULES_DST"

  if command -v udevadm >/dev/null 2>&1; then
    udevadm control --reload-rules || echo "lotus-ide: udevadm reload failed (non-fatal)"
    udevadm trigger --subsystem-match=tty || true
  else
    echo "lotus-ide: udevadm not available — plug devices in again after reboot"
  fi
else
  echo "lotus-ide: udev rules source not found at $RULES_SRC (skipping)"
fi

exit 0
