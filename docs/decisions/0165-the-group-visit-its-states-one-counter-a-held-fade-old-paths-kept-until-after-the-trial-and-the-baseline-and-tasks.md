# ADR-0165: The group visit: its states, one counter with one cap, a fade that is held while work is pending, the old paths kept until after the trial, and the baseline and tasks

- **Status:** (amended by ADR-0166, 2026-11-27: the sentence on what the model is sent is replaced; Quiet, activity, composition, a failed entry and outside events decided) accepted on 2026-11-27 for the duo experiment. **Nothing is built from it.** It stays behind `STREAKBOOM_DUO`; no merge into `main`, release, key use or art is authorised. Amends ADR-0164.
- **Date:** 2026-11-27
- **Decided by:** Vinh (author): option (a) on five multiple-choice questions, then "Duyệt, ghi ADR" to the state table, the baseline and the task list. Recorded by Claude (the app session).

## Context
Codex reviewed the design of ADR-0164 and agreed with changes (issue #1, comment 7212582231). The reply with the source cross-check is comment 7212765440. Read at `claude/issue-19-queue@701a394`, by source reading only: the day's chats are one counter with two caps chosen by the experiment flag; the box's automatic fade counts the pointer, the keyboard, a draft and the pin, but not a call in flight, a queued message or a line waiting to be shown (an arriving line does reset it); the experiment flag, not a visit, switches the send queue and the caps; an interactive bubble is shown by one kind of call and hidden by another.

## Decisions
1. **Daily limit (Q1).** In the experiment build: one counter, one cap of **120** a day for solo and visits alike; every real call is counted; inviting, ending or restarting never refills it. Normal builds keep their cap. Solo in the experiment is therefore more generous than Stable.
2. **Automatic fade (Q2).** While a call is in flight, a message waits or a line is still waiting to be shown, the box does not complete its fade. The hold is released when a call fails or times out. Closing on purpose still ends the visit at once.
3. **Old paths (Q3).** The walking Paws, the portrait and the three scenes are **unreachable in the new build** and are deleted only after the author has tried it and said keep, change or stop. This replaces the sentence of ADR-0164 that removes their code from the working branch now.
4. **Tickets (Q4).** The scene part of #6 is retired and #15 is marked superseded, each saying that it was not verified as passed. The author orders when this is written on the tickets.
5. **Discovery (Q5).** One hint in Peak's chat input and in the help. Only `@paws` at the start of a message, or a short typed command (VI "gọi Paws", EN "call Paws", JA "Pawsを呼んで"), invites; a sentence that merely mentions Paws does not.
6. A key for Paws alone stays deferred.

## The states of a visit (approved)
**S** solo; **E** entering (invitation accepted, box not yet shown); **A** visit active; **X** ending. Every visit has a generation `g`; a callback with an old `g` is ignored.

| From | Event | To | Rule |
|---|---|---|---|
| S | a message without an invitation | S | as today |
| S | invitation, Peak idle | E (g+1) | one row for the person, held for the group |
| S | invitation while Peak's solo reply A is pending | S, queued once | A finishes in the bubble, including its showing; then E. A is not replayed to Paws |
| S | tray hide or the input closed with a queued invitation | S | the invitation is cancelled and its text goes back to the field; Quiet keeps it |
| E | box shown, membership saved | A | the held words are sent once, to the recipients named; the draft and the input method's state are kept |
| E | entry fails | S | say so; unsent text stays; no model call, no charge |
| E | close on purpose, or tray click | S (g invalid) | a late completion cannot open or join; the text is returned |
| E | Quiet on | E then A | membership as asked, no speech, nobody woken or shown |
| A | message, mention, repeated invitation | A | in order; a repeated invitation changes nothing |
| A | 20 s elsewhere, nothing in flight, queued or waiting to be shown, not pinned | X | the fade; pointer, keyboard or a new line cancels it |
| A | the same, with something pending | A | the hold of decision 2 |
| A | Esc or hide, tray click | X at once | also while pinned (the pin only stops the automatic fade); the tray click hides the box, not Peak |
| A | Quiet on | A | pending and queued speech cancelled (#11); membership stays |
| A | restart or quit | S | membership and history gone |
| X | cleanup done | S | unshown lines dropped, unsent text back to the field, shown rows kept as history, no waiting cue; the next line comes from the bubble |
| X | invitation arrives | E (g+1) after cleanup | nothing of the old `g` can enter |

Kept apart: membership and pending work (by `g`); the history shown (while the app runs, bounded); what the model is sent (rows that were shown and that the recipient heard, never cancelled ones); personal memory (existing rules; the group transcript is not copied into solo prompts, and Peak does not bring Paws up unasked); usage (one daily counter).

## Baseline (approved)
A new branch from `claude/issue-19-queue@701a394` (it holds #17, #18 and #19), then: merge `main` (conflicts seen only in three documents; it brings the screen-picture wording of #8, missing at 701a394); port #11 (`5e52f58`) **once Codex accepts it** (it conflicts in `conversation.test.ts` and `+page.svelte`; keep both sets of regressions); do not merge the #14 branch, which is based on `main`; review the last three commits of `exp/duo-prototype@06d16c7`, whose equivalence on this line is not proven. 701a394 stays runnable for comparison.

## Tasks (approved as a list; no GitHub issue is created by this record)
| Task | Scope | Acceptance |
|---|---|---|
| T0 Baseline | the branch above | builds; `npm test`, `npm run check`, `cargo test` reported against 701a394; the three commits reviewed; #8's text present; no intended change of behaviour; pinned SHA |
| T1 Contract | the table and decisions of this record | Codex finds each row testable; a change of policy comes back to the author |
| T2 Entry | S, E, A | idle invitation, and held A, invitation B, message C: one row and one dispatch each, one charge per real call; failure, Quiet and close during entry; an old `g` cannot join; #18/#19 regressions kept; the hint and the phrases |
| T3 Exit and surfaces | A, X, tray, double click, shortcut, bubble input | the rows above; whole and interrupted fade; the hold released on failure; pin; restart; hidden or asleep Peak; the interactive bubble shows, takes input and hides repeatedly; Vietnamese and Japanese typing recorded as a human check |
| T4 Trial | the author, the T3 build against 701a394 | a few ordinary sessions including one without a key and one attempt to discover the invitation; keep, change or stop recorded; no invented score |
| T5 Resources | the exact T3 build | solo idle, active visit, dismissed, repeated visits, teardown, with the corrected method of #9; then the budget decision of #10 |
| T6 Cleanup | only after T4 | remove the walk, portrait and scene paths; additive `pet.json` fields stay readable; specs, backlog, texts, tests |

Order: T0, T1, T2, T3, T4, then T5 and T6. No dates.

## Existing tickets
#9 continues; #3 keeps its evidence and the new build is measured in T5; #10 waits for T5; #11 is verified on its own ticket and its regressions are required on the new branch; #12 stays frozen as written and the new entry is checked in T3; #13 and #14 matter more because solo uses the interactive bubble, their criteria unchanged; #7's evidence gate is unchanged.

## Why
It makes the moments of change predictable and testable before code, keeps one honest count of what the person's key is charged, and does not delete working code before the experience that replaces it has been tried.

## Rejected
- Caps of 60 and 120 on one counter (refusal at the edge of a visit); 60 everywhere with a group message costing two.
- Fading as now and dropping pending lines.
- Deleting the old paths immediately.
- Leaving the old tickets as they are until after the trial; a hint in the help only.

## Consequences
- **Not verified (V-211):** nothing of this record is built or run; the findings in Context are source reading; whether a call has a timeout that can release the hold was not checked; the table has not been reviewed by Codex as a testable contract.
