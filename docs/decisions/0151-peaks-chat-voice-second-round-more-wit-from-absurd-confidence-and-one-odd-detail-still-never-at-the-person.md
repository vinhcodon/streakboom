# ADR-0151: Peak's chat voice, second round: more wit, from absurd confidence and one odd detail, still never at the person; Paws's text is handed to the duo session

- **Status:** accepted on 2026-11-23 for Peak on `main`, **not released**. The author listened to a blind sheet of 16 lines (8 situations, each pet once, shuffled, names masked) and said the two voices were distinct, Peak acceptable but a little bland, Paws clearly styled but a little forced, and the humour too light and not punchy enough. He chose "both, blind again" as the next round, read a second sheet and answered "ok rồi". Refines ADR-0148. Paws's voice is **not** decided here: its text goes to the duo session.
- **Date:** 2026-11-23
- **Decided by:** Vinh (author), recorded by Claude (the app session). I read "ok rồi" as accepting this round; he did not mark each line of the second sheet, and the key of the first sheet has not been revealed.

## Context
ADR-0148 removed the sting aimed at the person but gave Peak nothing stronger in its place, so the lines were short, safe and reluctant. Paws's text (ADR-0149) made nearly every line the same template: "Báo cáo", a number, a small object under a chair.

## Decision
1. **Peak's voice layer (`app/src-tauri/persona/voice.md`)** keeps everything of ADR-0148 and adds a comedy engine: total confidence in absurd logic, what is happening taken as proof of Peak's greatness or as its own doing, dry understatement, one specific odd detail in a line, and no falling back on "busy napping or blinking". The fun is still about Peak and the situation, never the person.
2. **The persona fingerprint** becomes `10709759574674597729`.
3. **Paws's text** (the "Paws v6" block of `docs/plans/persona-voice-proposal.md`) drops the report format and numbers, gets its silliness from sincerity (a request read the wrong way round, a small mishap, a strong odd opinion about something small), allows a plain warm sentence between jokes, and never lists objects found under a chair. It replaces `persona/paws-voice.md` on `exp/duo-prototype` when the duo session takes it (note `docs/handoff/paws-voice-v6-for-duo-session.md`).

## Why
It answers the author's own words (bland, forced, not punchy) with the tools of the character bible (bend the meaning, claim credit; silliness from earnestness; not every line a punchline) and stays inside the charter and the bible's rule that a tease aims at the situation or the pet itself.

## Consequences
- **Not verified (V-197):** one sheet of 16 lines on Gemini in Vietnamese, one sample each; the second sheet was read by the author without per-line marks, so there is no H-02 score; Peak and Paws may still sometimes say "bạn tự lo đi" or lean on the same props; English, Japanese, the Gentle tone and the closeness tiers other than 2 were not read; Gemini was overloaded during the first run of the sheet (5 of 16 lines failed), so it was rerun.
- **For the next release notes**, in place of the sentence in ADR-0148: "Peak's chat voice is wittier: it states silly things with total confidence and one odd detail, and still never teases you."
