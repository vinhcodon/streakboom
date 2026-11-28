# ADR-0167: Returned text longer than the field, closing while composing, a repeated bare invitation, and the box shortcut while Peak is hidden

- **Status:** (amended by ADR-0172, 2026-11-28: B1 is investigated before T2b) (amended by ADR-0168, 2026-11-28: the T0a acceptance) accepted on 2026-11-27 for the duo experiment. **Nothing is built from it.** It stays behind `STREAKBOOM_DUO`; no merge, release, key use or art is authorised. Amends ADR-0166; the contract and the task split below replace those proposed in ADR-0165 and 0166.
- **Date:** 2026-11-27
- **Decided by:** Vinh (author): "Theo đề xuất" to four multiple-choice questions, each with the app session's recommendation. Recorded by Claude (the app session). Where the recommendation differed from Codex's (questions 1 and 3), the app session's was chosen.

## Context
Codex's second review of the state table (task T1; issue #1, comment 7213051617) found ADR-0166 mostly executable and left three policy gaps; the reply (comment 7213564548) added a fourth from row 26 and proposed a contract. Read at `claude/issue-19-queue@701a394` by source only.

## Decisions
1. **Returned text over the limit.** The whole returned text goes into the draft, even beyond the field's 300 characters; nothing is cut. Sending is refused, with a visible note, until it is 300 characters or less; the person splits it. Boundaries between the returned messages are line breaks.
2. **Closing on purpose while a word is composed.** The visit ends at once; the box is moved or hidden only when the composition settles, so it stays a moment. A shortcut or second-start open made before the close is discarded. If the window is lost, uncommitted text cannot be saved.
3. **A new bare `@paws` while Paws is already in the group** is an ordinary message to Paws under the usual Quiet and cap rules (with a brain, one call; without one, as the accepted build behaves). Membership and the join note do not repeat.
4. **The box shortcut in solo while Peak is hidden** shows Peak and opens its chat input, as a second start of the program shows it; a sleeping Peak wakes as for a double click.

## Why
Each takes the choice that adds the least new interface, throws away nothing the person typed, keeps what the accepted build already does, and treats a key the person pressed on purpose as a wish to see Peak.

## Rejected
- 1: returning message by message for editing (new interface); refusing to queue what could not be returned.
- 2: hiding at once and losing the half-typed word.
- 3: a local acknowledgement with no call.
- 4: doing nothing while Peak is hidden.

## The contract text
**Standing of this part:** proposed in comment 7213564548, recorded here with the four choices applied, and **approved by the author on 2026-11-27 ("Duyệt và đẩy")**: these definitions, the rows and the task split, including that the read beat (`min(9000, 1500 + 55 x characters)` ms) belongs to the hold of the automatic fade and is also used for Peak's solo reply at a handoff. Codex's confirmation (task T1) is still to come; a change of policy it finds comes back to the author. No GitHub task is created by this record and none is ordered to start.

### Shared definitions
- `mid` one deliberate send; `g` visit generation. States S, E, **A**, **Xr** (automatic fade, reversible, same `g`, membership kept), **Xe** (ended: `g` invalidated and membership ended exactly once, cleanup running). Xr and Xe are internal, not modes.
- **Commit (E to A):** current `g` live AND no composition active AND the box's shown acknowledgement AND membership saved, in either order. **Nothing is shown or focused before the guard allows it**; a native effect that lands for an old `g` is undone.
- **Delivery of a line** ends when it has been presented **and** its read beat has passed. **P** = any of: a call not settled; a message queued; a line (answer, error, cap or offline feedback) whose delivery has not ended. Each item releases only itself.
- **Old-`g` work** creates no row, window, focus, request or charge and changes nothing of a newer `g`; it still settles and releases its own wait. A charge already made stays.
- **Unsent text** has one owner (the pet page), held in process memory, returned as the existing draft first, then the returned messages in order, each once, never sent by itself, never truncated (decision 1), not stored across a restart.

