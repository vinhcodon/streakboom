# ADR-0044: The desktop is a terrain of surfaces and costs built from regions with identity; the ground map is on by default; props wait; the overlay comes first

- **Status:** accepted (decisions T1 to T4, 2026-11-10); built in the order of epic E14
- **Date:** 2026-11-10
- **Decided by:** Vinh (author), with Claude

## Context
The first perches needed bare desktop above a window. The author never saw one: his screen, like most, always has a full-screen window, so the map is one block and has no ledge; and the tests had hidden the cat under always-on-top windows of their own. He asked for the desktop to be thought of as a terrain of blocks, planes, steps and bumps. Spec 10 is the design.

## Decision
1. **T1: the model of spec 10 is adopted.** A surface is a visible boundary between two regions (the ground map carries an opaque region number per cell, from the system's window handle; nothing about the window is read); the frame of the screen and the taskbar are terrain; windows in front of windows, other monitors, moving windows and taught places are terrain; the accessibility tree is left for a later decision of its own.
2. **T2: the ground map switch is on by default** (Settings, Privacy keeps the switch and the honest text). The map stays in memory, is taken only when about to move, and is never written or sent. This changes the default of ADR-0043 item 4 ("off by default").
3. **T3: no props yet** (no cardboard box or cushion drawn under Peak); to be asked again when the rest of the terrain exists.
4. **T4: the developer overlay first.** A click-through window drawing what Peak believes about the screen, built behind a cargo feature and never in a release, so that the terrain is seen and not tested blind; then the region numbers, the surfaces, the frame and the taskbar, and the taught places.

## Alternatives considered
Keeping the perch rule (bare desktop above) and accepting that it almost never happens (declined: the feature would be invisible); reading the accessibility tree now (declined: a new kind of reading that needs its own privacy decision); props now (declined by the author for now); switch off by default (declined: nobody would find it).

## Consequences
- The README, the Settings text and the website prompt change at the next release: the map is on by default.
- A lone full-screen window still gives only the frame and the taskbar; spec 10 says so plainly.
- Not verified: how often real perches occur on real desktops, how the region numbers behave with several monitors and with windows that are moved, and whether the default-on map costs anything noticeable (it is taken only when about to move; 4 ms each).

## Sources
spec/10-terrain-model.md; docs/decisions/0030, 0031, 0043; docs/engineering-log.md
