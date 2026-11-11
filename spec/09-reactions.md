# 09. Reactions: how Peak expresses what happens (events, appraisal, beats, words)

Status: **decisions R1 to R4 of section 9 answered by Vinh on 2026-11-10 (ADR-0041), all as recommended. Built so far (2026-11-10, after 0.3.0; the first group in 0.3.1, the rest in 0.3.2): the beat format and runner with the `startle` beat and the exclaim style of the bubble (RX-1), and the words following the body for the five reflexes that speak (RX-3a); the author tried a test build and said it was good. Built later (2026-11-10): the events and appraisal, the line slots, the escalation stages and the shuffle bag, the persona in layers and its page, the reaction card and the model's remark after a reflex (RX-1 to RX-8; the first group was released in 0.3.1, the remark and the gate after it). The editable voice (RX-9) is later. How loudly a reaction may play, by the tempo ladder and the attention mode, is in [`11-restraint-play-and-the-charter.md`](11-restraint-play-and-the-charter.md).** It came from the author's feedback on the first fall (PC-7): "the line and the face do not feel like a start", followed by his concern that reactions written one rule at a time will grow into thousands of overlapping rules, and his idea of keeping reactions like **skills in a prompt**: small pieces loaded when they apply. Related: [`03-naive-pet-design.md`](03-naive-pet-design.md) (the line pools), [`06-character-and-movement.md`](06-character-and-movement.md) (character, quirks), [`08-perception.md`](08-perception.md) (what Peak senses and the table of reflexes in its section 6), ADR-0016 (mood tags), ADR-0021 (companion, not assistant), ADR-0031 (the sensory contract). The decisions are in section 9; the stories are epic E12 of [`../docs/plans/backlog.md`](../docs/plans/backlog.md).

## 1. The problem, and what the code does today (verified 2026-11-10)
Reactions reach the screen by three separate paths, and none shares its parts with another:
1. **Scripted lines** (`lines.ts`): 17 triggers (greeting, click, huff, milestone and so on), chosen by closeness tier, time band and tone. 182 lines per language, written by hand. A new situation means a new trigger and new lines.
2. **Poses chosen in the page** (`+page.svelte`): each event calls `enter("gasp")`, `enter("huff")`, `enter("happy")` with a duration from `TIMED` in `sprites.ts`. A new situation means a new `if` in the page. The bubble and the pose start in the same instant, whatever the event.
3. **Mood tags from the model** (ADR-0016): six feelings plus neutral, only for answers of a connected brain; the scripted lines have none.

What went wrong in the first fall (PC-7), and why it is a design problem and not a tuning problem: the `gasp` pose is one generic open-mouth face reused for everything; the line appeared at the same moment as the pose, so nothing came first; the 0.55 s hold was a number chosen in code for this one case. A startle that reads as a startle has a shape in **time**: *freeze, jolt, cry, look, act*. That shape belongs to the feeling, not to the event, and it is what every new event would otherwise have to rediscover.

