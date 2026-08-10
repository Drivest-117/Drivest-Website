param(
  [int]$Port = 4173,
  [switch]$OpenBrowser,
  [ValidateSet("edge", "chrome")]
  [string]$Browser = "edge",
  [int]$DebounceMs = 1200
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$checkScript = Join-Path $PSScriptRoot "check-localhost.ps1"
$sourcePrefix = "drivest-local-watch"
$watchExtensions = @(
  ".html", ".css", ".js", ".mjs", ".json", ".webmanifest",
  ".png", ".jpg", ".jpeg", ".svg", ".webp", ".ico", ".txt", ".xml"
)
$ignoreFragments = @(
  "\.git\",
  "\.vercel\",
  "\node_modules\",
  "\test-results\",
  "\output\",
  "\__pycache__\"
)

function Test-WatchedPath {
  param([string]$Path)

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $false
  }

  $normalized = $Path.Replace("/", "\")
  foreach ($fragment in $ignoreFragments) {
    if ($normalized -like "*$fragment*") {
      return $false
    }
  }

  if ($normalized -like "*\.local-preview.pid") {
    return $false
  }

  $extension = [System.IO.Path]::GetExtension($normalized)
  return $watchExtensions -contains $extension.ToLowerInvariant()
}

Write-Host "Starting localhost watch loop from $repoRoot"
& $checkScript -Port $Port -OpenBrowser:$OpenBrowser -Browser $Browser

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $repoRoot
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]'FileName, LastWrite, Size, DirectoryName'
$watcher.EnableRaisingEvents = $true

$sourceIdentifiers = @(
  "$sourcePrefix.changed",
  "$sourcePrefix.created",
  "$sourcePrefix.deleted",
  "$sourcePrefix.renamed"
)

$registrations = @(
  (Register-ObjectEvent -InputObject $watcher -EventName Changed -SourceIdentifier $sourceIdentifiers[0])
  (Register-ObjectEvent -InputObject $watcher -EventName Created -SourceIdentifier $sourceIdentifiers[1])
  (Register-ObjectEvent -InputObject $watcher -EventName Deleted -SourceIdentifier $sourceIdentifiers[2])
  (Register-ObjectEvent -InputObject $watcher -EventName Renamed -SourceIdentifier $sourceIdentifiers[3])
)

$pending = $false
$lastChangeAt = Get-Date
$changedPaths = [System.Collections.Generic.Dictionary[string, bool]]::new()

Write-Host "Watching for local changes. Press Ctrl+C to stop the watcher. The localhost server stays up until you stop it separately."

try {
  while ($true) {
    $event = Wait-Event -Timeout 1
    if ($event) {
      $eventArgs = $event.SourceEventArgs
      $candidatePaths = @()

      if ($eventArgs.PSObject.Properties.Name -contains "FullPath") {
        $candidatePaths += $eventArgs.FullPath
      }
      if ($eventArgs.PSObject.Properties.Name -contains "OldFullPath") {
        $candidatePaths += $eventArgs.OldFullPath
      }

      foreach ($path in $candidatePaths | Where-Object { $_ }) {
        if (Test-WatchedPath -Path $path) {
          $pending = $true
          $lastChangeAt = Get-Date
          $changedPaths[$path] = $true
          $relative = $path.Replace($repoRoot, ".").TrimStart("\")
          Write-Host "Queued change: $relative"
        }
      }

      Remove-Event -EventIdentifier $event.EventIdentifier -ErrorAction SilentlyContinue
    }

    if ($pending -and ((Get-Date) - $lastChangeAt).TotalMilliseconds -ge $DebounceMs) {
      $pending = $false
      $batch = $changedPaths.Keys | Sort-Object
      $changedPaths.Clear()

      Write-Host ""
      Write-Host "Rechecking localhost after changes:"
      foreach ($path in $batch) {
        $relative = $path.Replace($repoRoot, ".").TrimStart("\")
        Write-Host " - $relative"
      }

      try {
        & $checkScript -Port $Port -Browser $Browser
      } catch {
        Write-Warning $_.Exception.Message
      }

      Write-Host ""
      Write-Host "Watching for more changes..."
    }
  }
} finally {
  foreach ($sourceIdentifier in $sourceIdentifiers) {
    Unregister-Event -SourceIdentifier $sourceIdentifier -ErrorAction SilentlyContinue
  }

  foreach ($registration in $registrations) {
    if ($registration) {
      Remove-Job -Id $registration.Id -Force -ErrorAction SilentlyContinue
    }
  }

  $watcher.EnableRaisingEvents = $false
  $watcher.Dispose()
}
