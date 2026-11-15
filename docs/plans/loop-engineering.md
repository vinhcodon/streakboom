# Loop engineering: watching Peak in real use and improving it in rounds (E29)

**Idea.** A round has a fixed length, a fixed set of scenes and gestures, numbers that can be read, and one change at a time. We keep or drop the change by the numbers, and the author is the gate for anything he would see (motion, art). It is close to Karpathy's autoresearch loop (a fixed budget per experiment, one metric, keep or discard), with two corrections: the numbers measure whether Peak is correct, not whether it is likeable (only the author can score that), and the gate is a person.

## What Peak can do (from the table `BINDINGS`, the skill files and the page, checked again at each round)
- **Gestures:** poke (click), scratch (sweep head), belly rub (sweep belly), carry (drag), open chat (double click), shove (right click), step aside (right double click), toggle visibility (tray click).
- **Skills (typed or by the model):** leave, seat, seat_here, aside, remind. Verbs: say, pose, wait, walk_to_edge, step_aside, walk_home, save_seat, hide, count.
- **Actions without a gesture:** quiet toggle, settings, quit, make way, escape cover.
- **On its own:** walk on lanes, perch, climb, hop, fly and fall, land at window edges, sit by the pointer, lines by context, chat with the model, updates.
- **Senses:** windows (rectangles), activity (not content), cover by windows, time of day, and in Preview the picture of the screen (stand spots, edges, walls, plains, panels, rough ground, reach, dark or light).
- **Not yet used:** the picture is only a view (PS-6, PS-7).

## Round 1 (10 minutes, a dev build)
Five stretches of two minutes: a light page full screen, a dark page, a small window over the desktop, the desktop only, the light page again. In each, every 9 seconds a gesture from the list (click, sweeps, drag, right click, right double click, double click, idle), then the pointer leaves so Peak shows what it does alone. `scripts/loop/loop-round.ps1` samples Peak's window every half second into a CSV. Afterwards the CSV and the app logs are read:
- answered: after a gesture, did the window or the pose change, did a gate say why not (counts per gesture and per gate);
- motion: how far Peak moved by itself per stretch, and how long it stood still (stuck means no move for 60 s with the pointer away on a scene that has ledges);
- perch, climb and hop: attempts, results, the gate that blocked (perch-trace);
- covered or off screen: the window rectangle outside the screen or under a scene.
The round changes no behaviour code. Chat is not tested (it uses the author's key).

## Not measured by this loop
Likeable, natural, annoying. Only the author scores those, with the test build in his hands.
