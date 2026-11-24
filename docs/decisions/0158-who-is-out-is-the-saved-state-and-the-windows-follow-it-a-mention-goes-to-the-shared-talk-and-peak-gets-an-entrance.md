# ADR-0158: Who is out is the saved state and the windows follow it; a mention goes to the shared talk; Peak gets an entrance (DU-12)

- **Status:** accepted on 2026-11-24 for the prototype (the branch `exp/duo-prototype`, nothing ships, ADR-0139). After the author tried ADR-0157, a review ([duo-mentions-review.md](../plans/duo-mentions-review.md)) found the causes of "`@Peak` does not bring Peak out" and "it answers but does not appear"; the author chose the recommended option of each of six questions. Amends ADR-0145, 0152 and 0157.
- **Date:** 2026-11-24
- **Decided by:** Vinh (author)

## Decision
1. **D1, one source of truth.** Who is out is the saved state. The windows follow it and are **set**, never switched: a pet is shown or hidden to match, and a check puts a window right if it disagrees (and writes a line in the log). The away flow ("Luợn đi") writes the state too (away is a tuck), so a hidden Peak is never "out" on paper.
2. **D2, `@P` with both out.** Only P answers; the other may glance at it. The old single-pet chat is only for "Peak is the only pet out".
3. **D3, `@P` alone.** P comes out and answers in its own words (the model gets the bare mention and greets).
4. **D4, limits and Quiet.** A mention still brings the pet out (the person asked). The daily limit gives its line; Quiet gives none.
5. **D5, a call that fails.** A pet that is out says one short line (for example that the other is busy). It is not silent.
6. **D6, Peak's entrance.** Peak comes out as Paws does: it walks in from its remembered edge. The pet is on the screen before its first line starts (the wait is for the pet, not a fixed time).

## Why
Peak's window is always there and only hidden, and it was switched on and off; the state and the window could disagree both ways, which made a mention find nothing to call. Paws never had this (its window exists only while it is out).

## Consequences
- Rust: a `set` for Peak's window used by every path (tray, call, away, return), a periodic check, an entrance for Peak, a command that says whether a pet has arrived. Page: the routing and the order in `sendChat` and `tryTalkFromChat`, the line for a failed call.
- The entrance is motion: the author looks at a test build before it is committed (rule 8). V-204 holds what is not yet checked.
