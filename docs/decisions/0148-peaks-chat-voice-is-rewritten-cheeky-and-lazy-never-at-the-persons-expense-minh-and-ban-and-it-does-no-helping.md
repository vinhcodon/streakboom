# ADR-0148: Peak's chat voice is rewritten: cheeky and lazy, never at the person's expense, "mình" and "bạn", and it does no helping

- **Status:** (the voice text refined by ADR-0151) accepted on 2026-11-22 for Peak on `main`. The author tried a test build with the new voice and said: "Peak nói chuyện ổn rồi, chốt v5". The voice of **Paws is not decided here**: its text is handed to the duo session (`docs/handoff/paws-voice-v5-for-duo-session.md`) and the author has not heard it yet.
- **Date:** 2026-11-22
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The author found Peak's chat voice unpleasant and no longer cute, and Paws's voice muddled. A look at the code and a run of the shipped voice on Gemini (`gemini-flash-lite-latest`, ten Vietnamese messages) showed: Peak called the person "sếp", "cậu", "chủ nhân", mixed "tôi", "tớ", "tui", teased the person, told them to rest and offered to write their email. The sources the author asked to re-read all say the opposite: the character bible (`docs/handoff/peak-paws-living-spec-v0.2.md` section 6: Peak is the master of the house who is fond and denies it, short and deadpan, never cruel; tease the situation or yourself, never the person), the charter (articles 1, 3 and 5), and the hand-written lines of Stable (first person "mình", the person "bạn", no sarcasm aimed at the user). Paws on Groq `openai/gpt-oss-20b` was incoherent in Vietnamese with every voice (that was a test setup of the duo session, not a product choice); Peak was on Gemini throughout.

## Decision
1. **The voice layer `app/src-tauri/persona/voice.md` is replaced** by the text tried as v5 (`docs/plans/persona-voice-proposal.md`): Peak is the master of the house, fond and denying it, cute, cheeky, lazy and useless on purpose; the fun is about Peak and the situation, never the person (their flaws, typing, speed, questions, work); no helping, no advice, no tasks; a tired, hungry, sad, cross or sorry person gets one line of company in Peak's own words, never an instruction; one or two short sentences, about 100 characters, finished, no emoji; in Vietnamese always "mình" and "bạn".
2. **The ADR-0146 budget stays** (finished sentences, short): the new line says the same in other words, so the old wording "at most two short sentences, about 150 characters" is gone and the number is about 100.
3. **The persona fingerprint changes** to `15794038885184684225` and a test line now asks for "One or two short sentences".
4. **Method kept for later voices:** a fixed example line for a case makes the model repeat it word for word (seen six times of six), so a case is described and the model is told to answer in its own words, different each time.

## Why
It follows the character bible, the charter and the voice Stable already has, and it was tried on Gemini over 10, 20, 50 and 8 messages and then by the author in a test build.

## Rejected
- **Only changing the model** (Gemini against Groq): the shipped voice was already unpleasant on Gemini; the model was a second problem, for Paws only.
- **Gentle on by default**: it removes the teasing that is half of Peak.

## Consequences
- **Not verified:** only Vietnamese was tried; English and Japanese (`voice-ja.md` is unchanged and sits after the voice layer) were not; the tiers of closeness other than 2 and the Gentle tone were not heard; no run of fifty replies with the final text (v5 was seen on eight messages); a Peak that still sometimes says "bạn hỏi thừa thế" or "tự lo đi" was seen in the runs. V-194.
- The reaction cards and the line factory are not changed.
- The model may still drift: the proposal's raw outputs are the baseline to compare with.
- **For the next release notes** (not put in `CHANGELOG.md` now, which has no "unreleased" section): "Peak talks more like itself in a chat: a cheeky, lazy little cat who is fond of you and denies it, always mình and bạn in Vietnamese; it teases itself and the situation, never you, and offers no help or advice; when you say you are tired or sad it keeps you company in one short line."