### Rows that change (the others stand as in ADR-0166)
| # | From / event | To | Result |
|---|---|---|---|
| 1 | S, ordinary message | S | as the pinned build with the experiment off (routing, input, focus, body, Quiet), cap 120 the one exception |
| 3 | S, invitation behind solo A | S then E | A reaches end of delivery in the bubble (answer, error, cap or offline line), then entry for B, then C; A not in Paws's input |
| 4 | S, close or tray hide, invitation queued | S | invitation and all dependent unsent messages return as unsent text; the existing draft is kept |
| 5 | S, Quiet on, invitation queued | S | invitation kept; pending pet output dropped; other unsent messages returned once; Quiet off replays nothing |
| 6 | E, commit guard satisfied | A | show, focus and one dispatch per `mid`; draft moves once; duplicate acknowledgements do nothing |
| 8 | E, failure or deadline before commit | S | owner of the deadline: the pet page; full rollback, a late success undone; B, C, D returned once; 0 requests, 0 charge |
| 10 | E, Quiet on | E then A(quiet) | invitation commits silently, other unsent messages returned, no greeting call; a hidden or sleeping Peak stays so; the box may open |
| 11 | E, composition active | E | no show, focus, membership or send; when composition ends, recheck `g`; an ended entry never resumes |
| 12 | A, send or mention | A | FIFO; a queued message is heard by no pet before its turn; charge per request actually issued |
| 14a | A, Quiet | A | no request, no charge, a gesture |
| 14b | A, no brain | A | no request; the authored greeting or offline line of #17 |
| 14c | A, cap reached or cooling down, before a request | A | no request; the pet addressed first says the cap or rate-limit line; a later pet in the same turn makes its gesture (the #19 solo cap line stays) |
| 14d | A, issued request fails or is dropped | A | charge kept; the failing pet makes a gesture, as today; rate limit starts the cooldown; whatever is shown counts in P until delivered |
| 16 | A, 20 s idle elsewhere, P empty, not pinned, empty draft, pointer away | Xr | fade; membership kept |
| 18 | Xr, activity, draft, pin, new work or an invitation, observed before the end | A, same `g` | fade reversed; an invitation here is the repeated invitation of row 7 |
| 19 | Xr, fade completes, guards rechecked in the same step | Xe | end once |
| 21 | Xe, cleanup done | S | unshown lines removed, unsent text per section 2, shown rows kept; only a new solo reply uses the bubble |
| 22 | Xe, invitation | E(g+1) after cleanup | queued once, ahead of later messages |
| 25 | any, day change with a call pending | same | oracle: `dayKey` (local calendar date, `state.ts`); the first gate or charge of the new day resets chat, proactive and note counts and keeps `coolUntil`; fixtures just before and after midnight |
| 26 | S, double click / second start / box shortcut | S | double click: solo input of the visible Peak; second start: a hidden Peak is shown (as today); shortcut: opens the solo input, hidden Peak per decision 4 (the shortcut exists only with the experiment, so there is no experiment-off comparator) |
| 28a | E, shortcut, double click, second start | E | wait for and focus the entry in progress; no second one |
| 28b | Xe, the same | Xe then S | no reopening from the old press; only a new invitation enters; deferred opens across an explicit close per (decision 2) |
| 29 | E or A, body events | same | visit kept; a direct touch cancels pending talk and may get the normal body reaction; nothing wakes Peak for Paws; shown history kept |
| 30a | E, Xr, A, box window lost or reloaded | Xe | visit ends once; unsent text returned (composition: (decision 2)) |
| 30b | Xe, loss or late show/reload acknowledgement | Xe | no second end, no revival |
| 30c | any, restore delivery not acknowledged | same | the owner keeps the text and retries idempotently when an input is ready |
| 32 | composing: prefix, Enter, blur, reopen | same | in **both inputs**, Enter confirms first; only a non-composing send creates a `mid`; text transferred once (explicit close: (decision 2)) |

### Tasks and coverage (sizes are estimates; U unit with a fake clock and held callbacks, L live in the app's own windows, H a person)
| Task | Size | Rows | Evidence and added acceptance |
|---|---|---|---|
| T0a baseline | M | - | pinned base and main SHAs, merged head, per exp commit added **and removed** lines, guards and behaviour with keep/port/omit; named #17-#19 regressions; #8 assertions; experiment off unchanged; U + build |
| T0b port #11 | S/M | - | only after #11 is accepted on its ticket; until then T0 is incomplete at that gate. #14 keeps its own disposition |
| T1 contract | S | all | this contract and the decisions of this record; Codex confirms |
| **T2d dispatch and quota (new slice)** | M | 1, 12, 13, 14a-d, 25; solo Quiet | U: duplicate and retried `mid` in one `g`; two identical sends; Quiet solo and group; no brain; failure charged; cooldown; 119 used with two pets eligible (no 121st); invite, end and **same-day restart** do not refill; rollover. L: the counter and call log on a **release** build (a dev build lifts the chat cap, ADR-0122), canned replies, with the limits of canned evidence stated |
| T2a entry and rollback | M | 2, 6-11, 22, 23, 28a | U: commit before effects, either acknowledgement order, late and duplicate, held composition, lossless restore; L: failure and close during entry. Deadline value and owner recorded as engineering parameters |
| T2b held solo, handoff, inputs | M | 3, 4, 5, 7, 32 | U: A, B, C order; read beat on a fake clock; draft and boundaries; actual-page solo cap, error and offline settlement; composition guard in the bubble input. L: handoff |
| T2c phrases and hint | S | - (ADR-0165 point 5) | U: EN, VI, JA, negatives, bare repeat per decision 3; L: the hint |
| T3a fade and end | M | 15-21, 24, 30b | U: Xr against Xe, activity winning before the end, one failure with other work pending, old callback after reinvite, history against restart and counter; L: whole and interrupted fade; old paths unreachable |
| T3b entry points and windows | M | 26, 27, 28b, 29, 30a, 30c, 31 | L: tray, shortcut, double click, second start, bubble shown, typed in, hidden and recreated (gated on #14), focus, hidden and asleep Peak, display or DPI change where available; U: restore retry |
| T3c composition | S | 11, 32, decision 2 | H on a pinned release build: input method and version, OS, DPI, steps for ordinary send, deferred entry and explicit close; unavailable stays an open dependency, not a pass |
Order proposed: T0a, T0b, T1, T2d, T2a, T2b, T2c, T3a, T3b, T3c, then T4-T6. T2d is first because the other slices rest on dispatch and the counter.

## Consequences
- **Not verified (V-213):** nothing is built or run. Observed by source and unconfirmed in use: the solo bubble input sends on Enter with no composition guard (also on `main`); the return of waiting messages to the box is sent once and a failure is ignored. Unknown: whether a window's showing can be gated before it takes focus; what destroying a window during a composition does; whether an input method delivers that Enter.
