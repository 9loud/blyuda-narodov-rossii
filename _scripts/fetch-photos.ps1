$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"
$base = "C:\Users\Kirill\blyuda-narodov-rossii"
$prev = Join-Path $base "_staging\preview"
New-Item -ItemType Directory -Force -Path $prev | Out-Null
$ua = "SchoolProject-SiteBuilder/1.0 (school research project)"
$log = Join-Path $base "_staging\photos-report.txt"
$report = New-Object System.Collections.Generic.List[string]

$dishes = @(
  @{ id="shchi";       terms=@("Shchi soup", "щи суп") },
  @{ id="pelmeni";     terms=@("Pelmeni dumplings", "пельмени") },
  @{ id="blini";       terms=@("Russian blini", "блины") },
  @{ id="echpochmak";  terms=@("Echpochmak", "Эчпочмак") },
  @{ id="chakchak";    terms=@("Chak-chak", "чак-чак") },
  @{ id="gubadiya";    terms=@("Гөбәдия", "Gubadiya", "губадия") },
  @{ id="beshbarmak";  terms=@("Beshbarmak", "бешбармак") },
  @{ id="kazy";        terms=@("Казы", "Kazy horse meat", "horse meat sausage") },
  @{ id="kumys";       terms=@("Kumys", "кумыс", "koumiss") },
  @{ id="oset_pies";   terms=@("Ossetian pie", "осетинские пироги") },
  @{ id="dzykka";      terms=@("Дзыкка", "Dzykka", "осетинская кухня", "Ossetian cuisine") },
  @{ id="osset_third"; terms=@("Цывзыцы", "Tsyvzytsy", "лывза", "физонæг", "Ossetian beer") },
  @{ id="buuzy";       terms=@("Buuzy", "позы", "позы бурятские") },
  @{ id="shulen";      terms=@("Шулэн", "Shulen", "бурятский суп", "Buryat cuisine") },
  @{ id="huushuur";    terms=@("Khuushuur", "хушууры", "бурятская кухня") },
  @{ id="stroganina";  terms=@("Stroganina", "строганина") },
  @{ id="kerchekh";    terms=@("Керчэх", "Кёрчэх", "иэдьэгэй", "якутская кухня", "Yakut cuisine") },
  @{ id="salamat";     terms=@("Саламат якутский", "якутский саламат", "саламат") }
)

function Sleep-Api { Start-Sleep -Milliseconds 1600 }
function Api-Get($url) { Sleep-Api; return Invoke-RestMethod -Uri $url -UserAgent $ua -Headers @{ "Accept" = "application/json" } }

$skip = '(?i)(icon|logo|mural|sign|book|ingredient|diagram|schema|coat of arms|flag|portrait|screenshot|emblem)'

foreach ($d in $dishes) {
  $titles = New-Object System.Collections.Generic.List[string]
  foreach ($t in $d.terms) {
    if ($titles.Count -ge 6) { break }
    $u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=" + [uri]::EscapeDataString("filetype:bitmap " + $t) + "&gsrnamespace=6&gsrlimit=10"
    try { $j = Api-Get $u } catch { $report.Add("$($d.id) | term=$t | ERROR $($_.Exception.Message)"); continue }
    if ($j.query.pages) {
      foreach ($p in ($j.query.pages.PSObject.Properties.Value | Sort-Object index)) {
        $title = [string]$p.title
        if ($title -match $skip) { continue }
        if (-not ($titles -contains $title)) { $titles.Add($title) }
        if ($titles.Count -ge 6) { break }
      }
    }
  }
  if ($titles.Count -eq 0) { $report.Add("$($d.id) | НЕТ КАНДИДАТОВ"); continue }

  $dpath = Join-Path $prev $d.id
  New-Item -ItemType Directory -Force -Path $dpath | Out-Null

  $q = $titles -join "|"
  $u2 = "https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=" + [uri]::EscapeDataString($q) + "&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=420"
  try { $j2 = Api-Get $u2 } catch { $report.Add("$($d.id) | INFO-ERROR $($_.Exception.Message)"); continue }

  $idx = 0
  foreach ($p in $j2.query.pages.PSObject.Properties.Value) {
    $ii = $p.imageinfo | Select-Object -First 1
    if (-not $ii) { continue }
    $idx++
    $thumb = $ii.thumburl
    if (-not $thumb) { $thumb = $ii.url }
    $ext = ".jpg"
    if ($ii.mime -match 'png') { $ext = ".png" }
    $fn = Join-Path $dpath ("" + $idx + $ext)
    try {
      Invoke-WebRequest -Uri $thumb -UserAgent $ua -OutFile $fn
    } catch {
      $report.Add("$($d.id) | $idx | DL-FAIL $($p.title) :: $($_.Exception.Message)")
      continue
    }
    $artist = ""
    $lic = ""
    if ($ii.extmetadata) {
      if ($ii.extmetadata.Artist) { $artist = ([string]$ii.extmetadata.Artist.value) -replace '<[^>]+>', ' ' }
      if ($ii.extmetadata.LicenseShortName) { $lic = [string]$ii.extmetadata.LicenseShortName.value }
    }
    $artist = $artist.Trim()
    if ($artist.Length -gt 50) { $artist = $artist.Substring(0, 50) }
    $report.Add("$($d.id) | $idx | $($p.title) | LIC: $lic | BY: $artist | URL: $($ii.descriptionurl)")
  }
}

[System.IO.File]::WriteAllLines($log, $report, [System.Text.UTF8Encoding]::new($false))
"done $(Get-Date -Format 'HH:mm:ss')" | Out-File -Encoding utf8 (Join-Path $base "_staging\fetch-done.txt")
