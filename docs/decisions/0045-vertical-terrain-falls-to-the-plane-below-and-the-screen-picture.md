# ADR-0045: Peak climbs vertical surfaces and falls only to the plane below; the screen picture sense is allowed as an opt-in

- **Status:** accepted (decisions T5 to T8, 2026-11-10); built in the order of epic E14
- **Date:** 2026-11-10
- **Decided by:** Vinh (author), with Claude

## Context
After the first perches the author pointed out two things (spec 10 sections 11 and 12): Peak can climb vertical planes and should fall only when knocked off or when its seat is taken away, and then onto the plane below; and the terrain should also be found from the picture of the screen (a block of text, a box with a border), so that it does not depend on windows.

## Decision
1. **T5: the screen picture sense is allowed, opt-in, off by default.** Peak may look at the pixels of the screen, in memory, reduced at once to a small grayscale grid (too small to read text from) and then to rectangles, taken only when it is about to move or to check its seat; nothing is written or sent; its own text in the README, Settings and the website; a switch in Settings, Privacy. The window terrain stays on by default (ADR-0044). This crosses the line of ADR-0031 (never what is on the screen) on purpose and in the open; ADR-0031 is amended.
2. **T6: the climb pose is drawn now** (a rig change: a body turned to the wall with the claws out, a climb cycle, a mantle over the edge), not approximated by hops first. The author looks at a test build before it is committed.
3. **T7: falls.** Only when something **knocks Peak off** its seat or its seat is **removed**, and then onto the **next surface below at the same x** (the floor only if there is none). A deliberate way down is a climb down or a hop with a crouch, never a fall. This changes the fall of PC-7, which lands on the floor of the work area.
4. **T8: the order:** the overlay, the terrain from windows, the fall to the plane below, walls and climbing, and only then the screen picture sense (it needs the overlay to be tuned).

## Alternatives considered
Windows only (declined: a full-screen window leaves nothing); the picture sense on by default (declined: it would look at the screen of everyone who updates, before they agreed); the climb as a chain of hops first (declined by the author: the movement should look right from the start); keeping the fall to the floor (declined).

## Consequences
- ADR-0031 gets an amendment pointing here; the README privacy section, Settings and the website get a new paragraph when the picture sense ships (the website session is told at that release).
- The fall of PC-7 (`groundLost`) will need the terrain below the cat: the ground map (kept, on by default) is read when the seat goes.
- Not verified: whether segmenting a screen picture into blocks is good enough in practice (dark themes, dense text, video), what it costs, how security software reacts, and how the climb pose looks.

## Sources
spec/10-terrain-model.md (sections 11 to 14); docs/decisions/0031, 0043, 0044
