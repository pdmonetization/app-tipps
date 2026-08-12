# fetch-media.ps1
#
# Downloads the 994 images still used by App-Tipps articles from the old
# WordPress server into public/images/, keeping the 2023/05/... folder structure
# that the Markdown files expect.
#
# Run from the repo folder in any PowerShell window:
#     .\fetch-media.ps1
#
# Safe to re-run: files already downloaded are skipped, so if it stops halfway
# just run it again.

param(
    [string]$Dest = "public\images",
    [string]$List = "images.txt"
)

$ProgressPreference = 'SilentlyContinue'   # Invoke-WebRequest is ~10x faster without the progress bar
$Base = 'https://app-tipps.com/wp-content/uploads/'

if (-not (Test-Path $List)) {
    Write-Host "Cannot find $List. Run this from the folder that contains images.txt." -ForegroundColor Red
    exit 1
}

$paths = Get-Content $List | Where-Object { $_.Trim() -ne '' }
$total = $paths.Count
Write-Host "Downloading $total images into $Dest" -ForegroundColor Cyan

$missing = New-Object System.Collections.Generic.List[string]
$skipped = 0
$got     = 0
$i       = 0

foreach ($p in $paths) {
    $i++
    $out = Join-Path $Dest ($p -replace '/', '\')
    $dir = Split-Path $out -Parent

    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    if (Test-Path $out) { $skipped++; continue }

    try {
        Invoke-WebRequest -Uri ($Base + $p) -OutFile $out -UseBasicParsing -TimeoutSec 45
        $got++
    }
    catch {
        $missing.Add($p)
        if (Test-Path $out) { Remove-Item $out -Force }
    }

    if ($i % 50 -eq 0) {
        Write-Host ("  {0} / {1}   downloaded {2}, missing {3}" -f $i, $total, $got, $missing.Count)
    }
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "  downloaded : $got"
Write-Host "  already had: $skipped"
Write-Host "  missing    : $($missing.Count)"

if ($missing.Count -gt 0) {
    $missing | Set-Content 'missing-images.txt'
    Write-Host ""
    Write-Host "The old server no longer has $($missing.Count) file(s). List written to missing-images.txt." -ForegroundColor Yellow
    Write-Host "A small number is normal. Anything over ~50 means the old server may be rate-limiting you -" -ForegroundColor Yellow
    Write-Host "wait a few minutes and run this script again; it will only retry what is missing." -ForegroundColor Yellow
}
