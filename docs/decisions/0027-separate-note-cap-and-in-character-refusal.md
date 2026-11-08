# ADR-0027: Fact-noting has its own daily cap, and "enough for today" is said in character

Status: accepted (built 2026-11-08; unreleased, planned for 0.2.1)

## Context
On 2026-11-08 every chat answer was "Hôm nay mình nói nhiều rồi. Phần còn lại để mai nhé." The author asked whether chat was restricted. It was: the daily cap (ADR-0008) of 60 chat turns was used up (`pet.json` showed `ai.chat = 60`, `ai.proactive = 6`).

Two things made that cap feel unfair:
1. The background request that notes lasting facts from a chat (every 4 messages, ADR-0014) was counted in the same 60. The author had sent about 41 messages; the rest of the count was these requests and the author's own test runs that day.
2. The refusal said nothing about why, and was always the same sentence.

## Decision
- **A separate counter for fact-noting.** `AiUsage` gets `note`, with its own cap `AI_NOTE_DAILY_CAP = 20` per local day. `maybeRemember` is gated on and records `note`, not `chat`. Typed messages (`chat`, 60) and unprompted lines (`proactive`, 6) are unchanged. All three reset at local midnight and share the 2-minute cooldown after a rate limit. Data saved before this change has no `note`; it is read as 0.
- **No numbers in the pet's voice.** The author does not want Peak to say "60/60"; that is technical. When a cap is reached the pet declines in character, with one of four lines per language picked at random (`ui.capHit` is a list). The Brain page in Settings still shows today's use against the caps, because that is a status screen, not the pet speaking.
- **The caps themselves stay at 60 / 6 / 20.** They protect a free Gemini quota and a paid Claude or OpenAI key. A setting to change them is not built; revisit if people keep hitting 60 (the Bond Days watch metric for chat share, `../handoff/north-star-bond-days.md` question 3, is the signal).

## Consequences
- The 60 chat turns are now all the author's own messages, so the cap is easier to predict.
- Up to 20 extra small requests a day can go to the provider; on a paid key this is a small, bounded cost.
- A day-rollover or an old `pet.json` cannot break the cap logic (tests cover both).
- Not verified: a real chat reaching the cap in the running app with the new build (the installed 0.2.0 still has the old behaviour until the next release); only unit tests cover the new counter and the random line.
