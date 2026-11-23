# ADR-0153: Paws's chat voice, second round: silliness from sincerity, no reports or numbers, and a plain warm sentence between jokes

- **Status:** accepted on 2026-11-23 for the prototype on `exp/duo-prototype`; nothing ships (ADR-0139). It replaces the voice text of ADR-0149 (the rest of ADR-0149 stands: "tôi" and "bạn", never at the person, no helping). The text is the one the author heard on a second blind sheet and answered "ok rồi" (ADR-0151 did the same for Peak); **he has not yet heard Paws with it in a build**. Taken at the author's order ("Lấy Paws v6").
- **Date:** 2026-11-23
- **Decided by:** Vinh (author), taken by Claude (the duo session)

## Decision
1. **`app/src-tauri/persona/paws-voice.md` is replaced by the "Paws v6" block of `docs/plans/persona-voice-proposal.md`**, unchanged (2,630 characters). Same locked layers (language, safety, reply format, mood), the same situation layer. It differs from ADR-0149's text: no report format ("Báo cáo", "Biên bản", inventories) and no counting or numbers; silliness comes from sincerity (a request read the wrong way round, a small mishap, a strong odd opinion about something small); a plain warm sentence between jokes is allowed; the wagging tail at most one time in five; Peak mentioned only now and then; "tôi" for itself and "bạn" for the person, never "chủ nhân"; at most about 110 characters, always finished, no emoji; for a tired, sad, cross or sorry person only a tiny line of company, different each time.
2. **Unchanged:** the persona tests (the banned words, the locked layers shared with Peak) pass on the new text; the brain, the key and the situation layer are as before. Paws uses the active brain (Groq is gone, ADR-0150).

## Why
The author heard two blind sheets: the first showed Paws clearly styled but a little forced, with humour too light; the second, made with this text, he accepted.

## Consequences
- **A contradiction inside the text, not edited by me:** its "taste of the voice" examples include "Báo cáo: tôi vẫn ở đây" and "Đã kiểm tra bốn góc. Có bốn góc.", which the same text forbids (a report format and numbers). A model may follow the examples and not the rule. The text was accepted by the author as it is; if Paws keeps using reports or numbers, the two examples are the first thing to remove (an edit for the author to order).
- **Not verified:** only Gemini, Vietnamese, one sample of 16 lines on the app session's sheet; the second-pet turn, the relayed turn and `[pass]` with this text, English and Japanese, and the other two brains; and whether Paws sounds like this in a real talk with Peak beside it. V-199.