The persona prompt for a connected brain is one function, `persona()` in `app/src-tauri/src/brain.rs`: about ten fixed English sentences (witty, slightly sarcastic, loyal, under two sentences, the user's language, no claim to be human, no secrets, no medical/legal/financial advice), plus the Japanese voice rule, the Gentle tone, a closeness sentence, the mood-tag rule and the list of what the user told it. The user cannot see it or change it.

## 2. The model: separate what happened, how it feels, how it is shown
Four small layers, each one data and one short function, instead of a rule per situation.

**2.1 Event** (what happened). A name and a few plain facts, nothing about meaning (the sensory contract): `ground_lost {room_below: 300}`, `poked`, `belly_rub`, `user_typing_near`, `hour_changed`, `woken`. Events are a list in one file; adding a situation adds one entry.

**2.2 Appraisal** (how the event reads for Peak). Each event carries five numbers:
| Axis | Range | Meaning |
|---|---|---|
| surprise | 0..1 | how unexpected (a poke 0.2, the floor vanishing 0.95) |
| valence | -1..1 | pleasant to unpleasant |
| arousal | 0..1 | how much energy it calls for |
| about_user | 0..1 | does it concern the user's work or the user, or only Peak |
| control | 0..1 | could Peak have done something (low: it just happens to it) |
The six feelings of ADR-0016 are named points in this space (happy, warm, sassy, surprised, curious, sad), so the model's mood tag becomes a way to **set the appraisal**, not a separate system.

**2.3 Beat** (how it is shown). A beat is a short script in data: a list of steps, each with a pose, a duration, an optional gaze and an optional **slot** for words:
```
startle:  freeze 150 ms (pose: notice, no blink) -> jolt 120 ms (pose: gasp, jump) -> cry (slot: cry) -> look down 250 ms -> hand over to the action
sigh:     slow breath 600 ms (pose: sad-lite) -> slot: murmur
perk:     ears up 300 ms -> look toward the cause
```
About fifteen beats are expected to cover most of the product; each is judged once, by eye, on a test build. Each beat declares the appraisal region it suits (for `startle`: surprise above 0.7) and what it needs (a standing cat, no open panel). **Choosing** a beat is a small pure function: the beats that fit the appraisal and the situation, then the one nearest the point, with ties broken at random. Adding an event never needs a new rule: it needs an appraisal.

**2.4 Words** (what it says). A slot is filled from, in order: a line pool keyed by `event + slot` (offline, in all three languages, the same pools as today, grouped differently), or, when a brain is connected and the cap allows, a remark written by the model (section 5). The tone rules (Gentle drops sarcasm, closeness tier, time band) stay exactly as they are, applied inside the pool.

## 3. Rules that hold for every reaction (written once, not per event)
- **Anticipation comes first.** A reaction to a sudden event starts with a beat of stillness or a turn of the head; words are never spoken before the body has moved (the notice beat of PC-2 already follows this).
- **Words follow the jolt, by 100 to 300 ms**, and are short: an exclamation is at most five words, drawn in the bubble's larger style (the bubble can show an "exclaim" look: bigger text, a small shake).
- **A reflex lasts at most 1.5 s** from start to the action. Longer remarks are a separate, later step.
- **One reaction at a time, with priority.** A higher arousal can interrupt a lower one; the same beat does not repeat within a cool-down per event (the fall already uses 20 s). Quiet mode, an open panel and a held cat suppress all but the physical safety ones.
- **A budget.** At most a few unprompted reactions a minute, so that a screen full of changes does not make Peak twitch continuously.
- **CPU.** A beat is pose changes on the existing rig; it adds no redraw mode (spec/04). A beat that needs motion in the air uses the existing `fly`.

## 4. Where the pieces live
`app/src/lib/reactions/` (TypeScript, strip-only like the rig): `events.ts` (the event list with appraisals), `beats.ts` (the beat list and the runner), `choose.ts` (the pure selection), and the line pools stay in `lines.ts` keyed by `event.slot`. Everything is bundled data in the first version. Loading beats or persona parts from files the user can edit is a later step (section 7), because it makes character packs possible (spec/01 monetization hypothesis) and also makes the format a public contract.

## 5. Reaction cards: the "skills" idea for the model
The model is too slow for a reflex (1 to 3 s against a 0.2 s jolt), so the body always acts first, from data, with no model involved. The model is for the **remark** that follows, and for chat. Its guidance is stored as small **cards**, one per kind of situation, loaded only when they apply, instead of one growing prompt:
```
card: ground_lost
when:   the window the cat stood on went away (event ground_lost)
feel:   startled, a little indignant, then amused
say:    one short sentence, first person, as if it happened to a cat; do not blame the user
never:  mention windows, apps or what was on the screen; an apology; more than 12 words
examples (vi): "Chỗ mình ngồi mà!" / (en): "That was my seat!" / (ja): "わたしの席だったのに！"
```
The assembled prompt is **the core persona + the voice + the few cards that match the event + the facts the user told it**. This is the same format as the offline pools: the card's examples can be the offline lines, so one source feeds both.

**Privacy of the card path (needs Vinh's decision, section 9 R3):** a card sends the model an event name and its appraisal, not the screen. "A window under me went away" reveals that a window was closed. Recommended: the remark path uses only the event name and appraisal, never sizes, positions, titles or counts; it follows the existing caps (6 unprompted lines a day, ADR-0027) and a switch in Settings, Brain; the reflex never depends on it.

## 6. The persona, made visible
The persona is assembled from layers, each a short text file in the repository (moved out of the Rust function, same behaviour):
1. **Core (locked):** safety (no secrets, no human claim, no medical/legal/financial advice), the mood-tag format the app needs, the length limit. Never user-editable.
2. **Voice:** the character (witty, slightly sarcastic, loyal), the per-language voice rules (the Japanese casual voice).
3. **Modifiers (from settings):** Gentle, closeness tier, language.
4. **Known facts:** what the user told it (already visible in Settings, "What the pet remembers").
Showing it is consistent with the product's promise (your key, your data, you see what is sent): a **read-only "What Peak is told"** page in Settings, Brain, showing the assembled prompt for the current settings. Making the **voice** editable is a second step, with a few presets (witty, gentle, deadpan) before free text, the locked core left untouched so a bad edit cannot break the app or the safety rules.

## 7. What this changes in what already exists (audited against the code, 2026-11-10)
Short answer: **yes, in one respect, and only a little elsewhere.** The rules of section 3 are about the shape of a reaction in time. Checking every behaviour Peak has today:

**7.1 Which rules apply to which kind of behaviour.** Three kinds, so that a rule is not applied where it does not belong:
- **Reflex**: a reaction to something sudden or physical (a poke, the floor going, being picked up, a belly trap). All rules of section 3 apply, including the 1.5 s limit.
- **Expression**: Peak shows a feeling alongside information (a chat answer acted out by its mood, ADR-0016). The words are the point, so they are **not** delayed; the pose runs alongside; the 1.5 s limit does not apply (1.4 to 2.8 s stays).
- **Ambient**: what Peak does with nobody asking (look around, walk, doze, wake, stretch, unprompted lines). No reflex rules; the budget and the politeness rules of spec/03 still apply.

**7.2 The audit.**
| Behaviour today | Kind | How it is done now | Against section 3 | What changes |
|---|---|---|---|---|
| A poke (`singleClick`) | reflex | `happy` hop (1.2 s) and `say("click")` in the same instant | words are not after the body | words 150 ms after the pose starts |
| Head scratch (`onHeadScratch`) | reflex | `happy` and `say("pet")` together | same | words 200 ms after |
| Belly rub enjoyed (`purr`, `say("belly")`) | reflex | together | same | words once the purr has settled (about 500 ms) |
| Belly rub trap (`huff`, `say("huff")`) | reflex | together | same: a flinch should come first | flinch first, words 250 ms later |
| Naming and "call me" answered (`answerInput`) | reflex | `happy` and the memory line together | same | words 200 ms after |
| A chat answer acted out by its mood (ADR-0016) | expression | the pose starts with the answer; unknown tags give a nod | exempt (7.1) | the six feelings become appraisal presets in beats (RX-3); the answer is still shown at once |
| The fall (PC-7 placeholder) | reflex | gasp 0.55 s, then a cry line, then the fall | no freeze, no jolt, generic face | rebuilt as the `startle` beat (RX-1) |
| The notice beat before making way (PC-2) | reflex-like | 0.4 s of ears up and a turn before acting | **already follows the rules** (it is the model for them) | becomes the `notice` beat, no change in look |
| The hop out of the typing lane (TE-14, TE-16) | reflex-like | notice, then a 0.14 s crouch, then the hop | **already follows** | none |
| Walking away from the user's work (FS-4) | ambient with a cause | notice, then walk | follows | none |
| Curling up when there is nowhere to go (`drowsy`) | ambient | yawns and sleeps | follows | an optional sigh beat later |
| Wake and stretch (PC-4), sleep, doze, look, wander, `think` while waiting | ambient | timers in the page | not reflexes | none |
| Being picked up (`held`) | reflex, physical | the hang pose follows the cursor at once | an immediate physical response is correct | none (a yelp line is not planned) |
| Unprompted lines (greeting, idle, long session, milestone) | ambient | spoken with no pose | none required | optional: an ears-up beat 300 ms before an unprompted line, so a line does not come from nowhere (RX-3, to be judged by eye) |
| The tour and the first-key greeting (`happy` with a bubble) | expression | together | exempt | none |
| Pools `snack` and `play` (8 lines) | | exist, never triggered by anything | | left alone; they become events when something triggers them |

**7.3 Consequences for the code.** Nothing is rewritten at once. A small helper, `react(pose, trigger, delayMs)` (RX-3a), replaces the pairs `enter(x); say(y)` for the five reflexes above so the words follow the body; it is a few lines and is the first step of the beat runner. The rest moves into beats **when each is next touched** (RX-3); until then both ways work side by side.

**7.4 Documents.** `lines.ts` triggers become events with slots without losing a line: ids stay stable (the "recent lines" memory on disk refers to them), and the parity tests across the three languages stay. Spec 03 (reactive pet), spec 06 (voice, quirks), spec 08 (section 6 table), ADR-0016 and the persona text carry a pointer here; ADR-0016 is amended, not replaced.

## 8. Cost and checking
- **Tests:** every event has an appraisal in range; every beat uses existing poses and has a total under 1.5 s; every slot has lines in all three languages (the existing parity test extended); selection is deterministic for a given seed; the persona assembled from files equals today's string for the same settings (no behaviour change in RX-5).
- **By eye:** each beat once on a test build before it is committed (the standing rule for motion). Whether a beat feels right is a judgement, not a test.
- **Not verified, and the risks:** that five axes are enough and not too many (a few events may fit badly); that a generic beat selected by distance feels as good as a hand-made one for every event (the fall is the first proof); that the model's remark adds value over the offline line (it may not, and the cap exists for that reason); how Japanese exclamations read to a native speaker (V-60 already); that editing the voice stays safe.

## 9. Decisions for Vinh (answered 2026-11-10, ADR-0041)
| # | Question | Answer |
|---|---|---|
| R1 | How many dimensions describe a feeling: five axes (section 2.2), or keep only the six named feelings of ADR-0016 | Five axes, with the six feelings as named points |
| R2 | Where beats and persona live: bundled in the app only, or also loadable from a folder by the user (character packs) | Bundled first; loading later with its own decision |
| R3 | May a reaction card send the model the event name and appraisal for the follow-up remark | Yes, event name and appraisal only, under the existing caps, with a switch in Settings, Brain |
| R4 | The persona page: read-only first, or read-only and editable voice together | Read-only first; editable voice as a separate later story |

## 10. Stories
Epic E12 in the backlog (RX-0 to RX-9). The first useful slice is RX-1 and RX-2 (the beat runner and the selection) with the `startle` beat for the fall, because it replaces the weak placeholder and proves the shape on a real event; the persona stories (RX-5, RX-6) are independent and cheap and can run alongside.

## 11. Fresh words: why the lines feel repeated, and how to add more
The author finds the scripted lines not rich enough, repeating, not fresh. What the code shows (Vietnamese; the other languages are one-to-one):
- **The pools behind the most frequent actions are the smallest.** Poke 13 lines, head scratch 12, belly rub 6, belly trap 5, gesture hints 6 and 3, "how are you" 20, idle 36, greeting 19 (6 to 7 per closeness tier), return 9, morning 8, night 9. Poking is what a user does most. 187 lines in all.
- **The no-repeat rule is weak for small pools.** `pick` avoids the last 24 lines said (all triggers together), and when every line of a trigger is in that memory it only avoids the very last one. A pool of 13 pokes is exhausted after about 10 pokes and then repeats at random.
- **A line does not depend on anything but tier, time band and tone.** The tenth poke in a minute gets the same kind of line as the first; the user's name, the streak, the number of pokes today, the weekday and what Peak did a moment ago are not used (except by the memory lines).
- **Everything is written by hand**, so size is limited by the author's time; and the offline cat is the only voice for users without a key.

**Proposals, cheapest and most effective first** (stories LN-1 to LN-8 of epic E13):
1. **A shuffle bag, not a random pick (LN-1, S).** Every line of a trigger is said once before any is repeated, with a window that grows with the pool (at least the pool size minus one up to a cap), kept per trigger on disk. Fixes the repetition of small pools at once, with no new text.
2. **Escalation for repeated actions (LN-2, M).** The same action repeated within a short time moves through stages with their own lines: the first poke is playful, the fifth is annoyed, the tenth is resigned and then forgives; the belly rub, the scratch and the click each get 3 to 4 stages. Freshness comes from the story, not from more text, and it fits the character (the belly is a trap). Needs a counter in memory that is not saved (no new consent).
3. **Lines that use what Peak knows (LN-3, M).** Tokens in the text: the user's name, the hour, how long they have worked, the streak, today's pokes, the weekday, the cat's own favourite spot (PE-2). A line that mentions the real situation does not feel repeated even when it is the same pattern. Each token has a safe fallback when unknown, and the tests check that every language fills every token.
4. **A line factory for the author (LN-4, M).** A script in the repository, run by the author, not at runtime: given the character bible, the tone rules, a trigger and the lines it already has, it asks a model for 30 candidates; a filter removes near-duplicates, too long lines, banned patterns (guilt, assistant talk) and sarcasm aimed at the person; the author picks the ones to keep; a native reader checks Vietnamese and Japanese (V-60); the survivors join the pools through the existing tests. This is how the pools can grow tenfold (targets in LN-5) without runtime cost or privacy questions.
5. **Targets by frequency (LN-5, S + writing).** Pool sizes set from how often an action happens: poke 40, head scratch 30, belly rub 20, belly trap 15, snack and play 15 once they are used, hints 12, greeting 12 per tier, return 20, plus a few rare lines (about one in a hundred) and callbacks ("remember when you poked me ten times?"). A test fails when a trigger falls below its target.
6. **Rare delights and running jokes (LN-6, S).** A few lines with a low weight and a once-a-week limit; a small memory of what Peak joked about, so a joke can be called back.
7. **Top-up by the connected brain (LN-7, M, needs Vinh).** Once a day, when a key exists and the cap allows, Peak asks the brain for a handful of new lines for the triggers with the least variety, using only the trigger name, the tone and the persona (no user data), keeps them on the machine marked as generated, and uses them with the same rules; the author's pools stay the base. Needs a decision: it spends the user's key and shows machine-written lines without review.
8. **A way to see the repetition (LN-8, S).** A test and a small report: for each trigger, the number of distinct lines a typical week would show; it prints the triggers under their targets, so the next batch of writing goes where it is needed.

What this does not do: it does not make lines funny by itself (that is the author's and the readers' judgement), and the shuffle bag and escalation can be judged only by using the app for days. Both are in the list of what is not verified.

**Built 2026-11-10 (after 0.3.1, RX-3 rest, RX-7, RX-8, LN-4):** `reactions.ts` is the gate (one reaction at a time, a higher priority breaks in, an automatic event has a cool-down, a gap after the last reaction and at most four a minute; what the user does is never held back; the fall goes through it); the brain's mood tag and the notice lead-in now come from the beats (`moodBeat`, `NOTICE`; a test shows every mood and an unknown tag and the Gentle tone give the pose `moodPose` gave). **RX-7:** after the fall a connected brain may write one short remark: Rust adds the card `persona/cards/ground_lost.md` after the persona (`brain_chat` takes an `event` and only a fixed list of events has a card), the request carries only the event name and the five appraisal numbers, it counts toward the cap of unprompted lines, needs `Settings.remarks` (on by default, a checkbox in Settings, Brain) and never delays the cry or the fall. **LN-4:** `scripts/line-factory.mjs` (run by the author; reads the Gemini key from the Credential Manager when run; builds the request from the character, the situation and the existing lines, filters repeats, long lines and assistant talk, writes a review file under `scripts/line-factory/out/`, ignored by git) with the pure part in `linefactory.ts`. LN-7 (top-up by the brain) was declined for now.

**Built 2026-11-10 (after 0.3.0, RX-2, RX-3, RX-4 and LN-5):** `events.ts` lists the events (poked, scratched, belly_enjoyed, belly_trap, named, ground_lost) with an appraisal each, the pool their words come from and the counter that stages them; `beats.ts` has ten beats, each with a home point in the five-axis space; `choose.ts` picks the beat nearest to an appraisal (deterministic). The page now enters the pose of the chosen beat and says the words after the beat's delay (`startReflex`, `sayEvent`), so the poke, scratch, belly rub, belly trap, naming and the fall are all chosen from data; the old poses and delays are reproduced exactly (a test fixes them). The six feelings of ADR-0016 are points in the same space (`MOOD_APPRAISAL`) and a test shows each gives the pose `moodPose` gave; the chat reaction itself still calls `moodPose` (switching it to the beats is the one step left of RX-3). RX-4: each event names its pool (a test checks the pool exists in the three languages and has stage lines where it repeats). LN-5: 48 plain lines per language for the smallest pools (idle 15, poke 10, greeting 6, how 5, belly 4, pet 3, return 3, huff 2); the repetition report went from 6 triggers under the limit to 2 (idle and poke, by a small margin).

**Built 2026-11-10 (after 0.3.0, RX-6 and LN-8):** Settings, Brain has a section "What Peak is told" (a button shows the persona layer by layer for the current language, closeness and tone, with the locked layers marked; read-only; the Rust command `persona_preview`; three languages). `scripts/line-report.mjs` prints the repetition report (`linereport.ts`: the smallest pool of each trigger against a guess of how often it is spoken in a week; the guesses are in `USES_PER_WEEK`). Its first run (Vietnamese, in a context with no name known): idle 5 lines for about 50 uses a week, poke 11 for 70, greeting 3 for 14, belly 5 for 20, how 4 for 15 are under the limit of three sightings per line per week; about 31 lines per language would bring the smallest pools under it.

**Built 2026-11-10 (after 0.3.0, RX-5):** the persona is joined from layer files in `app/src-tauri/persona/` (`persona_layers` in `brain.rs`: voice, language, core, Japanese voice, tone, mood, closeness; the language, core and mood layers are marked locked); its words are unchanged, fixed by a fingerprint test over every language, tier and tone. The page that shows it (RX-6) and the editable voice (RX-9) are not built.

**Built 2026-11-10 (after 0.3.0, LN-1 to LN-3):** the shuffle bag (a bag per trigger and stage, saved with the pet), escalation (`escalation.ts`, 27 stage lines per language) and tokens (`{name}`, `{time}`, `{weekday}`, `{pokes}`; 10 lines per language). Each language gained 37 lines (224 in all, up from 187). Proposals 4 to 8 (the line factory, pool targets, rare lines, top-up by the brain, a repetition report) are not built.
