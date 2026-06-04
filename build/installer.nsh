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

; Inject a friendly status message at the start of install
!macro customInstall
  DetailPrint "Lotus IDE installation starting..."
  DetailPrint "Target: $INSTDIR"
  DetailPrint "Files: arduino-cli + ESP32 core + AVR toolchain + Blockly UI"
  DetailPrint "Total ~7 GB to extract — please wait, do not close this window"
  DetailPrint "----------------------------------------------------------------"
!macroend

!macro customInstallEnd
  DetailPrint "----------------------------------------------------------------"
  DetailPrint "Lotus IDE installed at $INSTDIR"
!macroend
