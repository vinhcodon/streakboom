# ADR-0116: The terrain overlay returns in Preview builds, and every perch attempt is logged

- **Status:** accepted (the author asked for both on 2026-11-15); built on branch `vanish`, **not yet seen** (V-147). Amends the "never in a release" rule of spec 10 section 7 (TT-1, ADR-0044) for Preview builds only.
- **Date:** 2026-11-15
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The author has never seen Peak climb a wall or hop up and down on his own desktop since those moves were built (V-81 and V-84 saw them only on a stand-in desktop of ours). The code of the perch, the climb and the hop has not changed since 0.6.0, so the cause is in the conditions on his desktop, which nothing records: the attention mode (an attempt needs "free" or "play"), the ground map switch, a five-minute cool-down, and a ledge the map has to show (a window top 70 to 420 px above the cat, with room above it). He also wants to see what Peak believes about the terrain, to decide how to improve its sight.

## Decision
1. **`perch-trace.log`** in the data folder, like `leave-trace.log`: one line for each attempt (about one every four minutes when Peak is idle) with the gate that stopped it or what it chose: `blocked busy`, `blocked cooldown left_s=`, `blocked not_free mode= walk_allowed=`, `blocked no_map ground_map=`, `blocked no_feet`, `no_ledge ledges= surfaces= desktop_pct= scale=`, `too_high rise= hop_max= wall= wall_width=`, `go climb|hop dx= dy= wall=`, `climb_done ok=`, `hop_done`. Fixed names and numbers only, capped at 64 KB, never sent (the command `perch_trace` shares `append_trace` with the update log).
2. **The terrain overlay is available in every Preview build** (an odd middle number, read at run time from the build's own version) and in a developer build (cargo feature `terrain-overlay`), **never in a Stable build**: the tray menu of a Preview has an item "Terrain overlay (Preview)" that opens or closes a thin, click-through, transparent layer over the work area of the monitor Peak is on. It draws the grid, the windows, the surfaces (green where the cat would have room), the cat's feet and the ledge it would choose, with the limits of a real attempt (climbing included), and a line at the top: the attention mode and the last gate of the perch trace. It draws on the screen only; nothing is saved or sent.
3. **The overlay follows Peak:** when Peak is hidden (the tray, or away) the overlay is hidden, and when Peak is shown it is shown again. It is off at every start (the person opens it).
4. No setting is added (charter: few settings): the tray item exists only in a Preview.

## Consequences
- A Preview shows a tray item and a layer that a Stable never has; the changelog of the Preview says so and the site does not (ADR-0101).
- After some days of use the trace says which gate stops the attempts; the next step is chosen from it (for example a tracked "free" time, or a different cost for a ledge).
- Not built: a way to make the overlay thinner or to pick what it draws; the favourite seat (a separate decision).
