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

# the notes of an entry (a release built in CI)
$cl = @("# Changelog", "", "## 0.4.1 (2026-11-12)", "- **One.** First", "  more", "- Two", "", "## 0.4.0 (2026-11-12), a title", "A paragraph", "- A")
$e = Get-ChangelogEntry -Lines $cl -Version "0.4.1"
Check "entry: its lines, without the heading and the blank line before the next" (($e -join "|") -eq "- **One.** First|  more|- Two")
$e = Get-ChangelogEntry -Lines $cl -Version "0.4.0"
Check "entry: a title in the heading, a paragraph line kept" (($e -join "|") -eq "A paragraph|- A")
Check "entry: a missing version gives nothing" ((Get-ChangelogEntry -Lines $cl -Version "0.9.9").Count -eq 0)

# the tag and the three versions
Check "versions: all agree" ((Test-ReleaseVersions -Tag "v0.4.1" -Conf "0.4.1" -Cargo "0.4.1" -Package "0.4.1").Count -eq 0)
Check "versions: a tag that is not a version" ((Test-ReleaseVersions -Tag "release-1" -Conf "0.4.1" -Cargo "0.4.1" -Package "0.4.1").Count -eq 1)
Check "versions: a tag with a suffix is refused" ((Test-ReleaseVersions -Tag "v0.4.1-rc1" -Conf "0.4.1" -Cargo "0.4.1" -Package "0.4.1").Count -eq 1)
Check "versions: each file that disagrees is named" ((Test-ReleaseVersions -Tag "v0.4.2" -Conf "0.4.2" -Cargo "0.4.1" -Package "0.4.0").Count -eq 2)

# the notes line and the manifest of a release finished locally
Check "notes: the first line, plain" ((Get-ManifestNotes -Entry @("", "- **One peak.** Starts `once`.", "- Two")) -eq "One peak. Starts once.")
Check "notes: a paragraph line is kept as it is" ((Get-ManifestNotes -Entry @("A paragraph", "- A")) -eq "A paragraph")
Check "notes: empty entry gives nothing" ((Get-ManifestNotes -Entry @()) -eq "")
Check "notes: cut at 300 characters" ((Get-ManifestNotes -Entry @("- " + ("x" * 500))).Length -eq 300)
$m = New-UpdateManifest -Version "0.4.2" -Notes "n" -Signature "SIG" -Url "https://api.github.com/repos/o/r/releases/assets/9" -PubDate "2026-11-12T10:00:00Z"
$j = $m | ConvertTo-Json -Depth 5 | ConvertFrom-Json
Check "manifest: version, notes, date" ($j.version -eq "0.4.2" -and $j.notes -eq "n" -and $j.pub_date -eq "2026-11-12T10:00:00Z")
Check "manifest: the windows platform has the signature and the address" ($j.platforms."windows-x86_64".signature -eq "SIG" -and $j.platforms."windows-x86_64".url -match "/assets/9$")
Check "manifest: a date is made when none is given" ((New-UpdateManifest -Version "1.0.0" -Notes "" -Signature "S" -Url "u").pub_date -match '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$')

if ($fail) { "$fail failed"; exit 1 } else { "all passed" }
