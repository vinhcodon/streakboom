# Duo conversation: who talks to whom, how it is shown, how it is typed, and how the layers are cut

2026-11-22. A design proposal, nothing decided and nothing built beyond the prototype (`duo-prototype-notes.md`). It answers the author's remark after trying step 5: one input box on Peak and an answer of Paws in a plain bubble does not feel natural. Decisions it needs are at the end (section 8) and become an ADR once answered. Inputs: ADR-0139, ADR-0140, charter articles 2, 5, 7 and the manners (`docs/charter.md`), `peak-paws-living-spec-v0.2.md` section 6.

## 1. The parties and the situations
Three parties: the **person** (P), **Peak** (K), **Paws** (W). A conversation is a list of turns `{from, to[], text, time}` in one shared **room log**; each pet is shown only the turns it *heard* (it spoke them, was addressed, or they were said to both).

| # | Situation | Who may speak | Today |
|---|---|---|---|
| 1 | P to one pet, both pets out | the addressed pet; the other listens | step 5 (Peak's box, by name) |
| 2 | P to one pet, only that pet out | that pet | as Peak alone |
| 3 | P to both ("hai đứa", both names, or the *Both* recipient) | one after the other, never together; the second sees the first's line and may **pass** (a gesture, no words) | not built |
| 4 | Pet to pet | only as an *aside* after a turn of the person (one line, no reply chain) or in a scene without words | scenes are wordless (charter art. 2) |
| 5 | Pet alone (monologue / remark) | one pet at a time, from the one shared attention budget | Peak only |
| 6 | Pet to person unprompted (a day kept, a notice) | the pet that owns it; the budget is shared | Peak only |
| 7 | P addresses a pet that is away ("Paws ơi") | the pet on the screen, with a gesture or one short line; never a reproach; the call command stays local | Peak answers as Peak |
| 8 | P asks one pet to relay ("hỏi Paws xem") | the first turns its head to the second, the second answers; one hop only | not built |
| 9 | The person touches, types or leaves during a line | the line stops, the queue is cleared, a scene is cancelled (token) | scene cancel exists |
| 10 | Quiet / reduced motion / no key / a key that fails | gestures only; a failed pet falls back to a canned line or a gesture while the other goes on (the keys may differ) | one key |
| 11 | A pet goes in during its reply | the reply is dropped (the token of the turn), the other pet is not made to fill the gap | not built |
| 12 | What is remembered | the person's own typed facts are one *household* memory both may read (same privacy contract); a pet's own habits stay its own | Peak only |

Limits that follow from the charter, whatever the display: no pet needs the person, no jealousy or sulking about the other (living spec rule 4), no counting of silence, no health claims, and the speech of two pets never costs more attention than the speech of one (the budget of `attention.ts` is shared, not doubled).

## 2. What the person sees: four ways to show the talk
- **A. One bubble, whoever speaks** (today). Cheap; the speaker is not visible except by where the bubble stands; no history of a three-way talk.
- **B. A bubble per pet** (each stands above its speaker, at most one *live* at a time, the older one fades out as the next begins; the listener turns its head to the speaker before the line appears). Attribution is spatial and natural; the history is gone as soon as it fades.
- **C. A thread panel** (a small chat log with a name and a colour for each speaker, anchored between or beside the pets). Handles three-way talk and history; looks like a messenger, less like a pet.
- **D. Hybrid (recommended): B for what is said, C for what was said.** Lines are short bubbles by the speaker (B), strictly one at a time through a queue; the same turns are appended to a log that opens as a panel when the person clicks a pet to talk (that panel is also the input, section 3). Reduced motion or screen reader: the panel is the primary text surface.

Choreography that makes it feel alive (all in code, none in a prompt): the listener looks at the speaker before the line; the second speaker waits a beat (not a fixed number: a short random range) after the first line fades; a *pass* is a nod, not silence; a pet that has just spoken is rested for the length of the quiet period of its own `attention` bucket.

## 3. How the person types: four ways to address
- **I1. One box, names in the text** (today). No cue about who hears; "Paws" in a sentence is parsed.
- **I2. Click the pet you talk to.** The box opens next to that pet and says (a colour and a name tag) who it is for. Needs the hit test of the second window (open item of the prototype).
- **I3. Recipient chips in the box:** `Peak` · `Paws` · `Both`, default the last pet spoken to.
- **I4. I2 plus I3 (recommended):** a click on a pet opens the box addressed to it, the chips switch the recipient (*Both* lives only here), a name in the text still overrides, and the local commands ("gọi Paws ra", "Paws vào đi") are caught before any model call. With one pet out the chips are hidden: there is nobody else to choose.

Out of scope for now: voice input, drag-to-address, a keyboard shortcut (all can be new adapters later).

## 4. Where the work is done: two calls or one
For *Both*, either (a) **one call per speaking pet** (each persona alone, the second sees the first's line, may answer `[pass]`), or (b) **one call that writes a short two-voice script**. (a) keeps the voices apart (H-02) and lets the keys differ, at twice the calls and a second wait; (b) is cheaper and more coherent but the voices tend to blend. Recommended: (a), with the second call skipped when the first line already answers and the second pet has nothing of its own (the prompt may answer `[pass]`; the code also passes at random when the cap of the quota is near). Each call counts against the existing chat quota.

## 5. The layers (what the person can configure by prompt, and what stays code)
The rule of the cut: **the model decides words; the code decides permission, timing, place and attention.** The model never chooses where a line is shown or when; safety is never only a prompt.

| Layer | Holds | Lives as | Editable by prompt? |
|---|---|---|---|
| L0 Safety and format | the charter limits, "never a therapist", the mood tag, no secrets | `persona/core.md`, `mood.md`, locked, fingerprint-tested (as today) | no |
| L1 Character | role, belief, rhythm, body language, limits of one pet (living spec section 6) | `persona/<pet>-voice.md` (Peak's files; `paws-voice.md`) | yes, one file per pet |
| L2 Capabilities | what a pet *can do* in a talk: `speaksToPerson`, `speaksToPet`, `monologue`, `relay`, `maxWords`, `mayPass`, languages | `app/src/lib/pets/<pet>.profile.json`, read by the gates **and** rendered as one short layer of the prompt ("You may answer the other pet once, in one line") | yes, within bounds the code enforces |
| L3 Situation | who is present, who is addressed, which turns this pet heard | built by code per call from the room log (never stored in a file the person edits) | no |
| L4 Conversation protocol | turn order, one line each, the pass rule, the budget, the cap on aside chains | a small data file (`conversation.rules.json`) read by the orchestrator; a short prompt layer states it to the model | the numbers: no (charter); the wording: yes |
| L5 Utterance | what a pet produces: `{text, mood, act: say \| gesture \| pass, to}` parsed from the reply (the `[mood]` tag exists; add `[to:..]`, `[pass]` the same way) | the parser (`split_reply`), untrusted, checked against L2 | no |
| L6 Presentation | where and how a line is shown: bubble by the speaker, the log panel, a gesture, silence under Quiet | a surface adapter chosen by code from the state (reduced motion, Quiet, one or two pets out) | no setting (charter: few settings) |
| L7 Input | box, click-to-address, chips, local commands, later voice | adapters that all produce `Message{from, to[], text}` | no |

Consequences: Peak's and Paws' *capability to talk* is a profile, so a third pet (or a pet that never speaks, the way the stickers behave) is a new file, not new code; a surface can be added without touching a persona; the orchestrator (the "director of speech", a sibling of the scene director, same token discipline) is pure TypeScript and is tested with a scripted fake model and a fake clock, as `scene.ts` is.

## 6. Charter check
- **Art. 2 (the attention is theirs):** speech is on the person's initiative (they typed) or from the one shared budget; a pet-to-pet *aside* happens only right after the person talked to both, one line, never a chain; scenes stay wordless.
- **Art. 5 (companion, not assistant):** both pets keep refusing tasks; *Both* is not a way to ask two assistants.
- **Art. 6 (works without AI):** the command layer, gestures, canned lines and the *pass* nod work with no key; a missing key silences words, not presence.
- **Art. 7 (never needs the person):** no pet comments on being addressed second or ignored; no "you talked to Paws more".
- **Not decided here, new cost:** a second model call per *Both* turn (counts in the quota), and the privacy text must say the second pet may be shown what the first said. Both go to ADR-0141 when decided.

## 7. A build order that can be tried (each step is small to medium)
1. `conversation.ts` (room log, turn order, pass rule, caps) with tests on a fake clock and a scripted model. No UI.
2. A second bubble window (bubble per pet) and the queue with the head turn; the log panel as the existing chat panel with a name and colour per speaker.
3. Hit test of the Paws window; click-to-address (I2); then chips (I3).
4. *Both* through two calls (needs the author's key for the voices to be read; H-02 test with the eight vignettes).
5. Pet profiles as files (L2) and the capability layer of the prompt.
6. Relay (situation 8) and the aside (situation 4): last, because they cost the most attention and calls.

## 8. Decisions (answered 2026-11-22, ADR-0141: D, I4, two calls, aside only)
1. The display: A, B, C or D (D recommended).
2. The input: I1, I2, I3 or I4 (I4 recommended).
3. *Both*: two calls (a, recommended) or one script (b).
4. Pet to pet in words: only as an aside after a turn of the person (recommended), or never in words, or also unprompted.
