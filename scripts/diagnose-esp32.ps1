#requires -Version 5.1
# Lotus IDE ESP32 compile health check.
# Run on a user's machine where ESP32 compile fails. Read-only; never modifies.
# Usage: powershell -ExecutionPolicy Bypass -File diagnose-esp32.ps1

$ErrorActionPreference = 'Continue'

$results = New-Object System.Collections.Generic.List[object]
function Add-Result($name, $status, $detail, $fix='') {
    $results.Add([PSCustomObject]@{
        Check  = $name
        Status = $status
        Detail = $detail
        Fix    = $fix
    })
}

Write-Host ''
Write-Host '======================================================' -ForegroundColor Cyan
Write-Host '  Lotus IDE - ESP32 compile health check' -ForegroundColor Cyan
Write-Host '======================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host ("  Computer:    {0}" -f $env:COMPUTERNAME)
Write-Host ("  User:        {0}" -f $env:USERNAME)
Write-Host ("  Date:        {0:yyyy-MM-dd HH:mm}" -f (Get-Date))
Write-Host ''

# ---- 1. userData dir ----
$userData = Join-Path $env:APPDATA 'Lotus IDE'
if (Test-Path $userData) {
    Add-Result 'Lotus IDE userData' 'OK' $userData
} else {
    Add-Result 'Lotus IDE userData' 'MISSING' $userData `
        'Open Lotus IDE at least once so userData is created.'
    Write-Host 'Cannot continue without userData. Exiting.' -ForegroundColor Red
    $results | Format-Table -AutoSize -Wrap
    return
}

$cliData = Join-Path $userData 'arduino-cli\data'
if (Test-Path $cliData) {
    Add-Result 'arduino-cli data dir' 'OK' $cliData
} else {
    Add-Result 'arduino-cli data dir' 'MISSING' $cliData `
        'Compile any AVR sketch once to trigger seed of arduino-cli data.'
}

# ---- 2. ESP32 hardware ----
$esp32Hw = Join-Path $cliData 'packages\esp32\hardware\esp32'
$hwVersions = @()
if (Test-Path $esp32Hw) {
    $hwVersions = Get-ChildItem -Directory $esp32Hw -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
}
if ($hwVersions.Count -gt 0) {
    Add-Result 'ESP32 core (hardware)' 'OK' ("version(s): " + ($hwVersions -join ', '))
} else {
    Add-Result 'ESP32 core (hardware)' 'MISSING' $esp32Hw `
        'In Lotus IDE: menu Lotus > Manage Boards > Cores > Download ESP32.'
}

# ---- 3. ESP32 tools (completeness) ----
$esp32Tools = Join-Path $cliData 'packages\esp32\tools'
$toolDirs = @()
if (Test-Path $esp32Tools) {
    $toolDirs = Get-ChildItem -Directory $esp32Tools -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
}
$required = @('esptool_py')
$missingReq = $required | Where-Object { $_ -notin $toolDirs }
$libsCount = ($toolDirs | Where-Object { $_ -like '*-libs*' }).Count
$gccCount  = ($toolDirs | Where-Object { $_ -like '*-elf-gcc*' -or $_ -like '*esp32*gcc*' }).Count
$summary = ("{0} tool folders ({1} *-libs, {2} *-gcc)" -f $toolDirs.Count, $libsCount, $gccCount)

if ($toolDirs.Count -eq 0) {
    Add-Result 'ESP32 tools' 'MISSING' 'tools/ directory empty' `
        'ESP32 core install never completed. Re-trigger from Manage Boards.'
} elseif ($missingReq.Count -gt 0 -or $libsCount -eq 0 -or $toolDirs.Count -lt 5) {
    Add-Result 'ESP32 tools' 'PARTIAL' $summary `
        ('Delete "' + (Join-Path $cliData 'packages\esp32') + '" and reinstall ESP32 core. Missing: ' + ($missingReq -join ', '))
} else {
    Add-Result 'ESP32 tools' 'OK' $summary
}

# Check the actual gcc binary exists inside its tool dir
$gccDirs = $toolDirs | Where-Object { $_ -like '*-elf-gcc*' -or $_ -like '*esp32*gcc*' }
$gccOk = $false
foreach ($g in $gccDirs) {
    $verDirs = Get-ChildItem -Directory (Join-Path $esp32Tools $g) -ErrorAction SilentlyContinue
    foreach ($v in $verDirs) {
        $candidates = @(
            Join-Path $v.FullName 'bin\xtensa-esp32-elf-gcc.exe'
            Join-Path $v.FullName 'xtensa-esp32-elf\bin\xtensa-esp32-elf-gcc.exe'
            Join-Path $v.FullName 'bin\xtensa-esp-elf-gcc.exe'
        )
        if ($candidates | Where-Object { Test-Path $_ } | Select-Object -First 1) { $gccOk = $true; break }
    }
    if ($gccOk) { break }
}
if ($gccDirs.Count -gt 0) {
    if ($gccOk) {
        Add-Result 'xtensa gcc.exe present' 'OK' 'found inside one of the tool versions'
    } else {
        Add-Result 'xtensa gcc.exe present' 'MISSING' 'gcc folder exists but no gcc.exe inside' `
            'Likely Windows Defender quarantined the binary. Check exclusions + reinstall ESP32 core.'
    }
}

