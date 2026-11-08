# ADR-0028: GitHub keeps the latest two releases; release notes live in CHANGELOG.md

Status: accepted (done 2026-11-08; amended the same day from "latest only" to "latest two")

## Context
ADR-0026 deleted the 17 development releases when 0.2.0 became the first official one. The author asked to make that the rule: delete older versions when a new one is published and keep their release notes. Then the author added that the version right before the newest should stay, as a safer way back.

## Decision
- **At most two releases exist on GitHub: the latest and the one right before it** (each with its installer, `latest.json` and tag). Anything older is deleted with its tag; the commits stay.
- **The notes of every version are in `CHANGELOG.md`** at the repository root, newest first, one `## <version> (date)` entry per version (0.1.x development builds are not listed).
- **`scripts/release.ps1 -Publish` enforces it:** it refuses to publish without a `## <version> ` entry in a committed `CHANGELOG.md`, and after publishing it deletes every release older than the previous one, together with its tag, and prints which one it kept. If a deletion fails it warns and goes on.
- First use: v0.2.0 was deleted by hand on 2026-11-08 after 0.2.1 was published, before the amendment, so it cannot be kept; its notes are in `CHANGELOG.md`. Only `v0.2.1` exists now. The rule starts to show with 0.2.2: then `v0.2.1` stays and nothing is deleted until 0.2.3.

## Consequences
- The update path is unaffected: the app reads the manifest (`updates/latest.json` in the repository, then the release asset), and both always point at the latest installer.
- Links to a tag or installer older than the previous release return 404; documents and the website must link only to `releases/latest` and to `CHANGELOG.md` (the website's "updates" section that lists releases through the GitHub API will show one release; it should read the changelog instead, see `docs/handoff/to-website-0.2.0.md`).
- The update manifest (`latest.json`) always points at the newest installer, so the previous release is not offered to anyone by the app. It is a manual way back: install it by hand, or point `updates/latest.json` at it. For a bad release the normal fix is still a new release. The commit history can rebuild any version.
- Not verified: the automatic deletion step has not run through a real publish yet (the script parses; the deletion command was run by hand for v0.2.0 and worked).

## Amendment: the changelog format is a contract with the website, and the prune step skips drafts
Added after the website session's note (2026-11-08):
- The site (`site/app.js`, `parseChangelog`) reads the raw `CHANGELOG.md` on `main` and shows the newest three entries; the first entry also gives the version on the download button and the installer name in the steps. It needs: a heading `## x.y.z (YYYY-MM-DD)` with an optional `, short title`; the notes as lines starting with `- ` (wrapped, indented continuation lines are joined); an entry without any `- ` line is skipped; any other level-1 or level-2 heading ends the entry. Tables or `###` groups make the site fall back to `updates/latest.json` (one paragraph, newest version only). **Do not change this format without telling the website session first.** `scripts/release.ps1 -Publish` now checks it (`Test-ChangelogEntry`) and refuses to publish an entry that does not match.
- The GitHub releases list includes drafts. A draft left by an interrupted publish could have been kept as "the previous release" while the real one was deleted. `Select-ReleasesToPrune` (in `scripts/release-lib.ps1`) now picks the previous release only among published ones and lists other drafts for deletion; the script deletes them and says so. `scripts/test-release-lib.ps1` tests both helpers with made-up data (15 checks, all passing).
- Still not verified: the deletion commands inside a real `-Publish` run.
