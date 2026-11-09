# 08. Peak's senses: perceiving the space around it and below it

Status: **brainstorm draft, 2026-11-09. Not agreed; nothing is built; the decisions in section 9 are Vinh's.** It came from Vinh's suggestion that, besides the signals around Peak (spec/06, spec/07), Peak needs a theory of **seeing the space around and below it**: when it can see, it knows how to react. It cross-checks the existing specs (section 7) and lists the gaps it found. Related: [`06-character-and-movement.md`](06-character-and-movement.md), [`07-terrain-and-attention.md`](07-terrain-and-attention.md), [`03-naive-pet-design.md`](03-naive-pet-design.md) ("reactive to the system"), ADR-0029 and ADR-0030.

## 1. The idea
Until now Peak's reactions came from a few signals read one at a time (idle time, pointer distance, room to the edge). There is no single picture of **what Peak can perceive and what it believes about the space it is in**. This spec proposes one: a small set of **senses** with a cat's character (whiskers, ears, paws, eyes, a sense of time), each giving a **percept**; percepts are merged into a **belief** about the surroundings with some confidence; the cat's **reflexes** (cheap, visible, immediate) and **intents** (walk away, hop, curl up) react to the belief. A cat that can be seen noticing things behaves more naturally than one that suddenly acts.

**The sensory contract (the privacy rule that makes this acceptable):** Peak perceives **shapes and activity, never meaning**. It can know that something is there, how big it is, whether it moved, whether the user is active near it. It cannot know what a window shows, what is typed, which keys are pressed, what an app is called. Every sense below states what it reads and what it does not.

## 2. The senses

| Sense | What it tells Peak | Signal (and what it does not read) | Cost | Status |
|---|---|---|---|---|
| **Whiskers** (what is near) | how far the pointer is; whether it is on the cat; whether it is moving (reaching for something) | the pointer position, from the thread that already polls it (no content) | none extra | built (FS-2, FS-4) |
| **Ears** (activity) | the user is typing or working now; stopped; started again; where they last clicked | time since the last input (one number), the mouse button state (T8; never a key) | one syscall in the existing thread | idle time built (FS-2); click anchor agreed, not built (TE-13) |
| **Paws** (what is below) | what the cat stands over: bare desktop, the taskbar, an app window, the foreground window; the edge of the world; whether the ground disappeared | `ChildWindowFromPointEx` at points under the cat, classifying only desktop / taskbar / Peak / app window (class names used only to recognize the shell; not kept) | about 0.03 ms a point | **proposed** (section 4); needs Vinh's permission |
| **Eyes** (the space around) | free room to the left and right; the neighboring monitor; where the bare desktop is; which cells belong to the foreground window | the same point sampling on a coarse grid; monitor work areas (already known to Rust) | 144 points in about 4 ms | partly built (`edge_room`); the rest proposed |
| **Clock** (slow senses) | time of day, session length, the weekday, battery, a long absence | the system clock and power status | none | partly built (spec/03); weekday and battery not built |

### 2.1 Measured on 2026-11-09 (the author's machine)
A probe sampled 144 points of a 16 x 9 grid with `ChildWindowFromPointEx` (flags skip invisible, disabled and click-through windows) and classified each point. Facts it gave:
- **The whole screen was one app window** (all 144 points "an app window", no bare desktop, which is the "people keep windows maximized" case the author warned about). So on a typical screen the ground map says nothing about free space; what it does say is which window is under the cat and whether that is the foreground window. This confirms spec/07 T1: the interior of a maximized window is the plain Peak lives on.
- With the click-through flag, **Peak's own window is skipped** (it does not see itself); without it, the probe finds Peak at its own position. So the cat can be recognized and excluded.
- **Cost:** 144 points took about 4 ms once warm (the first call is slower). A sparse sampling while the cat decides is negligible.
- Not tested: a desktop with several non-maximized windows, the taskbar band, several monitors with different scales, UWP and cloaked windows, a remote session.

