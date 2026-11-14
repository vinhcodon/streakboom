# ADR-0109: "Step aside" on the double right click, and one table of named actions

- **Status:** accepted (the author chose all four points on 2026-11-14); **built since the same day** (IM-1 to IM-4, ADR-0111; Stable 0.10.0), and seen working by the author on a real screen (Preview 0.9.6 and 0.9.8). The audit and the proposal are in [`../../spec/17-input-map.md`](../../spec/17-input-map.md). Builds on ADR-0055 (the right click is a push) and ADR-0103 (skills are files).
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Decision
1. **A new action `step_aside`** (typed: xê ra, tránh ra, nhường chỗ, move over, step aside, どいて and others; table only, never named by the model). Peak looks at the pointer, then moves away from it along its surface, never leaves and never falls; if it has no room it hops to another row or stays and nods. A skill file `aside.skill.json` with a new verb `step_aside` (the verb's own ADR when built).
2. **Its gesture is the double right click.** A single right click stays the push (`shove`). The two are told apart by a wait of **about 250 ms** after a right click (as the left click already waits for the double click): two right clicks inside it are `step_aside` and no push; one is the push after the wait. The typed phrase always works (a trackpad makes a double right click awkward).
3. **A hint, once:** after Peak has been pushed several times in a short while it says one line, once only in a lifetime, that the person can also say *xê ra* (three languages, under the banned-patterns test, one line in `lines.ts`'s style). No setting.
4. **One table of named actions:** `app/src/lib/bindings.ts` holds the names, gestures, gates and implementing skills of spec 17 section 5, with tests (one action per gesture, one skill per phrase, the closed list of gestures). A new gesture is an ADR. There is no remapping and no global key (charter, few settings; article 4).

## Consequences
- The push starts 250 ms later than today. Accepted by the author.
- Stories IM-1 to IM-4 in `docs/plans/backlog.md` (epic E24).
- Not verified: everything (nothing is built).
