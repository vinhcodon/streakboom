# Plan: terrain from the picture of the screen (TT-10, TT-11; spec 10 section 12; ADR-0045 T5; ADR-0119)

**Status:** written 2026-11-15 at the author's request; **stage 1 (the experiment, only a view) approved by the author the same day** ("Làm thí nghiệm ngay"); stages 2 to 6 are not approved and each needs the author's word after he has looked at the stage before. Epic E27 in the backlog.

## 1. Why now
- Peak's map (spec 10) knows only **windows**: a cell is the bare desktop, the taskbar or a window with a number. With every window minimised the whole screen is "bare desktop" (wallpaper and icons included); with a window maximised there is **one** block. Both give Peak **no ledge and no wall**, so it cannot hop or climb, and nothing in the map says why (the author: "from the day the climb and the hop were made I never saw them", 2026-11-15).
- The author asked for this sense on 2026-11-10 (spec 10 section 12) and decided it (ADR-0045, T5): look at the pixels of the screen **in memory, at very low resolution, opt-in, off by default**, turn them into blocks, throw the pixels away. It was put **last** in the order because it needs the overlay to tune the thresholds. The overlay is now in every Preview build (ADR-0116), so the order has reached it.
- Before it is trusted, `perch-trace.log` (ADR-0116) will tell whether `no_ledge` is really the gate that stops most attempts, or `not_free mode=work` (Peak must stay still while the person works; better sight changes nothing then). The experiment of stage 1 does not wait for that: it only draws.

## 2. What the sense is, and is not
- **Is:** a grid of grey levels about 190 by 110 (a cell is about 10 by 10 physical px on a 1920 px screen: **too small to read a letter from**), taken from the monitor Peak is on, turned into **edges** (where the brightness changes sharply), then into **segments** (horizontal runs are candidate ledges, vertical runs are candidate walls) and **empty space** (cells where nothing changes). The grid is dropped at once; only the segments stay, in memory, for a moment.
- **Is not:** a picture that is saved, sent, logged or shown anywhere but as lines on the overlay; text recognition; an understanding of what a block is (a window, a card, a button). It has no colour (grey only) and no identity: a block is a rectangle.

## 3. Guarantees (the test for each is in stage 1)
1. **Local and in memory only.** The grid is a byte array in Rust, handed to the pet window once, used and dropped. No file, no log line, no network, no telemetry.
2. **Too small to read.** At most 192 by 108 grey cells for a whole monitor.
3. **Peak's own windows are not in the picture** (GDI `StretchBlt` without the layered-window flag leaves layered windows out, and Peak's windows are layered).
4. **Only when asked, in the experiment**: a tray item of a Preview build, off at every start (ADR-0119). For the real feature (stage 5) the rule of ADR-0045 holds: a switch in Settings, Privacy, off by default, its own text in the README, Settings and the website, taken only when Peak is about to move or to check its seat.
5. **Nothing from the picture reaches a chat, a line or a trace**; the perch trace may say how many segments were found, never where or what.

## 4. The method (stage 1 and 2)
1. **Capture** (Rust, `screen_grid`): `StretchBlt` with `HALFTONE` from the screen device context straight into a bitmap of the grid size (the reduction is made by Windows, not by us), read as 32-bit, converted to grey (`0.299 R + 0.587 G + 0.114 B`). About 10 ms. Windows only. Black (protected video, some full-screen programs) gives an empty grid, which is read as "nothing to see", never as a floor.
2. **Gradient** (TypeScript, `picture.ts`, pure and tested): central differences `gx`, `gy`; the strength is `max(|gx|, |gy|)` and the direction the larger one.
3. **A relative threshold** (dark themes, light themes): `T = max(TMIN, 0.35 * p95)` of the strengths of the whole grid.
4. **Segments:** edge cells of the same direction in a row (or column), with a gap of one cell allowed, form a run; a run of at least `MINLEN` cells is kept; runs in neighbouring rows that overlap are merged into the strongest. A horizontal segment has a **side** (is it darker above or below) and **room above** (how many empty rows over it, to compare with the cat's height); a vertical one likewise to the left or the right.
5. **Empty space:** a cell whose 3 by 3 neighbourhood has no gradient above `T/3`.
6. **Stability** (stage 3): the segments of two captures about a second apart; a segment counts only if it is in both (a tolerance of one cell). Scrolling and video make segments disappear, which is right.
7. **Overlay view** (stage 1): the segments are drawn over the screen, horizontal ones green when there is room above and grey when not, vertical ones orange, empty space as a faint blue; a line at the top says the number of segments and the threshold. Nothing else uses them.

## 5. Stages (each is checked by the author on a Preview before the next)
| Stage | What | Exit |
|---|---|---|
| 1 | **The experiment: only a view.** Capture, segmentation, the overlay drawing, a second tray item to turn it on (ADR-0119) | the author looks at several screens (desktop with icons, a maximised editor, a browser page, a dark theme) and says what is right and what is not |
| 2 | **Tuning:** thresholds, minimal run, the merge, noise on wallpapers and icons; a fixture set of synthetic grids with tests | the author is satisfied with the lines on his usual screens |
| 3 | **Stability:** two captures, the filter, the cost measured | scrolling and video do not leave ledges behind |
| 4 | **Empty-space rule and content surfaces (TT-11):** the segments feed `terrain.ts` as surfaces and walls, behind a switch for the author's Preview only; the perch trace says when a content ledge was chosen | Peak hops or climbs onto a content ledge on the author's screen and the trace shows why |
| 5 | **The feature:** the switch in Settings, Privacy (off by default), the texts (README, Settings in three languages, the website through the website session), taken only when about to move; the privacy test that nothing is written | the author orders it; a Stable only by his order |
| 6 | **Hardening:** several monitors and scales, security software, full-screen programs, the cost on a weak computer | the lists in the verification debt are checked |

## 6. Risks and honest limits
- **Wallpaper and icons are noise** on a bare desktop: a detailed wallpaper has edges everywhere. Stage 2 will probably make the desktop come out as "icons as small blocks" and little more; that is a result, not a failure.
- **Dark themes, dense text** (little empty space), **animation** (stage 3), **protected video and some games** (black), **security software** that objects to any screen capture, even in memory (a company policy may forbid it; the Stable would then need a way to know).
- **A false ledge** is worse than none: Peak would hop onto something that is not there. The perch already re-checks the real windows (`refinedEdgeY`) for window ledges; a content ledge has nothing to re-check against except a second capture, so stage 4 keeps it to when the person is calm and takes a second look just before the hop.
- **Privacy is the cost that matters** (ADR-0031 says Peak never reads the screen). The guarantees above are what makes it a decision and not a feature; the author can end the work at any stage.

## 7. What is not in the plan
Text recognition, colours, window titles, any use of the picture outside the terrain, a picture of more than one monitor at once, and any storage of a picture.
