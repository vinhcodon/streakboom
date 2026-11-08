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
.PARAMETER Publish  Also do the GitHub part: create the release (as a draft) with the installer, point the
                   manifest at the installer through the GitHub API (which kept working when the public
                   download path of github.com answered 504), upload the manifest, publish the release, and
                   commit and push the same manifest as updates/latest.json (a second place the app reads it
                   from, see updater.rs). Needs gh logged in, a clean git tree under app/, scripts/ and updates/,
                   and an entry "## <version> (date)" in CHANGELOG.md. After publishing it deletes every older
                   release and tag except the one right before the new one (ADR-0028: the latest two releases are
                   kept; the notes of all versions stay in CHANGELOG.md).

.EXAMPLE
  .\scripts\release.ps1 -Repo someone/streakboom -Notes "Fixes the bubble position"
#>
param(
  [Parameter(Mandatory = $true)][string]$Repo,
  [string]$Notes = "",
  [string]$KeyPath = (Join-Path $env:USERPROFILE ".tauri\streakboom-updater.key"),
  [switch]$Publish
)
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "release-lib.ps1")   # Select-ReleasesToPrune, Test-ChangelogEntry (tested by test-release-lib.ps1)
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

if ($Publish) {
  # --- publish: a clean tree, a draft release with the installer, the manifest, then publish and mirror
  Push-Location $root
  try {
    # Only what feeds the build and the release has to be clean; other work in the checkout (for example the site/ folder) does not.
    $dirty = git status --porcelain -- app scripts updates CHANGELOG.md
    if ($dirty) { throw "The git tree is not clean (see ADR-0023: commit explicit paths first):`n$dirty" }
    # Older releases are deleted after this one is published (ADR-0028), so their notes must already be in CHANGELOG.md.
    # The website reads CHANGELOG.md, so the format is a contract (ADR-0028): "## x.y.z (YYYY-MM-DD)", optional ", title", then "- " lines.
    if (-not (Test-ChangelogEntry -Lines (Get-Content (Join-Path $root "CHANGELOG.md") -Encoding UTF8) -Version $version)) {
      throw "CHANGELOG.md has no usable entry for ${version}: a heading '## $version (YYYY-MM-DD)' followed by at least one line starting with '- '. Write the release notes there and commit it first."
    }
    $gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
    if (-not $gh) { $gh = Join-Path $env:LOCALAPPDATA "Programs\GitHub CLI\gh.exe" }
    if (-not (Test-Path $gh)) { throw "gh not found; install it and run 'gh auth login'" }
    $tag = "v$version"
    $exePath = Join-Path $dist $exeName
    $manifestPath = Join-Path $dist "latest.json"

    & $gh release create $tag $exePath --repo $Repo --title "Streakboom $version" --notes $Notes --draft
    if ($LASTEXITCODE -ne 0) { throw "gh release create failed" }
    # (filtered here, not with --jq: Windows PowerShell 5.1 mangles quotes passed to native programs)
    $releases = (& $gh api "repos/$Repo/releases") | ConvertFrom-Json
    $id = ($releases | Where-Object { $_.tag_name -eq $tag } | Select-Object -First 1).assets | Where-Object { $_.name -eq $exeName } | Select-Object -First 1 -ExpandProperty id
    if (-not $id) { throw "could not read the installer's asset id" }

    # the installer address goes through the API (Accept: application/octet-stream, which the updater sends)
    $m = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $m.platforms."windows-x86_64".url = "https://api.github.com/repos/$Repo/releases/assets/$id"
    [System.IO.File]::WriteAllText($manifestPath, ($m | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))

    & $gh release upload $tag $manifestPath --repo $Repo --clobber
    if ($LASTEXITCODE -ne 0) { throw "gh release upload failed" }
    & $gh release edit $tag --repo $Repo --draft=false --latest
    if ($LASTEXITCODE -ne 0) { throw "gh release edit failed" }

    # the second copy of the manifest, in the repository
    New-Item -ItemType Directory -Force (Join-Path $root "updates") | Out-Null
    Copy-Item $manifestPath (Join-Path $root "updates\latest.json") -Force
    git add updates/latest.json
    git commit -m "Update manifest for $version"
    git push origin HEAD
    if ($LASTEXITCODE -ne 0) { throw "git push failed" }

    # Keep the new release and the one right before it (a way back if the new one is bad); delete every older release and its tag
    # (the commits stay; the notes live in CHANGELOG.md). Left-over drafts of an interrupted publish are deleted, never kept.
    $plan = Select-ReleasesToPrune -Releases (((& $gh api "repos/$Repo/releases?per_page=100") | ConvertFrom-Json)) -CurrentTag $tag
    foreach ($t in $plan.DeleteTags) {
      & $gh release delete $t --repo $Repo --cleanup-tag --yes
      if ($LASTEXITCODE -ne 0) { Write-Warning "could not delete the old release $t" } else { Write-Host "Deleted the old release $t (notes stay in CHANGELOG.md)" }
    }
    foreach ($d in $plan.Drafts) {
      if ($d -match '^\d+$') { & $gh api -X DELETE "repos/$Repo/releases/$d" | Out-Null } else { & $gh release delete $d --repo $Repo --yes }
      if ($LASTEXITCODE -ne 0) { Write-Warning "could not delete the left-over draft release $d" } else { Write-Host "Deleted a left-over draft release ($d)" }
    }
    if ($plan.Keep.Count) { Write-Host "Kept the previous release $($plan.Keep[0]) as a way back." }

    Write-Host ""
    Write-Host "Published $tag. Check from here (the repository copy may lag a few minutes behind a cache):"
    Write-Host "  https://raw.githubusercontent.com/$Repo/main/updates/latest.json"
    Write-Host "  https://api.github.com/repos/$Repo/releases/assets/$id   (send Accept: application/octet-stream)"
  } finally { Pop-Location }
}
