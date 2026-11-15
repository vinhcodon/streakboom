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

## Ideas from the rounds, with the charter check (for the author to weigh; nothing here is built)
Within the charter (article 8: alive inside 1 to 7):
1. **A clear place before dozing** (H29): it covers content while it sleeps. A small change, no new sense.
2. **A back-off for the rule of the clear place:** after a move, rest at least a minute; after three moves in ten minutes, stop chasing and stay put (manners 3 and 6). Needed whatever ADR-0123 becomes.
3. **A home in the clear:** over days, the clear places it has used most become its places (like the usual place, ADR-0117, but chosen by the picture). It remembers a place, never a meaning.
4. **Watching with you:** when a large part of the picture changes at once (a video, a slide), it sits still and watches the same area from a clear place. It senses only that cells changed (activity, article 4 allows it).

Pressing on the charter (feel free to decide whether the charter should change):
5. **Colour as a sense** (a new sense, so a decision by the privacy contract): a screen with a lot of red for a long time (a failing build, an error page) makes Peak sit quietly near, and not play. It would be warm and useful, but it is meaning by proxy: it comes close to article 4 ("shapes, not meaning") and to the rule "no sense without a decision". If the author wants it, it needs an ADR and a rewording of article 4 (colour counts, text never does).
6. **Standing on content on purpose, when invited:** after petting, Peak may sit on the window you are in for ten seconds as play, then yields. It breaks article 2 for ten seconds, only when the person started it; the mode `play` already exists. A charter note would be needed to say that an invited cover is allowed.
7. **Leaving marks:** a paw print left on a clear place on the screen for a minute. It is a drawing on top of the person's screen (article 1: no surprise cost); only with an explicit switch, never in work mode. It would need an exception for drawing outside its own window.
