# 07. The desktop as terrain: a cost field of fixed relief and the user's attention

Status: **draft; the direction was agreed by Vinh on 2026-11-09 (see section 0); no code exists.** It builds on [`06-character-and-movement.md`](06-character-and-movement.md) (focus-safety, favorite places) and replaces its "places on a 3 x 3 grid" with the model below. Plan: [`../docs/plans/terrain-and-attention.md`](../docs/plans/terrain-and-attention.md). Decision: [ADR-0030](../docs/decisions/0030-terrain-as-a-cost-field.md). Backlog: epic E9. What Peak can sense and how it reacts (the layers below are its beliefs), with the gaps found against the specs, is in [`08-perception.md`](08-perception.md).

## 0. How this came about, and what is decided

Vinh proposed that Peak should treat the desktop as terrain: a map made of paths and blocks. The first version of the idea said "the cat lives on window edges, not inside windows". Vinh pointed out that people keep their windows maximized, so there are no edges to live on, and that Peak must live both on edges and **inside** windows: "the empty space is its space". This spec rebuilds the thesis on that.

| # | Decision (Vinh, 2026-11-09) |
|---|---|
| T1 | Peak lives anywhere on the screen, inside maximized windows too. Edges are special places, not the only ones. |
| T2 | "Empty space" means **where the user's attention is not**, found from how the user uses the pointer and keyboard, never from reading the screen. |
| T3 | The attention field is a coarse grid kept **in memory only** (not written to disk, not sent, gone when the app closes), described in the README and on the website. |
| T4 | Once the field exists (level L2), Peak **moves away** from where the user is working. Before that it makes way sideways (spec/06 D6, FS-4: it walks away, or curls up if there is no room). A fade was tried first and removed: the author found a see-through cat unnatural. |
| T5 | When a window is dragged away under the cat, it **falls to the surface below**; it does not follow the window (level L3). |
| T6 | Order: the spec first, the code after FS-4 and the CPU target (PR-9). Levels: L1 then L2; reading window geometry is a separate, later permission (L3), not needed for L1 and L2. |
| T7 | **The typing lane** (section 3.1): the cat also avoids a band along the row where the user is typing, found from the last click and the time spent typing (a predicted caret), not from the real caret. |
| T8 | **Mouse button state may be read** (only whether a button is down, never a key), in memory only, to know where the user last clicked into a field. |
| T9 | **Order (2026-11-09):** FS-4 (making way sideways, built) is committed first; vertical movement (TE-2, TE-7) comes next because escaping a lane needs it. |

## 1. Thesis: a cost field, not a map of paths

A map of "walkable" and "blocked" cells does not fit a desktop: the cat is an overlay window that can be drawn anywhere, and nothing blocks it. What matters is where it **should** be. So the world is a field: every place has a **cost** (how bad it would be for Peak to be there now). Peak may cross any place but does not rest, sit, nap or play where the cost is high. The terrain metaphor stays useful: the cost is the height, fixed features are the relief, the user's attention is a hill that moves.

cost(place, now) = fixed relief(place) + attention(place, now) + (later) window relief(place, now)

Peak chooses where to go by cost, plus its own preferences (its mood, closeness tier, favorite places). Nothing here reads what is on the screen.

## 2. The layers

| Layer | What it is | Signals it reads | Privacy | Level |
|---|---|---|---|---|
| A. Fixed relief | Monitor work areas joined into one world; the screen edges and corners; the taskbar (outside the work area); **danger zones** that exist in every Windows app: the caption buttons at the top right of a window (minimize, maximize, close) and the title bar band along the top. | none | nothing new | L1 |
| B. Attention field | A coarse grid over each monitor (about 16 x 9 cells). While the user is active, the cell under the pointer gains weight; every cell decays with a half-life of about 20 seconds. High where the user is working now, low elsewhere. | the pointer position and "the user did something just now" (both already read for FS-1 and FS-2) | memory only, never stored or sent; it is a few hundred numbers, not a trail | L2 |
| C. Window relief | The visible, non-maximized windows: their top edges are perches (ledges), their sides are walls; a maximized window is plain field (its interior is the plain). | position, size and the maximized state of visible windows; **no** titles, process names or contents | needs Vinh's separate permission and a Settings switch (T6); geometry is not stored or sent | L3 |
| D. Learned places | Counts of where the user drags the cat to (welcome) and where the user pushes it away from (unwelcome), per zone. | the user's own dragging | counts only, shown and deletable in Settings (as the favorite places of spec/06 2.3) | L4 |