# ---- 4. Lotus build cache ----
$buildCache = Join-Path $env:TEMP 'lotus_build'
if (Test-Path $buildCache) {
    $stats = Get-ChildItem -Recurse -File $buildCache -ErrorAction SilentlyContinue |
        Measure-Object -Property Length -Sum
    $sizeMB = [Math]::Round($stats.Sum / 1MB, 1)
    $oldest = Get-ChildItem -Recurse -File $buildCache -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime | Select-Object -First 1
    $ageDays = if ($oldest) { [Math]::Round((New-TimeSpan -Start $oldest.LastWriteTime -End (Get-Date)).TotalDays, 1) } else { 0 }
    if ($sizeMB -gt 2000) {
        Add-Result 'Lotus build cache' 'LARGE' ("{0} files, {1} MB, oldest {2} d" -f $stats.Count, $sizeMB, $ageDays) `
            ('Cache is large. Safe to delete to free space: Remove-Item -Recurse -Force "' + $buildCache + '"')
    } elseif ($ageDays -gt 30) {
        Add-Result 'Lotus build cache' 'STALE' ("{0} files, {1} MB, oldest {2} d" -f $stats.Count, $sizeMB, $ageDays) `
            ('Some files >30 days. If you see "header not found" errors: Remove-Item -Recurse -Force "' + $buildCache + '"')
    } else {
        Add-Result 'Lotus build cache' 'OK' ("{0} files, {1} MB, oldest {2} d" -f $stats.Count, $sizeMB, $ageDays)
    }
} else {
    Add-Result 'Lotus build cache' 'EMPTY' $buildCache 'No cache yet - normal if you have not compiled recently.'
}

