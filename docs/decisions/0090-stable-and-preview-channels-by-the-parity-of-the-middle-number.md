# ADR-0090: Two channels, Stable and Preview, told apart by the parity of the middle version number

- **Status:** accepted as a **direction** (answered by the author on 2026-11-13 as multiple choice); nothing is built. The work is the plan [`../plans/preview-channel-plan.md`](../plans/preview-channel-plan.md), each step approved before code. Completes ADR-0089, which left the way tryout builds reach people open.
- **Date:** 2026-11-13
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The author wants to keep building features and let a few adults try them (ADR-0089), with updates that arrive in the app without reinstalling by hand. The public release line is also the update channel of every installed copy, so an unfinished feature must not travel through it. The author first proposed numbers (stable ends in `.0`, preview in `.x`); assessed against the facts, that rule leaves Stable without a way to receive a fix (0.4.1 fixed the duplicate Peaks and is already a `.x`) and would make 0.4.1 and 0.4.2 "previews".

## Decision
1. **Two channels:** **Stable** (what is published today, ordered by name) and **Preview** (built on demand by the author's order, not on a schedule).
2. **The channel is the parity of the middle number.** Even middle number is **Stable** (0.4.x, 0.6.x, 0.8.x); odd is **Preview** (0.5.x, 0.7.x). The app reads its own version to choose its update manifest: even reads `updates/latest.json` (as now), odd reads `updates/preview.json`. No setting.
3. **Upgrade rule (the author's principle):** a Preview `0.A.x` goes to `0.A.x+1` or to `0.A+1.0` (the next Stable); a Stable `0.A.x` goes to `0.A.x+1` (a fix) or to the next Stable `0.A+2.0`, passing over the Preview line. The first Preview is **0.5.0**; the next Stable is **0.6.0**. 0.4.2, today's release, is already on the Stable line.
4. **Preview updates in the app like Stable does**, through the same hybrid flow: built in CI without the updater key, finished on the author's computer with `release-finish.ps1`, which signs and publishes. Each Preview costs the author one command, as each Stable does.
5. **Preview is built from `main`**, and **CI writes the Preview version into the three version files inside the build folder only**, never committed. `main` keeps saying the last Stable version, so the website build, which checks that a release for that version is published (ADR-0065), stays green.
6. **Preview releases are marked pre-release on GitHub**, so `releases/latest`, the website's download button and the Stable update path never point at one. Their notes live in a file of their own, not in `CHANGELOG.md`; pruning keeps the newest two of each channel.
7. **Data is shared** between the channels (one `pet.json`, one `memory.json`). A Preview may only **add** fields until the version is promoted to Stable: no renaming, no deletion, no migration of existing ones; a test shows that Stable reads a file written by Preview.
8. **Adults only** for anyone on Preview (ADR-0089). The About page says "Preview" when it is one.
9. **A Stable fix while `main` carries unfinished work** needs a release branch of the Stable line (a story of the plan); it is not decided here how it is cut.

## Consequences
- ADR-0089's open question (the build channel) is closed by this record.
- The website session is told (handoff note) that Preview releases are pre-releases and never the download, and that their notes are not in `CHANGELOG.md`.
- A person on Preview cannot be moved down to Stable by the updater (it never downgrades); they wait for the next Stable or install it by hand.
- **PV-0 (2026-11-13):** the NSIS installer installs a lower version over a higher one silently, with the data untouched; the updater offers a release only if its version is greater (semver), so Preview and Stable must keep **separate manifests** and `preview.json` must show the newest release of both channels (plan, PV-0 results). Still **not tried**: that `releases/latest` ignores a published pre-release (GitHub's REST documentation says it does).
