#!/bin/bash
# electron-builder deb afterRemove hook.
#
# Strip the udev rules we installed in after-install.sh so removing
# LotusIDE doesn't leave stray permission rules behind.

set -e

RULES_DST="/etc/udev/rules.d/99-lotus.rules"

if [ -f "$RULES_DST" ]; then
  echo "lotus-ide: removing udev rules → $RULES_DST"
  rm -f "$RULES_DST"
  if command -v udevadm >/dev/null 2>&1; then
    udevadm control --reload-rules || true
  fi
fi

exit 0
