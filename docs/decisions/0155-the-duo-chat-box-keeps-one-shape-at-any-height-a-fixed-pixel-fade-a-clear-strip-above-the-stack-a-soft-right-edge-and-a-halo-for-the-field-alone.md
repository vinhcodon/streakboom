# ADR-0155: The duo chat box keeps one shape at any height: a fixed-pixel fade, a clear strip above the stack, a soft right edge, and a quiet halo for the field alone

- **Status:** accepted on 2026-11-24 for the prototype (the branch `exp/duo-prototype`, nothing ships, ADR-0139). The author saw the box as a capsule with one message and a rectangle with many, a hard horizontal band at the top of the dark layer when there is history, and a field with no history that floats and gets lost among the screen's details. Option A of three was chosen.
- **Date:** 2026-11-24
- **Decided by:** Vinh (author)

## Decision
1. **The window stays as tall as its content** (ADR-0147); the box is not made large. What changes is how the dark layer (the scrim) is drawn.
2. **The fade is in pixels, not percent**: the same eased fade (about 44 px, several stops) at any height, so one message and a long talk are the same shape, shorter or longer.
3. **A clear 44 px strip above the stack** is kept in the window, so the fade is gone before the window edge cuts it (the band was the window edge showing). The strip is not part of the box for the pointer (hover engages only over the stack).
4. **The right edge is soft** (14 px) as the left already was.
5. **The field alone** (engaged, no history) gets a quiet halo (the same scrim at 70 %), a soft shadow and a muted placeholder, so it does not float; nothing that asks to be looked at.

## Why
The scrim was the size of the window and its fade a share of that size, so its shape followed the content height; and its last step (0.2 to 0 in the last tenth) ended at the window edge. The fix is to make the shape independent of the height.

## Rejected
- **B, a minimum height of about 96 px:** steadier when empty but it takes room in the corner of the screen. **C, as it was:** the three points are real.

## Consequences
- `app/src/routes/chatbox/+page.svelte` (scrim, `FADE_HEAD`, field) and `duo.rs` (`BOX_FADE_HEAD`). Seen in a test build before it is committed (rule 8); V-201 for what is not yet checked (light, dark and busy backgrounds, two monitors, high DPI).
