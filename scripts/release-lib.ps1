# Helpers for scripts/release.ps1 (dot-sourced there and by scripts/test-release-lib.ps1).
# Kept in their own file so the selection logic can be tested with made-up data, without publishing anything.

<#
.SYNOPSIS
  Which releases to keep and which to delete after publishing $CurrentTag (ADR-0028).
.DESCRIPTION
  Keeps the current release and the newest published (non-draft) release before it; every older
  published release is deleted with its tag. Drafts of other tags are left-overs of an interrupted
  publish: they are never kept as "the previous release" and are listed for deletion.
  Input: release objects as returned by `gh api repos/<repo>/releases` (tag_name, draft, created_at).
#>
function Select-ReleasesToPrune {
  param([Parameter(Mandatory = $true)][object[]]$Releases, [Parameter(Mandatory = $true)][string]$CurrentTag, [string]$Channel = "")
  # Each channel (ADR-0090) keeps its own newest two and its own left-over drafts; the other channel is never touched.
  # A tag that is not a version (a draft's "untagged-..." name) counts as Stable, as before.
  if (-not $Channel) { $Channel = Get-ReleaseChannel -Version $CurrentTag }
  $Releases = @($Releases | Where-Object { (Get-ReleaseChannel -Version $_.tag_name) -eq $Channel })
  $others = @($Releases | Where-Object { $_.tag_name -ne $CurrentTag })
  $published = @($others | Where-Object { -not $_.draft } | Sort-Object { [datetime]$_.created_at } -Descending)
  $drafts = @($others | Where-Object { $_.draft })
  [pscustomobject]@{
    Keep       = @($published | Select-Object -First 1 | ForEach-Object { $_.tag_name })
    DeleteTags = @($published | Select-Object -Skip 1 | ForEach-Object { $_.tag_name })
    Drafts     = @($drafts | ForEach-Object { if ($_.id) { [string]$_.id } else { [string]$_.tag_name } })
  }
}

<#
.SYNOPSIS
  Does CHANGELOG.md have a usable entry for $Version? The website reads this file (ADR-0028), so the
  format is a contract: a heading "## x.y.z (YYYY-MM-DD)" with an optional ", short title", followed
  by at least one line that starts with "- " before the next heading.
#>
function Test-ChangelogEntry {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string[]]$Lines, [Parameter(Mandatory = $true)][string]$Version)
  $head = '^## ' + [regex]::Escape($Version) + ' \(\d{4}-\d{2}-\d{2}\)(, .+)?\s*$'
  $in = $false
  foreach ($l in $Lines) {
    if ($l -match $head) { $in = $true; continue }
    if ($in -and $l -match '^#{1,2} ') { return $false }
    if ($in -and $l -match '^- \S') { return $true }
  }
  return $false
}

<#
.SYNOPSIS
  The lines of the CHANGELOG.md entry for $Version (without its heading), up to the next "## " heading, with leading and
  trailing blank lines removed. Used for the notes of a release built in CI (ADR-0072). Empty when there is no entry.
#>
function Get-ChangelogEntry {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string[]]$Lines, [Parameter(Mandatory = $true)][string]$Version)
  $head = '^## ' + [regex]::Escape($Version) + ' \(\d{4}-\d{2}-\d{2}\)(, .+)?\s*$'
  $in = $false
  $out = New-Object System.Collections.Generic.List[string]
  foreach ($l in $Lines) {
    if (-not $in) { if ($l -match $head) { $in = $true }; continue }
    if ($l -match '^## ') { break }
    $out.Add($l)
  }
  while ($out.Count -gt 0 -and [string]::IsNullOrWhiteSpace($out[0])) { $out.RemoveAt(0) }
  while ($out.Count -gt 0 -and [string]::IsNullOrWhiteSpace($out[$out.Count - 1])) { $out.RemoveAt($out.Count - 1) }
  return ,$out.ToArray()
}

