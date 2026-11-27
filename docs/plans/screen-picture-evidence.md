# The screen picture and readable text: synthetic evidence (issue #8)

**Status:** written 2026-11-24 by the app session for issue #8 (parent #2). **Evidence, not a policy.** It replaces the guarantee "too small to read a letter from" with what was actually seen. No new capture rule, no minimum cell size and no exhaustive proof of unreadability is claimed or required.

## What the app does (the thing being imitated)
`app/src-tauri/src/picture.rs`: `StretchBlt` with `HALFTONE` reduces the monitor into at most 192 cells wide and 216 tall (height `round(192 * h / w)`, 108 on a 16:9 screen), read as grey (0.299 R + 0.587 G + 0.114 B), used for empty cells and brightness changes, dropped at once, never saved, logged or sent. Nothing recognises text.

## How to reproduce (no screen is captured, nothing personal is drawn)
```powershell
powershell -NoProfile -File scripts\windows\picture-evidence.ps1 -Width 1920 -Height 1080
powershell -NoProfile -File scripts\windows\picture-evidence.ps1 -Width 1366 -Height 768
powershell -NoProfile -File scripts\windows\picture-evidence.ps1 -Width 1920 -Height 1080 -Dark
```
Output in `docs/plans/assets/screen-picture/`: `contact-sheet-<size>.png` (left: the synthetic screen scaled for viewing, bilinear; right: the grid enlarged x5, nearest neighbour), `grid-<size>.png` (the grid itself, 192 wide), `params-<size>.txt` (every parameter).

## Parameters (also written on each sheet and in `params-*.txt`)
- A synthetic screen of the given size, one band per text size, top to bottom: **8, 10, 12, 14, 16, 20, 24, 32, 40, 48 physical px** (the em height, `GraphicsUnit.Pixel`, not points), Segoe UI regular, ClearType grid fit, the line "Hello Peak 2026 - Xin chào, đây là chữ", black on white (and white on dark for one sheet).
- Reduction: the same Windows call as the app, `StretchBlt` with `HALFTONE` (`SetStretchBltMode` 4, `SetBrushOrgEx` 0,0), from a memory device context into a bitmap of the grid size. Grey as above. Enlargement for the sheet: x5, nearest neighbour.
- Cells: 1920 wide gives a cell of 10 physical px; 1366 wide gives 7.11 px.
- Windows 10 build 19045, one machine, one run each.

## What I saw (my own reading by eye of the enlarged grid; one reader, not a measurement of any tool)
| Synthetic screen | Cell | Rows that look like unreadable grey smudges | Rows where words can be read |
|---|---|---|---|
| 1920 x 1080, black on white | 10 px | 8, 10, 12, 14, 16 | 40 and 48 clearly; 32 mostly; 20 and 24 only in part |
| 1366 x 768, black on white | 7.11 px | 8, 10, 12, 14 | 32, 40 and 48 clearly; 24 and 20 mostly or in part; 16 barely |
| 1920 x 1080, white on dark | 10 px | 8, 10, 12, 14, 16 | 40 and 48 (at lower contrast); 20 to 32 only in part |
The reading depends on who looks and how much it is enlarged; the sheets are in the repository so that anyone can look and disagree.

## What follows, and what does not
- **Text of ordinary body size (about 10 to 16 physical px here) was not readable in these pictures, but text of about 24 to 32 physical px and larger can be.** On a narrower screen the cells are smaller, so the readable size is smaller. Physical pixels are not points or CSS pixels: at 125% scale or with zoom, ordinary text can occupy 24 or more physical px.
- So no active text may promise that ordinary text cannot be read, or that the grid is "too small to read a letter from". The wording now used (Settings in three languages, `docs/privacy.md`): the picture is small, but it can still hold readable text, especially large or zoomed text; Peak does not recognise text and only looks at which squares are empty and where the brightness changes sharply.
- **Not shown, not claimed:** other fonts, other weights and languages, other screens and scales, a real screen, a reader with a tool (contrast stretching, super-resolution), or that 16 px is safe. No cell-size policy is proposed.

## What changed in the documents (issue #8)
The active texts were corrected (`ui.ts` x3, `docs/privacy.md`, the comment in `picture.rs`), `screen-picture-plan.md` sections 2 and 3 and `duo-reconciliation.md` are marked as corrected or superseded, V-177 is rewritten. ADRs, `CHANGELOG*` and the engineering log are left as they are (history).

## Website (read only; the website session edits it, not this patch)
`site/strings.mjs` says without condition that Peak never reads the screen in English at lines 84 (a8), 89, 106, 116 and 146, in Vietnamese at 339, 344 and 361, and in Japanese from line 608 on (I found the question at 608 and did not list the rest). Today's sentences are true for Stable 0.10.0, which has no screen picture; they must be reconciled by the website owner **before any Stable carries the switch** (tracked in V-177).
