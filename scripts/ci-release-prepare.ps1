<#
.SYNOPSIS
  The first step of a release built in CI (ADR-0072, .github/workflows/release.yml): check that the tag, the three version
  files and CHANGELOG.md agree, and write the release notes (the CHANGELOG entry) to a file.
.DESCRIPTION
  It changes nothing in the repository. On failure it prints GitHub error lines and exits 1, so the workflow stops before
  anything is built. When $env:GITHUB_OUTPUT is set it writes `version` and `tag` there for the next steps.
.EXAMPLE
  powershell -NoProfile -File scripts\ci-release-prepare.ps1 -Tag v0.4.1 -NotesPath release-notes.md
#>
param(
  [Parameter(Mandatory = $true)][string]$Tag,
  [string]$NotesPath = "release-notes.md"
)
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "release-lib.ps1")
$root = Split-Path -Parent $PSScriptRoot

$conf = (Get-Content (Join-Path $root "app\src-tauri\tauri.conf.json") -Raw | ConvertFrom-Json).version
$cargo = [regex]::Match((Get-Content (Join-Path $root "app\src-tauri\Cargo.toml") -Raw), '(?m)^version = "([^"]+)"').Groups[1].Value
$pkg = (Get-Content (Join-Path $root "app\package.json") -Raw | ConvertFrom-Json).version

$problems = @(Test-ReleaseVersions -Tag $Tag -Conf $conf -Cargo $cargo -Package $pkg)
$version = $Tag.TrimStart("v")
if ($problems.Count -eq 0) {
  $lines = Get-Content (Join-Path $root "CHANGELOG.md")
  if (-not (Test-ChangelogEntry -Lines $lines -Version $version)) {
    $problems += "CHANGELOG.md has no usable entry for $version (a heading '## $version (YYYY-MM-DD)' and at least one line starting with '- ')"
  } else {
    $entry = Get-ChangelogEntry -Lines $lines -Version $version
    [System.IO.File]::WriteAllText($NotesPath, (($entry -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding($false)))
  }
}

if ($problems.Count -gt 0) {
  foreach ($p in $problems) { Write-Host "::error::$p" }
  exit 1
}
Write-Host "tag ${Tag}, version ${version} - tauri.conf.json, Cargo.toml, package.json and CHANGELOG.md agree; notes in ${NotesPath}"
if ($env:GITHUB_OUTPUT) {
  Add-Content -Path $env:GITHUB_OUTPUT -Value "version=$version"
  Add-Content -Path $env:GITHUB_OUTPUT -Value "tag=$Tag"
}
