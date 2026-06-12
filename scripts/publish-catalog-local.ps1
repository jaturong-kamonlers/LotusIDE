#requires -Version 5.1
$ErrorActionPreference = 'Stop'

# Step A of catalog republish:
#   - bump minor version in 15 plugins-converted/*/lotus-plugin.json
#   - bump minor version in 6 public/boards/Lotus*/config.js
#   - re-zip plugins in-place (overwrite plugins-converted/*.zip)
#   - re-zip boards into $stage/boards/ for the push step
# Local-only, reversible. No GitHub calls.

$repo  = 'C:\LotusIDE'
$stage = Join-Path $env:TEMP 'lotus-catalog-stage'
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
$pluginStage = Join-Path $stage 'plugins'
$boardStage  = Join-Path $stage 'boards'
New-Item -ItemType Directory -Force -Path $pluginStage, $boardStage | Out-Null

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Bump-Minor([string]$ver) {
    $p = $ver.Split('.')
    return ('{0}.{1}.0' -f $p[0], ([int]$p[1] + 1))
}

# ===== Plugins =====
$pluginResults = @()
$pluginsDir = Join-Path $repo 'plugins-converted'
foreach ($d in Get-ChildItem -Directory $pluginsDir | Where-Object { $_.Name -like 'Lotus*' }) {
    $manifestPath = Join-Path $d.FullName 'lotus-plugin.json'
    $text = [System.IO.File]::ReadAllText($manifestPath, $utf8NoBom)
    if ($text -match '"version"\s*:\s*"(\d+\.\d+\.\d+)"') {
        $oldVer = $matches[1]
        $newVer = Bump-Minor $oldVer
        $text = $text -replace '("version"\s*:\s*")(\d+\.\d+\.\d+)(")', "`${1}$newVer`${3}"
        [System.IO.File]::WriteAllText($manifestPath, $text, $utf8NoBom)

        $zipPath = Join-Path $pluginsDir ($d.Name + '.zip')
        if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
        Compress-Archive -Path (Join-Path $d.FullName '*') -DestinationPath $zipPath

        Copy-Item $zipPath (Join-Path $pluginStage ($d.Name + '.zip'))

        # Read id for catalog update
        $manifest = $text | ConvertFrom-Json
        $pluginResults += [PSCustomObject]@{
            name = $d.Name; id = $manifest.id; old = $oldVer; new = $newVer
            zipFile = ($d.Name + '.zip')
        }
    } else {
        Write-Warning "No version line in $manifestPath"
    }
}

# ===== Boards =====
$boardResults = @()
$boardsDir = Join-Path $repo 'public\boards'
foreach ($d in Get-ChildItem -Directory $boardsDir | Where-Object { $_.Name -like 'Lotus*' }) {
    $configPath = Join-Path $d.FullName 'config.js'
    $text = [System.IO.File]::ReadAllText($configPath, $utf8NoBom)
    if ($text -match "version\s*[:=]\s*['""](\d+\.\d+\.\d+)['""]") {
        $oldVer = $matches[1]
        $newVer = Bump-Minor $oldVer
        $text = [regex]::Replace($text, "(version\s*[:=]\s*['""])(\d+\.\d+\.\d+)(['""])", "`${1}$newVer`${3}")
        [System.IO.File]::WriteAllText($configPath, $text, $utf8NoBom)

        $zipPath = Join-Path $boardStage ($d.Name + '.zip')
        Compress-Archive -Path (Join-Path $d.FullName '*') -DestinationPath $zipPath -Force

        $boardResults += [PSCustomObject]@{
            name = $d.Name; old = $oldVer; new = $newVer
            zipFile = ($d.Name + '.zip')
        }
    } else {
        Write-Warning "No version line in $configPath"
    }
}

Write-Host ''
Write-Host '== Plugins ==' -ForegroundColor Cyan
$pluginResults | Format-Table -AutoSize
Write-Host '== Boards ==' -ForegroundColor Cyan
$boardResults | Format-Table -AutoSize
Write-Host ''
Write-Host "Stage:      $stage" -ForegroundColor Yellow
Write-Host ("Plugins:    {0} zips ready" -f $pluginResults.Count)
Write-Host ("Boards:     {0} zips ready" -f $boardResults.Count)

# Persist results for Step B (push)
$pluginResults | ConvertTo-Json | Set-Content -Path (Join-Path $stage 'plugin-results.json') -Encoding UTF8
$boardResults  | ConvertTo-Json | Set-Content -Path (Join-Path $stage 'board-results.json')  -Encoding UTF8
