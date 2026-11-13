# ADR-0094: What an update offers a Preview copy and a Stable copy, and how the three update modes behave

- **Status:** accepted as a **direction** (answered by the author on 2026-11-14 as multiple choice); nothing is built. The work is stories PV-10 to PV-12 of [`../plans/preview-channel-plan.md`](../plans/preview-channel-plan.md), each approved before code. **Amends** ADR-0093 point 3 (the rule that `preview.json` shows the newest release of both channels) and completes ADR-0090 and spec 16.
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
A Preview copy reads one manifest, `preview.json`, which holds only the newest release of both channels, so when a newer Preview and a newer Stable both exist it is offered one of them and the person cannot choose. The author asked for the choice, and for how the automatic and the manual update should behave.

## Decision
1. **The channel stays the parity of the middle number** (ADR-0090); no "update channel" setting is added. What changes is what a copy is **offered**.
2. **A Preview copy is offered up to two things:** the newest Preview that is higher than itself (staying) and the newest Stable that is higher than itself (switching channel). When both exist, the card and the manual check show **both**, with staying on Preview as the highlighted default. A Stable copy is offered Stable updates only and is **never told about Previews** (they are not announced publicly, ADR-0089); to try a Preview it is given a Preview installer.
3. **Update modes** (the existing Auto, Ask, Off):
   - **Auto** installs by itself only an update **in its own channel**; it never switches channel on its own.
   - **Ask** (the default) shows the card, with the second choice when there is one.
   - **Off** makes no background check.
   - **The manual check** in Settings works in every mode, Off included; on a Preview it lists both candidates, each with its own install button, and says which channel the copy is on.
4. **The manifests are separate:** `updates/preview.json` holds only the newest **Preview**, `updates/latest.json` only the newest **Stable**. A Preview copy reads both (two small requests; a Stable copy reads only `latest.json`). The rule "`preview.json` shows the newest of both" is dropped. Publishing the next Preview line on the day of a Stable stays the practice, so that a tester always has a way to stay.
5. **No downgrade by the updater:** a Stable lower than the Preview in hand is never offered. Going back to a lower Stable is done by installing it by hand (a lower version installs over a higher one and the data is kept, tried 2026-11-13) or by waiting for the next Stable; no "Return to Stable" button is built.

## Consequences
- **Order of work:** the app first (PV-10 reads two manifests and lists candidates; PV-11 the card and the Settings text; both go out in a Preview), and only then the release script changes (PV-12: `preview.json` holds only Previews). Until then the current rule stands: copies built before PV-10 (0.5.0 to 0.7.1) read only `preview.json`, and they stay on Preview by that rule.
- **A cross-channel offer is always a click** (a Stable to a Preview copy, never an automatic install), so a person is never moved between channels without asking.
- Not yet tried: any of it; the card with two choices and the manual list are new surfaces that the author looks at in a test build before they are committed (`AGENTS.md` rule 8).
