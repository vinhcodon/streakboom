# Checks the helpers in release-lib.ps1 with made-up data. Run: powershell -NoProfile -File scripts\test-release-lib.ps1
. (Join-Path $PSScriptRoot "release-lib.ps1")
$fail = 0
function Check($name, $ok) { if ($ok) { "ok   $name" } else { "FAIL $name"; $script:fail++ } }
function Rel($tag, $date, $draft = $false, $id = 0) { [pscustomobject]@{ tag_name = $tag; created_at = $date; draft = $draft; id = $id } }

# normal: three older releases; keep the newest of them, delete the other two
$r = Select-ReleasesToPrune -CurrentTag "v0.2.3" -Releases @(Rel "v0.2.3" "2026-11-10T10:00:00Z"; Rel "v0.2.1" "2026-11-08T11:00:00Z"; Rel "v0.2.2" "2026-11-09T10:00:00Z"; Rel "v0.2.0" "2026-11-08T10:00:00Z")
Check "keeps the previous release" (($r.Keep -join ",") -eq "v0.2.2")
Check "deletes older ones, newest first order not required" ((($r.DeleteTags | Sort-Object) -join ",") -eq "v0.2.0,v0.2.1")
Check "no drafts" ($r.Drafts.Count -eq 0)

# a left-over draft is newer than the real previous release: it must not be kept
$r = Select-ReleasesToPrune -CurrentTag "v0.2.3" -Releases @(Rel "v0.2.3" "2026-11-10T10:00:00Z"; Rel "v0.2.2" "2026-11-09T10:00:00Z"; Rel "untagged-abc" "2026-11-10T09:00:00Z" $true 555; Rel "v0.2.1" "2026-11-08T11:00:00Z")
Check "draft is not kept as previous" (($r.Keep -join ",") -eq "v0.2.2")
Check "draft is listed for deletion (by id)" (($r.Drafts -join ",") -eq "555")
Check "published older release deleted" (($r.DeleteTags -join ",") -eq "v0.2.1")

# only the current release exists (like today): nothing kept, nothing deleted
$r = Select-ReleasesToPrune -CurrentTag "v0.2.1" -Releases @(Rel "v0.2.1" "2026-11-08T11:00:00Z")
Check "only current: nothing to keep or delete" ($r.Keep.Count -eq 0 -and $r.DeleteTags.Count -eq 0 -and $r.Drafts.Count -eq 0)

# the current release's own tag never appears in any list
$r = Select-ReleasesToPrune -CurrentTag "v0.2.2" -Releases @(Rel "v0.2.2" "2026-11-09T10:00:00Z"; Rel "v0.2.1" "2026-11-08T11:00:00Z")
Check "one previous kept, none deleted" (($r.Keep -join ",") -eq "v0.2.1" -and $r.DeleteTags.Count -eq 0)

# changelog contract
$ok = @("# Changelog", "", "## 0.2.1 (2026-11-08)", "- First line", "  continued", "", "## 0.2.0 (2026-11-08), the first official release", "- A")
Check "changelog: entry found" (Test-ChangelogEntry -Lines $ok -Version "0.2.1")
Check "changelog: entry with a title found" (Test-ChangelogEntry -Lines $ok -Version "0.2.0")
Check "changelog: missing version rejected" (-not (Test-ChangelogEntry -Lines $ok -Version "0.2.2"))
Check "changelog: heading without a date rejected" (-not (Test-ChangelogEntry -Lines @("## 0.3.0", "- A") -Version "0.3.0"))
Check "changelog: entry without a bullet rejected" (-not (Test-ChangelogEntry -Lines @("## 0.3.0 (2026-11-09)", "Just text", "## 0.2.1 (2026-11-08)", "- A") -Version "0.3.0"))
Check "changelog: 0.2 does not match 0.2.1" (-not (Test-ChangelogEntry -Lines $ok -Version "0.2"))
Check "changelog: sub-headings (###) are not accepted as the bullets' parent" (-not (Test-ChangelogEntry -Lines @("## 0.3.0 (2026-11-09)", "## Added", "- A") -Version "0.3.0"))

if ($fail) { "$fail failed"; exit 1 } else { "all passed" }
