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

# the channels (ADR-0090)
Check "channel: an even middle number is stable" ((Get-ReleaseChannel "0.4.2") -eq "stable" -and (Get-ReleaseChannel "v0.6.0") -eq "stable")
Check "channel: an odd middle number is preview" ((Get-ReleaseChannel "0.5.0") -eq "preview" -and (Get-ReleaseChannel "v0.7.3") -eq "preview")
Check "channel: anything else is stable" ((Get-ReleaseChannel "untagged-abc") -eq "stable" -and (Get-ReleaseChannel "") -eq "stable" -and (Get-ReleaseChannel "0.5") -eq "stable")
Check "preview version: a good tag above the base" ((Test-PreviewVersion -Tag "v0.5.0" -Base "0.4.2").Count -eq 0)
Check "preview version: an even middle number is refused" ((Test-PreviewVersion -Tag "v0.6.0" -Base "0.4.2").Count -eq 1)
Check "preview version: not above the base is refused" ((Test-PreviewVersion -Tag "v0.3.9" -Base "0.4.2").Count -eq 1)
Check "preview version: a tag that is not a version is refused" ((Test-PreviewVersion -Tag "preview-1" -Base "0.4.2").Count -eq 1)
Check "preview manifest: written when none exists or when newer" ((Test-ShouldWritePreviewManifest -NewVersion "0.5.0" -ExistingVersion "") -and (Test-ShouldWritePreviewManifest -NewVersion "0.5.1" -ExistingVersion "0.5.0") -and (Test-ShouldWritePreviewManifest -NewVersion "0.6.0" -ExistingVersion "0.5.9"))
Check "preview manifest: not written when older or equal" ((-not (Test-ShouldWritePreviewManifest -NewVersion "0.4.3" -ExistingVersion "0.5.2")) -and (-not (Test-ShouldWritePreviewManifest -NewVersion "0.5.2" -ExistingVersion "0.5.2")))
Check "preview manifest: 0.10.0 is greater than 0.9.0 (numbers, not text)" (Test-ShouldWritePreviewManifest -NewVersion "0.10.0" -ExistingVersion "0.9.0")

# pruning keeps each channel apart
function RelP($tag, $date, $draft = $false, $id = 0) { [pscustomobject]@{ tag_name = $tag; created_at = $date; draft = $draft; id = $id } }
$mix = @(RelP "v0.6.0" "2026-12-01T10:00:00Z"; RelP "v0.4.2" "2026-11-13T10:00:00Z"; RelP "v0.4.1" "2026-11-12T10:00:00Z"; RelP "v0.5.3" "2026-11-30T10:00:00Z"; RelP "v0.5.2" "2026-11-29T10:00:00Z"; RelP "v0.5.1" "2026-11-28T10:00:00Z"; RelP "v0.7.0" "2026-12-02T10:00:00Z" $true 777)
$r = Select-ReleasesToPrune -CurrentTag "v0.6.0" -Releases $mix
Check "prune stable: keeps the previous Stable, deletes no Preview" (($r.Keep -join ",") -eq "v0.4.2" -and (($r.DeleteTags -join ",") -eq "v0.4.1"))
Check "prune stable: a Preview draft is not touched" ($r.Drafts.Count -eq 0)
$r = Select-ReleasesToPrune -CurrentTag "v0.5.3" -Releases $mix
Check "prune preview: keeps the previous Preview and deletes the older one" (($r.Keep -join ",") -eq "v0.5.2" -and ($r.DeleteTags -join ",") -eq "v0.5.1")
Check "prune preview: no Stable release is listed" (-not (@($r.DeleteTags) + @($r.Keep) | Where-Object { $_ -match "^v0\.(4|6)\." }))
$r = Select-ReleasesToPrune -CurrentTag "v0.7.0" -Releases $mix
Check "prune preview: the draft of its own tag is not a left-over" ($r.Drafts.Count -eq 0)

# the version written into a build folder (a copy of the real files)
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("relver-" + [guid]::NewGuid().ToString("N"))
$repoRoot = Split-Path -Parent $PSScriptRoot
foreach ($f in @("app\src-tauri\tauri.conf.json", "app\src-tauri\Cargo.toml", "app\package.json", "app\src-tauri\Cargo.lock")) {
  $dest = Join-Path $tmp $f; New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null; Copy-Item (Join-Path $repoRoot $f) $dest
}
$before = @{}; foreach ($f in @("app\src-tauri\tauri.conf.json", "app\src-tauri\Cargo.toml", "app\package.json", "app\src-tauri\Cargo.lock")) { $before[$f] = [System.IO.File]::ReadAllLines((Join-Path $tmp $f)) }
Set-WorkspaceVersion -Root $tmp -Version "0.9.9"
$changed = @{}; foreach ($f in $before.Keys) { $after = [System.IO.File]::ReadAllLines((Join-Path $tmp $f)); $n = 0; for ($i = 0; $i -lt $after.Count; $i++) { if ($after[$i] -ne $before[$f][$i]) { $n++ } }; $changed[$f] = @{ lines = $n; same = ($after.Count -eq $before[$f].Count) } }
Check "version: one line changed in each of the four files" (($changed.Values | Where-Object { $_.lines -eq 1 -and $_.same }).Count -eq 4)
Check "version: tauri.conf.json, Cargo.toml, package.json and Cargo.lock all say 0.9.9" (
  ((Get-Content (Join-Path $tmp "app\src-tauri\tauri.conf.json") -Raw | ConvertFrom-Json).version -eq "0.9.9") -and
  ((Get-Content (Join-Path $tmp "app\package.json") -Raw | ConvertFrom-Json).version -eq "0.9.9") -and
  ((Get-Content (Join-Path $tmp "app\src-tauri\Cargo.toml") -Raw) -match '(?m)^version = "0.9.9"') -and
  ((Get-Content (Join-Path $tmp "app\src-tauri\Cargo.lock") -Raw) -match 'name = "streakboom"\r?\nversion = "0.9.9"'))
