#requires -Version 5.1
$ErrorActionPreference = 'Stop'

# Step B: push staged zips + updated catalog.json to GitHub catalog repos.
# Reads stage from %TEMP%\lotus-catalog-stage\ (produced by publish-catalog-local.ps1).
# Requires $env:GH_TOKEN with `public_repo` (or `repo`) scope on jaturong-kamonlers.

if (-not $env:GH_TOKEN) { throw 'GH_TOKEN not set' }
$owner = 'jaturong-kamonlers'
$stage = Join-Path $env:TEMP 'lotus-catalog-stage'
if (-not (Test-Path $stage)) { throw "stage missing: $stage  (run publish-catalog-local.ps1 first)" }

$headers = @{
    Authorization = "Bearer $($env:GH_TOKEN)"
    'User-Agent' = 'lotus-catalog-publisher'
    Accept = 'application/vnd.github+json'
}

function Get-FileSha($repo, $path) {
    try {
        $r = Invoke-RestMethod -Method GET -Uri "https://api.github.com/repos/$owner/$repo/contents/$path" -Headers $headers
        return $r.sha
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 404) { return $null }
        throw
    }
}

function Put-File($repo, $path, $localPath, $message) {
    $bytes = [System.IO.File]::ReadAllBytes($localPath)
    $b64 = [Convert]::ToBase64String($bytes)
    $sha = Get-FileSha $repo $path
    $body = @{
        message = $message
        content = $b64
        branch  = 'main'
    }
    if ($sha) { $body.sha = $sha }
    $json = $body | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Method PUT -Uri "https://api.github.com/repos/$owner/$repo/contents/$path" -Headers $headers -Body $json -ContentType 'application/json' | Out-Null
}

function Put-Text($repo, $path, $text, $message) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
    $b64 = [Convert]::ToBase64String($bytes)
    $sha = Get-FileSha $repo $path
    $body = @{
        message = $message
        content = $b64
        branch  = 'main'
    }
    if ($sha) { $body.sha = $sha }
    $json = $body | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Method PUT -Uri "https://api.github.com/repos/$owner/$repo/contents/$path" -Headers $headers -Body $json -ContentType 'application/json' | Out-Null
}

function Get-Catalog($repo) {
    $r = Invoke-RestMethod -Method GET -Uri "https://api.github.com/repos/$owner/$repo/contents/catalog.json" -Headers $headers
    $clean = $r.content -replace '\s',''
    $bytes = [Convert]::FromBase64String($clean)
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
    return ($text | ConvertFrom-Json), $r.sha
}

# ===== Plugins =====
$pluginResults = Get-Content (Join-Path $stage 'plugin-results.json') -Raw | ConvertFrom-Json
$pluginStage = Join-Path $stage 'plugins'
Write-Host "Updating jaturong-kamonlers/lotus-plugins ($($pluginResults.Count) entries)" -ForegroundColor Cyan
foreach ($p in $pluginResults) {
    $zipLocal = Join-Path $pluginStage $p.zipFile
    Write-Host ("  + zip  {0}  -> v{1}" -f $p.zipFile, $p.new)
    Put-File 'lotus-plugins' $p.zipFile $zipLocal ("Update {0} to v{1}" -f $p.name, $p.new)
}

Write-Host '  + catalog.json (update plugin versions)'
$catalog, $catSha = Get-Catalog 'lotus-plugins'
foreach ($entry in $catalog) {
    $match = $pluginResults | Where-Object { $_.id -eq $entry.id } | Select-Object -First 1
    if ($match) { $entry.version = $match.new }
}
$catalogJson = $catalog | ConvertTo-Json -Depth 6
Put-Text 'lotus-plugins' 'catalog.json' $catalogJson 'Bump catalog versions'

# ===== Boards =====
$boardResults = Get-Content (Join-Path $stage 'board-results.json') -Raw | ConvertFrom-Json
$boardStage = Join-Path $stage 'boards'
Write-Host "Updating jaturong-kamonlers/lotus-boards ($($boardResults.Count) entries)" -ForegroundColor Cyan
foreach ($b in $boardResults) {
    $zipLocal = Join-Path $boardStage $b.zipFile
    Write-Host ("  + zip  {0}  -> v{1}" -f $b.zipFile, $b.new)
    Put-File 'lotus-boards' $b.zipFile $zipLocal ("Update {0} to v{1}" -f $b.name, $b.new)
}

Write-Host '  + catalog.json (update board versions)'
$catalog, $catSha = Get-Catalog 'lotus-boards'
foreach ($entry in $catalog) {
    $match = $boardResults | Where-Object { $_.name -eq $entry.id } | Select-Object -First 1
    if ($match) { $entry.version = $match.new }
}
$catalogJson = $catalog | ConvertTo-Json -Depth 6
Put-Text 'lotus-boards' 'catalog.json' $catalogJson 'Bump catalog versions'

Write-Host ''
Write-Host 'Done. Verify:' -ForegroundColor Green
Write-Host '  https://raw.githubusercontent.com/jaturong-kamonlers/lotus-plugins/main/catalog.json'
Write-Host '  https://raw.githubusercontent.com/jaturong-kamonlers/lotus-boards/main/catalog.json'