### 2.1 Layer A in detail
- **The world.** Monitors are joined by their work areas in physical pixels. Positions inside the world are stored as a monitor key and a fraction (0 to 1) of that monitor's work area, so a changed resolution, DPI or taskbar keeps the meaning (this also answers spec/06's open question on how places survive monitor changes). Walking from one monitor to the next is allowed where their work areas touch along an edge (level L1).
- **Danger zones** are costs, not walls: the top-right 150 x 40 logical px of every work area (caption buttons of a maximized window sit there), and a soft cost along the top 40 px (title bars). The bottom of the work area is **not** a danger zone by itself, but see layer B.
- **Rest preference.** With no attention anywhere, the cat prefers low-cost edge and corner cells (it likes a wall to lean on), with closeness tier deciding how far from the user's last known place it sits (spec/06 2.3).

### 2.2 Layer B in detail
- **Update.** At each probe (see spec/06 3.2): if the user is active, add weight at the pointer's cell and, with a smaller weight, its neighbors; then decay all cells by `0.5^(dt / 20 s)`. If the user is idle, only decay. The pointer is only read while active, so a parked pointer does not keep a hill alive forever.
- **Reading it.** `attention(place)` is the cell weight (0 to 1). A place counts as "where the user is working" above 0.25.
- **What it cannot know.** It knows where the pointer is, not where the caret is: a user who types with the pointer parked in a corner is invisible to it. That is why the FS-1 rule stays as the safety net: while the user is active, the cat stays still (and makes way if the pointer is near), wherever it is. The field decides where the cat **goes** when it moves; focus-safety decides whether it moves at all.
- **Keyboard-only use** is therefore the weak case. It is a known limit, not a bug to hide: see the open questions.

### 2.3 Movement kinds the field needs
The cat's sprite has a side and a front view only, so it cannot walk diagonally. Movement is made of three kinds, all through Rust:
1. **Walk** along its current row (exists).
2. **Hop** to another row along a short arc (new): the existing `hop` and `land` motion, plus a window move of a few steps along a curve; limited to a modest height; chained for a long way. The window moves 60 times a second, played by a Rust thread from one path (TE-15), and the cat inside is painted at 30 frames a second; a hop costs about 0.34 core-seconds (measured 2026-11-09).
3. **Fall** (new, L3 and also when the cat is dropped): gravity to the surface below, a `gasp` pose in the air and a `land` squash on arrival.
Moving away from attention is a walk, then (if needed) a hop or two: never a long diagonal run.

## 3. Behavior

| State | When | What the cat does |
|---|---|---|
| Rest | no attention near, nothing to do | stands, blinks, dozes, naps at a low-cost place (edges and corners preferred; the middle of a maximized window is allowed when it is quiet) |
| Wander | the user has been idle for a while (the CALM limit of spec/06) | walks and hops between low-cost places, weighted by its preferences |
| Avoid | the user is active and the attention reaches the cat (cost above the limit at its place) | moves to the nearest lower-cost place **away from the user's hill** (T4); at most once every 20 seconds, so it never runs around; if it cannot, it curls up where it is |
| Approach | the user has been idle for a long time and the cat is close or lonely | may come closer to the last known place of the user (tier-dependent), never into a hill |

Nothing in this makes the cat louder: it moves less than today while the user works and more while the user rests. Lines (spec/03) keep their own rules.

### 3.1 The typing lane (agreed 2026-11-09; built in TE-12, TE-13 and TE-14: the cat hops out of the band)
**The gap it closes.** Pointer proximity makes the cat leave when the user starts typing near it. It does not notice when the **text** then runs toward the cat, because the pointer stays where it was. The real caret is not available: the system caret (`GetGUIThreadInfo`) is not reported by Chromium and Electron apps, which is most modern software (tested on 2026-11-09 on the author's machine, foreground class `Chrome_WidgetWin_1`: no caret). UI Automation can give it but is heavy, needs the browser's accessibility mode and looks like surveillance (ADR-0029); reading pixels near the cat is reading the screen. So the caret is **predicted**.
**The model (pure logic in `lane.ts`, proposals to tune):**
- **Anchor A:** where the user last clicked (the caret was put there), taken from the mouse button state; if there was no click since typing began, the pointer position when typing began. A new click replaces it. It expires after 60 s without any input.
- **Tuned after the author's first try (2026-11-09):** the first version moved after the text had reached the cat. Now the predicted caret runs at **60 px/s** (not 45) and the band looks **1.5 s ahead**; the cat can hop **from a walk**; a **sleeping** cat the band reaches wakes after 0.6 s (not 4 s); the lane has its own **10 s cool-down** between hops (6 s gave 15 hops in two minutes in the author's test; the pointer rule keeps 25 s); the poll starts when the user is active and clicked on a row within 200 px of the cat, even with the pointer far away. The author then said the timing was right.
- **Typing time tau:** seconds of continuous activity (`idleMs < 1.5 s`) since the anchor was set, capped at 120 s. Only the time is counted, never keys.
- **Predicted caret:** `x = A.x + 45 px/s * tau` along the row `y = A.y` (a typist makes about 5 characters a second at about 9 px each).
- **The lane:** the band `|y - A.y| <= 100 px` (half the cat plus a margin) from `A.x - 100` to `predicted x + 200` px: what is typed so far and what is about to be.
- **Crowded** when the user is active and the cat's centre is inside the lane (this adds to the circular "near" rule, it does not replace it).
**Escaping.** Walking sideways cannot work: the cat walks at 36 px/s and a typist's caret advances at about 45 px/s, so the text would catch it. The cat must leave the band **vertically**: a hop to a row at least 160 px above or below (the side with more room first). That is why vertical movement (TE-2, TE-7) comes first (T9). Until it exists the cat keeps today's sideways making way.
**Limits, said plainly.** Line wraps, multi-line fields, text that was already there, right-to-left text and typing in a title bar make the prediction wrong. The prediction is used only to make way early; it can make the cat leave when it was not needed. Only use will say whether that is acceptable (H9).
**Privacy.** The only new signal is whether a mouse button is down (a button, not a key), read in the thread that already reads the pointer, kept in memory (the anchor and the typing time), never stored or sent; stated in the README and on the website with the attention field.

