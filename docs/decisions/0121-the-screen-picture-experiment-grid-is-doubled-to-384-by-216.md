# ADR-0121: The screen picture experiment's grid is NOT doubled: 384 by 216 was tried and words could be read, the grid stays 192 by 108

- **Status:** accepted on 2026-11-15 (the author chose it from options), **then refused by its own check the same day**: the grid of a real screen at 384 by 216 was written once and looked at, and **words could be read** (the titles and most lines of the chat window); the same grid reduced to 192 by 108 could not be read (only the shapes of lines and blocks). So the grid stays at **192 by 108**, which keeps the promise of ADR-0045 T5 ("too small to read text from"). Nothing at 384 was ever kept: the file was written to the session's temporary folder for the look and deleted at once. What stays from the work: the parameters of `picture.ts` scale with the width of the grid (`scaled`, tested), and the check as an ignored test.
- **Date:** 2026-11-15
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
On the author's desktop the icons were not seen by the picture: an icon is about 6 cells wide on a grid 192 cells across (a cell is about 10 px on a 1920 px screen), so it melts into the wallpaper, and its label is a few short grey lines. A finer grid would see them. ADR-0045 asked that the picture be reduced to a grid "too small to read text from".

## What was decided, and what the check found
(The decision below was taken first; the check in point 2 refused it.)

## Decision
1. **The grid is at most 384 by 216 cells** (a cell is about 5 px on a 1920 px screen; `GRID_W` and `GRID_H_MAX` in `picture.rs`), in the experiment of ADR-0119 only (a Preview build, turned on from the tray each time).
2. **The size stays a bound, not a promise of unreadability**: at 5 px a cell a line of text 14 px tall is about three cells high, which is far under what can be read, but that was **not checked against a real picture of a screen** when the decision was taken. A check is part of the work (V-152): the grid of a text-heavy screen, looked at once by the author and the session, to see that no word can be made out. If a word can, the grid goes back to 192.
3. **Everything that counts cells scales with the grid** (`scaled` in `picture.ts`: lengths times k, areas times k squared, with k = the grid width over 192), so that the same screen is read the same at both sizes; a test reads a box on a grid and on a grid twice as wide and expects the same result.
4. The other guarantees of ADR-0119 hold: memory only, never written, logged or sent, only lines and a mask reach the overlay, Peak's own windows are left out of the capture (addendum of ADR-0119).

## Consequences
- The picture takes four times the cells (about 83,000 grey values handed to the pet window once a second while the experiment is on); the analysis is about four times the work (a few tens of milliseconds; not measured yet, V-152).
- The real feature (PS-8) would need its own decision about the size: this one is for looking and tuning.

## The result of the check (2026-11-15)
- A grid of 384 by 216 of a real screen (a text-heavy window), enlarged three times with nearest-neighbour (no detail added): **readable**, words and sentences.
- The same screen reduced to 192 by 108 (two by two cells averaged) and enlarged six times: **not readable**; lines of text are grey bars, the largest titles are barely suggested.
- So the icons on the desktop need another way (a measure taken at a finer grain and reduced at once to one number per cell is a possible way, and would need its own decision), not a bigger grid.