<#
.SYNOPSIS
  What is wrong with a release tag? The tag must be "v" + the version, and the version of tauri.conf.json, Cargo.toml and
  package.json must be the same. Returns the list of problems (empty when all agree). A release built in CI starts here.
#>
function Test-ReleaseVersions {
  param([Parameter(Mandatory = $true)][string]$Tag, [string]$Conf, [string]$Cargo, [string]$Package)
  $problems = @()
  if ($Tag -notmatch '^v(\d+\.\d+\.\d+)$') { $problems += "the tag '$Tag' is not v<major>.<minor>.<patch>"; return $problems }
  $v = $Matches[1]
  if ($Conf -ne $v) { $problems += "tauri.conf.json says '$Conf', the tag says '$v'" }
  if ($Cargo -ne $v) { $problems += "Cargo.toml says '$Cargo', the tag says '$v'" }
  if ($Package -ne $v) { $problems += "package.json says '$Package', the tag says '$v'" }
  return $problems
}

<#
.SYNOPSIS
  The first line of a CHANGELOG entry as a plain sentence for the update manifest's "notes" (what the app can show when it
  offers an update): the first non-empty line without the leading "- ", the bold marks and the code marks, at most 300 characters.
#>
function Get-ManifestNotes {
  param([Parameter(Mandatory = $true)][AllowEmptyCollection()][AllowEmptyString()][string[]]$Entry)
  $first = $Entry | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First 1
  if (-not $first) { return "" }
  $t = ($first -replace '^\s*-\s+', '') -replace '\*\*', '' -replace '`', ''
  $t = $t.Trim()
  if ($t.Length -gt 300) { $t = $t.Substring(0, 297).TrimEnd() + "..." }
  return $t
}

<#
.SYNOPSIS
  The update manifest (latest.json) for one installer: the version, the notes, the date, the updater signature and the address
  the app downloads the installer from. The same shape as scripts/release.ps1 writes. Write it as UTF-8 WITHOUT a byte-order mark.
