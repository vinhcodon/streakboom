# Release 0.4.0: the alignment release (a plan; nothing is built)

**Status:** approved by the author at gate 3 (2026-11-11), with Q9. **FA-1 to FA-11 are built on the branch `foundation/alignment`; the release is prepared (version 0.4.0 in the four files, the CHANGELOG entry, the README, the prompt for the website session) but NOT published and not on `main`.** Spec: [`../../spec/12-foundation-alignment.md`](../../spec/12-foundation-alignment.md). Decisions: ADR-0056 to ADR-0059. No code before the author approves, and then story by story.

## Stories (epic E17, "Foundation alignment"; they enter `backlog.md` when approved)

| Story | What | Rule | Size | Files | Tests |
|---|---|---|---|---|---|
| FA-1 | Absence costs nothing: no decay, no lonely band, the away and "missed you" lines replaced | 1 | M | `state.ts`, `lines.ts`, `memlines.ts`, `linereport.ts`, `+page.svelte`, specs 03 and 09 | spec 12 section 1 (a) to (d) |
| FA-2 | No streak: state, memory, lines, Settings row, the daily +3, telemetry names | 2, 6 | M | `state.ts`, `memory.ts`, `lines.ts`, `ui.ts`, settings page, `telemetry.ts`, spec 05 | section 2 (a) to (c) |
| FA-3 | The "bored" lines no longer ask for attention (**only if Q9 is approved**) | 1 | S | `lines.ts` | the banned-pattern test gains the patterns |
| FA-4 | Persona: goodbye, crisis and outward sentences in the locked core; "well-being" and "close friends" reworded | 3, 7, 8, 11 | S | `persona/*.md`, `brain.rs` tests | section 3 |
| FA-5 | The help card in Settings, About, three languages | 11 | S | `ui.ts`, settings page | section 4 |
| FA-6 | 18+: the tour line, the Brain page line, README, installer description | ADR-0056 | S | `ui.ts`, tour, settings page, `tauri.conf.json`, README | section 5 |
| FA-7 | Three outward lines per language | 7 | S | `lines.ts` | parity |
| FA-8 | Charter article 7 and the mission line; README promises; the prompt for the website session | 10 | S | `docs/charter.md`, README, `docs/handoff/website-release-prompt.md` | the site build's README checks still pass |
| FA-9 | `audit-docs` checks the banned claim words | 10 | S | `scripts/audit-docs.mjs` | the audit fails on a planted word |
| FA-10 | The two data checks (uninstaller, Gemini free tier) and their sentences | 9 | S | README, `ui.ts` if needed | none (texts) |
| FA-11 | Hypotheses reworded (H1, H4, H5, H6) with the counter-measure beside each; the old roadmap marked superseded when the new one is written | review section 3 | S | `docs/hypotheses/README.md`, `docs/plans/roadmap.md` | audit |

## Order
FA-1 and FA-2 together (the same function and the same pools; one test build for the author to look at), then FA-4, FA-5 and FA-6 (a second test build: the tour, the card, a chat with a real key), then FA-7 to FA-11 (texts), then the release routine (ADR-0033).

## What the author has to do
Read the replaced Vietnamese lines; try a goodbye and a hard sentence in chat with a real key on at least one brain; answer Q9; take the lawyer's list (`../foundation/legal-questions.md`) when convenient (0.4.0 does not wait for it, but any wider announcement does, ADR-0059 point 4).

## Risks
- The pet may feel flatter without loneliness and streak lines. The replaced lines must stay characterful; this is the main review point of the first test build.
- Line counts change: the README and the site state "267 hand-written lines per language" and the site build checks it. The website session must be told in the same release prompt.
- A persona sentence about crisis can make some models preachy in ordinary chats. The manual check looks for this.
- Old installs: closeness that had decayed is not restored (nobody can know what it was); it simply stops decaying.

## Proposed for 0.4.1, not here
The night share and the long tail of active minutes in the opt-in local stats; the plan for the observed group (the old Phase 3) and a new roadmap; the answer to the lawyer on the age gate.

## Not verified
See spec 12 section 11. Sizes are estimates; no code was tried.

## Before this branch goes to `main` (2026-11-11)
- **The website must change in the same push.** The README now says 263 hand-written lines per language and "your absence costs nothing"; the site says 267 and "it only gets a little lonely" (`pr2`, three languages). `node scripts/build-site.mjs` fails on this branch for the count (checked 2026-11-11), so the Pages build would fail on `main` until the website session follows. The website session is told by the release prompt: the count (263), the promise sentence, "for adults (18+)", the mission sentence, the right click as a push (ADR-0055), no streak and no "Longest streak", the help text in Settings.
- The author reads the Vietnamese lines (V-103) and tries the persona with a real key (V-104).

## What the data checks found (FA-10, 2026-11-11)
- **Gemini free tier:** the terms (opened 2026-11-11, effective 2026-03-23) say that with unpaid use Google uses prompts and responses to improve its products and that human reviewers may read them; with paid use it does not. The app already says so on the Brain page and in the README. The same page says API users must be 18 or older, and that the service may not be used in an app directed at or likely to be accessed by people under 18.
- **Uninstalling:** keys are in Windows Credential Manager and are not removed by an uninstaller; the README now says how to remove everything. Whether the uninstaller offers to delete the data folder was **not checked** on a real uninstall.

## Preparation (2026-11-12) and what is left to publish
Done on the branch: the line report (the same two pools are under the limit as before the work, idle 9 instead of 8: "idle" gained the lines of the old lonely band; click is unchanged at 21), the versions (`tauri.conf.json`, `Cargo.toml`, `Cargo.lock`, `package.json`), the CHANGELOG entry, the README status and roadmap, the test counts (250 JS, 73 Rust), and `docs/handoff/website-release-prompt.md` for 0.4.0.
To publish, in this order (ADR-0060; nothing is done until the author orders "Phát hành 0.4.0"):
1. The author reads the Vietnamese lines (`vi-lines-0.4.0.md`; V-103, V-105) and tries the chat rules with a real key on one brain (V-104).
2. Merge `foundation/alignment` into `main` with a merge commit; push `main` **before** releasing (the tag goes on the head of the default branch at publish time). The site build will fail from this push until the website session follows; that is accepted.
3. `scripts/release.ps1 -Repo vinhcodon/streakboom -Notes ... -Publish` from a clean tree (the key stays at `~\.tauri\streakboom-updater.key`, never shown); then the routine of ADR-0033 (audit, README and icon, the name, the debt list).
4. **Then** hand the website session its prompt (`docs/handoff/website-release-prompt.md`): the site is updated after the release. Record the answer in the debt list.