$problems = Test-ReleaseVersions -Tag "v0.9.9" -Conf ((Get-Content (Join-Path $tmp "app\src-tauri\tauri.conf.json") -Raw | ConvertFrom-Json).version) -Cargo "0.9.9" -Package "0.9.9"
Check "version: the usual check of the three files passes after the write" ($problems.Count -eq 0)
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue

# the CI step on a copy of the repository: a Preview tag and a Stable tag
function NewCopy {
  $t = Join-Path ([System.IO.Path]::GetTempPath()) ("relprep-" + [guid]::NewGuid().ToString("N"))
  foreach ($f in @("app\src-tauri\tauri.conf.json", "app\src-tauri\Cargo.toml", "app\package.json", "app\src-tauri\Cargo.lock", "CHANGELOG.md")) {
    $d = Join-Path $t $f; New-Item -ItemType Directory -Force (Split-Path $d) | Out-Null; Copy-Item (Join-Path $repoRoot $f) $d
  }
  return $t
}
function Prep($root, $tag) {
  $notes = Join-Path $root "notes.md"
  $out = & powershell.exe -NoProfile -File (Join-Path $PSScriptRoot "ci-release-prepare.ps1") -Tag $tag -NotesPath $notes -Root $root 2>&1
  [pscustomobject]@{ Code = $LASTEXITCODE; Out = ($out -join "`n"); Notes = $notes }
}
$c = NewCopy
[System.IO.File]::WriteAllText((Join-Path $c "CHANGELOG-preview.md"), "# Changelog of Preview builds`n`n## 0.5.0 (2026-11-14)`n- **A first Preview.** Notes.`n", (New-Object System.Text.UTF8Encoding($false)))
$r = Prep $c "v0.5.0"
Check "prepare: a Preview tag with an entry passes" ($r.Code -eq 0)
Check "prepare: the notes come from CHANGELOG-preview.md" ((Test-Path $r.Notes) -and ((Get-Content $r.Notes -Raw) -match "A first Preview"))
Check "prepare: the version files of the copy now say 0.5.0" (((Get-Content (Join-Path $c "app\src-tauri\tauri.conf.json") -Raw | ConvertFrom-Json).version -eq "0.5.0") -and ((Get-Content (Join-Path $c "app\package.json") -Raw | ConvertFrom-Json).version -eq "0.5.0"))
Check "prepare: the real repository was not touched" (((Get-Content (Join-Path $repoRoot "app\src-tauri\tauri.conf.json") -Raw | ConvertFrom-Json).version) -ne "0.5.0")
Remove-Item $c -Recurse -Force -ErrorAction SilentlyContinue

$c = NewCopy
$r = Prep $c "v0.5.0"
Check "prepare: a Preview tag without an entry in CHANGELOG-preview.md fails" ($r.Code -ne 0 -and $r.Out -match "CHANGELOG-preview.md has no usable entry")
Remove-Item $c -Recurse -Force -ErrorAction SilentlyContinue

$c = NewCopy
[System.IO.File]::WriteAllText((Join-Path $c "CHANGELOG-preview.md"), "## 0.3.0 (2026-11-14)`n- Old.`n", (New-Object System.Text.UTF8Encoding($false)))
$r = Prep $c "v0.3.0"
Check "prepare: a Preview tag not above the Stable version fails" ($r.Code -ne 0 -and $r.Out -match "not greater")
Remove-Item $c -Recurse -Force -ErrorAction SilentlyContinue

$c = NewCopy
$r = Prep $c "v0.6.0"
Check "prepare: a Stable tag that the files do not say fails as before" ($r.Code -ne 0 -and $r.Out -match "tauri.conf.json says")
Remove-Item $c -Recurse -Force -ErrorAction SilentlyContinue

$conf = (Get-Content (Join-Path $repoRoot "app\src-tauri\tauri.conf.json") -Raw | ConvertFrom-Json).version
$c = NewCopy
$r = Prep $c ("v" + $conf)
Check "prepare: the current Stable tag still passes" ($r.Code -eq 0 -and $r.Out -match "\(stable\)")
Remove-Item $c -Recurse -Force -ErrorAction SilentlyContinue

if ($fail) { "$fail failed"; exit 1 } else { "all passed" }
