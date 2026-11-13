<#
.SYNOPSIS
  The first step of a release built in CI (ADR-0072, .github/workflows/release.yml): check that the tag, the three version
  files and CHANGELOG.md agree, and write the release notes (the CHANGELOG entry) to a file.
.DESCRIPTION
  It changes nothing in the repository. On failure it prints GitHub error lines and exits 1, so the workflow stops before
  anything is built. When $env:GITHUB_OUTPUT is set it writes `version`, `tag` and `channel` there for the next steps.
  A STABLE tag (even middle number) must equal the version of the three files and have an entry in CHANGELOG.md.
  A PREVIEW tag (odd middle number, ADR-0090) is built from main, whose files still say the last Stable: the version must be
  greater than that, the notes come from CHANGELOG-preview.md, and the Preview version is written into the files of THIS
  build folder only (never committed), so that the app, its manifest and the installer all carry it. -Root is the repository
  (default: this one); it exists so that the script can be tried on a copy.
.EXAMPLE
  powershell -NoProfile -File scripts\ci-release-prepare.ps1 -Tag v0.4.1 -NotesPath release-notes.md
#>
param(
  [Parameter(Mandatory = $true)][string]$Tag,
  [string]$NotesPath = "release-notes.md",
  [string]$Root = ""
)
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "release-lib.ps1")
$root = if ($Root) { $Root } else { Split-Path -Parent $PSScriptRoot }

$conf = (Get-Content (Join-Path $root "app\src-tauri\tauri.conf.json") -Raw | ConvertFrom-Json).version
$cargo = [regex]::Match((Get-Content (Join-Path $root "app\src-tauri\Cargo.toml") -Raw), '(?m)^version = "([^"]+)"').Groups[1].Value
$pkg = (Get-Content (Join-Path $root "app\package.json") -Raw | ConvertFrom-Json).version

$version = $Tag.TrimStart("v")
$channel = Get-ReleaseChannel -Version $version
if ($channel -eq "preview") {
  $problems = @(Test-PreviewVersion -Tag $Tag -Base $conf)
  $changelogFile = "CHANGELOG-preview.md"
} else {
  $problems = @(Test-ReleaseVersions -Tag $Tag -Conf $conf -Cargo $cargo -Package $pkg)
  $changelogFile = "CHANGELOG.md"
}
if ($problems.Count -eq 0) {
  $changelogPath = Join-Path $root $changelogFile
  $lines = if (Test-Path $changelogPath) { @(Get-Content $changelogPath -Encoding UTF8) } else { @("") }
  if (-not (Test-ChangelogEntry -Lines $lines -Version $version)) {
    $problems += "$changelogFile has no usable entry for $version (a heading '## $version (YYYY-MM-DD)' and at least one line starting with '- ')"
  } else {
    $entry = Get-ChangelogEntry -Lines $lines -Version $version
    [System.IO.File]::WriteAllText($NotesPath, (($entry -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding($false)))
  }
}
if ($problems.Count -eq 0 -and $channel -eq "preview") {
  # the Preview version lives only in this build folder; main keeps saying the last Stable (so the website build stays green)
  Set-WorkspaceVersion -Root $root -Version $version
  Write-Host "Preview ${version}: written into tauri.conf.json, Cargo.toml, Cargo.lock and package.json of this build folder only (not committed)"
}

if ($problems.Count -gt 0) {
  foreach ($p in $problems) { Write-Host "::error::$p" }
  exit 1
}
Write-Host "tag ${Tag} (${channel}), version ${version} - the version files and ${changelogFile} agree; notes in ${NotesPath}"
if ($env:GITHUB_OUTPUT) {
  Add-Content -Path $env:GITHUB_OUTPUT -Value "version=$version"
  Add-Content -Path $env:GITHUB_OUTPUT -Value "tag=$Tag"
  Add-Content -Path $env:GITHUB_OUTPUT -Value "channel=$channel"
}
