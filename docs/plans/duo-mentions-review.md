# The @ mention in the duo chat: a full review and a plan (DU-12)

Written by Claude (Anthropic) on 2026-11-24, after Vinh tried ADR-0157 in a test build and found that `@Peak` did not bring Peak out, and that a message that only names a pet is answered without the pet appearing. Vinh asked for an analysis and a complete plan **in a document before any change**. Nothing here is built; every choice for Vinh is at the end (section 6). Statements are marked **Observed** (seen in the code or in a run), **Inferred** (read from the code, not run) or **Opinion**.

Scope: the behaviour of `@Peak`, `@Paws`, `@everyone` and the names without the `@`, from the chat box to the pets on the screen. Branch `exp/duo-prototype` only (ADR-0139). It amends nothing yet; ADR-0145, 0152 and 0157 stay as they are until Vinh decides.

## 1. What the three ADRs say today

| ADR | Rule |
|---|---|
| 0145 | A message goes to every pet that is out; a name picks one; a name of a pet that is in sends the message to whoever is out. |
| 0152 | `@` opens a list (Peak, Paws, everyone); `@everyone`, `@all`, `@both` mean whoever is out; a double click on a pet writes its mention. |
| 0157 | An `@` at the start of a message **calls** the pet if it is in (the same as `/call`), and then the message goes to it. A plain name and a mention in the middle call nobody. |

The code that does it: `summons()` and `addressees()` in `app/src/lib/duo-command.ts`; `sendChat` and `tryTalkFromChat` in `app/src/routes/+page.svelte`; `duo_command`, `apply`, `request_out` in `app/src-tauri/src/duo.rs`; `toggle_visibility` in `lib.rs`.

## 2. Findings

**F1. The presence (the saved state) and the window can disagree. Observed, and it explains what Vinh saw.**
After Vinh's session the dump of the program said `peak out=true` while `main visible=false`: Peak "was out" on paper and not on the screen. Then `@Peak` finds nothing to call (it is already "out"), the message goes to Peak, Peak answers, and nothing appears. That is exactly "it answers but it does not appear". The same session shows the other direction: with `peak out=true` and the window hidden, the command to send Peak in **showed** it (state `out=false`, window `visible=true`). Both were reproduced on the running build through the developer channel and put right afterwards.

**F2. The cause of F1 is that the window is switched, not set. Observed in the code.**
`toggle_visibility` (used by `apply` for Peak) shows a hidden window and hides a visible one, whatever the state says. Sending Peak in, bringing Peak out, the tray, the timer that brings Peak back after "Luợn đi", and Peak's own page can all change the window without the state, or the state without the window. Paws does not have this problem because its window exists only while it is out (it is made and destroyed). Peak's window is always there, only hidden. **What first made Peak's window and state disagree in Vinh's session is not proven**; the candidates are the away flow (`pet_leave` hides the window and does not touch the duo state) and a double toggle. A run that records the order is part of the plan.

**F3. `@Peak` with Paws out goes to the old chat of Peak alone. Inferred.**
In `tryTalkFromChat`: `if (to.length === 1 && to[0] === "peak") return false; // Peak alone: its own chat, as before`. That line was written for "only Peak is out"; it is also true for "both are out and the message names Peak". The message then takes the single-pet path (its own bubble, its own limit, no shared talk room), and Paws does not hear it. Not run yet.

**F4. The person's message is filed before the call, for the wrong pet. Inferred.**
`sendChat` writes the message into the talk with `addressees(text, out)` computed **before** `tryTalkFromChat` brings the pet out. With Paws in and `@Paws` typed, the message is first filed as addressed to Peak and then answered by Paws. The box shows one pill so it looks right, but the room (what the pets "heard") has the wrong addressee for that turn.

**F5. The wait for the pet is a fixed 0.7 s and a poll of the saved state. Observed.**
`duo_presence` reports the **state**, which is set at once, so the poll ends at the first look and the 0.7 s is the whole wait. Paws needs its window to be built and to slide in; the answer may start before it has arrived. Peak has no walk-in at all: it appears where it was.

**F6. Peak has no entrance. Observed.**
A pet that comes out should be seen to come. Paws slides in from its edge; Peak is simply shown in its old place, which may be behind another window or far from where the person looks. Vinh's "I did not see it come out" may be this, or F1, or both. Not separated yet.

**F7. What a mention does with the limits and with Quiet is undecided. Inferred.**
The call is made before the gate for the daily limit and before the Quiet check, so a pet can come out and then only say that the limit is reached, or stay silent in Quiet after coming out. Quiet is "the pets are silent"; calling a pet out is the person's own act, so it should probably still happen, but nobody decided.

**F8. The edge cases of the grammar. Inferred.**
`@Paws` alone (nothing after it), `@Paws,` with a comma, `@Paws và @Peak`, `@everyone` when nobody is out, a mention of the pet that is already out and a name of the other pet in the middle ("@Peak ask Paws ..."), and the relay rule ("hỏi Paws ...") together with a mention. The tests cover the grammar of `summons()` only, not these in the whole flow.

**F9. A call that changes nothing is silent. Observed in the code.**
`duo_command` returns false when the program is busy (another call is in progress) or the pet is already out; the page then goes on as if nothing was asked. The person sees a message with no pet appearing and no reason.

## 3. The behaviour to aim for (the scenarios)

`P` = the pet named. "Out/in" = on the screen / resting. The target behaviour is a proposal; the choices that are Vinh's are in section 6.

