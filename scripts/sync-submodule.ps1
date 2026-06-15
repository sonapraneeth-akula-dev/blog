<#
.SYNOPSIS
    Manages a git submodule with sparse-checkout.

.DESCRIPTION
    Adds a git repository as a submodule under dependencies/<name> using
    sparse-checkout to sync only specified folders. Supports init, update,
    pull, push, and sparse-checkout path management.

.PARAMETER Action
    The action to perform: init, update, pull, push, add-path, remove-path, list-paths, status

.PARAMETER RepoUrl
    The git repository URL to add as a submodule (required for init, optional otherwise)

.PARAMETER Name
    The submodule name (used as folder name under dependencies/). Defaults to
    the repository name extracted from RepoUrl.

.PARAMETER Path
    The path to add or remove (used with add-path/remove-path actions)

.PARAMETER Branch
    The branch to track (default: main)

.PARAMETER SyncPaths
    Folders to sync via sparse-checkout (default: packages, apps).
    Only used during init.

.EXAMPLE
    # First-time setup (auto-derives name from URL)
    .\scripts\sync-submodule.ps1 -Action init -RepoUrl "https://github.com/org/design-system.git"

    # First-time setup with custom name and branch
    .\scripts\sync-submodule.ps1 -Action init -RepoUrl "https://github.com/org/design-system.git" -Name "ds" -Branch "main-v2"

    # First-time setup with custom sync paths
    .\scripts\sync-submodule.ps1 -Action init -RepoUrl "https://github.com/org/repo.git" -SyncPaths "src","lib"

    # Pull latest changes
    .\scripts\sync-submodule.ps1 -Action pull -Name "design-system"

    # Commit and push submodule changes to remote
    .\scripts\sync-submodule.ps1 -Action push -Name "design-system"

    # Update parent repo's submodule pointer
    .\scripts\sync-submodule.ps1 -Action update -Name "design-system"

    # Add a new folder to sync
    .\scripts\sync-submodule.ps1 -Action add-path -Name "design-system" -Path "docs"

    # Remove a folder from sync
    .\scripts\sync-submodule.ps1 -Action remove-path -Name "design-system" -Path "docs"

    # List currently synced paths
    .\scripts\sync-submodule.ps1 -Action list-paths -Name "design-system"

    # Show submodule status
    .\scripts\sync-submodule.ps1 -Action status -Name "design-system"
#>

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("init", "update", "pull", "push", "add-path", "remove-path", "list-paths", "status")]
  [string]$Action,

  [Parameter(Mandatory = $false)]
  [string]$RepoUrl,

  [Parameter(Mandatory = $false)]
  [string]$Name,

  [Parameter(Mandatory = $false)]
  [string]$Path,

  [Parameter(Mandatory = $false)]
  [string]$Branch = "main",

  [Parameter(Mandatory = $false)]
  [string[]]$SyncPaths = @("packages", "apps")
)

$ErrorActionPreference = "Stop"

# Derive Name from RepoUrl if not provided
if (-not $Name -and $RepoUrl) {
  $Name = [System.IO.Path]::GetFileNameWithoutExtension(($RepoUrl -split '/')[-1])
}

# Validate required parameters
if ($Action -eq "init" -and -not $RepoUrl) {
  throw "RepoUrl is required for init. Use: -RepoUrl 'https://github.com/org/repo.git'"
}
if ($Action -ne "init" -and -not $Name) {
  # Try to auto-detect from .gitmodules if only one submodule exists
  if (Test-Path ".gitmodules") {
    $submodules = @(Select-String -Path ".gitmodules" -Pattern 'path = dependencies/(.+)' |
      ForEach-Object { $_.Matches[0].Groups[1].Value.Trim() })
    if ($submodules.Count -eq 1) {
      $Name = $submodules[0]
    }
    else {
      throw "Name is required when multiple submodules exist. Use: -Name 'submodule-name'"
    }
  }
  else {
    throw "Name is required. Use: -Name 'submodule-name'"
  }
}

$SubmodulePath = "dependencies/$Name"

function Get-SparseCheckoutFilePath {
  # Must be called from within the submodule directory
  $gitDir = git rev-parse --git-dir
  return Join-Path $gitDir "info" "sparse-checkout"
}

function Set-SparseCheckoutPatterns {
  param([string[]]$Paths)
  # Non-cone mode: only listed patterns are checked out.
  # Directory entries use a trailing slash; file entries (e.g. package.json)
  # are written as-is so they match a single file rather than a directory.
  $patterns = @()
  foreach ($p in $Paths) {
    $trimmed = $p.Trim('/')
    if ([string]::IsNullOrWhiteSpace($trimmed)) { continue }
    if ($trimmed -match '\.[^/]+$') {
      # Looks like a file (has an extension in the final segment)
      $patterns += "/$trimmed"
    }
    else {
      $patterns += "/$trimmed/"
    }
  }
  $sparseFile = Get-SparseCheckoutFilePath
  $sparseDir = Split-Path $sparseFile -Parent
  if (-not (Test-Path $sparseDir)) {
    New-Item -ItemType Directory -Path $sparseDir -Force | Out-Null
  }
  $patterns | Set-Content -Path $sparseFile -Encoding utf8
  # Apply the patterns
  git read-tree -mu HEAD
  if ($LASTEXITCODE -ne 0) { throw "Failed to apply sparse-checkout patterns" }
}

