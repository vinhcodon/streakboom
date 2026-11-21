# ADR-0140: Paws chats with the AI too, with a persona from the character bible, and a shared or a separate key

- **Status:** accepted on 2026-11-22 for the prototype and as the direction for the spec; nothing ships (see ADR-0139). The author's words: Paws has its own character as the living spec describes, so Paws answers through the AI chat; the chat keeps using the person's own key, with an option to give both pets the same key or each its own.
- **Date:** 2026-11-22
- **Decided by:** Vinh (author)

## Decision
1. **Paws answers through the AI chat**, on the person's own key (ADR-0001: the app hosts no inference). This supersedes the line "no AI chat for Paws" of `docs/handoff/duo-prototype-and-cross-review.md` (section 1) and of the charter-impact note; the charter itself is not changed.
2. **Each pet has its own persona**, taken from the character bible of `docs/handoff/peak-paws-living-spec-v0.2.md` section 6 (role, belief, rhythm of speech, affection, limits and the six common rules: answer back in words, cooperate in action; no humiliating the person; no guessing the person's mood, ability or work; no jealousy about the other; no collapse when the person is away). Peak keeps the layers in `app/src-tauri/persona/`; Paws gets its own layer set beside them, not an edit of Peak's.
3. **The key: shared or separate.** By default the two pets use the one key already stored; the person may give Paws its own key (another provider is allowed). Keys stay in the operating system's credential store under the existing scheme (`brain.rs`, `KEY_SERVICE`), with a second entry per pet; no key is ever read, printed or written to a file by the assistant or in a log. This is the one setting added, and it is about a key, not a taste (ADR-0080 A1 is not affected).
4. **The bubble belongs to the pet that answers** (ADR-0139 follow-ups): the person picks by name; with no name, the pet last spoken to answers; "both" answers one after the other.
5. **The command layer needs no AI** ("call Paws out", "Paws, go in"): it is understood on the device and works without a key.

## Why
The two characters differ by how they speak (H-02); a canned line cannot carry a voice. A shared default key costs the person nothing; a separate key is there for those who want it.

## Rejected
- **Canned lines for Paws only**: loses the voice the character bible depends on.
- **One persona for both with a name tag**: the two would sound alike (H-02 fails).

## Consequences
- **What the model is sent** grows by the persona of the pet that answers; the privacy contract of ADR-0001 is unchanged (the person's own typed words, only when the person turns chat on). The privacy text of the Settings and `docs/privacy.md` need a line about the second key before anything ships.
- **Not verified:** the Paws persona is not written; no test of whether the two voices are told apart (H-02); the second key entry; the shared-or-separate option as a person sees it. Each in `docs/plans/verification-debt.md` (V-180).