## 3. From senses to belief to reaction
- **Percepts** are a typed snapshot taken when a decision is needed (the sampling policy of section 8). They are plain data: `{ idleMs, pointer, click?, room, ground?, free?, time }`.
- **Belief** is what the cat concludes, with a confidence and some hysteresis so that it does not flicker: "the user is working at about here" (the pointer, the click anchor and the predicted caret of spec/07 3.1; medium confidence), "I am crowded", "there is room on my left", "I am standing over the foreground window", "my ground is gone". `focus.ts` already is a small belief (crowded, keepWalking); the typing lane and the attention field of spec/07 are beliefs too. A pure module, `perception.ts`, would hold the types and the merging, with Node tests.
- **Reflex** (cheap, immediate, visible, small): turn the head toward the user's attention, perk the ears, glance at the pointer. **Intent** (costly, rate-limited): walk away, hop to another row, curl up, fall to the ground below.
- **Confidence decides the response.** Low confidence (a guessed caret) gets a reflex only (look toward it, ears up); high confidence (the pointer is right by the cat and the user is typing) gets the intent. This is also how the "predicted caret" of the typing lane stays honest: when the guess is weak the cat shows it noticed, and only acts when it is sure.

## 4. Below: sensing the ground
"Below" has two meanings and both matter.
1. **What the cat stands over** (the ground type): the point under its feet and a few points around it. Categories only: **bare desktop** (the quietest place), **taskbar**, **an app window** (and whether it is the foreground window and whether it is maximized), **the edge of the world**. Reactions:
   - Standing over bare desktop or the taskbar is calm; standing over the **foreground** window while the user is active is where it can cover work, so it is the case in which crowding (spec/06) matters; standing over a **background** window while the user works elsewhere is harmless.
   - When the ground **changes** (the window under the cat is closed, minimized or dragged away), the cat notices: a gasp (existing pose), then it falls to the ground below (the T5 decision, spec/07 section 4), a small unexpected moment that makes the space feel real.
2. **What is under the cat's position on the screen, as a map:** the same point sampling on a coarse grid gives a **ground map**: for every cell, desktop, taskbar, background window or foreground window. Because each point is asked for the **topmost** window there, z-order is handled by the system: no window list, no overlap arithmetic. The perches of spec/07 section 4 (the top edge of a window with bare desktop above it) fall out of the map: a ledge is a cell row where "app window" has "desktop" above it. Compared with the plan in spec/07 section 4 (enumerate all windows, subtract the ones above), this is **simpler and safer** (no titles, no process names, no window list at all), at the price of a resolution set by the grid (it can be refined where the cat is going).
Both need the same permission as window geometry (spec/07 section 4): the ground map reveals the layout of the user's windows. Whether point sampling is a different permission from reading rectangles is for Vinh to say (section 9).

## 5. Around: the space the cat can use
- **Room:** how far to each edge (exists), and on a map the nearest low-cost place away from the user's work (spec/07).
- **Neighbors:** the next monitor across a touching edge (spec/07 L1), so the cat can walk to it.
- **Attention:** the pointer, the click anchor, the typing time and the predicted lane (spec/07).
- **Free space:** where the map says bare desktop is; on a fully covered screen there is none, and the cat falls back on fixed relief (corners, edges) and the attention field.
- **Quiet and loud places:** a place the user keeps pushing the cat out of (learned, spec/07 layer D) is a high-cost place.

## 6. Seeing made visible (the part that makes it feel alive)
A reaction without a cause the user can see looks like a glitch; the same reaction after the cat has visibly noticed looks like intent. Proposed small behaviors, all with poses and springs that exist:
- **Notice (anticipation):** when the user starts working near the cat, it first looks toward the pointer or the predicted caret and perks its ears for about 0.4 s, *then* decides. The author's earlier complaints (a jolt, a stop that looked like turning and sitting back down, a see-through cat) were all about reactions that lacked this lead-in.
- **Look toward the attention** while the user types near the cat, not only when the pointer is over it (today the eyes follow the pointer only while it is over the cat).
- **Reluctant leaving:** the cat looks back once as it walks away.
- **A sleeping cat is not blind:** asleep, its senses are dull (it ignores a distant pointer), but a strong stimulus (the user typing right by it for several seconds) wakes it with its usual stretch and it then makes way. Today a sleeping cat stays in the way until it wakes by itself (20 to 60 s): this is a gap in FS-4 found while writing this spec.
- **Ground change** (L3): the gasp and the fall.

| Belief | Reflex (immediate) | Intent (when sure) |
|---|---|---|
| the user starts typing within about 200 px of me | look at the pointer, ears up | walk away, or hop off the row (spec/07 lane); curl up if there is no room |
| the predicted caret is coming toward me (low confidence) | look along the line the text will take | hop off the row once the prediction reaches about 200 px |
| the pointer is coming toward me with no typing | look at it, maybe a happy hop | stay (it is about to touch me) |
| I am over the foreground window and the user is active | nothing | prefer a place over the bare desktop or the taskbar when moving |
| my ground disappeared | gasp | fall to the ground below, land with a squash |
| I am asleep and the user types right by me for a few seconds | stretch and open the eyes | make way as awake |
| a long silence | glance around | wander (spec/03) |

