param(
  [int]$Port = 4173,
  [string]$OutputPath = "",
  [int]$Width = 1440,
  [int]$Height = 2200,
  [int]$VirtualTimeBudgetMs = 6000
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $repoRoot = Split-Path -Parent $PSScriptRoot
  $OutputPath = Join-Path $repoRoot "test-results\local-home-preview.png"
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  throw "OutputPath could not be resolved."
}

$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)

$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$edgeCandidates = @(
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)
$edgePath = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $edgePath) {
  throw "Microsoft Edge was not found locally."
}

$url = "http://127.0.0.1:$Port/"
$stdoutFile = [System.IO.Path]::GetTempFileName()
$stderrFile = [System.IO.Path]::GetTempFileName()

try {
  $process = Start-Process `
    -FilePath $edgePath `
    -ArgumentList @(
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--window-size=$Width,$Height",
      "--virtual-time-budget=$VirtualTimeBudgetMs",
      "--screenshot=$OutputPath",
      $url
    ) `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutFile `
    -RedirectStandardError $stderrFile `
    -Wait `
    -PassThru

  $browserOutput = @()
  if (Test-Path $stdoutFile) {
    $browserOutput += Get-Content -LiteralPath $stdoutFile -ErrorAction SilentlyContinue
  }
  if (Test-Path $stderrFile) {
    $browserOutput += Get-Content -LiteralPath $stderrFile -ErrorAction SilentlyContinue
  }

  if ($process.ExitCode -ne 0) {
    if ($browserOutput) {
      $browserOutput | Out-String | Write-Host
    }
    throw "Edge screenshot capture failed for $url"
  }

  if (-not (Test-Path $OutputPath)) {
    if ($browserOutput) {
      $browserOutput | Out-String | Write-Host
    }
    throw "Edge reported success but no screenshot was written to $OutputPath"
  }
} finally {
  Remove-Item -LiteralPath $stdoutFile, $stderrFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Saved local homepage screenshot to $OutputPath"
