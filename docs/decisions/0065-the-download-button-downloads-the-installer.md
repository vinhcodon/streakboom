# ADR-0065: The download button downloads the installer

- **Status:** accepted (answered by the author on 2026-11-12); **built on 2026-11-12** (committed; the live behaviour is checked after the push)
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
The button "Download for Windows" pointed at `releases/latest`, the GitHub release page, where the visitor had to find the .exe among the files. For an ordinary user that is confusing: they clicked Download and were taken to a developer's page.

## Decision
1. **The button is the installer itself:** `https://github.com/vinhcodon/streakboom/releases/download/v<version>/Streakboom_<version>_x64-setup.exe`, built from the version in `tauri.conf.json` (the file name is the one the release script publishes). The same link serves "Download the .exe anyway" for phones and other computers, the Download button of the sticker pages, the `downloadUrl` of the structured data and a line in `llms.txt`. GitHub counts the click as a download of the installer, so the counter (ADR-0052) is unchanged.
2. **The release page stays one small link away** under the button ("Release notes and other versions"), and in the install steps.
3. **A line after the click** (a toast, so nothing on the page moves; three languages): "Your download has started. Open the file when it finishes. If Windows says it protected your PC, choose More info, then Run anyway." It is shown by the page script, kept nowhere and sent nowhere; without the script the fixed note under the button says the same about SmartScreen.
4. **The build protects the link.** Always: the link must name this version's file and be on every home page (and the line, and the release-page link). In the Pages build (`STREAKBOOM_DOWNLOADS=live`): the release `v<version>` must be published (not a draft) and have an asset with that exact name, or the build stops and the site that is online stays as it is. A local build does not call GitHub.

## Alternatives considered
A stable link, `releases/latest/download/Streakboom-setup.exe`, that never lags behind a release: it needs the app session's release script to upload a second, unversioned file and the counter to count it (left for later; it can be combined with this). Keeping the release page (nothing changes).

## Consequences
- **The release order matters.** The Pages workflow runs when `CHANGELOG.md` or `tauri.conf.json` change on `main` and every day at 03:17 UTC. If that push comes before the release is published, the Pages build stops with "there is no published release" (the old site stays up, the old link works). After publishing the release run the workflow again (`gh workflow run pages.yml --repo vinhcodon/streakboom`) or wait for the daily run. The app session's flow (ADR-0061: merge, then publish, then the website) is already in this order.
- GitHub keeps the newest two releases; the link is always the newest, so it does not go stale between releases.
- Chrome and Edge may show a warning on a download that is not commonly downloaded; the installer is not code-signed yet (the same as before, now one click closer).
- Not verified when this record was written: the live click on each browser and on a phone (the .exe was not downloaded: only the address and the 200 answer of GitHub were checked); how SmartScreen and the browsers' own warnings look after a direct download; the toast on a phone and in Vietnamese and Japanese.

## Sources
ADR-0052, ADR-0061, `scripts/release.ps1`, `scripts/site/facts.mjs`, `.github/workflows/pages.yml`.
