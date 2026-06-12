#requires -Version 5.1
$ErrorActionPreference = 'Stop'

# Resumes catalog publish after plugin zips were uploaded.
# Uploads board zips + both catalog.json files. Plugin zips are skipped
# (already uploaded by the earlier push run).

if (-not $env:GH_TOKEN) { throw 'GH_TOKEN not set' }
$owner = 'jaturong-kamonlers'
$stage = Join-Path $env:TEMP 'lotus-catalog-stage'

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
    $body = @{ message=$message; content=$b64; branch='main' }
    if ($sha) { $body.sha = $sha }
    $json = $body | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Method PUT -Uri "https://api.github.com/repos/$owner/$repo/contents/$path" -Headers $headers -Body $json -ContentType 'application/json' | Out-Null
}

function Get-Catalog($repo) {
    $r = Invoke-RestMethod -Method GET -Uri "https://api.github.com/repos/$owner/$repo/contents/catalog.json" -Headers $headers
    $clean = $r.content -replace '\s',''
    $bytes = [Convert]::FromBase64String($clean)
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
    return @(($text | ConvertFrom-Json), $r.sha)
}

function Put-Text($repo, $path, $text, $message, $sha) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
    $b64 = [Convert]::ToBase64String($bytes)
    $body = @{ message=$message; content=$b64; branch='main'; sha=$sha }
    $json = $body | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Method PUT -Uri "https://api.github.com/repos/$owner/$repo/contents/$path" -Headers $headers -Body $json -ContentType 'application/json' | Out-Null
}

# ===== Boards (zips not yet uploaded) =====
$boardResults = Get-Content (Join-Path $stage 'board-results.json') -Raw | ConvertFrom-Json
$boardStage = Join-Path $stage 'boards'
Write-Host "Uploading board zips ($($boardResults.Count))" -ForegroundColor Cyan
foreach ($b in $boardResults) {
    $zipLocal = Join-Path $boardStage $b.zipFile
    Write-Host ("  + zip  {0}  -> v{1}" -f $b.zipFile, $b.new)
    Put-File 'lotus-boards' $b.zipFile $zipLocal ("Update {0} to v{1}" -f $b.name, $b.new)
}

# ===== catalog.json files =====
Write-Host 'Updating lotus-plugins/catalog.json' -ForegroundColor Cyan
$pluginResults = Get-Content (Join-Path $stage 'plugin-results.json') -Raw | ConvertFrom-Json
$pair = Get-Catalog 'lotus-plugins'
$cat = $pair[0]; $sha = $pair[1]
foreach ($entry in $cat) {
    $m = $pluginResults | Where-Object { $_.id -eq $entry.id } | Select-Object -First 1
    if ($m) { $entry.version = $m.new }
}
$json = $cat | ConvertTo-Json -Depth 6
Put-Text 'lotus-plugins' 'catalog.json' $json 'Bump catalog versions' $sha
Write-Host '  done' -ForegroundColor Green

Write-Host 'Updating lotus-boards/catalog.json' -ForegroundColor Cyan
$pair = Get-Catalog 'lotus-boards'
$cat = $pair[0]; $sha = $pair[1]
foreach ($entry in $cat) {
    $m = $boardResults | Where-Object { $_.name -eq $entry.id } | Select-Object -First 1
    if ($m) { $entry.version = $m.new }
}
$json = $cat | ConvertTo-Json -Depth 6
Put-Text 'lotus-boards' 'catalog.json' $json 'Bump catalog versions' $sha
Write-Host '  done' -ForegroundColor Green
