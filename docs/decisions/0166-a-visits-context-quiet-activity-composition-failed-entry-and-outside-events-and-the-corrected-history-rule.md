# ADR-0166: In a group visit: what the second pet hears, Quiet and unsent messages, activity against closing, typing composition, a failed entry and outside events

- **Status:** accepted on 2026-11-27 for the duo experiment. **Nothing is built from it.** It stays behind `STREAKBOOM_DUO`; no merge, release, key use or art is authorised. Amends ADR-0165 (and corrects one sentence of it).
- **Date:** 2026-11-27
- **Decided by:** Vinh (author): option (a) on six multiple-choice questions. Recorded by Claude (the app session).

## Context
Codex reviewed the state table of ADR-0165 (task T1; issue #1, comment 7212867819) and found rows without one testable outcome and six gaps in policy. The reply, with a second table and the source cross-check, is comment 7212933679. One gap was an error of the app session: ADR-0165 says the model is sent rows "that were shown and that the recipient heard", while the accepted build of #18 lets the next pet of the same turn hear a line before it is shown. Read at `claude/issue-19-queue@701a394` by source only.

## Decisions
1. **Q1, what a pet hears.** As accepted in #18: a pet of the **same turn** may hear a line that is not yet shown; when it is cancelled it is removed from the talk before any later turn is built. The person's own message and shown lines stay. A request already sent is not changed after the fact. This **replaces** the sentence of ADR-0165 "what the model is sent (rows that were shown and that the recipient heard, never cancelled ones)": cancelled lines are never sent to a later turn; same-turn recipients may hear a line before it is shown.
2. **Q2, Quiet and unsent messages.** A queued invitation stays and takes effect silently. Other messages not yet sent go back to the draft; nothing is sent again by itself. Pending speech of the pets is dropped (#11); shown history and membership stay. Turning Quiet off brings nothing cancelled back.
3. **Q3, activity against closing.** The pointer on the box, typing, a draft or the pin reverses an **automatic** fade; closing on purpose is final. After a hold or an interruption the 20 seconds start again from nothing. Esc keeps its order (ADR-0159: first clears the field, again hides; composing keys and open lists first).
4. **Q4, composition.** The surface does not change while a word is being composed: the committed text is sent first, then the group opens and the text moves once. The program never ends a composition itself.
5. **Q5, a failed entry.** The invitation and what waits behind it come back as unsent text in their order; nothing is rerouted to Peak alone and nothing retries by itself. No call and no charge before dispatch. The length of the entry deadline is an engineering value for review, not a setting.
6. **Q6, outside events.** Dragging, pushing or touching Peak, its sleep, Lượn đi and a hide from outside do not end a visit, and Peak is not shown or woken for Paws (a touch on Peak still cancels pending talk, as today). If the box window is lost, the visit ends and unsent text returns to the surviving input. The box shortcut, a double click and a second start of the program focus the existing box in a visit and wait during entry or ending; they never override a close.

## Why
It keeps what was already accepted and tried where one exists, never throws away what the person typed, never lets a window or a timer override a deliberate close, and leaves each situation with one result that can be checked.

## Rejected
- Q1: only shown lines (slower two-pet turns, new acceptance). Q2: queue until Quiet ends; send as silent turns. Q3: resume the clock, a pin that cannot reverse a started fade. Q4: ending the composition by program. Q5: send the later messages to Peak alone; a retry-or-cancel prompt. Q6: any hide, leave or lost window ends the visit.

## The state table, second version
**Standing of this table:** it was offered as a proposal in comment 7212933679 and is recorded here with the six choices applied, so that Codex can finish T1 against one text. The author approved the six decisions above; **he has not approved the table row by row, nor the task split of that comment.** Where it and ADR-0165's table differ, the decisions above govern and the difference is for the T1 review.

Terms: `mid` message id; `g` visit generation; **commit** = the box has acknowledged shown for the current `g` AND membership is saved; **end** = the instant `g` is invalidated; **P** = a call not yet settled, or a message queued, or a line not yet shown (one failure clears only its own part). Checks: **U** unit with a fake clock and held callbacks, **L** live script in the app's own windows, **H** a person. [Qn] follows decision Qn above.

| # | From / event / guard | Commit or cancel point | To | Observable result | Check |
|---|---|---|---|---|---|
| 1 | S, message with no invitation | dispatch | S | as the build with the experiment off; one counter, cap 120 | U,L |
| 2 | S, invitation, nothing pending | `mid` assigned | E(g+1) | one waiting row, exact text; 0 calls | U |
| 3 | S, invitation while A pending or showing | queued once | S | A ends in the bubble, then row 2; B before C; A not in Paws's input | U,L |
| 4 | S, close or tray hide with a queued invitation | at the event | S | invitation removed, text restored once, durable while the surface is hidden | U,L |
| 5 | S, Quiet on with a queued invitation | none | S | invitation kept; pet output pending is dropped (Q2) | U |
| 6 | E, ready acknowledgements (show, save), any order | commit | A | one dispatch per `mid`; draft moved once; duplicates ignored | U,L |
| 7 | E, another message or invitation | queued | E | FIFO; a repeated invitation adds no member | U |
| 8 | E, failure or entry deadline before commit | end | S | partial show/save rolled back; failure said; B, C, D back as unsent text (Q5); 0 calls, 0 charge | U,L |
| 9 | E, explicit close or tray | end | S | text restored once; late acknowledgement creates nothing and takes no focus | U,L |
| 10 | E, Quiet on | none | E | entry continues silently; no pet revealed or woken; commit gives A(quiet) | U,L |
| 11 | E, composition active elsewhere | commit deferred | E | no forced end of composition (Q4) | H |
| 12 | A, send or mention | dispatch | A | FIFO and recipients; each real call charged once, also if it fails or its reply is dropped | U |
| 13 | A, repeated delivery of one `mid` | none | A | no duplicate; two intentional sends stay two | U |
| 14 | A, provider error, timeout, no brain, cap | per call | A | feedback line; only that item leaves P; cap reached means a gesture or the cap line, no call | U,L |
| 15 | A, Quiet on or off | at the event | A | on: pending pet output dropped, shown rows and membership kept; unsent messages other than a queued invitation back to the draft (Q2); off: nothing cancelled returns | U,L |
| 16 | A, idle 20 s elsewhere, not P, not pinned, empty draft, pointer away | fade starts | X(auto) | box fading, membership kept | U,L |
| 17 | A, the same but P | held | A | no completion; after the last item the 20 s start again (Q3) | U |
| 18 | X(auto), pointer, key, draft, new line, pin, or work arriving, also in the completion tick | fade cancelled | A | same `g`, no membership change (Q3 for pin) | U,L |
| 19 | X(auto), complete, guards rechecked | end | X | membership ends once | U,L |
| 20 | X(auto) or A, explicit hide, tray, second Esc | end | X | latched; works while pinned; the tray hides the box only, also with Peak hidden | U,L |
| 21 | X, cleanup done | cleanup | S | unshown lines removed, unsent text restored once, shown rows kept, no waiting cue; only a new solo reply uses the bubble | U |
| 22 | X, invitation | queued once | E(g+1) after cleanup | before later C, D; duplicate completion adds nothing | U |
| 23 | any, old-`g` callback | ignored | same | no row, window, focus or charge change | U |
| 24 | any, restart or quit | process end | S | membership, history, pending work gone; counter and personal memory kept; no draft restored | U,L |
| 25 | any, day change with a call pending | existing rule | same | the existing daily-reset convention; no new rule | U |
| 26 | S, shortcut, double click, second start | none | S | solo input opens; a second start shows a hidden Peak as today | L |
| 27 | A, shortcut, double click, second start | none | A | the existing box is focused; history and counter kept | L |
| 28 | E or X, the same | deferred | E / X then S or E | no second entry, an explicit close is not overridden (Q6) | U,L |
| 29 | E or A, drag, push, touch, sleep, Lượn đi, external hide of Peak | none | same | the visit continues; Peak is not revealed or woken for Paws; a touch on Peak still cancels pending talk as today (Q6) | U,L |
| 30 | E or A, box window destroyed or reloaded; failed restore event | end | S | no membership without a box; unsent text restored in the surviving input; no focus grab (Q6) | U,L |
| 31 | E or A, display or DPI change | none | same | the box stays on screen | L |
| 32 | composing, invitation-looking text or Enter, blur and reopen | none | same | nothing is sent or invited until committed text is sent; no duplicated characters (Q4) | H |

## Consequences
- **Not verified (V-212):** nothing is built or run; acknowledgements for showing and saving the box, handling of a destroyed box window and an entry deadline were not found in the code; a second start was read only for a hidden Peak; the Peak-only path under Quiet was not checked; a returned text longer than the field's 300-character limit was not checked; Codex has not accepted the table.
- The task split proposed in comment 7212933679 (T0a, T0b, T1, T2a to T2c, T3a to T3c) replaces nothing until the author approves it.
