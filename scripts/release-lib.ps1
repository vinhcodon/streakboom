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
  param([Parameter(Mandatory = $true)][object[]]$Releases, [Parameter(Mandatory = $true)][string]$CurrentTag)
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