# ---- 5. Windows Defender exclusions ----
try {
    $prefs = Get-MpPreference -ErrorAction Stop
    $excludedPaths = @($prefs.ExclusionPath)
    $excludedProcs = @($prefs.ExclusionProcess)
    $lotusExcluded = $excludedPaths | Where-Object {
        $_ -like '*Lotus IDE*' -or $_ -like '*esp32*' -or $_ -like '*arduino-cli*'
    }
    $gccExcluded = $excludedProcs | Where-Object { $_ -like '*xtensa*' -or $_ -like '*esp32*' }
    if ($lotusExcluded -or $gccExcluded) {
        Add-Result 'Defender exclusion (Lotus)' 'OK' (($lotusExcluded + $gccExcluded) -join '; ')
    } else {
        Add-Result 'Defender exclusion (Lotus)' 'WARN' 'No exclusion for Lotus/esp32/arduino-cli paths' `
            ('If compile is very slow (>3 min for small sketch), add: Add-MpPreference -ExclusionPath "' + $cliData + '"  (run as Administrator)')
    }
    if ($prefs.DisableRealtimeMonitoring) {
        Add-Result 'Defender realtime'        'OFF' 'Real-time protection disabled'
    } else {
        Add-Result 'Defender realtime'        'ON'  'Real-time scanning active - slows compile if no exclusion'
    }
} catch {
    Add-Result 'Defender' 'UNAVAILABLE' 'Get-MpPreference failed (third-party AV in use?)' `
        'If you use Kaspersky/Avast/Norton: add exclusion for the arduino-cli data folder in that product.'
}

# ---- 6. Long path support ----
try {
    $lp = Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -ErrorAction Stop
    if ($lp.LongPathsEnabled -eq 1) {
        Add-Result 'Windows long paths' 'OK' 'LongPathsEnabled=1'
    } else {
        Add-Result 'Windows long paths' 'DISABLED' 'LongPathsEnabled=0' `
            'Enable: New-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWord -Force  (run as Administrator, then reboot)'
    }
} catch {
    Add-Result 'Windows long paths' 'WARN' 'LongPathsEnabled key absent (defaults to 0)' `
        'See "Windows long paths" above - same fix.'
}

# Lotus userData path depth (ESP32 needs ~200 chars of overhead under the data dir)
$depth = $cliData.Length
if ($depth -gt 80) {
    Add-Result 'userData path depth' 'WARN' ("$depth chars: " + $cliData) `
        'ESP32 SDK paths get deep. Long paths must be enabled OR install Lotus IDE somewhere short like C:\Lotus.'
} else {
    Add-Result 'userData path depth' 'OK' ("$depth chars")
}

# ---- 7. CH340 driver ----
try {
    $ch340 = Get-PnpDevice -Class Ports -ErrorAction SilentlyContinue |
        Where-Object { $_.FriendlyName -like '*CH340*' -or $_.FriendlyName -like '*USB-SERIAL*' }
    $cp210 = Get-PnpDevice -Class Ports -ErrorAction SilentlyContinue |
        Where-Object { $_.FriendlyName -like '*CP210*' }
    $all = @($ch340) + @($cp210) | Where-Object { $_ }
    if ($all.Count -gt 0) {
        Add-Result 'USB-Serial driver' 'OK' (($all | ForEach-Object { $_.FriendlyName }) -join ', ')
    } else {
        $anyPort = Get-PnpDevice -Class Ports -ErrorAction SilentlyContinue
        if ($anyPort.Count -gt 0) {
            Add-Result 'USB-Serial driver' 'INFO' (($anyPort | ForEach-Object { $_.FriendlyName }) -join ', ') `
                'No CH340/CP210x detected - if your board uses one, plug it in and re-run.'
        } else {
            Add-Result 'USB-Serial driver' 'INFO' 'No serial ports detected' `
                'Plug in the board first, then re-run (upload step needs this).'
        }
    }
} catch {
    Add-Result 'USB-Serial driver' 'UNKNOWN' 'PnP query failed' ''
}

# ---- Report ----
Write-Host ''
Write-Host '------ Results ------' -ForegroundColor Cyan
foreach ($r in $results) {
    $color = switch ($r.Status) {
        'OK'         { 'Green' }
        'MISSING'    { 'Red' }
        'PARTIAL'    { 'Red' }
        'STALE'      { 'Yellow' }
        'LARGE'      { 'Yellow' }
        'WARN'       { 'Yellow' }
        'DISABLED'   { 'Yellow' }
        'OFF'        { 'Yellow' }
        'ON'         { 'Gray' }
        default      { 'Gray' }
    }
    Write-Host ('  [{0,-9}] {1}' -f $r.Status, $r.Check) -ForegroundColor $color
    if ($r.Detail) { Write-Host ('             {0}' -f $r.Detail) -ForegroundColor Gray }
}

# ---- Suggested fixes ----
$fixes = $results | Where-Object { $_.Fix }
if ($fixes.Count -gt 0) {
    Write-Host ''
    Write-Host '------ Suggested fixes ------' -ForegroundColor Cyan
    foreach ($r in $fixes) {
        Write-Host ('  > {0}' -f $r.Check) -ForegroundColor Yellow
        Write-Host ('    {0}' -f $r.Fix) -ForegroundColor Gray
    }
}

Write-Host ''
Write-Host 'Save this output and send to support if problem persists.' -ForegroundColor Cyan
Write-Host ''
