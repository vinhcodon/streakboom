# ADR-0168: T0a is an integration baseline with recorded exceptions; what each experiment-off difference must meet before it reaches main

- **Status:** (amended by ADR-0172, 2026-11-28: B1 is investigated before T2b; E3 completed by ADR-0173) accepted on 2026-11-28 for the duo experiment. It authorises no merge, release, key use or art, and does not start T0b. Amends the T0a acceptance of ADR-0167 and, for the flag off, ADR-0143 and ADR-0161.
- **Date:** 2026-11-28
- **Decided by:** Vinh (author): one multiple-choice question on the criterion and four on the differences, each answered with the app session's recommendation. Recorded by Claude (the app session).

## Context
T0a (issue #20) was delivered as `claude/t0a-baseline@69632fbc35d34a3097d17dafd973c2108bec717b`. Codex returned it (comment 7231315842): its acceptance says "experiment off unchanged", and the delivery reports six differences from `main` with the experiment off, all inherited from `claude/issue-19-queue@701a394`. ADR-0165 compared T0 with 701a394 and did not say whether "unchanged" meant against `main`. Live runs with the experiment off also failed: B1 (the first interactive bubble did not take the keyboard, both runs; in the second, Esc did not hide it) and A4 (the harness received `pasive` for `passive`, both runs; the cause, app or harness, is not known).

## Decisions
1. **T0a is accepted as a baseline with exceptions, measured against 701a394.** "Experiment off unchanged" means: the integration introduces no change of behaviour against `claude/issue-19-queue@701a394` beyond what the pinned `main` brings (the #8 wording). It is not a claim of parity with `main`. That the source differs from 701a394 only in that wording was checked by reading; the same behaviour has not been shown by running both builds.
2. **Every difference from `main` and every unresolved finding below is open until its gate is met, and all of them are gates before any merge into `main`.**

| Item | What differs with the experiment off | Disposition | Owner and gate |
|---|---|---|---|
| E1 | Purposeful walks at 60 px/s (`main`: 110, climb 105), leave deadline up to 46 s | **Only with the experiment on.** With it off, `main`'s pace | A parity task, not yet opened; before any merge into `main` |
| E2 | The person cannot name the pet (ADR-0143) | **Only with the experiment on.** With it off, naming works as on `main`; stored data is unchanged | The same parity task; before any merge into `main` |
| E3 | The passive bubble does not take the focus | **Keep for both, once B1 is cleared** | T3b; merged only when B1 is fixed or shown not to come from E3 or E4 |
| E4 | Windows are shown and hidden with the system call pair | **Keep for both, once B1 is cleared** | T3b (gated on #14); same condition |
| E5 | Mood tags: leading, misspelt and inner tags are removed | **Keep for both** | No condition beyond the ordinary review of the merge |
| E6 | Peak calls itself by mood in Vietnamese (ADR-0156) | **Decided later**, after real replies have been read (V-202) | The author; before any merge into `main` |
| B1 | The first interactive bubble does not take the keyboard | **Unresolved.** A bounded investigation continues under #20 | T3b if still open; before any slice relies on the first interactive bubble taking the keyboard (T2b at the earliest), and before any merge |
| A4 | A typed letter missing while a passive bubble shows | **Unresolved, cause unknown;** keyboard retention while the bubble appears is unverified. Not asked about on its own; recorded with B1 | T3b; same gate |

The grouping of E3 to E5 was one question; the answer ("keep, after B1 is clear") puts the condition on E3 and E4, which B1 may involve; E5 does not touch windows.

## Why
The branch is an experiment that is not merged, so work on the group visit can go on from a pinned tree, while nothing that changes the solo pet reaches `main` by accident: ADR-0164 keeps solo as Peak is today.

## Rejected
- **Keep the criterion as parity with `main`:** guard or revert everything before T0b; more work before any slice.
- **Postpone the choice** until B1 is explained or the prototype is tried.

## Consequences
- T0a still needs the signed correction, the added limitations in V-214 and the bounded B1 and A4 work that Codex asked for, then Codex's verification of the amended acceptance. This record does not accept T0a by itself.
- A parity task (E1, E2) is to be opened before anyone asks to merge; it is not opened by this record.
- T0b starts only on the author's order.
