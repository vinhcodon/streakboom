# ADR-0052: A download counter on the website, read from GitHub and kept in a ledger

- **Status:** accepted (decisions answered by the author on 2026-11-11); **nothing is built yet**
- **Date:** 2026-11-11
- **Decided by:** Vinh (author), with Claude (the website session), after the author asked for counters of downloads and installs shown on the site

## Context
The author wants a counter of downloads and installs on the website. What can be known today:
- GitHub counts every download of a release asset (`download_count`). On 2026-11-11 the installer of v0.3.1 had 3 and that of v0.3.0 had 1, including the author's own test downloads. The update manifest `latest.json` had 1 each.
- GitHub keeps only the newest two releases (ADR-0028), so the count of an older version disappears with its release. The total therefore cannot be read from GitHub alone.
- The app's updater downloads the same installer file, so an update counts as a download: the number is higher than the number of people.
- **Installs and active users cannot be counted from GitHub.** Nothing in the app calls home, by design: the privacy page says nothing is sent automatically except what the person sends to the AI provider they chose, and the update check. The count of `latest.json` downloads is too small and cannot tell an app from a check. Counting installs would need a server and an opt-in ping in the app (a consent in the sense of charter article 1 and the "few settings" rule), which is work for the app session and a change of the privacy text.
- The site has no analytics on purpose (ADR-0034) and makes no request to a third party; a badge service or a visit counter would add one.

## Decision
1. **Count downloads, not installs.** The site shows the total number of downloads of the Windows installer from GitHub, and says what it counts: downloads from GitHub, including updates, not people. It does not say or imply "installs", "users" or "people".
2. **A ledger keeps the history.** At every build of the site, the build script reads the releases from the GitHub API (only the assets named `*-setup.exe`), reads the previous ledger from the live site (`https://streakboom.com/downloads.json`), keeps for each tag the larger of the two counts, writes the new ledger to `_site/downloads.json` and shows the sum. A release that GitHub has deleted stays in the sum with its last known count. The first ledger starts with what the API shows on the day it is built; the counts of the releases deleted before that (0.2.x and earlier) are lost and are not in the number.
3. **It runs in the existing deploy, in the website's own paths.** The step lives in `scripts/site/` and `scripts/build-site.mjs` and is switched on only in `.github/workflows/pages.yml` (an environment variable); local builds, the preview server and the tests do not use the network and show no number. If the API or the live ledger cannot be read, the deploy **fails** (the site stays as it was) rather than publish a total that has lost its history; a missing ledger file (the first run) is the only case that starts a new one.
4. **Refreshed once a day.** `pages.yml` gets a daily schedule besides the existing triggers, so the number follows the downloads without anyone doing anything. GitHub may pause a scheduled workflow after 60 days without any activity in the repository; a manual run or any push restarts it.
5. **Shown from the start,** as the author chose, even while the number is small (4 today). A short line near the install steps in the three languages, for example "Downloaded {n} times from GitHub (counts downloads, including updates, not people)." The number is part of the static HTML, so no script runs in the visitor's browser and no request leaves it. It is **not** added to the structured data (a number the structured data would have to keep in step, and that an answer engine could quote stale).
6. **The build checks it:** when the ledger is on, the number on every home page equals the sum of the ledger, `downloads.json` exists, no total is lower than the previous one, and the wording says "downloads" (a retired word list is extended with "installs" and "users" next to the number).
7. **Installs, not now.** An opt-in ping would be proposed to the app session as a separate decision if the author wants it; it would need a small server, a consent in Settings, a change of the privacy text on the site and a measure of how many people opt in.

## Alternatives considered
A private script for the author only (a number that is never shown; safe while the number is small, but not what was asked); an opt-in ping in the app (counts people who agree, needs a server and app work, and weighs on the promise that nothing is sent by itself); a badge or a counter from a third-party service (a request to a third party for every visitor, and it forgets deleted releases); reading the counter from the visitor's browser at page load (a request to the GitHub API from every visitor, and the same loss); a threshold before showing the number (declined: the author prefers to show it from the start); the number of the current version only (declined: it falls to 0 at every release).

## Consequences
- The number is honest but modest, and it will include the author's tests, repeated downloads and every automatic update. It understates the history before the ledger. A very small number is public from the first day.
- A new moving part: the ledger is a file in the deployed site. If the site were ever deployed from an older build or the file removed, the history of deleted releases would restart from the API's current counts. The build can also copy `downloads.json` to a workflow artifact on each run as a second copy (to be decided when it is built).
- The privacy page needs no change (the site collects nothing and the visitor's browser makes no extra request); the build reads only public data.
- Not verified: that the GitHub API count includes every download the author expects (redirects, CDN caching, bots); how the number reads next to the "four promises"; the daily schedule's behaviour on this repository.

## Sources
GitHub REST API (`/releases`, asset `download_count`), `scripts/release.ps1` and ADR-0028 (only the newest two releases are kept), ADR-0034 (no analytics), ADR-0031 and `docs/charter.md` (what is sent and what is consent), `.github/workflows/pages.yml`.
