param(
  [int]$Port = 4173,
  [switch]$OpenBrowser,
  [ValidateSet("edge", "chrome")]
  [string]$Browser = "edge",
  [switch]$Stop
)

$ErrorActionPreference = "Stop"

function Open-PreviewBrowser {
  param(
    [string]$Browser,
    [string]$Url
  )

  $edgeCandidates = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
  )
  $chromeCandidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
  )

  $candidates = if ($Browser -eq "chrome") { $chromeCandidates } else { $edgeCandidates }
  $browserPath = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1

  if (-not $browserPath) {
    Write-Warning "Could not find $Browser locally. Preview is still running at $Url"
    return
  }

  Start-Process -FilePath $browserPath -ArgumentList $Url
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $repoRoot ".local-preview.pid"
$buildScript = Join-Path $PSScriptRoot "build-site.mjs"
$url = "http://127.0.0.1:$Port/"

if ($Stop) {
  if (-not (Test-Path $pidFile)) {
    Write-Host "No local preview pid file found at $pidFile"
    exit 0
  }

  $savedPid = Get-Content -Raw $pidFile
  if ([string]::IsNullOrWhiteSpace($savedPid)) {
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    Write-Host "Preview pid file was empty and has been removed."
    exit 0
  }

  $process = Get-Process -Id ([int]$savedPid) -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $process.Id
    Write-Host "Stopped local preview server pid $($process.Id)."
  } else {
    Write-Host "Preview server pid $savedPid is not running."
  }

  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
  exit 0
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  throw "node was not found in PATH. It is required for the local site build."
}

Write-Host "Building local site output"
& $node.Source $buildScript
if ($LASTEXITCODE -ne 0) {
  throw "Local site build failed."
}

if (Test-Path $pidFile) {
  $savedPid = Get-Content -Raw $pidFile
  if (-not [string]::IsNullOrWhiteSpace($savedPid)) {
    $existing = Get-Process -Id ([int]$savedPid) -ErrorAction SilentlyContinue
    if ($existing) {
      Write-Host "Local preview already running at $url (pid $($existing.Id))."
      if ($OpenBrowser) {
        Open-PreviewBrowser -Browser $Browser -Url $url
      }
      exit 0
    }
  }

  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

$activePortUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
  Where-Object { $_.State -notin @("TimeWait", "Closed") -and $_.OwningProcess -ne 0 }

if ($activePortUse) {
  throw "Port $Port is already in use by another process. Choose a different -Port."
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
  throw "python was not found in PATH. Install Python or adjust this script to use another local server."
}

$server = Start-Process `
  -FilePath $python.Source `
  -ArgumentList "-m", "http.server", "$Port" `
  -WorkingDirectory $repoRoot `
  -WindowStyle Hidden `
  -PassThru

try {
  $connected = $false
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 300
    try {
      $response = Invoke-WebRequest -UseBasicParsing $url
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        $connected = $true
        break
      }
    } catch {
    }
  }

  if (-not $connected) {
    throw "Local preview server started but did not respond at $url."
  }

  Set-Content -LiteralPath $pidFile -Value $server.Id
  Write-Host "Local preview running at $url"
  Write-Host "Server pid: $($server.Id)"
  Write-Host "Stop it with:"
  Write-Host "  powershell -ExecutionPolicy Bypass -File .\tools\local-preview.ps1 -Stop"

  if ($OpenBrowser) {
    Open-PreviewBrowser -Browser $Browser -Url $url
  }
} catch {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -ErrorAction SilentlyContinue
  }
  throw
}
