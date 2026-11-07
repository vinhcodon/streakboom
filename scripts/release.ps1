<#
.SYNOPSIS
  Build a signed Windows installer and the update manifest (latest.json) for a release.

.DESCRIPTION
  1. Builds the NSIS installer, signed with the updater key (so installed apps accept it).
  2. Writes dist\latest.json pointing at the GitHub release asset.
  3. Copies the installer to dist\.
  Then you create a GitHub release tagged v<version> and upload BOTH files from dist\
  (the installer and latest.json). The app reads
  https://github.com/<Repo>/releases/latest/download/latest.json

  UPDATE_URL in app\src-tauri\src\updater.rs must point at that address (it already does for
  vinhcodon/streakboom). A release is built from the code in this folder, so commit first.

.PARAMETER Repo   GitHub "owner/name" that hosts the releases.
.PARAMETER Notes  Release notes shown in the update info (optional).
.PARAMETER KeyPath Updater private key (default: ~\.tauri\streakboom-updater.key).

.EXAMPLE
  .\scripts\release.ps1 -Repo someone/streakboom -Notes "Fixes the bubble position"
#>
param(
  [Parameter(Mandatory = $true)][string]$Repo,
  [string]$Notes = "",
  [string]$KeyPath = (Join-Path $env:USERPROFILE ".tauri\streakboom-updater.key")
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$app = Join-Path $root "app"
if (-not (Test-Path $KeyPath)) { throw "Signing key not found: $KeyPath" }

$conf = Get-Content (Join-Path $app "src-tauri\tauri.conf.json") -Raw | ConvertFrom-Json
$version = $conf.version
$product = $conf.productName

# The private key is passed by path and never printed. It has no password.
$env:TAURI_SIGNING_PRIVATE_KEY = $KeyPath
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
# Reuse a shared compiled-dependency cache if this machine has one (spike\src-tauri\target);
# otherwise Cargo uses app\src-tauri\target.
$cache = Join-Path $root "spike\src-tauri\target"
if (-not $env:CARGO_TARGET_DIR) {
  $env:CARGO_TARGET_DIR = if (Test-Path $cache) { $cache } else { Join-Path $app "src-tauri\target" }
}

Push-Location $app
try { npm run tauri build -- --bundles nsis } finally { Pop-Location }

$bundle = Join-Path $env:CARGO_TARGET_DIR "release\bundle\nsis"
$exeName = "${product}_${version}_x64-setup.exe"
$exe = Join-Path $bundle $exeName
$sig = "$exe.sig"
if (-not (Test-Path $exe) -or -not (Test-Path $sig)) { throw "Build did not produce $exeName and its .sig in $bundle" }

$dist = Join-Path $root "dist"
New-Item -ItemType Directory -Force $dist | Out-Null
Copy-Item $exe $dist -Force

$manifest = [ordered]@{
  version  = $version
  notes    = $Notes
  pub_date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  platforms = [ordered]@{
    "windows-x86_64" = [ordered]@{
      signature = (Get-Content $sig -Raw).Trim()
      url       = "https://github.com/$Repo/releases/download/v$version/$exeName"
    }
  }
}
# UTF-8 WITHOUT a byte-order mark: Windows PowerShell's "-Encoding utf8" adds one, and the
# updater's JSON parser rejects it.
[System.IO.File]::WriteAllText((Join-Path $dist "latest.json"), ($manifest | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))

Write-Host ""
Write-Host "Done. Upload these two files to a GitHub release tagged v$version :"
Write-Host "  $(Join-Path $dist $exeName)"
Write-Host "  $(Join-Path $dist 'latest.json')"
