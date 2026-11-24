# ADR-0155: The duo chat box has no panel behind it: a shadow on each element, the field ends where the pills end, the field measures its height right

- **Status:** accepted on 2026-11-24 for the prototype (the branch `exp/duo-prototype`, nothing ships, ADR-0139). The author saw the box as a capsule with one message and a rectangle with many, a hard horizontal band at the top of the dark layer when there is history, and a field with no history that floats and gets lost among the screen's details. Several ways were tried until the author was satisfied.
- **Date:** 2026-11-24
- **Decided by:** Vinh (author)

## Decision
1. **The window stays as tall as its content** (ADR-0147); the box is not made large.
2. **No panel behind the messages.** The first try (a dark layer with a fade in pixels) was seen and rejected: it showed a block with an edge, and it appeared with a jolt when the box took the focus. Four ways without a panel were drawn and compared on a white, a dark and a busy background; the author chose **A2**: a soft shadow on each pill and on the field, and the name of the pet as a small dark chip (readable on any background). The field fades in over 0.15 s.
3. **The field ends where the pills and avatars end**: the send button sits inside the field. The left edges stay ragged (the pills follow the length of the text), as in any chat; the author asked whether aligning is too orderly for a messy cat, and the answer was that only the right edge carries structure.
4. **The shadows stay inside the scroller** (14 px of padding inside, given back by a negative margin; 14 px round the window), so that nothing cuts them straight.
5. **The field** measures its height with `box-sizing: border-box` (it was 14 px too tall after the first send), grows up to about four lines, then scrolls with a thin 6 px bar without arrows.

## Rejected
- **A fade in pixels with a clear strip (built first):** still a block. **A glow around each element, a radial halo, a soft card:** a grey smear, a lumpy halo, a visible rectangle. **A minimum height:** takes room in the corner. **Aligning both edges:** a control panel, not a chat.

## Consequences
- `app/src/routes/chatbox/+page.svelte` and `duo.rs` (`BOX_FADE_HEAD` is 0: no clear strip). The author saw it in a test build before it was committed (rule 8); V-201 for what is not yet checked (two monitors, high DPI, an IME while the field changes height).
