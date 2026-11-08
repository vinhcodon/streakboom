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
