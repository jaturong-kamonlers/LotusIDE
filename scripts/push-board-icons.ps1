#requires -Version 5.1
$ErrorActionPreference = 'Stop'

# Push the staged 96x72 board icons up to jaturong-kamonlers/lotus-boards/icons/.
# Overwrites the existing 200xN icons in place (filenames unchanged so
# catalog.json's icon URL stays valid).

if (-not $env:GH_TOKEN) { throw 'GH_TOKEN not set' }
$owner = 'jaturong-kamonlers'
$repo  = 'lotus-boards'
$stage = Join-Path $env:TEMP 'lotus-catalog-stage\board-icons'
if (-not (Test-Path $stage)) { throw "stage missing: $stage  (run make-board-icons.ps1 first)" }

$headers = @{
    Authorization = "Bearer $($env:GH_TOKEN)"
    'User-Agent' = 'lotus-catalog-publisher'
    Accept = 'application/vnd.github+json'
}

function Get-FileSha($path) {
    try {
        $r = Invoke-RestMethod -Method GET -Uri "https://api.github.com/repos/$owner/$repo/contents/$path" -Headers $headers
        return $r.sha
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 404) { return $null }
        throw
    }
}

function Put-File($path, $localPath, $message) {
    $bytes = [System.IO.File]::ReadAllBytes($localPath)
    $b64 = [Convert]::ToBase64String($bytes)
    $sha = Get-FileSha $path
    $body = @{ message=$message; content=$b64; branch='main' }
    if ($sha) { $body.sha = $sha }
    $json = $body | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Method PUT -Uri "https://api.github.com/repos/$owner/$repo/contents/$path" -Headers $headers -Body $json -ContentType 'application/json' | Out-Null
}

foreach ($f in Get-ChildItem $stage -Filter '*.jpg') {
    $remotePath = 'icons/' + $f.Name
    Write-Host ("  + {0}  ({1} KB)" -f $remotePath, [Math]::Round($f.Length/1KB, 1))
    Put-File $remotePath $f.FullName ("Compress " + $f.BaseName + " icon to 96x72 for fast Available-tab loading")
}

Write-Host ''
Write-Host 'Done. Verify a sample:' -ForegroundColor Green
Write-Host '  https://raw.githubusercontent.com/jaturong-kamonlers/lotus-boards/main/icons/LotusDevkit.jpg'
