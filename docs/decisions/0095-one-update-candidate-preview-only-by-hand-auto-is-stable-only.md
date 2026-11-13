# ADR-0095: One update candidate; Preview is offered only by hand; Auto is Stable only

- **Status:** accepted as a **direction** (the author's proposal of 2026-11-14, with his answers to three questions as multiple choice); nothing is built. **Replaces points 2 and 3 of ADR-0094** (two choices; Auto in its own channel); points 1, 4 and 5 of ADR-0094 stand (no update-channel setting, separate manifests, no downgrade by the updater). The work is stories PV-10 and PV-11 of [`../plans/preview-channel-plan.md`](../plans/preview-channel-plan.md), each approved before code.
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The author preferred a simpler model than a card with two choices: the website shows only Stable; the in-app Preview update exists only when the person checks by hand; one version is shown at a time; automatic updates are Stable only. Taken literally, every Stable user who checked by hand would be shown a Preview whenever one exists (a Preview number is always higher than the Stable), so they would never see "up to date", and the check would advertise test builds to everyone, against ADR-0089. Three points were put to him.

## Decision
1. **One candidate, by this rule:** the **newest Stable that is higher than the copy in hand**; if there is none, **and the copy is itself a Preview**, the **newest Preview that is higher than the copy**; else nothing ("you have the latest version"). A Preview copy that has both a newer Stable and a newer Preview is shown the **Stable first**; the Preview is shown by the next check (two clicks at a promotion).
2. **A Stable copy is not shown a Preview in the result of the check.** It sees "up to date". Under that result there is a small link, **"Test builds..."**, a second deliberate step with a plain warning (a test build may have rough edges and can change; to go back, install the Stable installer by hand) and a confirmation; only then is the newest Preview shown, and installing it makes the copy a Preview. The website and the README never mention it.
3. **Background checks (the Ask card and Auto) look at Stable only**, never at a Preview.
4. **Auto:** on a **Stable** copy it installs the newer Stable by itself when the person is not busy; on a **Preview** copy it **behaves as Ask** (it asks once; it never moves a tester to Stable silently).
5. **The manifests are separate** (ADR-0094 point 4 stands): `updates/latest.json` only the newest Stable, `updates/preview.json` only the newest Preview. A Stable copy reads `latest.json`, and `preview.json` only after the confirmation of point 2; a Preview copy reads both. **No downgrade by the updater** (ADR-0094 point 5).
6. **No update-channel setting.** The channel (the "Preview" label in About, nothing else in the updater) still comes from the parity of the middle number (ADR-0090); the updater itself no longer needs it.

## Consequences
- **Simpler to build and to read:** no card with two buttons; one candidate; the manual check and the confirmation are the only new surfaces.
- **Order of work:** the app first (PV-10: the rule, the two manifests, a test of every case of the table in spec 16 section 11; PV-11: the check result, the "Test builds..." step and the confirmation, in three languages, which the author looks at in a test build before they are committed); only then PV-12 (`preview.json` holds only Previews). Copies built before (0.5.0 to 0.7.1) read only `preview.json` as it is.
- **Not yet tried:** any of it. The "Test builds..." wording and its warning are for the author to read in the three languages.
