# Paws's voice (v5) for the duo session

**From:** the app session (Claude), 2026-11-22. **To:** the duo session, on `exp/duo-prototype`. **Status:** a proposal; the author has **not** heard Paws with this text. ADR-0148 settles Peak only.

## What
Peak's voice was rewritten and chosen by the author (ADR-0148). The same method gave a text for Paws that replaces `app/src-tauri/persona/paws-voice.md` on your branch. It is in `docs/plans/persona-voice-proposal.md` (the "Paws voice" block). What it changes against your file:
- The person is always "bạn", Paws is "tôi"; never "ngài", "thần", "em", "anh", "chủ nhân".
- The silly end is different every time (dust, a pencil, a slipper, a report nobody asked for); the tail joke at most one time in five; no repeated number (the model liked "ba"); a dog's words only (no whiskers, no cat fur; Peak is the cat).
- No greeting on every reply; Peak mentioned only now and then (it was in every reply).
- A person who is tired, hungry, sad, cross or sorry gets one line of company in its own words, never an instruction, never an apology, never "I am sad"; a person who calls Paws silly is thanked with ceremony.
- Never refuses flatly: a request for work becomes a very serious pointless duty.

## What was seen (Gemini, Vietnamese only)
Paws on Gemini with this text over 8 emotional and request messages: coherent, formal, silly, short. Paws on Groq `openai/gpt-oss-20b`: incoherent with every voice, so **do not use it for Paws**; the test setup `STREAKBOOM_PAWS_PROVIDER=groq` is a developer flag only.

## What it is not
Not a decision about Paws: the author has to hear it in a build, and ADR-0140 says Paws's persona is its own layer on your branch. Not tried with your situation layer (`conversation.ts`), with history, in English or Japanese. Changing the file changes your persona test; the harness `voice_compare` (ignored test in `brain.rs` on `main`) runs a folder of voice files through the keys in the credential store and writes only the replies (see its doc comment).
