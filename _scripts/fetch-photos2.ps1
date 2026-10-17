$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"
$base = "C:\Users\Kirill\blyuda-narodov-rossii"
$prev = Join-Path $base "_staging\preview2"
New-Item -ItemType Directory -Force -Path $prev | Out-Null
$ua = "SchoolProject-SiteBuilder/1.0 (school research project)"
$log = Join-Path $base "_staging\photos-report2.txt"
$report = New-Object System.Collections.Generic.List[string]

$jobs = Get-Content (Join-Path $base "_staging\jobs2.json") -Raw -Encoding UTF8 | ConvertFrom-Json

function Sleep-Api { Start-Sleep -Milliseconds (3000 + (Get-Random -Maximum 1500)) }
function Api-Get($url) {
  for ($i = 0; $i -lt 4; $i++) {
    Sleep-Api
    try { return Invoke-RestMethod -Uri $url -UserAgent $ua -Headers @{ "Accept" = "application/json" } }
    catch {
      if ($_.Exception.Message -match '429') { Start-Sleep -Seconds 20; continue }
      throw
    }
  }
  throw "429 persists"
}

$skip = '(?i)(icon|logo|symbol|commons|wiki|edit|padlock|question|stub|star|emblem|coat|flag|diagram|banknote|stamp)'
$badExt = '(?i)\.(svg|gif|tif|tiff|webm|ogv|pdf)$'

foreach ($j in $jobs) {
  $titles = New-Object System.Collections.Generic.List[string]

  # 1. images from Russian Wikipedia articles
  foreach ($wt in @($j.wiki)) {
    if (-not $wt) { continue }
    try {
      $u = "https://ru.wikipedia.org/w/api.php?action=query&format=json&titles=" + [uri]::EscapeDataString($wt) + "&prop=images&imlimit=60"
      $r = Api-Get $u
      if ($r.query.pages) {
        foreach ($p in $r.query.pages.PSObject.Properties.Value) {
          foreach ($im in $p.images) {
            $t = [string]$im.title
            if ($t -match $skip -or $t -match $badExt) { continue }
            if ($t -notmatch '^(File|.)') { continue }
            $t = 'File:' + ($t -replace '^[^:]+:\s*', '')
            if (-not ($titles -contains $t)) { $titles.Add($t) }
          }
        }
      }
    } catch { $report.Add("$($j.id) | WIKI $wt | ERROR $($_.Exception.Message)") }
  }

  # 2. Commons categories
  foreach ($ct in @($j.cats)) {
    if (-not $ct) { continue }
    try {
      $u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&list=categorymembers&cmtitle=" + [uri]::EscapeDataString($ct) + "&cmtype=file&cmlimit=40"
      $r = Api-Get $u
      if ($r.query.categorymembers) {
        foreach ($m in $r.query.categorymembers) {
          $t = [string]$m.title
          if ($t -match $skip -or $t -match $badExt) { continue }
          if (-not ($titles -contains $t)) { $titles.Add($t) }
        }
      }
    } catch { $report.Add("$($j.id) | CAT $ct | ERROR $($_.Exception.Message)") }
  }

  # 3. Commons search
  foreach ($term in @($j.terms)) {
    if (-not $term) { continue }
    try {
      $u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=" + [uri]::EscapeDataString("filetype:bitmap " + $term) + "&gsrnamespace=6&gsrlimit=8"
      $r = Api-Get $u
      if ($r.query.pages) {
        foreach ($p in ($r.query.pages.PSObject.Properties.Value | Sort-Object index)) {
          $t = [string]$p.title
          if ($t -match $skip -or $t -match $badExt) { continue }
          if (-not ($titles -contains $t)) { $titles.Add($t) }
        }
      }
    } catch { $report.Add("$($j.id) | TERM $term | ERROR $($_.Exception.Message)") }
  }

  $titles = @($titles | Select-Object -First 12)
  if ($titles.Count -eq 0) { $report.Add("$($j.id) | no candidates"); continue }

  $dpath = Join-Path $prev $j.id
  New-Item -ItemType Directory -Force -Path $dpath | Out-Null
  $q = $titles -join "|"
  try {
    $u2 = "https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=" + [uri]::EscapeDataString($q) + "&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=420"
    $r2 = Api-Get $u2
  } catch { $report.Add("$($j.id) | INFO-ERROR $($_.Exception.Message)"); continue }

  $idx = 0
  foreach ($p in $r2.query.pages.PSObject.Properties.Value) {
    $ii = $p.imageinfo | Select-Object -First 1
    if (-not $ii) { continue }
    $idx++
    $thumb = $ii.thumburl
    if (-not $thumb) { $thumb = $ii.url }
    $ext = ".jpg"
    if ($ii.mime -match 'png') { $ext = ".png" }
    $fn = Join-Path $dpath ("" + $idx + $ext)
    try { Invoke-WebRequest -Uri $thumb -UserAgent $ua -OutFile $fn }
    catch { $report.Add("$($j.id) | $idx | DL-FAIL $($p.title)"); continue }
    $artist = ""; $lic = ""
    if ($ii.extmetadata) {
      if ($ii.extmetadata.Artist) { $artist = ([string]$ii.extmetadata.Artist.value) -replace '<[^>]+>', ' ' }
      if ($ii.extmetadata.LicenseShortName) { $lic = [string]$ii.extmetadata.LicenseShortName.value }
    }
    $artist = $artist.Trim()
    if ($artist.Length -gt 50) { $artist = $artist.Substring(0, 50) }
    $report.Add("$($j.id) | $idx | $($p.title) | LIC: $lic | BY: $artist | URL: $($ii.descriptionurl)")
  }
}

[System.IO.File]::WriteAllLines($log, $report, [System.Text.UTF8Encoding]::new($false))
"done2" | Out-File -Encoding utf8 (Join-Path $base "_staging\fetch2-done.txt")
