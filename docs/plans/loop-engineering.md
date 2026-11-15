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

## An assessment of Peak's movement and reaction rules after rounds 1 to 7 (2026-11-15)
**The method.** Observation alone is not enough; a round should end in one change to the behaviour, with the number it is expected to move written down before the run (the cover share, the moves per five minutes, the time standing in a clear place). Rounds 4 to 7 did that once (the rule of the clear place); the hypotheses H27 to H31 are the queue of the next changes. The author is the gate for anything he can see.

**What the numbers say about the rules as they are:**
1. **Reactions are sound.** Every gesture reached Peak (poke, scratches, carry 9 of 10, double click to chat 5 of 5, step aside chosen 4 of 5, shove). Nothing there needs a change; what was missing was the trace, now added.
2. **Idle behaviour is quiet and seldom purposeful.** Peak stands still about 240 s of every 300 and sleeps 12 to 23% of the time (`pickNext`: half looks, a third walks, the rest dozes). That fits the charter (quiet by default), but it is also why nothing was seen of the rest of its abilities: **the abilities are rare because the rolls are rare and the gates are tight, not because they are broken** (a perch is tried on 3% of the rolls, at most every 5 minutes, and never in work mode).
3. **Two systems decide where Peak is, with different goals.** The perch and climb choose a ledge of the window map (a place to look from, kept for 3 minutes whatever is under it); the rule of the clear place chooses by the picture (a place that covers nothing). They do not know of each other: a perched cat that covers content stays, and a settled cat does not perch. **One chooser of places** (clear, reachable, and sometimes high) with the gates of both would be simpler and more predictable.
4. **Sleep is placed by chance.** It covers content asleep (20 to 34% of the sleeping views at 30% or more): go to a clear place before dozing (H29).
5. **When nothing is clear it stays where it is** (H31): the least covering place, an edge or a corner, is the better fallback.
6. **Restlessness is the risk of any rule that moves it:** a back-off exists now (ADR-0123), unseen in action (V-154).
7. **The speed of the cat's decisions is slow where it matters:** after a change of the screen the rule looks at most every 10 s, and the first look waits for a calm pose. A cover that appears (a window opens under the cat) can last half a minute. Acceptable by the manners (slow when nobody asked for fast); worth checking against the author's feeling.

**Next changes, in this order (each with its number):** (a) a clear place before dozing (H29; cover asleep); (b) the least covering place as the fallback (H31; cover on the dense page); (c) one chooser for the perch and the clear place (fewer rules; the number of different kinds of moves per hour).
