<#
.SYNOPSIS
  Finish a release that CI built (ADR-0072, story CI-2): the second half of the flow, run on the maintainer's own computer.
.DESCRIPTION
  .github/workflows/release.yml builds the installer on GitHub, without the updater key, and makes a DRAFT release for the tag
  (signed by SignPath once that is active). This script then:
    1. finds the draft and downloads its installer into dist\ (the file is checked for its size, its product name and
       version, and its Authenticode signature: valid, or "not signed" with a warning; -RequireSigned makes not signed an error);
    2. signs it with the UPDATER key (the minisign key that never leaves this computer), after the Authenticode signature, as
       the updater signature covers the final bytes;
    3. verifies that signature against the public key in tauri.conf.json, as the installed app will (scripts\updater-verify);
    4. writes dist\latest.json (the manifest), pointing at the draft's own installer asset;
    5. with -Publish: uploads the manifest, publishes the release as the latest, copies the manifest to updates\latest.json and
       pushes it, and deletes the releases older than the previous one (ADR-0028). Without -Publish it stops after step 4: a
       rehearsal that changes nothing on GitHub or in the repository.
  scripts\release.ps1 remains the all-local fallback (it builds, signs and publishes by itself).
  The key is passed by path and never printed. Needs `gh` logged in. Run it with powershell.exe -File.
.EXAMPLE
  powershell -NoProfile -File scripts\release-finish.ps1 -Tag v0.4.2            # a rehearsal
  powershell -NoProfile -File scripts\release-finish.ps1 -Tag v0.4.2 -Publish
#>
param(
  [Parameter(Mandatory = $true)][string]$Tag,
  [string]$Repo = "vinhcodon/streakboom",
  [string]$KeyPath = (Join-Path $env:USERPROFILE ".tauri\streakboom-updater.key"),
  [switch]$RequireSigned,
  [switch]$Publish,
  [switch]$RehearseOnPublished   # a test of steps 1 to 4 on an already published release; never with -Publish
)
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "release-lib.ps1")
$root = Split-Path -Parent $PSScriptRoot
$app = Join-Path $root "app"

if ($Tag -notmatch '^v(\d+\.\d+\.\d+)$') { throw "The tag '$Tag' is not v<major>.<minor>.<patch>" }
$version = $Matches[1]
$conf = Get-Content (Join-Path $app "src-tauri\tauri.conf.json") -Raw | ConvertFrom-Json
if ($conf.version -ne $version) { throw "tauri.conf.json says $($conf.version) but the tag is ${Tag}: check out the tagged commit (or one with the same version) first" }
$product = $conf.productName
$exeName = "${product}_${version}_x64-setup.exe"
if (-not (Test-Path $KeyPath)) { throw "The updater key was not found: $KeyPath" }
$gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
if (-not $gh) { $gh = Join-Path $env:LOCALAPPDATA "Programs\GitHub CLI\gh.exe" }
if (-not (Test-Path $gh)) { throw "gh not found; install it and run 'gh auth login'" }

if ($Publish -and $RehearseOnPublished) { throw "-RehearseOnPublished is for rehearsals only and cannot be combined with -Publish" }
if ($Publish) {
  Push-Location $root
  try {
    $dirty = git status --porcelain -- app scripts updates CHANGELOG.md
    if ($dirty) { throw "The git tree is not clean (ADR-0023: commit explicit paths first):`n$dirty" }
    $branch = (git rev-parse --abbrev-ref HEAD).Trim()
    if ($branch -ne "main") { throw "Publish from main (this is '$branch'): the manifest commit is pushed from here" }
    git fetch origin main | Out-Null
    $behind = [int](git rev-list --count "HEAD..origin/main")
    if ($behind -gt 0) { throw "main is $behind commit(s) behind origin/main: pull first, so the manifest commit can be pushed" }
  } finally { Pop-Location }
}

