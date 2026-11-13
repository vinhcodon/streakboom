# ADR-0098: The model may name a skill by a tag (story S4)

- **Status:** accepted (answered by the author on 2026-11-14 as multiple choice); built, **not released**, **not tested against any real model**. Completes ADR-0097 (the first slice), spec 14 section 5 (the two tiers) and the feasibility note's choice of a tag over native function calling (N3).
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The first real try of "Lượn đi" (ADR-0097) showed a variant of the phrase going to the chat: the model answered with a goodbye it could not act on. The table cannot cover how people talk. The model understands the intent, so it is asked to name it.

## Decision
1. **A tag, not native function calling** (the earlier recommendation, N3): in a chat the person started, on a **Preview build** and not in Quiet mode, the persona gets one more layer after everything else (`persona/skills.md`, only through `persona_with_skills`; `persona()` and its fingerprint are untouched). It tells the model that if, and only if, the latest message is plainly a short command to go away, it puts `[skill:leave]` after its mood tag. The same text serves all four providers; there is no new request and no new quota (the tag rides on a chat turn that was counted anyway).
2. **A closed list of one:** `leave`. `split_reply` removes **every** `[skill:...]` tag wherever it stands, so a tag never reaches the screen, and returns the first whose name is on the list; any other name is removed and ignored. A copy that was not given the layer ignores a tag it still gets.
3. **It acts at once, behind a short filter** (N7): the page acts only if the name is `leave`, the message is **short (at most 10 words) and not a question**, and the same gates as for the table pass (Preview, not Quiet, not carried, not in the air, not already leaving). A long sentence that merely mentions leaving never acts, whatever the model says. Undo is the tray, as always.
4. **The goodbye is Peak's own written line** (ADR-0097), not the model's words: the model's reply is not shown when it names the skill. The command is dropped from the talk history.
5. **H20 is tested by a harness the author runs himself:** `cargo test -- --ignored skill_harness --nocapture` with `STREAKBOOM_HARNESS_PROVIDER`, `STREAKBOOM_HARNESS_KEY` (and optionally `STREAKBOOM_HARNESS_MODEL`) set in his own shell. It sends 49 labelled messages (25 commands, 24 that must not be tagged) through the real persona and parser and prints the hits, the misses and, above all, the **false tags**. The assistant never sees a key.

## Consequences
- Until the harness is run on a real model the reliability is **unknown**; it is the evidence for H20 and the thresholds are the author's to set before he reads the result.
- The chat box must exist (a connected brain) and a chat turn is spent; the table still acts first, with no key and no turn.
- The tag layer is a persona change: it is shown nowhere yet (the "What Peak is told" page lists the base layers only).
