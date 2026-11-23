# ADR-0149: Paws's chat voice is rewritten the way Peak's was: ceremony and silliness, never at the person, "tôi" and "bạn", and no helping

- **Status:** accepted on 2026-11-22 for the prototype on `exp/duo-prototype`; nothing ships (ADR-0139). The author ordered it ("Chỉnh giọng Paws trên nhánh duo") after choosing Peak's voice (ADR-0148) and after reading the lines Paws gave in the tests; he has **not yet heard Paws in a build**. Amends the voice part of ADR-0140.
- **Date:** 2026-11-22
- **Decided by:** Vinh (author), recorded by Claude (the app session, working in the duo worktree at his order)
- **Amended by:** ADR-0153 (2026-11-23): the voice text of this ADR is replaced by the second-round text (Paws v6); the rest stands.

## Context
Paws's voice was one paragraph from the character bible. In the first real run (ADR-0140, Paws on Groq `openai/gpt-oss-20b`) it was muddled; on Gemini it was coherent but long, called the person "ngài" and "thần" in places, spoke of Peak in every reply, repeated the tail gag, put cat words on a dog, and said "tôi buồn lắm" when called silly (a pet that needs the person) and "go and rest" to a tired person (advice). Peak's voice was rewritten by the same method (ADR-0148, `docs/plans/persona-voice-proposal.md`).

## Decision
1. **`app/src-tauri/persona/paws-voice.md` is replaced.** Paws is the self-appointed butler: official duty for every small thing, a touch too formal, then a silly end that is different every time (a made-up rule, a report nobody asked for, a small mishap, something small and ordinary at home); polite first, then reads the request its own way; glad to see the person and keeps its composure; jokes about itself or the situation, never the person, never guesses their mood or work; a dog's words only (the cat is Peak); Peak mentioned only now and then.
2. **The person is always "bạn", Paws is "tôi"** in Vietnamese; never "ngài", "thần", "em", "anh", "chủ nhân".
3. **No helping, no advice, no flat refusal:** a request for work becomes a very serious pointless duty; a tired, sad, cross, sorry person or one in need of lunch gets one line of company in Paws's own words, never an instruction, never an apology, never "I am sad"; a person who calls Paws silly is thanked with ceremony; on a serious matter of their own life Paws has no opinion, it is only a dog on duty. (The word list of the persona test forbids "hungry", so the text says "in need of lunch".)
4. **Providers:** Groq `openai/gpt-oss-20b` stays a developer flag, not a recommendation: it was incoherent in Vietnamese with every voice.

## Why
Same sources as ADR-0148 (character bible section 6, the charter, Stable's lines) and a run on Gemini with the real situation layer of a talk with one pet (20 messages, then 12 after one correction).

## Consequences
- **Seen:** Paws coherent, short, formal and silly; "tôi/bạn" throughout; no advice; "Vinh dự lớn lao" when called silly; "Tôi ngồi cạnh bạn đây" to a tired person.
- **Still seen, not fixed:** a liking for the number three and for "báo cáo / thống kê" as the silly end; Peak named in about a third of the replies; "tôi chỉ là một chú chó nhỏ làm nhiệm vụ" used more than the serious cases need; once an answer to "anh có nên nghỉ việc không" that gave a wish about family and hobbies (before the correction). A fixed example line makes the model copy it, so the text describes cases and gives few examples.
- **Not verified (V-195):** the author has not heard Paws in a build; English and Japanese (no Japanese Paws layer exists); the second-pet turn, the relayed turn and `[pass]`; a long run; Paws on a provider other than Gemini; whether the two voices are told apart by people (H-02).
- The ignored test `paws_voice_check` in `brain.rs` (the real persona plus the situation layer, Gemini, the program's own key) is how the lines were read; it writes only replies.
