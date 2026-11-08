# ADR-0022: North star: Bond Days, with decisions D1 to D8

- **Status:** accepted (built; released in 0.1.15)
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
The north star must measure the bond and must not reward chat usage.

## Decision
Fixed: chat does not count; no alpha targets until a baseline exists; the chat cap is watched as chat share; per-day counters are added to telemetry, counts only, same opt-in. Answered: D1 commit the revert of the accidental prototype and do not release yet; D2 new wording plus a consent version, people who agreed before are asked again; D3 a double-click on an unprompted line counts as engaged, a typed message never; D4 shown means periodic proactive lines and milestones only; D5 retention is presence in days n to n+1 after first launch; D6 min skips machine sleep, present means at least 5 minutes; D7 add the quiet counter, hide-pet rate later; D8 the export adds config and autostart.

## Alternatives considered
Counting chat (rejected by the author); counting pokes as care (outside).

## Consequences and when to revisit
Built on 2026-11-08 following docs/plans/bond-days.md (bond.ts, consent version 2, the second Privacy switch); released in 0.1.15 on 2026-11-08, which replaces the accidental prototype that 0.1.14 installers contained (R1: no separate release for the removal).

## Sources
spec/05-north-star-metrics.md