## 7. Cross-check against the current specs: gaps found
| # | Gap | Where | Action in this change |
|---|---|---|---|
| G1 | There is no single description of what Peak can perceive and what it believes; signals are listed in spec/03 ("reactive to the system"), spec/06 (3.2) and spec/07 (layers) separately | spec/03, 06, 07 | this spec is the home; the others point to it |
| G2 | **Below** is missing: spec/07 knows the terrain only through window rectangles (L3) and has no notion of what the cat stands over now, nor of ground that changes under it except as a side effect of L3 | spec/07 | section 4; spec/07 gets the point-sampling alternative to the window list |
| G3 | The eyes follow the pointer only while it is over the cat; there is no looking toward the user's attention | spec/03 | proposed in section 6 |
| G4 | The make-way behavior has **no anticipation**: after the hold it simply walks | spec/06 3.1 | proposed in section 6 (a "notice" beat) |
| G5 | A **sleeping cat never makes way** (found while writing this spec): it stays over the user's work for 20 to 60 s | spec/06 3.1 | a note in spec/06 and a story (PC-4) |
| G6 | The privacy rules are spread over ADR-0029, ADR-0030 and spec/06 section 4 and 07 section 6 | docs | the sensory contract (section 1); the README and website text get written once when it ships |
| G7 | No confidence: the lane (a guess) and the pointer (a fact) are treated alike; the response should depend on how sure the cat is | spec/07 3.1 | section 3 |
| G8 | Percepts come from polling plus one event (`focus-hint`); a general set of events (typing started, typing stopped, a click, the monitor set changed, the ground changed) is not defined | spec/06 3.2 | section 8 |
| G9 | The slow senses (weekday, battery, a long absence) are listed as "not built" in spec/03 and are not tied to the same model | spec/03 | the "clock" sense above |
| G10 | Multi-monitor perception is per monitor (the pointer on another monitor is not a reason to leave): stated in spec/07 open question 2, not in the model | spec/07 | section 8 |

## 8. Sensing policy, cost and privacy
- **Event-driven, not a clock.** Sense only when something can change the answer: when the user's activity begins or ends (Rust sends events on change, as `focus-hint` does), before a walk or a hop, and a few times a second only while the user may be working near the cat. A standing cat with nobody near costs nothing.
- **Cost model.** A point query is about 0.03 ms; a 16 x 9 map is about 4 ms and is taken only when the cat is about to move (not continuously). Painted frames remain the main cost (spec/04: about 0.55% of a core per frame per second plus a floor of about 1.3%).
- **Privacy.** Nothing here reads titles, contents, keys or app names. The ground map and the click anchor live in memory, are never written or sent. The same README and website paragraph as the attention field covers them when built (TE-9). Window-layout senses (paws and eyes beyond the cat's own position) wait for Vinh's permission (section 9).
- **Platform.** The senses sit behind a small Rust interface (`focus_probe`, `edge_room`, later `ground_at(points)`), so a macOS port can provide its own.

## 9. Decisions for Vinh (open)
1. Is the **sensory contract** of section 1 the rule: shapes and activity, never meaning?
2. May Peak sense **what is under it** (ground type at a few points around the cat: desktop / taskbar / app window / foreground)? This reveals only which kind of thing is there, not what it is.
3. May Peak take a **coarse ground map** (a 16 x 9 grid of the same classification, only when about to move)? It reveals the layout of your windows. It would replace the window-list plan of spec/07 section 4 with something simpler.
4. Add the **notice beat** (look and perk the ears before acting) and **looking toward the attention** to the character (spec/03)?
5. Should a **sleeping cat wake and make way** when the user types right by it for several seconds (G5)?

## 10. What could not be verified
Everything except section 2.1: the 144-point probe on one machine in a fully covered state. Not tested: bare-desktop cases, the taskbar band, several monitors and scales, UWP and cloaked windows, remote sessions; that point sampling is accepted by security software as harmlessly as `GetLastInputInfo`; how the notice beat looks; whether the confidence idea makes the lane less annoying in practice (only use can say).
