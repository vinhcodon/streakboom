# 10. The desktop as terrain, version 2: surfaces and costs from regions with identity

Status: **decisions T1 to T4 answered by Vinh on 2026-11-10 (ADR-0044): the model adopted, the ground map on by default, no props yet, the overlay first.** It answers the author's feedback after the first perches (PC-6, TE-10c): the cat never hopped onto a window edge for him, and he pointed out that a machine where one monitor always holds a full-screen window has no "windows with bare desktop above them", so a terrain made only of such ledges almost never exists. He asked for the desktop to be thought of as **a terrain made of blocks, planes, steps and bumps** where Peak can sit and move. Related: [`07-terrain-and-attention.md`](07-terrain-and-attention.md) (the cost field and the layers), [`08-perception.md`](08-perception.md) (the senses and the ground map), ADR-0030, ADR-0031, ADR-0043. Backlog: epic E14 in [`../docs/plans/backlog.md`](../docs/plans/backlog.md).

## 1. What went wrong (two things, both ours)
1. **The model was too narrow.** A "perch" was a window whose top edge had **bare desktop** above it (the ground map says `desktop`, a class the system gives only to the wallpaper). On a screen with a maximized window the whole map says "window": no ledge exists. The author's screen is such a screen, and so is most people's.
2. **The tests hid the cat.** The stand-in desktop and the gray window of the real-ledge test were always-on-top windows created after Peak's own, so they were drawn **over** the cat: the hop happened (the numbers say so) and nobody could see it. A test that cannot be watched is not a test for a feature whose point is how it looks.

## 2. The principle
**Peak is always on top of everything.** It does not need bare desktop to stand on a ledge; it needs a **visible edge to stand on** and **room around it that hides nothing the user needs**. So:
- A **surface** is a visible boundary where the thing below is "ground" and the thing above is "air" for Peak: a horizontal edge Peak's feet can rest on.
- The **cost** of a place (spec/07) says where it should *not* be even if a surface is there: over the title-bar buttons, over where the user types.
- The **terrain** is the set of surfaces, how they connect (a hop up, a hop down, a walk along) and the cost of each.

The ground map (a coarse grid) gives what is needed if each cell carries **which region** it belongs to, not only its kind: an **opaque number** for the topmost window at the cell's centre (the system already gives one; ADR-0043 allows it, nothing about the window is read, the number is compared inside one map and dropped). A boundary between two different regions is an edge. This is what makes a dialog, a popup, a floating window over a maximized one, a toast or a flyout into terrain: each is a block standing on the one behind it.

## 3. Where terrain comes from
| # | Source | What it gives | Exists on a screen with a full-screen window? | Reads |
|---|---|---|---|---|
| S1 | The frame of the work area | the floor (above the taskbar), the left and right walls, the corners, the ceiling | **always** | monitor geometry (already known) |
| S2 | The taskbar | a floor of its own, a wall when it is at a side | always | the kind "taskbar" (built) |
| S3 | A window in front of another (a boundary between two regions in the map) | ledges (top edges), walls (sides), steps (several windows stacked or cascaded) | when a dialog, popup, floating window or flyout is up | the map with region numbers |
| S4 | Monitor seams and other monitors | a step where two monitors differ in height, the windows on a second monitor (often not full-screen) | with more than one monitor | monitor geometry; the same map per monitor |
| S5 | A window that moves | a moving platform: Peak on a window's edge goes with it; a dragged window carries it, a closed one drops it | when the user drags or resizes | the region number and its edge, per probe |
| S6 | Places the user taught (spec/07 L4) | a favourite spot where Peak goes to rest, anywhere, even over a full-screen window | always, once taught | where the user dropped Peak (a few numbers, in memory or in the pet file with consent) |
| S7 | Props Peak carries | a cushion, a cardboard box, a small bed **drawn inside Peak's own window under it**: a place that justifies sitting anywhere (cats sit in boxes) | always | nothing: it is art |
| S8 | The structure inside a window (title bar, tab strip, toolbars) through the system's accessibility tree | many small flat edges inside a full-screen window | with a full-screen window | **a new kind of reading**: shapes of controls, not their names or text; **not proposed now**, it needs its own decision and its own privacy text |

**What this says plainly:** on a lone full-screen window the terrain is S1, S2, S6 and S7: the frame, the taskbar, the places the user taught and a prop. That is why S6 and S7 matter as much as S3: they are what keeps Peak from standing on the taskbar and nothing else.

