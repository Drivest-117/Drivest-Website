param(
  [int]$Port = 4173,
  [switch]$OpenBrowser,
  [ValidateSet("edge", "chrome")]
  [string]$Browser = "edge",
  [switch]$SkipVerification,
  [switch]$SkipScreenshots
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$localPreviewScript = Join-Path $PSScriptRoot "local-preview.ps1"
$captureScript = Join-Path $PSScriptRoot "capture-local-home.ps1"
$verifyScript = Join-Path $PSScriptRoot "verify-generated-site.mjs"
$resultDir = Join-Path $repoRoot "test-results\local-check"

Write-Host "[1/3] Ensuring local preview is running on http://127.0.0.1:$Port/"
if ($OpenBrowser) {
  & $localPreviewScript -Port $Port -OpenBrowser -Browser $Browser
} else {
  & $localPreviewScript -Port $Port
}

if (-not $SkipVerification) {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) {
    throw "node was not found in PATH. It is required for verify-generated-site.mjs."
  }

  Write-Host "[2/3] Running site verification"
  & $node.Source $verifyScript
  if ($LASTEXITCODE -ne 0) {
    throw "verify-generated-site.mjs failed."
  }
} else {
  Write-Host "[2/3] Skipping site verification"
}

if (-not $SkipScreenshots) {
  if (-not (Test-Path $resultDir)) {
    New-Item -ItemType Directory -Path $resultDir -Force | Out-Null
  }

  $desktopShot = Join-Path $resultDir "home-desktop.png"
  $mobileShot = Join-Path $resultDir "home-mobile.png"
  $heroDesktopShot = Join-Path $resultDir "home-hero-desktop.png"
  $heroMobileShot = Join-Path $resultDir "home-hero-mobile.png"

  Write-Host "[3/3] Capturing localhost screenshots"
  & $captureScript -Port $Port -OutputPath $desktopShot -Width 1440 -Height 2200
  & $captureScript -Port $Port -OutputPath $mobileShot -Width 390 -Height 2200
  & $captureScript -Port $Port -OutputPath $heroDesktopShot -Width 1365 -Height 768
  & $captureScript -Port $Port -OutputPath $heroMobileShot -Width 390 -Height 844

  Write-Host "Desktop screenshot: $desktopShot"
  Write-Host "Mobile screenshot:  $mobileShot"
  Write-Host "Hero desktop screenshot: $heroDesktopShot"
  Write-Host "Hero mobile screenshot:  $heroMobileShot"
} else {
  Write-Host "[3/3] Skipping screenshots"
}

Write-Host "Localhost check complete."
