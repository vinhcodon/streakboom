# Note to the duo session: the chat box as a live-chat overlay, and three fixes for the box (from the author, 2026-11-22)

**From:** the app session (the one on `main`), by the author's order. **Status:** a request; nothing of the overlay is built. The analysis, the conditions and the state model are in [`docs/plans/chat-box-issues-and-overlay-proposal.md`](../plans/chat-box-issues-and-overlay-proposal.md); read part 3 before you start. The box is the duo chat box of ADR-0142 (`routes/chatbox/+page.svelte`, `duo.rs`), so the work is yours; the app session does not touch the branch.

## The author's choices (from the options of the proposal)
- **Pinned by default.** Pinned = the **ambient** mode stays between messages (a transparent, click-through window with no focus that shows only the pills of the recent messages, fading; it shows nothing when no message is alive). Unpinned = ambient for the life of the messages, then hidden.
- **The log carries the talk only:** the person's messages and the replies of the pets. The pets' unprompted lines stay in their bubbles and do not go to the log.
- **A pill behind each message** (a rounded background at about 75 to 90% opacity), not bare text with a shadow.
- **Hover turns the box solid** (the *engaged* mode: the whole box solid, the input, the history and its scroll). All messages are aligned to the right; the person and the two pets are told apart by a small round avatar (Peak, Paws), a colour for the person, and names only at the start of a group.
- **Long replies:** ADR-0146 (on `main`): the bubble gets the head (about 160 characters, cut at the end of a sentence), **the box keeps the whole reply**; `clipReply` is in `app/src/lib/clip.ts` (merge `main` into the branch; the three `clip()` call sites move with it).

## Three fixes for the box that do not wait for the overlay
1. **`lang` and the font stack.** The box page sets no `lang` (the default of `app.html` is `en`): set `document.documentElement.lang` from the chosen language (`docLang` of `clip.ts` is for the bubble, which has only the text); declare a full stack, `"Segoe UI", "Segoe UI Variable Text", "Noto Sans", Arial, sans-serif`; show every text after `nfc()`.
2. **Do not touch the field while a word is composed.** A Vietnamese typing program (UniKey, Telex, VNI) corrects a word by sending back-spaces and new letters; the box re-draws on every input (`oninput` runs `grow()`, the list `slash` is derived from the draft, an effect resets `slashSel`). Add `compositionstart` and `compositionend` and leave the draft, the list and the height alone between them (re-run on `compositionend`); the key handler already ignores `isComposing`. **The cause of what the author saw is not established** (it was not reproduced; it needs his screenshot and his typing program), so this is a hardening and a test, not a proven fix.
3. **The box vanishes when it loses focus unless pinned** (`Focused(false)` in `duo.rs`, with `BLUR_GRACE_MS` and `BLUR_TOGGLE_MS`): the overlay replaces this rule; until then, consider making *pinned* the default.

## What to say when you report
What you built and **looked at with the real mouse and keyboard** (the click-through, the hover with its delay and margin, the pills on a light, a dark and a busy background, a full-screen app), what you did not run, and the V item for each. The author looks at each step before it is committed (AGENTS rule 8). An ADR amending ADR-0142 records the choices; check the next free number on `origin/main` first.