| # | Situation | Target behaviour | Today |
|---|---|---|---|
| 1 | `@P text`, P in, the other out | P comes out (seen to come), then answers; the other hears it too (shared room) | Paws: works. Peak: F1, F3 |
| 2 | `@P text`, P in, nobody out | P comes out, then answers | Paws: works (observed). Peak: not run |
| 3 | `@P text`, P out, the other in | P answers; nothing else moves | works for Paws; Peak goes through F3 |
| 4 | `@P text`, both out | only P answers; the other may glance | F3 for Peak |
| 5 | `@P` alone (no text) | P comes out and says a greeting line (or only comes out) | undecided (D3) |
| 6 | `@Peak @Paws text` | both come out, both answer, one after the other | called both; the talk is shared |
| 7 | `@everyone text` | whoever is out answers; nobody is called | as designed |
| 8 | `@P` in the middle, or `P ơi` | no call; goes to whoever is out (ADR-0145) | as designed |
| 9 | The call fails (busy, a scene, "Luợn đi") | a short line from a pet that is out, or the message waits for the call | silent (F9) |
| 10 | The daily limit or the cooldown | P comes out and says the limit line (or does not come) | undecided (F7) |
| 11 | Quiet is on | P comes out (the person asked), speaks nothing | undecided (F7) |
| 12 | `@P` while a scene runs, or Peak is held, or is away | the scene ends (as for any touch); an away Peak stays away unless asked | not run |
| 13 | Presence and windows disagree | cannot happen: the window follows the state | F1, F2 |

## 4. The plan

**Principle (opinion).** One source of truth for who is out: the saved state. The windows follow it and are set, never toggled. Everything else in this review is a rule on top of that.

**DU-12.1 — one source of truth.** Replace the switch with a set: `set_pet_visible(Peak, want)` that shows or hides the window to match, used by `apply` and the tray, and `pet_leave`/`pet_return` write the state too. At the start and after every change, a small check compares the state with the windows and puts the window right if they disagree (and writes a line in the log). Acceptance: after any sequence of calls (in, out, tray, away, return) the dump shows `out` and `visible` equal for both pets; a test script runs 200 random steps and asserts it.

**DU-12.2 — route a mention to the shared talk.** A message that names one pet (`@P`) goes to the shared talk with `to=[P]` whoever else is out; the legacy single-pet path is only for "Peak is the only pet out and nothing else is named". File the person's turn after the call, for the right pet (F4). Acceptance: with both out and `@Peak text`, the room's turn is `person → peak`, the limit counted is the duo's, and Paws may react.

**DU-12.3 — a visible entrance and a real wait.** Peak gets an entrance (the same edge walk-in as Paws, or at least a short, visible appearance with its page told to wake); the wait is for the pet's window and entrance to end, not 0.7 s. Acceptance: the pet is on the screen before its first line starts, and the first line starts within 1 s of arriving. (This is motion: Vinh looks at a build before it is committed, rule 8.)

**DU-12.4 — say it when it fails and honour the limits.** A call that changes nothing gives one short line from a pet that is out, in its own voice. The order for the limits and Quiet is the one Vinh picks in D3 and D4.

**DU-12.5 — the whole matrix as a script.** `scripts/windows/duo-mentions.ps1` (it exists for the list) grows into the table of section 3: each row is a start state, one message, the expected windows and the expected addressee in the log. It runs on the real program with real mouse and keyboard. Rows that need the second monitor or the model stay in `verification-debt.md`.

Order: 12.1 first (everything else rests on it and it is a bug, not a choice), then 12.2, 12.5 (so the fixes are measured), then 12.4, and 12.3 last because it is motion and needs Vinh's eyes.

## 5. How it will be checked

- The invariant "state equals window" is asserted in the dump after every row of the matrix.
- Each fix gets its test in `duo-command.test.ts` / `chatbox.test.ts` (pure rules) and a row in the script (real windows).
- What I cannot check stays in the debt list: a second monitor, a real model answering, IME in the box, behaviour while a scene runs.
- ADR-0157 is amended, or a new ADR is written, **after** Vinh answers section 6.

## 6. Decisions for Vinh (multiple choice)

- **D1. Source of truth.** A: the saved state, the windows follow it (recommended: it is how Paws already works and it removes F1). B: the windows, the state is read from them. C: leave both and add a repair step only.
- **D2. `@P` with both out.** A: only P answers and the other may glance at it (recommended). B: both answer, P first. C: as `@everyone`.
- **D3. `@P` alone, no text.** A: P comes out and says one greeting line (recommended). B: P comes out and says nothing. C: the box keeps the mention and waits for text.
- **D4. The limits and Quiet when a mention calls a pet.** A: the pet still comes out (the person asked); the daily limit gives its line, Quiet gives none (recommended). B: neither comes out. C: it comes out and speaks even in Quiet.
- **D5. A call that fails.** A: a pet that is out says one short line, for example that the other is busy (recommended). B: the message waits and is sent when the call is done. C: silent as now.
- **D6. Peak's entrance.** A: the same walk-in as Paws from Peak's remembered edge (recommended, more work, motion). B: a short appear effect in place. C: none.

## 7. Not verified

Nothing in section 3 beyond rows 1 (Paws) and 2 (Paws) was run on the real program. F3 and F4 are read from the code, not run. The cause that first desynchronised Peak's window in Vinh's session is not proven (F2). The measurements for F1 come from the developer channel on one build, one monitor, 125% scale.