#>
function New-UpdateManifest {
  param(
    [Parameter(Mandatory = $true)][string]$Version, [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Notes,
    [Parameter(Mandatory = $true)][string]$Signature, [Parameter(Mandatory = $true)][string]$Url, [string]$PubDate = ""
  )
  if (-not $PubDate) { $PubDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
  return [ordered]@{
    version   = $Version
    notes     = $Notes
    pub_date  = $PubDate
    platforms = [ordered]@{ "windows-x86_64" = [ordered]@{ signature = $Signature; url = $Url } }
  }
}

<#
.SYNOPSIS
  The release channel of a version or a tag (ADR-0090): an even middle number is "stable" (0.4.x, 0.6.x), an odd one is
  "preview" (0.5.x, 0.7.x). Anything that is not major.minor.patch is "stable", the safe side. The app has the same rule in
  src-tauri/src/updater.rs (channel_of) and src/lib/channel.ts.
#>
function Get-ReleaseChannel {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Version)
  $v = $Version.Trim().TrimStart('v')
  if ($v -match '^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$') {
    if (([int64]$Matches[2] % 2) -eq 1) { return "preview" }
  }
  return "stable"
}

<#
.SYNOPSIS
  What is wrong with a Preview tag? It must be v<major>.<minor>.<patch> with an ODD middle number, and its version must be
  greater than $Base (the version in tauri.conf.json on main, the last Stable), or the updater would not offer it.
  Returns the problems (empty when fine). A Preview build is made from main, whose version files say $Base: the Preview version
  is written only into the build folder (Set-WorkspaceVersion).
#>
function Test-PreviewVersion {
  param([Parameter(Mandatory = $true)][string]$Tag, [string]$Base = "")
  $problems = @()
  if ($Tag -notmatch '^v(\d+\.\d+\.\d+)$') { return @("the tag '$Tag' is not v<major>.<minor>.<patch>") }
  $v = $Matches[1]
  if ((Get-ReleaseChannel -Version $v) -ne "preview") { $problems += "the tag '$Tag' is not on the Preview channel (the middle number must be odd)" }
  if ($Base -match '^\d+\.\d+\.\d+$' -and ([version]$v) -le ([version]$Base)) {
    $problems += "the Preview version $v is not greater than the version in tauri.conf.json ($Base): the updater would not offer it"
  }
  return $problems
}

<#
.SYNOPSIS
  Write $Version into the three version files and Cargo.lock under $Root (tauri.conf.json, Cargo.toml, package.json and the
  streakboom entry of Cargo.lock, which `cargo test --locked` compares with Cargo.toml). Used by the CI build of a Preview, in
  the build folder only; nothing is committed. Only the first version field of each file is changed; throws if one is missing.
#>
function Set-WorkspaceVersion {
  param([Parameter(Mandatory = $true)][string]$Root, [Parameter(Mandatory = $true)][string]$Version)
  $enc = New-Object System.Text.UTF8Encoding($false)
  $targets = @(
    @{ Path = "app\src-tauri\tauri.conf.json"; Pattern = '(?m)^(\s*"version"\s*:\s*")[^"]+(")' },
    @{ Path = "app\src-tauri\Cargo.toml"; Pattern = '(?m)^(version\s*=\s*")[^"]+(")' },
    @{ Path = "app\package.json"; Pattern = '(?m)^(\s*"version"\s*:\s*")[^"]+(")' },
    @{ Path = "app\src-tauri\Cargo.lock"; Pattern = '(?ms)(name = "streakboom"\r?\nversion = ")[^"]+(")' }
  )
  foreach ($t in $targets) {
    $p = Join-Path $Root $t.Path
    if (-not (Test-Path $p)) { throw "Set-WorkspaceVersion: $p not found" }
    $text = [System.IO.File]::ReadAllText($p)
    $re = New-Object System.Text.RegularExpressions.Regex($t.Pattern)
    if (-not $re.IsMatch($text)) { throw "Set-WorkspaceVersion: no version field found in $($t.Path)" }
    $new = $re.Replace($text, ('${1}' + $Version + '${2}'), 1)
    [System.IO.File]::WriteAllText($p, $new, $enc)
  }
}

<#
.SYNOPSIS
  Should the manifest of a newly published PREVIEW be written to updates/preview.json? preview.json holds only the newest
  Preview (ADR-0094, ADR-0095), so it is written when the new version is greater than the one it holds now, or when there is
  none. A version that is not a Preview (the older rule put a Stable there) does not count as the one it holds.
#>
function Test-ShouldWritePreviewManifest {
  param([Parameter(Mandatory = $true)][string]$NewVersion, [string]$ExistingVersion = "")
  if ($ExistingVersion -notmatch '^\d+\.\d+\.\d+$') { return $true }
  if ((Get-ReleaseChannel -Version $ExistingVersion) -ne "preview") { return $true }
  return ([version]$NewVersion) -gt ([version]$ExistingVersion)
}

<#
.SYNOPSIS
  Which manifest files of updates/ a publish writes (ADR-0095). A STABLE writes updates/latest.json and nothing else; a PREVIEW
  writes updates/preview.json only when it is newer than the Preview that file holds, and never touches latest.json. The two
  files are separate: latest.json holds only the newest Stable, preview.json only the newest Preview.
#>
function Get-ManifestFilesToWrite {
  param([Parameter(Mandatory = $true)][string]$Channel, [Parameter(Mandatory = $true)][string]$NewVersion, [string]$ExistingPreviewVersion = "")
  if ($Channel -eq "stable") { return @("latest.json") }
  if (Test-ShouldWritePreviewManifest -NewVersion $NewVersion -ExistingVersion $ExistingPreviewVersion) { return @("preview.json") }
  return @()
}

