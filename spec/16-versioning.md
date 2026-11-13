# 16. Version numbers: what each number means, when it moves, and how a build becomes Stable

**Status:** **approved by the author on 2026-11-13 (ADR-0093)**; the four questions of section 9 are answered with the defaults. The rule of the channels is ADR-0090 (an even middle number is Stable, an odd one is Preview). This spec writes down how the numbers are *managed* so that every release, by anyone, follows the same logic. It changes no code. Companions: [`../docs/plans/preview-channel-plan.md`](../docs/plans/preview-channel-plan.md), [`../docs/releasing.md`](../docs/releasing.md), the code in `app/src-tauri/src/updater.rs`, `app/src/lib/channel.ts` and `scripts/release-lib.ps1`.

## 1. The format and the one rule

A version is **`MAJOR.MINOR.PATCH`**: three whole numbers separated by two dots (semver, which the updater compares as numbers: `0.10.0` is greater than `0.9.0`). The middle number decides the channel:

| `MINOR` | Channel | What it is |
|---|---|---|
| **even** (0, 2, 4, 6 ...) | **Stable** | for everyone: the website download, the README, `releases/latest` |
| **odd** (1, 3, 5, 7 ...) | **Preview** | for a few adults the author hands a build to; a GitHub pre-release; never the download |

`MAJOR` stays 0 until the author decides on 1.0 (section 8). With a major of 1 the same rule holds: 1.0.x is Stable, 1.1.x is Preview, 1.2.0 is Stable.

## 2. What moves when (the heart of it)

The three numbers move for **different reasons**:

| Number | Moves when | Resets |
|---|---|---|
| **PATCH** | a new **build** is handed out inside a line: the next Preview build (0.5.0, 0.5.1, 0.5.2 ...), or a fix to a Stable (0.6.0, 0.6.1 ...) | to 0 when the middle number changes |
| **MINOR** | the channel changes: **+1** when a Preview line starts after a Stable (0.4.x to 0.5.0), **+1** when a Preview line is promoted to Stable (0.5.x to 0.6.0). So it moves by 2 over one cycle and always alternates odd, even | the patch |
| **MAJOR** | only by the author's decision at a public milestone (1.0), recorded in an ADR | minor and patch |

The size of a change does **not** pick the number. A big feature and a typo both ride the same Preview line; what decides is *which line the build belongs to* and *whether it is being promoted*.

A **line** is every version with the same `MAJOR.MINOR`. A Stable line (0.6.x) receives only fixes; a Preview line (0.7.x) receives everything new.

## 3. The life of one cycle

```
Stable 0.4.0 .. 0.4.1 .. 0.4.2          (fixes only: patch moves)
        |
        v   a Preview line starts: minor +1, patch 0
Preview 0.5.0 .. 0.5.1 .. 0.5.2 .. 0.5.k      (each build handed out: patch moves)
        |
        v   promotion: minor +1, patch 0
Stable 0.6.0 .. 0.6.1 .. 0.6.2          (fixes only)   and, at once or later,
Preview 0.7.0 .. 0.7.1 ..               (the next line)
```