## 4. Window relief (L3, later)
Only when Vinh gives the permission (a Settings switch, default to be decided then): a Rust command returns the visible, non-minimized, non-cloaked, non-own top-level windows as rectangles (from the extended frame bounds, so invisible borders do not count), in z-order, with the maximized flag. The terrain then adds: top edges as **perches** where there is headroom for the cat and the edge is not covered by a higher window (the visible part only); side edges as **walls**; the cat hops up to a perch, sits, naps and watches. **Surfaces must be stable for half a second before they are used** (window animations make the geometry jump). When the surface under the cat disappears or moves (a window dragged, minimized or closed), the cat **falls to the surface below** with a `gasp` (T5). A maximized window offers nothing but its interior, which is plain field: this is the common case, and the cat lives there by layers A and B alone.

**Alternative mechanism (spec/08 section 4, proposed):** instead of listing every window and subtracting the ones above, ask the system for the **topmost window at the points of a coarse grid** and classify each point (bare desktop, taskbar, an app window, the foreground window). Z-order is then handled by the system, no window list, titles or process names are involved, and a perch is a place where an app window has bare desktop above it. It needs the same permission as the window list. Measured on 2026-11-09: 144 points in about 4 ms; on the author's screen every point was one app window (a maximized window), which confirms that the interior is the plain and that this map mostly says which window is under the cat.

## 5. Rejected
- **Detecting blank areas of the screen** (sampling pixels, even at low resolution) so that Peak can sit on "empty" parts of a document: that is reading the screen, against the privacy principle, heavy, and flagged by security tools. If ever wanted it would be an opt-in experiment with its own decision record, not part of this.
- **UI Automation, the caret rectangle** (already rejected in ADR-0029): unreliable in browsers and Electron, heavy, looks like surveillance.
- **Following a dragged window** (T5): needs the window's position every frame (CPU), error-prone.
- **A long diagonal run across the screen**: no diagonal walk exists and chasing is already rejected (ADR-0011).

## 6. Privacy statement (to go into the README and onto the website when built)
- The attention field is a coarse grid kept only in memory. It records where the pointer was while you were active, fading in about 20 seconds. It is never written to a file, never sent, and is gone when Peak closes. It does not read the screen, the keys you press, or any window.
- If window geometry is ever added (L3), only the position, size and maximized state of visible windows would be read, only while the setting is on, never titles or contents, never stored or sent.

## 7. Constraints
Idle cat about 0% CPU (hops and falls are full-speed motion and are measured one by one); no new network call; no global keyboard hook; no screen-content reading; the pet window owns the state; pure logic in `src/lib` with Node tests (`terrain.ts`, `attention.ts`, place choice); platform specifics in Rust behind a small interface (a monitor list, `move_to`, later a window list), so a macOS port stays possible.

## 8. Open questions
1. **Keyboard-only users** (pointer parked, typing): the field is blind to the caret. Mitigations: the FS-1 stillness while active; a longer decay when typing continues with a parked pointer; or accept the limit. To be settled in L2 with real use.
2. **Whose attention when the pointer is on another monitor than the cat?** The cat avoids only its own monitor's hill; a hill on another monitor is no reason to leave.
3. **How many hops, how high?** To be set by measuring CPU and by how the movement looks (the author reviews every new motion on a test build before it is committed).
4. **Window relief default and wording of the permission** (L3).
5. **Does living in the middle of a maximized window feel intrusive when the user is idle?** Only the alpha can say; a Settings choice "stay near the edges" may be needed.

## 9. What could not be verified
Everything: no part of this exists. In particular, whether a pointer-based attention field is a good enough proxy for "where the user is working" is a hypothesis (H9, see the register), the constants (half-life 20 s, 0.25 limit, 20 s between moves, 150 x 40 danger zone) are starting values, and the CPU cost of hops and falls is unmeasured.
