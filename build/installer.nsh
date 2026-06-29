; Custom NSIS include — referenced from package.json "build.nsis.include".
; Forces the installer to auto-show the details pane so users see filenames +
; percentage progress as the install runs (no need to click "Show details").

; Always show the detail log on the install page
ShowInstDetails show
ShowUninstDetails show

; Force the progress bar to track byte-level progress (not just file count)
!ifndef MUI_INSTFILESPAGE_PROGRESSBAR
  !define MUI_INSTFILESPAGE_PROGRESSBAR smooth
!endif

; customInit fires inside .onInit, *before* the running-app file-lock check
; that surfaces the "Lotus IDE Full cannot be closed — Retry?" dialog when
; upgrading over a running instance. Doing the kill here pre-empts that
; dialog. Also adds Defender exclusions up-front so xtensa-esp32-elf-gcc.exe
; isn't quarantined mid-extraction (the cause of half-installed ESP32
; toolchains where only `esp-rv32` lands and gcc.exe is missing).
!macro customInit
  ; Kill any running Lotus IDE / Lotus IDE Full so files unlock. /T also
  ; kills child processes (Electron renderer + GPU helper). nsExec swallows
  ; the non-zero exit when the target isn't running.
  nsExec::Exec `taskkill /F /T /IM "Lotus IDE.exe"`
  Pop $0
  nsExec::Exec `taskkill /F /T /IM "Lotus IDE Full.exe"`
  Pop $0

  ; Defender exclusion for $INSTDIR — installer is already elevated, so
  ; Add-MpPreference works silently (no extra UAC prompt). $INSTDIR here is
  ; the default or the previous-install path read from the registry;
  ; user-customised paths from the Directory page land later via
  ; customInstall. We intentionally do NOT pass $APPDATA / $LOCALAPPDATA
  ; here: when the installer is elevated those resolve to the *admin* user's
  ; profile, not the user who launched the installer — so an exclusion on
  ; them would silently target the wrong folder. The user's AppData copy is
  ; protected at runtime via the in-app diagnostics:addDefenderExclusion
  ; IPC (UAC-prompted), now auto-suggested on startup when bundleHealth
  ; reports the toolchain as corrupt.
  ; -ErrorAction SilentlyContinue keeps this non-fatal on Server SKUs /
  ; machines with third-party AV where Defender cmdlets aren't present.
  nsExec::Exec `powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command "Add-MpPreference -ExclusionPath '$INSTDIR' -ErrorAction SilentlyContinue"`
  Pop $0
!macroend

; Inject a friendly status message at the start of install
!macro customInstall
  DetailPrint "Lotus IDE installation starting..."
  DetailPrint "Target: $INSTDIR"
  DetailPrint "Files: arduino-cli + ESP32 core + AVR toolchain + Blockly UI"
  DetailPrint "Total ~7 GB to extract — please wait, do not close this window"
  DetailPrint "----------------------------------------------------------------"

  ; Re-apply Defender exclusion against the *finalised* $INSTDIR — covers the
  ; case where the user picked a non-default install dir on the Directory
  ; page after customInit ran. Idempotent: Add-MpPreference on an existing
  ; path is a no-op.
  DetailPrint "Registering Windows Defender exclusion for $INSTDIR ..."
  nsExec::ExecToLog `powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command "Add-MpPreference -ExclusionPath '$INSTDIR' -ErrorAction SilentlyContinue"`
  Pop $0
!macroend

!macro customInstallEnd
  DetailPrint "----------------------------------------------------------------"
  DetailPrint "Lotus IDE installed at $INSTDIR"
!macroend
