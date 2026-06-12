#requires -Version 5.1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# Generate a small icon.jpg per board from static/display.*.
#   - Fit-inside box: 96 x 72 (preserves aspect ratio)
#   - JPEG quality: 75
# Output:
#   - public/boards/<id>/static/icon.jpg  (bundled with board)
#   - %TEMP%/lotus-catalog-stage/board-icons/<id>.jpg  (for catalog push)

$BOX_W = 96
$BOX_H = 72
$JPEG_QUALITY = 75

$repo = 'C:\LotusIDE'
$stage = Join-Path $env:TEMP 'lotus-catalog-stage'
$iconStage = Join-Path $stage 'board-icons'
New-Item -ItemType Directory -Force -Path $iconStage | Out-Null

# Build a JPEG encoder with our quality setting
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$qualityParam = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]$JPEG_QUALITY)
$encParams.Param[0] = $qualityParam

$results = @()
foreach ($d in Get-ChildItem (Join-Path $repo 'public\boards') -Directory | Where-Object { $_.Name -like 'Lotus*' }) {
    $src = $null
    foreach ($ext in @('jpg','png','jpeg')) {
        $candidate = Join-Path $d.FullName ("static\display.$ext")
        if (Test-Path $candidate) { $src = $candidate; break }
    }
    if (-not $src) { Write-Warning "no display.* in $($d.Name)"; continue }

    $img = [System.Drawing.Image]::FromFile($src)
    try {
        # Fit-inside scaling (preserve aspect)
        $scale = [Math]::Min($BOX_W / $img.Width, $BOX_H / $img.Height)
        $newW = [int][Math]::Round($img.Width  * $scale)
        $newH = [int][Math]::Round($img.Height * $scale)

        $bmp = New-Object System.Drawing.Bitmap($newW, $newH, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        # Solid white background — JPEG is opaque; this matches the displays
        $g.Clear([System.Drawing.Color]::White)
        $g.DrawImage($img, 0, 0, $newW, $newH)
        $g.Dispose()

        $localOut = Join-Path $d.FullName 'static\icon.jpg'
        $stageOut = Join-Path $iconStage ($d.Name + '.jpg')
        $bmp.Save($localOut, $jpegCodec, $encParams)
        $bmp.Save($stageOut, $jpegCodec, $encParams)
        $bmp.Dispose()

        $sizeKB = [Math]::Round((Get-Item $localOut).Length / 1KB, 1)
        $results += [PSCustomObject]@{
            name = $d.Name; size = ("{0}x{1}" -f $newW, $newH); bytes = "$sizeKB KB"
        }
    } finally {
        $img.Dispose()
    }
}

$results | Format-Table -AutoSize
Write-Host ''
Write-Host ("Local icons: " + (Join-Path $repo 'public\boards\<id>\static\icon.jpg')) -ForegroundColor Yellow
Write-Host ("Stage:       " + $iconStage) -ForegroundColor Yellow
