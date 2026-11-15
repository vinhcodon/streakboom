# ADR-0128: The screen picture gets a switch in Settings, off by default, and it only senses: nothing is drawn

- **Status:** accepted on 2026-11-15 (the author confirmed that in Stable the switch senses and the layer is not shown, and ordered the work on the app); **built, not released**: it goes out in a Preview first, and to Stable only on the author's order. This is the decision of ADR-0045 that was "not made" (a switch in Settings, off by default, with its own text).
- **Date:** 2026-11-15
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
Peak uses a tiny grey picture of the screen to move out of what its body covers (ADR-0123). A new sense is a decision by the privacy contract; the charter (article 4) allows it only when the person switched it on in the open.

## Decision
1. **A setting `screenPicture`** in `pet.json` (added after 0.10.0, read with a default so an older build still works), **off by default**, true only when it is exactly `true`.
2. **A checkbox in Settings, Privacy**, with its own text in English, Vietnamese and Japanese (the Japanese is by Claude, as the rest, without a native reader), saying what is taken (a grey picture of at most 192 by 108 squares, too small to read a letter from, only which squares are empty), when (about every ten seconds while awake), what it is for (to walk or hop to a clear place, to step aside, before dozing), that it is kept in memory for an instant and **never saved, logged or sent**, that Peak's own windows are left out, that **nothing is drawn on the screen**, and that it can be turned off at any time.
3. **Two separate gates in Rust** (`picture_gate`): the person's switch (any build), or the tray switch of a Preview or developer build (`overlay_allowed()`). The overlay (the drawing for testers) stays a test aid of those builds; **a Stable build never draws anything**, whatever the switch.
4. **The traces stay in Preview and developer builds only** (ADR-0122): a Stable build with the switch on writes neither `loop-trace.log` nor `chat-trace.log`.
5. **The checks of the privacy** (PS-9): `picture.rs` and `settle.ts` have no storage, network, log or emit; `screen_grid` only returns the grid; every note of the traces holds fixed words and numbers (tests: `picture-privacy.test.ts`, `picture.rs`).

## Not done
The text of the README and the website (through its session) and `docs/privacy.md` for the Stable that carries it; the hardening (PS-10); the run of the switch end to end in a built app (V-162).

## Charter check
Article 4 (the person switched it on in the open; it senses emptiness, never meaning), article 2 (nothing is drawn, the moves are slow and have a back-off), article 1 (nothing saved or sent).
