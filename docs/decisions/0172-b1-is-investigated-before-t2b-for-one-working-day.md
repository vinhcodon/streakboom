# ADR-0172: The first interactive bubble that does not take the keyboard (B1) is investigated before T2b, for at most one working day

- **Status:** accepted on 2026-11-28 for the duo experiment. It authorises the investigation only: no fix, merge, release, key use or art, and it does not start T2b. Amends the task order of ADR-0167 and the owner of B1 in ADR-0168.
- **Date:** 2026-11-28
- **Decided by:** Vinh (author): "Investigate B1 first" on the app session's next-step question, then one multiple-choice question on the limit, answered with the recommended option. Recorded by Claude (the app session).

## Context
T2a was accepted (issue #23). The next slice in ADR-0167 is T2b, whose work includes the bubble's input. ADR-0168 gates any slice that relies on the first interactive bubble taking the keyboard on B1, "T2b at the earliest". B1 was seen in 5 of 16 probe cycles of the T0a build with the experiment off, 0 of 8 of 701a394 and 0 of 8 of main (V-214); it is intermittent, its cause is not known, and these runs neither show nor rule out a difference from 701a394.

## Decisions
1. **B1 is investigated before T2b.** This part of T3b moves ahead; the rest of T3b stays where it is. The order is now: T0a, T0b, T1, T2d, T2a (done), B1, then T2b, T2c, T3a, T3b, T3c, T4 to T6.
2. **At most one working day**, with the number of runs of each comparison fixed before they are run.
3. **If the day ends without a cause, the author is asked** what to do: go on, change how the bubble is made, or do T2b without relying on B1. Nothing follows by itself.

## Why
T2b would otherwise be built on a behaviour that sometimes fails, and its live checks on the bubble could not be read.

## Rejected
- **One day and then T2b by itself,** with its live bubble checks postponed.
- **No limit,** with T2b waiting until the defect is fixed or shown not to be from our code.
- **T2b now without relying on B1** (the other answer to the first question).

## Consequences
- The finding is reported with its evidence and what was not checked, and Codex verifies it. Whether a fix is made is ordered after the report.
- The conditions of ADR-0168 on E3 and E4 are unchanged: B1 clears them only when it is fixed or shown not to come from them.
- A4 (the harness alone drops a doubled letter; keyboard retention unverified) stays open with the T3b gate unless the same runs happen to settle it.
