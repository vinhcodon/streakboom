# ADR-0159: Nothing vanishes on the spot: the pets walk through a door, the box fades; one shortcut, which only opens the box

- **Status:** (amended by ADR-0164, 2026-11-27) accepted on 2026-11-24 for the prototype (the branch `exp/duo-prototype`, nothing ships, ADR-0139). The author found that Esc works well but that the two global shortcuts make the windows and the characters vanish, which does not feel physical; the recommended option of three questions was chosen. Amends ADR-0142 (two global shortcuts).
- **Date:** 2026-11-24
- **Decided by:** Vinh (author)

## Decision
1. **One rule for showing and hiding:** a pet always goes through its door (ADR-0158: Peak walks to the side of the screen), and a window always fades. Nothing disappears on the spot.
2. **The second shortcut (Ctrl+Alt+Shift+P, everyone in or out) is removed**, with its field in Settings. The same thing is a double click on the tray, `/in`, `/call` and `@name`. A "hide everything at once" key (for a shared screen) would need to vanish instantly, against rule 1; if it is wanted later it is a feature of its own, decided on its own.
3. **The box shortcut (Ctrl+Alt+P) only opens the box**, or gives it the keyboard if it is showing; it never hides it. Hiding is Esc (once clears the field, again hides the box), a click elsewhere, or the fade after a while (ADR-0147).
4. **Every hiding of the box fades** (about 0.3 s), from Esc, the tray, the blur or the fade.
5. **The tray** stays: one click shows or hides the box (with the fade), a double click sends everyone in or brings them out (they walk).
6. **Not yet consistent:** Paws still slides in and out (it has no walking art; DU-11 step 2, or the round window idea). Recorded, not hidden.

## Why
The pets are meant to feel like small beings with a body; a window or a pet that blinks out of existence breaks that, and a second global key costs a combination other programs may want, for something four other ways already do.

## Consequences
- `duo_keys.rs` registers only the box shortcut (the file keeps its old field so that an older build still reads it); Settings shows one shortcut; the words in three languages; `duo.rs` hides the box after a fade.
- V-206 for what is not yet seen.