The update paths the rule gives (the author's principle, adjusted):

| From | Offered | By which manifest |
|---|---|---|
| Stable 0.6.p | 0.6.p+1 (a fix), or the next Stable 0.8.0 | `updates/latest.json` |
| Preview 0.7.p | 0.7.p+1, or the next Stable, or the next Preview line | `updates/preview.json` (always the newest release of both channels) |

## 4. Definitions

- **Preview:** a build handed to a few adults (ADR-0088). May contain unfinished features and new fields in `pet.json` / `memory.json` (add only, ADR-0090). Its notes are in `CHANGELOG-preview.md`. Published as a **pre-release**. Its version is written **only into the CI build folder** (`main` keeps saying the last Stable). It is never announced on the website.
- **Stable:** a build everyone may install. Its notes are in `CHANGELOG.md` (which the website reads), the README and `docs/PROJECT.md` say its version, and the website shows it. Its version is written in the version files on `main`.
- **Promotion:** the act that turns the last Preview of a line into the next Stable (`0.5.k` to `0.6.0`). It is a new build with a new number, from the commit of that last Preview (plus the version bump and the release documents), so what the testers used is what everyone gets.
- **Fix:** a change to a Stable that does not add behaviour: a bug, a broken update path, a security hole, a data-loss risk. It moves the Stable patch (0.6.0 to 0.6.1).

## 5. What goes where (the decision table)

| The change is ... | It goes to ... | Number |
|---|---|---|
| new behaviour, new text the person sees, a new art, a new setting | a Preview first, never straight to Stable | the Preview patch moves |
| a bug found in a Stable that does not add behaviour | a Stable fix **and** (merged forward) the Preview line | the Stable patch moves; the next Preview carries it too |
| a security, data-loss or broken-update problem | a Stable fix at once; no waiting for a Preview | the Stable patch moves |
| documents, the website, stickers, scripts that are not part of the app | no release at all | none |
| a change that only affects Preview builds (the label, the channel code) | a Preview | the Preview patch moves |

**A Preview tester after a promotion (the gap).** A Preview tester who takes the promotion (0.5.k to 0.6.0) becomes a Stable user: an even middle number reads `latest.json`, so the next Preview 0.7.0 is not offered to a Stable copy. Two ways to handle it, the author chooses (question 2): the tester **returns to Stable** at each promotion and installs the next Preview installer by hand to come back; or the next Preview is published **together with** the Stable (0.6.0 and 0.7.0 on the same day), `preview.json` then says 0.7.0 (the newest), and Preview testers **skip the Stable and stay on Preview**, since 0.7.0 contains everything 0.6.0 does.

## 6. Where the version is written and who changes it

| Place | Holds | Changed by |
|---|---|---|
| `tauri.conf.json`, `Cargo.toml`, `Cargo.lock`, `package.json` on `main` | the **last Stable** version (and the website build checks that a release for it is published, ADR-0065) | a promotion or a Stable fix only |
| the same four files in a **CI build folder** | the Preview version being built | `ci-release-prepare.ps1`, never committed |
| `CHANGELOG.md` | one entry per **Stable** version | the promotion or the fix |
| `CHANGELOG-preview.md` | one entry per **Preview** build | before the tag of that build |
| the tag | `vMAJOR.MINOR.PATCH`, on a commit that is on `main` | the author's order, by name |
| the installer name | `Streakboom_<version>_x64-setup.exe` | built from the version |
| `updates/latest.json`, `updates/preview.json` | the manifests (`preview.json` = the newest of both channels) | `release-finish.ps1` |

A version number is **never reused**, never taken back, and may be skipped. A tag is never moved after its release is published.

## 7. Gates

- **To start a Preview line** (after a Stable): nothing but the author's order and an entry in `CHANGELOG-preview.md`.
- **To publish a Preview build:** the tests and the types pass in CI; the entry exists; the version is greater than the last Stable and has an odd middle number (all checked by `ci-release-prepare.ps1`).
- **To promote** (the Stable gate), all of: every feature of the line is finished or switched off; the tests, the types and `audit-docs` pass; the points of `verification-debt.md` that the new features add are checked by the author, or are named in the notes as not yet checked; the `CHANGELOG.md` entry for the Stable summarises the whole Preview line since the last Stable; the README status line, `docs/PROJECT.md` and the website prompt are refreshed (`docs/releasing.md`, the list after every release); the author orders it by name.
- **To fix a Stable:** the fix is on `main` first (and so in the next Preview); the Stable patch is released as a normal release.

## 8. History, 1.0 and the numbers already used

- **Before this rule** the middle number meant "a bigger step" (0.2, 0.3, 0.4 were all Stable). Nothing is renumbered. The rule starts at **0.4.2 (Stable)**, with the first Preview **0.5.0** and the next Stable **0.6.0**.
- **Copies built before the channel code** (every release up to 0.4.2) always read `latest.json`; the channel is read from the version only by builds from 0.5.0 on, so an old odd-numbered copy (a 0.3.x) cannot be moved to Preview by mistake.
- **1.0:** the author decides when, by an ADR; it must be a Stable (1.0.0, an even middle number). After it the cycle continues with 1.1.x (Preview) and 1.2.0 (Stable).

## 9. Decisions of the author (answered 2026-11-13, ADR-0093: every default was chosen)

1. **A fix to a Stable while `main` already carries unfinished Preview work.** (a) **Only when `main` is shippable; otherwise the fix waits for the next promotion, which may be brought forward.** (b) A release branch for the Stable line (`stable-0.6`) from the last Stable tag, the fix cherry-picked there, the release workflow accepting tags on `stable-*` (plan step PV-7). (a) is simpler and enough while there are few users; (b) is needed the day a Stable fix cannot wait.
2. **Preview testers across a promotion.** (a) **They stay on Preview: the next Preview line is published on the same day as the Stable, and `preview.json` points at it.** (b) They return to Stable at each promotion and reinstall a Preview by hand to come back (the author's first principle, literally).
3. **How a Stable is cut.** (a) **From the commit of the last Preview, with the version files and the release documents changed** (what the testers used is what everyone gets). (b) From the head of `main` at that time (may include later Preview work).
4. **MAJOR.** Keep 0 until the author orders 1.0 by an ADR (**recommended**), or move to 1 at the first public launch automatically.

## 10. What would enforce this (proposed, not built)

- `release-lib.ps1`: a check that a Stable tag has an even middle number and `CHANGELOG.md` has its entry (already true by construction: an odd tag takes the Preview path); a check that a Preview version is greater than the last Stable (done: `Test-PreviewVersion`).
- A check in `ci-release-prepare.ps1` that a version is not already tagged (never reused).
- `audit-docs.mjs`: the snapshot version in `docs/PROJECT.md` is the last **Stable** (already so), never a Preview.
- For the Preview-stays-on-Preview choice: `release-finish.ps1 -Tag` for a Stable also reminds the author to publish the next Preview, and a test shows `preview.json` ends at the highest version whatever the order of publishing.

## 11. What a copy is offered, and the update modes (ADR-0094, 2026-11-14)

The rule of the channels (section 1) is unchanged. What a copy is **offered** is:

| The copy is on | What exists that is higher | The card (Ask) and the manual check show |
|---|---|---|
| Preview | a newer Preview only | that Preview |
| Preview | a newer Stable only (no Preview line yet) | that Stable, marked as switching to Stable |
| Preview | **both** | **two choices**: the Preview (staying, highlighted) and the Stable (switching) |
| Stable | a newer Stable | that Stable |
| Stable | only a Preview | nothing: Previews are not announced; a person tries one by being given its installer |

A Stable cut from a Preview line contains the code of that line up to its last Preview, so switching from a Preview to a higher Stable loses no feature the person already has (it has fewer than the newest Preview).

| Mode | Behaviour |
|---|---|
| **Auto** | installs by itself only an update in the copy's **own channel**, when the person is not busy; never switches channel |
| **Ask** (default) | the card, with the second choice when there is one |
| **Off** | no background check |
| **Manual check** (Settings) | works in every mode; on a Preview it lists both candidates, each with its own install button, and says which channel the copy is on |

**Manifests:** `updates/latest.json` holds only the newest **Stable**, `updates/preview.json` only the newest **Preview**; a Preview copy reads both, a Stable copy only the first. This replaces the earlier rule that `preview.json` shows the newest of both channels (sections 3 and 6, and ADR-0093 point 3, are amended by ADR-0094). **It takes effect only after the app can read two manifests and has been released in a Preview** (plan PV-10 to PV-12); until then the earlier rule stands, and the copies built before (0.5.0 to 0.7.1) keep reading only `preview.json`. **No downgrade by the updater**; a lower Stable is installed by hand.

## 12. Not verified

**Tried on 2026-11-13** with Preview 0.7.0 then Stable 0.6.0 on the same day: pruning per channel, `preview.json` staying at the newest version when a Stable is published after a Preview, and the Preview line starting before the Stable is published (testers skip it). **Not tried:** the in-app updates that cross the two (Stable 0.4.2 to 0.6.0, Preview 0.5.1 to 0.7.0), a Preview taking a Stable, and the release-branch route. The cycle above is reasoned from the code (`updater.rs` compares versions as semver and takes the first manifest address that answers) and from the two Previews published so far (0.5.0, 0.5.1).