## 4. Shapes, and what Peak does on each
- **Block:** a region, a rectangle. **Ledge:** the top edge of a block (the cat sits, naps, watches). **Wall:** the side of a block (the cat sits against it, peeks over the edge). **Step:** two ledges within one hop of each other, up or down. **Stairs:** a run of steps (a cascade of windows). **Gap:** two ledges too far for one hop (it goes around or does not go). **Ramp / slope / bump:** a rectangle has none, so a slope is **a run of small steps** and a bump is **a prop** (a cushion on a ledge): the sprite cannot walk diagonally (spec/07 2.3), so it hops step by step.
- On a surface Peak can: rest (sit, nap, watch, groom), walk along it (the existing walk, **kept inside the surface's extent**), hop up or down to a neighbouring surface, **peek** (lean over the edge, half out of the screen at a frame edge), and **ride** (a moving platform).

## 5. The rules that keep it honest
1. **A surface counts only if its edge is visible now** (the region above it is not Peak's concern; the edge itself must be a boundary in the current map) **and has been stable for half a second** (a window being moved is a moving platform, S5).
2. **Headroom:** the cell rows above the edge up to the cat's height must not be a danger zone (title-bar buttons, the caption of the window in front) and, while the user is active near it, must not be where they work (the attention field).
3. **Reach:** a surface is a goal only within one chain of hops (the limits of `perch.ts`: 700 px across, 70 to 420 up; down is a fall).
4. **Rare and calm:** it moves to a surface only when calm (the user paused), rarely, and with the notice beat first; nothing it does ever blocks the user's work (spec/06).
5. **Privacy (ADR-0031, ADR-0043):** the map and the region numbers live in memory only, are taken only when about to move, are never written or sent, and carry no title, process or app name. S6 stores only positions the user chose by dragging.

## 6. How it is built
- Rust `ground_map` returns, per cell, the kind **and the region number** (a number from `window_id_at`; 0 for the desktop, the taskbar, Peak's own window).
- A pure `terrain.ts` turns a map into **surfaces** (ledge, wall, step) with their extent, the region on each side and a stability counter across probes; a **surface graph** says which surface can be reached from which (hop up, hop down, walk along) and at what cost (the cost field of spec/07).
- `perch.ts` becomes one consumer: it asks the terrain for the nearest reachable surface with headroom instead of reading cells.
- The frame and the taskbar (S1, S2) come from the monitor geometry; the places (S6) and props (S7) are separate small modules that add surfaces to the same graph.
- **Seeing it** (section 7) comes first, so that nothing here is built blind.

## 7. A way to see the terrain (built first)
A **developer overlay**, never in a release build: a click-through window the size of the screen that draws what Peak believes: the grid, the region numbers (as colours), the surfaces (green lines), the surface it has chosen (a marker) and the cost of each. With it the author **sees** what Peak thinks the desktop is, and a failure of the idea shows up as a picture ("no green lines at all on my screen"), not as a missed test. The overlay is drawn on top of the cat but with the cat's own window above it, so the cat is never hidden (the mistake of section 1).

## 8. What stays rare, honestly
Even with all of this, a desktop that is one full-screen window and nothing else gives only the frame, the taskbar, the taught places and the prop. Perching on **real windows** will be an event that happens when the user has dialogs, popups or windows in front of the big one, or a second monitor. The design accepts that and makes the other sources (S6, S7) carry the daily life of the cat.

## 9. Decisions for Vinh (answered 2026-11-10, ADR-0044)
| # | Question | Answer |
|---|---|---|
| T1 | Adopt the model of this spec | **Yes** |
| T2 | The default of the ground map switch (Settings, Privacy): the map is memory only; off by default means almost nobody ever sees the feature | **On by default**, with the same honest text and a switch to turn it off |
| T3 | Props (a cushion, a cardboard box, a small bed drawn under Peak) as the place that works anywhere: new art | **Not yet** (the author declined for now) |
| T4 | The order of work | **The overlay first**, then region numbers and surfaces, then the frame and the taskbar, then taught places |

## 10. Stories
Epic E14 (TT-0 to TT-9) in the backlog. The overlay (TT-1) comes first because the last two rounds of tests were done blind.

## 11. Vertical surfaces, climbing, and when Peak falls (the author's second point, 2026-11-10)
The author said: Peak can **climb up and down vertical planes**; a **straight fall** should happen only when something **knocks it off** its seat, or when its seat is **taken away**, and then it should fall **to the plane below**, not to the floor of the screen. Assessment: **right, and it fixes two things in what we built.**
- **Movement modes** instead of "walk, hop, fall": *walk* along a horizontal surface; *hop* between nearby surfaces (a crouch first, a landing squash); *climb* along a vertical one (up or down); *mantle* (pull up over the top edge of a wall onto its ledge); *cling* (hold on, and doze); *fall* (gravity). A deliberate way down is a **climb down or a hop with a crouch, never a fall** (TE-16: a deliberate hop down already read as a fall to the author; it must read as a decision).
- **Falls only when involuntary:** (1) **knocked off**: a window dragged or resized into the cat, a window that closes or minimizes under a wall it clings to (the pointer carrying it away is a drag, not a fall); (2) **seat removed** (the window or block it stands on is gone: what PC-7 does today). Both are shown with the startle beat.
- **Where it lands:** on the **next surface below at the same x** (the terrain is scanned downward), the floor only if there is none. PC-7 today falls to the bottom of the work area: **that changes** (story TT-12).
- **The terrain must give vertical edges** (walls), a *surface below x* query and the extent of each wall; `terrain.ts` gets them (a wall is a boundary between two regions in a column).
- **Art:** a climb is a body turned to the wall with the claws out, a whole new pose. The first version can **climb as a chain of short hops up the wall** (zig-zag), so that nothing waits for art; a real climb pose and cycle comes after (TT-14, a rig change the author looks at first).

## 12. Terrain from the picture on the screen (the author's third point, 2026-11-10)
The author said the map should also recognize **blocks of the screen by colour and lines**: a block of black text is one block, a box with a border is one block; then terrain would be varied and **need not have anything to do with windows**. Assessment: **it is the richest idea so far, and it is a different kind of sense with a privacy cost that has to be decided on its own.**
- **What it would be.** Looking at the pixels of the screen, in memory, at a very low resolution, and turning them into **rectangles** (blocks of text-like content, boxes with a border, pictures, empty space), then throwing the pixels away. The blocks are **regions with identity**, like windows: the same surface and wall rules apply (a block's top edge is a ledge, its sides are walls). Better still, it gives a **better rule for room**: the cat should sit in **empty space** (the blank above a block), so it covers nothing that is on the screen; that is the same as the focus-safety promise (spec/06) and replaces "some other window above it".
- **Why it is different from every sense so far.** ADR-0031 says Peak perceives shapes and activity, **never what is on your screen**. Shapes of the content are not the content, but **to get them Peak must look at the pixels**, which may hold anything (a password manager, a private message). It needs its own decision, its own text (README, Settings, website) and strong guarantees: **local only; the picture is reduced to a small grayscale grid in memory (so small that no text can be read from it) and dropped at once; only rectangles remain, in memory; nothing is written or sent; taken only when Peak is about to move or to check that its seat is still there (a small rectangle).** A switch in Settings, Privacy.
- **How it could be taken:** the screen device context (GDI `BitBlt` without the layered-window flag leaves out layered windows, so **Peak's own transparent window is not in the picture**), downsampled; no new dependency for the segmentation (a gradient map, a whitespace map, connected blocks after closing: a few hundred lines of Rust); about 10 ms; no hook, no driver, no network.
- **Honest limits:** protected video, some games and exclusive full-screen programs come out black (no terrain from them); dark themes need relative thresholds; a page of dense text has little empty space; **content moves** (scrolling, video, animation), so a block must be stable for about a second before it counts, a video or a scroll makes the content terrain disappear (the windows and the frame remain), and **content perches only when the user is calm**; when the user comes back, Peak **gets down by itself** (it makes way), it does not wait to be knocked off; security software and company policies may object to any program that captures the screen, even in memory; Windows may show no indicator for this kind of capture.
- **What it opens:** perches on any application (the edge of a card, a toolbar, a code block), walls to climb, steps in a list, and so a terrain of every desktop, full-screen or not.

## 13. Decisions for Vinh (second round, answered 2026-11-10, ADR-0045)
| # | Question | Answer |
|---|---|---|
| T5 | May Peak look at the pixels of the screen, in memory, at low resolution, to find blocks (section 12) | **Yes, opt-in, off by default**, with its own text; the window terrain stays on by default |
| T6 | Climbing walls: first as chains of hops, the climb pose as a later rig change (section 11) | **The climb pose is drawn now** (the author declined the hops-first approach) |
| T7 | Falls: only when knocked off or when the seat is removed, and then to the plane below; deliberate ways down are climbs or hops (section 11) | **Yes** |
| T8 | Order: finish the overlay and the window terrain first, then the falls to the plane below and the walls, then the screen picture sense | **Yes**: overlay, window terrain, the fall to the plane below, walls and climbing, then the picture sense |

## 14. Stories added
Epic E14 gets TT-10 to TT-14 (the picture sense, content surfaces and the empty-space rule, walls and climbing with falls to the plane below, knocks from moving windows, the climb pose).
