# ADR-0028: GitHub keeps only the latest release; release notes live in CHANGELOG.md

Status: accepted (done 2026-11-08)

## Context
ADR-0026 deleted the 17 development releases when 0.2.0 became the first official one. The author asked to make that the rule: always keep only the newest version, delete the older ones when a new one is published, and keep their release notes.

## Decision
- **Only the latest release exists on GitHub** (the installer, `latest.json` and one tag). Old releases and their tags are deleted; the commits stay.
- **The notes of every version are in `CHANGELOG.md`** at the repository root, newest first, one `## <version> (date)` entry per version (0.1.x development builds are not listed).
- **`scripts/release.ps1 -Publish` enforces it:** it refuses to publish without a `## <version> ` entry in a committed `CHANGELOG.md`, and after publishing it deletes every other release together with its tag. If a deletion fails it warns and goes on.
- First use: v0.2.0 was deleted by hand on 2026-11-08 after 0.2.1 was published; its notes are in `CHANGELOG.md`.

## Consequences
- The update path is unaffected: the app reads the manifest (`updates/latest.json` in the repository, then the release asset), and both always point at the latest installer.
- Links to an old tag or old installer return 404; documents and the website must link only to `releases/latest` and to `CHANGELOG.md` (the website's "updates" section that lists releases through the GitHub API will show one release; it should read the changelog instead, see `docs/handoff/to-website-0.2.0.md`).
- A bad release cannot be rolled back by pointing people to the previous installer; the fix is a new release. The commit history can still rebuild any version.
- Not verified: the automatic deletion step has not run through a real publish yet (the script parses; the deletion command was run by hand for v0.2.0 and worked).