# 1. the draft and its installer
$releases = (& $gh api "repos/$Repo/releases?per_page=100") | ConvertFrom-Json
$rel = $releases | Where-Object { $_.tag_name -eq $Tag -and ($_.draft -or $RehearseOnPublished) } | Select-Object -First 1
if (-not $rel) { throw "No DRAFT release for $Tag in $Repo. Push the tag (the Release workflow makes the draft) or check the tag." }
$asset = $rel.assets | Where-Object { $_.name -eq $exeName } | Select-Object -First 1
if (-not $asset) { throw "The draft $Tag has no asset named $exeName" }
$dist = Join-Path $root "dist"
New-Item -ItemType Directory -Force $dist | Out-Null
$exe = Join-Path $dist $exeName
Remove-Item $exe, "$exe.sig" -Force -ErrorAction SilentlyContinue
Write-Host "Downloading $exeName from the draft release $Tag ..."
# the bytes go to a file through the operating system (a PowerShell redirect would re-encode them)
$p = Start-Process -FilePath $gh -ArgumentList @("api", "-H", "`"Accept: application/octet-stream`"", "repos/$Repo/releases/assets/$($asset.id)") -RedirectStandardOutput $exe -NoNewWindow -Wait -PassThru
if ($p.ExitCode -ne 0) { throw "Downloading the installer failed (gh exit code $($p.ExitCode))" }
$len = (Get-Item $exe).Length
if ($len -ne $asset.size) { throw "The downloaded file is $len bytes, the asset is $($asset.size)" }
if ($asset.digest -and $asset.digest -like "sha256:*") {
  $want = $asset.digest.Substring(7)
  $got = (Get-FileHash $exe -Algorithm SHA256).Hash
  if ($got -ne $want) { throw "The SHA-256 of the download ($got) differs from the one GitHub states ($want)" }
  Write-Host "  SHA-256 equals the one GitHub states."
}

# what the file is
$vi = (Get-Item $exe).VersionInfo
if ($vi.ProductName -ne $product -or $vi.ProductVersion -ne $version) { throw "The installer says '$($vi.ProductName)' $($vi.ProductVersion); expected '$product' $version" }
$auth = Get-AuthenticodeSignature $exe
switch ($auth.Status.ToString()) {
  "Valid" { Write-Host "  Authenticode: valid, signed by $($auth.SignerCertificate.Subject)" }
  "NotSigned" {
    if ($RequireSigned) { throw "The installer is not Authenticode-signed and -RequireSigned was given" }
    Write-Warning "The installer is NOT code-signed (SignPath is not active yet): Windows SmartScreen will warn."
  }
  default { throw "The Authenticode signature is '$($auth.Status)': $($auth.StatusMessage)" }
}

# 2. the updater signature, made after the Authenticode one (it covers the final bytes). The key is passed by path; its password is empty.
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY -ErrorAction SilentlyContinue
Push-Location $app
try { cmd /c "npm run tauri -- signer sign --app-version $version -f `"$KeyPath`" -p `"`" `"$exe`" 2>&1" | Out-Null } finally { Pop-Location }
if (-not (Test-Path "$exe.sig")) { throw "The updater signature was not made (the key, or npm run tauri -- signer sign, failed)" }
$signature = (Get-Content "$exe.sig" -Raw).Trim()

# 3. verified the way the installed app will
$verifyDir = Join-Path $PSScriptRoot "updater-verify"
if (-not $env:CARGO_TARGET_DIR) { $env:CARGO_TARGET_DIR = Join-Path $verifyDir "target" }
$out = cmd /c "cargo run --release --quiet --manifest-path `"$verifyDir\Cargo.toml`" -- `"$($conf.plugins.updater.pubkey)`" `"$exe.sig`" `"$exe`" 2>&1"
$out | ForEach-Object { Write-Host "  $_" }
if ($LASTEXITCODE -ne 0 -or -not ($out -match "^VALID")) { throw "The updater signature does not verify against the public key in tauri.conf.json: nothing is published" }

# 4. the manifest, pointing at the draft's own installer (its asset id stays the same when the release is published)
$notes = Get-ManifestNotes -Entry (Get-ChangelogEntry -Lines (Get-Content (Join-Path $root "CHANGELOG.md") -Encoding UTF8) -Version $version)
$manifest = New-UpdateManifest -Version $version -Notes $notes -Signature $signature -Url "https://api.github.com/repos/$Repo/releases/assets/$($asset.id)"
$manifestPath = Join-Path $dist "latest.json"
[System.IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))
Write-Host ""
Write-Host "Ready: $exe"
Write-Host "       $manifestPath  (version $version, notes: $notes)"
if (-not $Publish) {
  Write-Host ""
  Write-Host "A rehearsal: nothing was published and nothing in the repository changed. Run again with -Publish to publish."
  return
}

# 5. publish
& $gh release upload $Tag $manifestPath --repo $Repo --clobber
if ($LASTEXITCODE -ne 0) { throw "gh release upload failed" }
& $gh release edit $Tag --repo $Repo --draft=false --latest
if ($LASTEXITCODE -ne 0) { throw "gh release edit failed" }
Push-Location $root
try {
  New-Item -ItemType Directory -Force (Join-Path $root "updates") | Out-Null
  Copy-Item $manifestPath (Join-Path $root "updates\latest.json") -Force
  git add updates/latest.json
  git commit -m "Update manifest for $version"
  git push origin HEAD
  if ($LASTEXITCODE -ne 0) { throw "git push failed" }

  # keep the new release and the one before it; delete every older release and its tag (ADR-0028); left-over drafts of other tags go too
  $plan = Select-ReleasesToPrune -Releases (((& $gh api "repos/$Repo/releases?per_page=100") | ConvertFrom-Json)) -CurrentTag $Tag
  foreach ($t in $plan.DeleteTags) {
    & $gh release delete $t --repo $Repo --cleanup-tag --yes
    if ($LASTEXITCODE -ne 0) { Write-Warning "could not delete the old release $t" } else { Write-Host "Deleted the old release $t (notes stay in CHANGELOG.md)" }
  }
  foreach ($d in $plan.Drafts) {
    if ($d -match '^\d+$') { & $gh api -X DELETE "repos/$Repo/releases/$d" | Out-Null } else { & $gh release delete $d --repo $Repo --yes }
    if ($LASTEXITCODE -ne 0) { Write-Warning "could not delete the left-over draft release $d" } else { Write-Host "Deleted a left-over draft release ($d)" }
  }
  if ($plan.Keep.Count) { Write-Host "Kept the previous release $($plan.Keep[0]) as a way back." }
} finally { Pop-Location }

Write-Host ""
Write-Host "Published $Tag. Check from here (the repository copy may lag a few minutes behind a cache):"
Write-Host "  https://raw.githubusercontent.com/$Repo/main/updates/latest.json"
Write-Host "  https://api.github.com/repos/$Repo/releases/assets/$($asset.id)   (send Accept: application/octet-stream)"
