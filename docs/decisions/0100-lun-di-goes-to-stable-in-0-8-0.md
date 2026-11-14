# ADR-0100: "Lượn đi" goes to Stable in 0.8.0

- **Status:** accepted (the author ordered the promotion on 2026-11-14 after trying Preview 0.7.6); carried out as Preview 0.7.7 (the last of the 0.7 line) and Stable 0.8.0. **Lifts point 4 of ADR-0097** ("only a Preview build") and the Preview-only condition of ADR-0098. Follows spec 16 (ADR-0093) for how a Stable is cut.
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
"Lượn đi" and the model's skill tag lived on the Preview channel only. The author tried them through Previews 0.7.3 to 0.7.6 (a success, a miss fixed by taking fillers off, then "works well", then the audit fixes, reported OK) and ordered Stable 0.8.0.

## Decision
1. **The Preview-only gate is lifted** in the last Preview of the line, 0.7.7: any build may send Peak away (the table and the model's tag), under the gates that stay (not in Quiet mode, not carried, not in the air, not away or leaving). The chat persona of every build now carries the skills layer. A Preview copy behaves exactly as in 0.7.6; the change reaches Stable copies.
2. **Stable 0.8.0 is cut from the commit of Preview 0.7.7** with only the version files and the release documents changed (spec 16), and **Preview 0.9.0, the first of the next line, is published the same day** so that a Preview tester has a Preview to go to after the Stable.
3. What Stable 0.8.0 carries from the 0.7 line, for the notes: Peak keeps still and quiet in a full-screen program, a presentation or a locked screen (AP-08); one update on offer at a time, a test build only by hand, a "Test builds..." step for a Stable copy (ADR-0095); "Lượn đi" with a goodbye, a walk to the nearer edge, a return after 20 minutes or at once from the tray, understood from a table of phrases and by the chat model; the counters `leave` and `callback`, apart from Bond Days.

## Consequences
- **Known and accepted:** the model's false-tag rate on a real model is **not measured** (the harness of H20 was not reported run), and the author's report of 0.7.6 was "OK" without listing the checks of `docs/plans/lun-di-checklist.md` one by one. They stay in `verification-debt.md` as not seen.
- A Stable copy's chat persona now carries a short added paragraph; nothing new is collected or sent.
- The notes of 0.8.0 say plainly what has not been tried.
