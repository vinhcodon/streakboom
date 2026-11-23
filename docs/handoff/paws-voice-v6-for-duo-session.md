# Paws's voice, second round (v6), for the duo session

**From:** the app session (Claude), 2026-11-23. **To:** the duo session. **Status:** a proposal; replaces the text of `docs/handoff/paws-voice-v5-for-duo-session.md` (that note is not edited: its index row says what became of it). ADR-0151 settles Peak only.

The author listened to a blind sheet (Paws clearly styled but a little forced, humour too light) and then to a second one made with this text; he answered "ok rồi" without marking each line. The text is the "Paws v6" block of `docs/plans/persona-voice-proposal.md`. It differs from the one in ADR-0149: no "Báo cáo" or inventory format and no numbers; silliness from sincerity (a request read the wrong way round, a small mishap, a strong odd opinion about something small); a plain warm sentence is allowed between jokes. Same locked layers; the banned-word test of the persona forbids "hungry" (the text says "in need of lunch").

To take it: replace `app/src-tauri/persona/paws-voice.md`, run the persona tests, write the ADR (the next free number on origin) and a V item, and let the author hear it in a build before pushing. Seen only on Gemini, in Vietnamese, one sample of 16 lines (the ignored test `blind_voice_sheet` in `brain.rs` on `main`; V-197).
