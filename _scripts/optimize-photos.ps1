# Optimize dish photos: resize to width <= 1000, re-encode as JPEG.
# PNG files are converted to JPEG (kort.png -> kort.jpg). ASCII-only script!
Add-Type -AssemblyName System.Drawing

$dir = 'C:\Users\Kirill\blyuda-narodov-rossii\assets\img\dishes'
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

function Save-Jpeg($bmp, $outPath, $quality) {
  $enc = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
  $bmp.Save($outPath, $jpegCodec, $enc)
  $enc.Dispose()
}

Get-ChildItem $dir -File | ForEach-Object {
  $f = $_
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  $isPng = $f.Extension -ne '.jpg'
  $isBig = $img.Width -gt 1000
  $isHeavy = $f.Length -gt 340KB
  if (-not ($isPng -or $isBig -or $isHeavy)) {
    "$($f.Name) - skip ($([math]::Round($f.Length/1KB))KB, $($img.Width)x$($img.Height))"
    $img.Dispose()
    return
  }
  $w = $img.Width; $h = $img.Height
  if ($w -gt 1000) { $h = [int]($h * 1000 / $w); $w = 1000 }
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::FromArgb(242, 235, 221))
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, $w, $h)
  $g.Dispose()
  $img.Dispose()
  if ($isPng) {
    $outPath = Join-Path $dir ($f.BaseName + '.jpg')
    Save-Jpeg $bmp $outPath 85
    $bmp.Dispose()
    Remove-Item $f.FullName
    "$($f.Name) -> $(Split-Path $outPath -Leaf) $([math]::Round((Get-Item $outPath).Length/1KB))KB"
  } else {
    $tmp = $f.FullName + '.tmp.jpg'
    Save-Jpeg $bmp $tmp 82
    $bmp.Dispose()
    Move-Item -Force $tmp $f.FullName
    "$($f.Name) - $([math]::Round($f.Length/1KB))KB -> $([math]::Round((Get-Item $f.FullName).Length/1KB))KB"
  }
}
"Done."
