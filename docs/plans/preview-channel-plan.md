# The Stable and Preview channels: the steps (ADR-0090)

**Status:** proposed 2026-11-13, **waiting for Vinh**; nothing is built. Decision: [`../decisions/0090-stable-and-preview-channels-by-the-parity-of-the-middle-number.md`](../decisions/0090-stable-and-preview-channels-by-the-parity-of-the-middle-number.md). Related: ADR-0089 (informal tryouts), ADR-0072 (the hybrid release flow), [`../releasing.md`](../releasing.md). **No app code, workflow or script is changed until Vinh approves the step that does it.**

**The rule in one line:** an even middle number is Stable (0.4.x), an odd one is Preview (0.5.x); a Preview goes to its next patch or to the next Stable (0.5.x to 0.5.x+1 or 0.6.0); Preview and Stable share the data files; Preview may only add fields; Preview releases are GitHub pre-releases; the first Preview is 0.5.0.

## Steps, cheapest first

| ID | Step | Code? | Size | What it settles |
|---|---|---|---|---|
| PV-0 | **Check the unknowns without shipping anything:** build a throwaway installer with a higher and a lower version in a scratch folder and see whether NSIS installs over each; read how `tauri-plugin-updater` compares versions (0.4.2 against 0.5.0 and 0.6.0); confirm from GitHub's documentation and one throwaway release that `releases/latest` skips a pre-release | No (a scratch build and a deleted release) | S | The three open facts of ADR-0090 |
| PV-1 | **The channel from the version.** A pure function `channelOf(version)` (even middle number is stable, odd is preview) and the choice of manifest address in `app/src-tauri/src/updater.rs` (`latest.json` or `preview.json`, fallback to the release asset as now); "Preview" in the About page and in the update prompt; tests | Yes | S | The app knows its channel with no setting |
| PV-2 | **The data rule.** A test that the Stable parser reads a `pet.json` and a `memory.json` written with extra fields (the Preview case) and keeps the known ones; the additive-only rule written in `docs/development.md`, `AGENTS.md` and `CONTRIBUTING.md` | Yes (tests) and docs | S | A person can go back to Stable without losing the known data |
| PV-3 | **The Preview build in CI.** `ci-release-prepare.ps1` accepts a tag whose middle number is odd, writes the Preview version into `tauri.conf.json`, `Cargo.toml`, `package.json` **in the workspace only**, reads the notes from `CHANGELOG-preview.md`; `release.yml` makes the draft with `--prerelease` for these tags | Yes (workflow and script) | M | A Preview installer built by CI from `main`, with `main` untouched |
| PV-4 | **Finishing a Preview.** `release-finish.ps1` for a Preview tag: the manifest goes to `updates/preview.json`; publish with `--prerelease` and never `--latest`; prune the newest two of each channel (`Select-ReleasesToPrune` takes the channel); tests in `test-release-lib.ps1` | Yes (script and tests) | M | The in-app update for Preview, through the author's key, as for Stable |
| PV-5 | **The website stays true.** The website session checks that its release check (ADR-0065), the download button and the changelog read only Stable releases and `CHANGELOG.md`; the handoff note [`../handoff/website-preview-channel.md`](../handoff/website-preview-channel.md) says what to look at | No (a note); the site by the website session | S | The site never shows a Preview as the download |
| PV-6 | **The first Preview, as a rehearsal.** Tag `v0.5.0` builds in CI; the author finishes it; installs it over 0.4.2 on his computer; then a 0.5.1 arrives by the in-app update; the data is read back by 0.4.2's parser in a test | Release (ordered by name) | M | The whole channel works end to end |
| PV-7 | **A Stable fix while `main` carries unfinished work.** A release branch of the Stable line (for example `stable-0.4`), the check "the tag is on main" relaxed for it, and a rule that the fix is merged forward | Yes (workflow) | M | Needed only the day a Stable fix cannot wait for `main` |
| PV-8 | **Docs in the same commit as each step:** `releasing.md`, `PROJECT.md`, `README.md` (a line on the two channels, and the install guide's link to Preview, which the site shows only if Vinh decides), `CONTRIBUTING.md` | Docs | S | The documents stay true |

## Order and gates
PV-0 first (it can kill or change the plan), then PV-1 and PV-2 together, then PV-3 and PV-4, then PV-5, then PV-6. PV-7 only when needed. **Gate:** after PV-6 the author decides whether to hand the Preview installer to anyone (adults only, ADR-0089).

## Risks
- **`releases/latest` choosing a Preview** if one is published without the pre-release flag: the first rehearsal checks it, and the publish step refuses an odd-minor tag without it.
- **The website build turning red** if `main` ever says a Preview version: the version is written only in the CI workspace.
- **The notes of a Preview leaking into the changelog or the home page:** they live in `CHANGELOG-preview.md`.
- **One more path to keep true:** two manifests, two pruning sets and two kinds of tag. The plan keeps one script and one workflow for both.
- **A person on Preview stuck** when a Stable fix is needed: they get it with the next Stable or by installing it by hand; the updater never moves down.

## Not verified
Everything in PV-0: how the NSIS installer behaves over a higher or lower version, how the updater compares 0.5.x with 0.6.0, and what `releases/latest` does with a pre-release. None of it has been tried.
