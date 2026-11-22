# ADR-0146: A long reply is cut at the end of a sentence, the model is given a budget of characters, and it keeps its whole words in the talk

- **Status:** accepted on 2026-11-22 (the author chose "B + D" from the options of `docs/plans/chat-box-issues-and-overlay-proposal.md`, part 2). **The code is on `main`; the model's behaviour with the new voice line is not verified** (V-193). Amends the voice layer of the persona (`persona/voice.md`, not a locked layer).
- **Date:** 2026-11-22
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
Every reply was cut at 239 characters, in the middle of a sentence, with "…" (`clip()` and `MAX_REPLY_CHARS = 240` in `routes/+page.svelte`), and the cut text was what the page kept in the talk, so the model saw its own broken sentence in the next turn. Vietnamese needs more characters than English for the same idea.

## Decision
1. **The cut is made at the end of a sentence** when one fits (at least 40% of the limit), else at a word with "…" (`clipReply` in `app/src/lib/clip.ts`, tested), and a text is shown in one form of the letters (NFC).
2. **Limits by use:** the reply to the person in the chat panel 600 characters; a remark in a bubble that the person did not ask for 160; the reply shown by the model test of Settings 400.
3. **The talk keeps the whole reply** (the model gets its own whole words back), unless Peak said something else in their place (the remind answers).
4. **The model is given a budget** in the voice layer: "at most two short sentences, about 150 characters, and always end on a complete sentence" (was "under 2 sentences"). The fingerprint test of the persona was changed with it, as the test asks.
5. **The bubble shows the head and the box keeps the whole** (the author's option B) is for the duo chat box, which has a log; it is carried out there (the duo branch), not here: the single-pet chat has no log, and its panel shows up to 600 characters.

## Not done and not verified
The duo chat box log and the bubble head (the duo branch); whether a real model keeps to the budget in Vietnamese and in Japanese (the voice file for Japanese is separate and was not changed); the placement of a tall bubble near the top of the screen. V-193.

## Charter check
Article 2: a remark nobody asked for stays short (160); the person's own conversation may be longer. Article 5: a companion keeps to a few words; the budget says so.