function Get-CurrentSyncPaths {
  $sparseFile = Get-SparseCheckoutFilePath
  if (-not (Test-Path $sparseFile)) { return @() }
  $content = Get-Content $sparseFile
  # Extract directory and file paths (lines like /packages/ or /package.json)
  $paths = $content | Where-Object { $_ -match '^/[^*!]' } | ForEach-Object { $_.TrimStart('/').TrimEnd('/') }
  return @($paths)
}

function Write-Step {
  param([string]$Message)
  Write-Host "`n>> $Message" -ForegroundColor Cyan
}

function Write-Success {
  param([string]$Message)
  Write-Host "   $Message" -ForegroundColor Green
}

function Write-Warn {
  param([string]$Message)
  Write-Host "   $Message" -ForegroundColor Yellow
}

function Test-SubmoduleExists {
  return (Test-Path (Join-Path $SubmodulePath ".git")) -or
  (Test-Path ".gitmodules") -and
  ((Get-Content ".gitmodules" -ErrorAction SilentlyContinue) -match [regex]::Escape($SubmodulePath))
}

function Initialize-Submodule {
  Write-Step "Initializing $Name submodule"

  if (Test-SubmoduleExists) {
    Write-Warn "Submodule already exists at $SubmodulePath"
    Write-Host "   Use '-Action update' to pull latest changes" -ForegroundColor Gray
    return
  }

  # Add the submodule
  Write-Step "Adding submodule from $RepoUrl"
  git submodule add --branch $Branch $RepoUrl $SubmodulePath
  if ($LASTEXITCODE -ne 0) { throw "Failed to add submodule" }
  Write-Success "Submodule added"

  # Enable sparse-checkout in the submodule (non-cone mode to exclude root files)
  Write-Step "Configuring sparse-checkout"
  Push-Location $SubmodulePath
  try {
    git sparse-checkout init --no-cone
    if ($LASTEXITCODE -ne 0) { throw "Failed to init sparse-checkout" }

    # Write gitignore-style patterns: include only specified directories
    Set-SparseCheckoutPatterns -Paths $SyncPaths
    Write-Success "Sparse-checkout configured with: $($SyncPaths -join ', ')"
  }
  finally {
    Pop-Location
  }

  # Configure submodule to preserve sparse-checkout on update
  git config -f .gitmodules "submodule.$SubmodulePath.shallow" true
  Write-Success "Submodule configured for shallow clone"

  Write-Host "`n   Synced folders:" -ForegroundColor White
  foreach ($p in $SyncPaths) {
    Write-Host "     - $p" -ForegroundColor White
  }

  Write-Host "`n   Next steps:" -ForegroundColor Gray
  Write-Host "     1. Review changes: git status" -ForegroundColor Gray
  Write-Host "     2. Commit: git add .gitmodules $SubmodulePath" -ForegroundColor Gray
  Write-Host "     3. To add more paths: .\scripts\sync-submodule.ps1 -Action add-path -Name '$Name' -Path 'folder'" -ForegroundColor Gray
}

function Update-Submodule {
  Write-Step "Updating $Name submodule"

  if (-not (Test-SubmoduleExists)) {
    Write-Warn "Submodule not found. Run '-Action init' first."
    return
  }

  # Update the submodule to latest
  git submodule update --remote --merge $SubmodulePath
  if ($LASTEXITCODE -ne 0) { throw "Failed to update submodule" }
  Write-Success "Submodule updated to latest $Branch"

  # Re-apply sparse-checkout (in case it was reset)
  Push-Location $SubmodulePath
  try {
    $currentPaths = Get-CurrentSyncPaths
    if ($currentPaths.Count -gt 0) {
      Write-Success "Sparse-checkout paths preserved: $($currentPaths -join ', ')"
    }
  }
  finally {
    Pop-Location
  }
}

function Add-SyncPath {
  param([string]$NewPath)

  if (-not $NewPath) {
    throw "Path is required. Use: -Action add-path -Path 'folder'"
  }

  if (-not (Test-SubmoduleExists)) {
    Write-Warn "Submodule not found. Run '-Action init' first."
    return
  }

  Write-Step "Adding path '$NewPath' to sparse-checkout"

  Push-Location $SubmodulePath
  try {
    $currentPaths = Get-CurrentSyncPaths
    if ($currentPaths -contains $NewPath) {
      Write-Warn "Path '$NewPath' is already synced"
      return
    }

    $allPaths = $currentPaths + $NewPath
    Set-SparseCheckoutPatterns -Paths $allPaths
    Write-Success "Added '$NewPath' to sparse-checkout"
    Write-Host "   Current paths: $($allPaths -join ', ')" -ForegroundColor White
  }
  finally {
    Pop-Location
  }
}

function Remove-SyncPath {
  param([string]$RemovePath)

  if (-not $RemovePath) {
    throw "Path is required. Use: -Action remove-path -Path 'folder'"
  }

  if (-not (Test-SubmoduleExists)) {
    Write-Warn "Submodule not found. Run '-Action init' first."
    return
  }

  Write-Step "Removing path '$RemovePath' from sparse-checkout"

  Push-Location $SubmodulePath
  try {
    $currentPaths = Get-CurrentSyncPaths
    if ($currentPaths -notcontains $RemovePath) {
      Write-Warn "Path '$RemovePath' is not in sparse-checkout"
      return
    }

    $remaining = $currentPaths | Where-Object { $_ -ne $RemovePath }
    if ($remaining.Count -eq 0) {
      Write-Warn "Cannot remove last path. At least one path must remain."
      return
    }

    Set-SparseCheckoutPatterns -Paths $remaining
    Write-Success "Removed '$RemovePath' from sparse-checkout"
    Write-Host "   Remaining paths: $($remaining -join ', ')" -ForegroundColor White
  }
  finally {
    Pop-Location
  }
}

function Get-SyncPaths {
  if (-not (Test-SubmoduleExists)) {
    Write-Warn "Submodule not found. Run '-Action init' first."
    return
  }

  Write-Step "Currently synced paths"

  Push-Location $SubmodulePath
  try {
    $paths = Get-CurrentSyncPaths
    if ($paths.Count -gt 0) {
      foreach ($p in $paths) {
        Write-Host "   - $p" -ForegroundColor White
      }
    }
    else {
      Write-Warn "No sparse-checkout configured (all files synced)"
    }
  }
  finally {
    Pop-Location
  }
}

function Get-SubmoduleStatus {
  Write-Step "$Name submodule status"

  if (-not (Test-SubmoduleExists)) {
    Write-Warn "Submodule not found. Run '-Action init' first."
    return
  }

  git submodule status $SubmodulePath
  Write-Host ""

  Push-Location $SubmodulePath
  try {
    $branch = git branch --show-current
    $commit = git log -1 --format="%h %s" 2>$null
    Write-Host "   Branch: $branch" -ForegroundColor White
    Write-Host "   Commit: $commit" -ForegroundColor White

    $paths = Get-CurrentSyncPaths
    if ($paths.Count -gt 0) {
      Write-Host "   Synced: $($paths -join ', ')" -ForegroundColor White
    }
  }
  finally {
    Pop-Location
  }
}

function Receive-Submodule {
  Write-Step "Pulling latest changes for $Name submodule"

  if (-not (Test-SubmoduleExists)) {
    Write-Warn "Submodule not found. Run '-Action init' first."
    return
  }

  Push-Location $SubmodulePath
  try {
    $branch = git branch --show-current
    Write-Host "   Pulling from origin/$branch..." -ForegroundColor White
    git pull origin $branch
    if ($LASTEXITCODE -ne 0) { throw "Failed to pull" }
    Write-Success "Pulled latest changes"

    $commit = git log -1 --format="%h %s" 2>$null
    Write-Host "   Latest: $commit" -ForegroundColor White
  }
  finally {
    Pop-Location
  }
}

function Send-Submodule {
  Write-Step "Pushing $Name submodule changes to remote"

  if (-not (Test-SubmoduleExists)) {
    Write-Warn "Submodule not found. Run '-Action init' first."
    return
  }

  Push-Location $SubmodulePath
  try {
    $branch = git branch --show-current
    $status = git status --porcelain
    if (-not $status) {
      Write-Warn "No changes to push in submodule"
      return
    }

    Write-Host "   Changed files:" -ForegroundColor White
    git status --short
    Write-Host ""

    git add -A
    if ($LASTEXITCODE -ne 0) { throw "Failed to stage changes" }

    $commitMsg = Read-Host "   Enter commit message"
    if (-not $commitMsg) {
      Write-Warn "Commit message required. Aborting."
      git reset HEAD -- . | Out-Null
      return
    }

    git commit -m $commitMsg
    if ($LASTEXITCODE -ne 0) { throw "Failed to commit" }

    Write-Host "   Pushing to origin/$branch..." -ForegroundColor White
    git push origin $branch
    if ($LASTEXITCODE -ne 0) { throw "Failed to push" }
    Write-Success "Pushed to origin/$branch"
  }
  finally {
    Pop-Location
  }

  # Update the parent repo's submodule pointer
  Write-Step "Updating parent repo submodule reference"
  git add $SubmodulePath
  Write-Success "Submodule reference updated. Commit the parent repo to record the new pointer."
}

# Main dispatch
switch ($Action) {
  "init" { Initialize-Submodule }
  "update" { Update-Submodule }
  "pull" { Receive-Submodule }
  "push" { Send-Submodule }
  "add-path" { Add-SyncPath -NewPath $Path }
  "remove-path" { Remove-SyncPath -RemovePath $Path }
  "list-paths" { Get-SyncPaths }
  "status" { Get-SubmoduleStatus }
}
