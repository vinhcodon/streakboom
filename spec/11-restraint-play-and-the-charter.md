# 11. Restraint, play, and a charter for Peak

**Status:** the charter, the three modes and the fall rule are decided (ADR-0047, 2026-11-10). **Built and released in 0.3.2 (2026-11-11): CH-4 (the edge ladder with the poses `peek` and `ledge`, waiting for the author to look), CH-2 (the edge check) and CH-3 (the attention modes in `attention.ts`, the thresholds, the silent fall in Work); the audit findings 1 to 5 of section 6 are fixed, 6 is by design, 7 is CH-6.** CH-5 (the person's push and drop) is built and committed; **CH-6 is built (Chattiness and Quiet hours retired; the shoo was declined)**. It answers the author's message of 2026-11-10: knocks and slips should be rare and strong; slow, easy actions come first; Peak lives on the screen beside someone who is working, so it must not distract; how does it tell work from play; and does Peak need a manifesto or constitution.

## 1. Falls, knocks and slips: a strong feeling is spent rarely

A fall is fear plus a bump. It is the loudest thing Peak can do, so it is treated as a **currency**, not as a behaviour: every use has to be *caused*, *proportional* and *followed by recovery and warmth*.

**What was built (CH-5, 2026-11-10):** a poke on the side of the cat toward which it would be pushed (away from the pointer), when it sits within 100 px of the end of its seat, is the push; **letting go of a dragged cat above the floor and off a ledge makes it fall** (a deliberate change: before, it stayed where it was let go; the threshold is 90 px, `DROP_MIN_PX` in `push.ts`), and let go on a ledge it keeps the ledge as its seat. The flick of a fast pointer is not built; the poke is the push.

**Who may cause one.**
| Cause | Allowed | Notes |
|---|---|---|
| The user knocks or drops it (picks it up and lets go in the air; a flick at an edge; a fast poke at the edge) | **Yes** | The user chose it; this is play. |
| The seat goes (the window closes or moves) | Yes, already built (ADR-0041, ADR-0045) | Caused by the world. |
| It slips by itself at an edge | **No** (decided 2026-11-10) | An unprompted fall is a startle for someone who is not looking for one. At an edge Peak stops, peeks, sits or climbs down. |

**1.1 The edge is a place to be careful, not a place to fall.** At the end of a surface Peak climbs down the wall (built), or it goes through a short **edge ladder**, which the author described and which is cheaper than any fall: it **stops** a step before the edge, **peeks** over it (head down and ears forward: a pose to draw), **sits** at the edge with the front paws over it (a pose to draw), and only then, if it wants to be elsewhere, climbs down. Today the cat that walks along a ledge has no edge check at all; that is a bug to fix first (walking off the end of a ledge into the air). The ladder is the fix and the character at once.

**1.2 When it is knocked.** The reaction is an event with an appraisal (spec 09): surprise high, valence negative, arousal high, about-the-user high, control low. The beat is a **teeter** first (a short wobble at the edge: it may recover, about 4 times in 5, a second chance that is itself funny and mild), and a fall only when it does not. After a fall: the landing (built), a shake, a look back up, and a line chosen by closeness and the Gentle switch; sarcasm only in the sassy tier; **never guilt** (ADR-0013). Repeated knocks use the escalation stages already built: at first amused, then wary (it keeps away from edges when the pointer is near, which is a game of its own), then mock-sulking for a moment and forgiving, never punishing.

**1.3 Spending limits (proposed numbers, to tune on a test build).**
- **No spontaneous teeter or slip at all, in any mode** (decided). A teeter and a fall happen only when the person pushes or drops Peak, or when its seat goes. After a fall there is a "bruise" of 10 minutes in which a push gets a teeter and a recovery, not another fall.
- After a fall Peak is **wary for a while**: it keeps one body length from an edge, peeks more, sits sooner. A cat that learned from the fall reads as alive; a cat that falls the same way all day reads as a loop.
- A fall's intensity follows the drop: under a quarter of the screen is a stumble onto its feet; more is the full beat.

## 2. Leisurely first: a tempo ladder

Everything Peak can do is given a **tempo** and a cost to the person beside it. The corner of the eye is very sensitive to sudden movement, so the unit of cost is how much *sudden motion* Peak puts in the periphery.

| Tier | What | When allowed |
|---|---|---|
| 0, still | sit, loaf, look, blink, doze, stretch, purr | always (except Quiet) |
| 1, unhurried | a slow walk, climbing, a slow turn, a yawn, a short line | Free and Play; in Work only to make way |
| 2, brisk | hops, a perch, a hop out of the typing lane or from under the Start menu | needs a reason (making way, a perch in Free mode, getting out from under a cover) |
| 3, sudden | a startle, a teeter, a fall, a dash, anything with a cry | needs an **external cause** (the user's play, the seat gone); never spontaneous in Work mode |

Rules that follow: spontaneous behaviour is picked from tiers 0 and 1; a tier-2 action is slowed where it can be (a perch is a climb where there is a wall: it is); every tier-3 action has a tier-0 landing after it (a settle and a look, not another action); a **motion budget** per hour in Work mode (proposed: no tier 3, at most 2 of tier 2) that the page counts in memory and never saves.

## 3. How Peak knows work from play

**What it can know without crossing ADR-0031** (all already available): how long since any input (one number), whether the pointer is near or over the cat, a click or poke or drag **on the cat**, whether the chat is open, whether the foreground window fills the screen, typing activity elsewhere (the activity percept with its hysteresis), and Quiet mode.

**Three modes, with an asymmetric rule: when unsure, assume Work.**
- **Work.** The user is active and not with Peak (input recent, pointer far, nothing on the cat). Tier 0 only, makes way, silent unless asked, no falls.
- **Free.** The user has been idle for a while (the screen is not being worked on: reading, away, a pause). Tier 0 and 1, a perch, a climb, dozing, an unprompted line at the usual cap.
- **Play.** The user **touched Peak** (a click or a poke or a drag on it, the pointer resting on it, the chat opened). It begins only by a deliberate act and it **expires fast**: after about 2 minutes without a touch, or 20 seconds of work elsewhere with the pointer far, it is Work again. Everything is allowed, including a teeter when the user pushes it.

**Why asymmetric.** A false Play (Peak jumps while the person works) costs attention. A false Work (Peak stays calm when the person wanted a game) costs one click to correct: the poke itself enters Play. So every doubt falls to the quiet side, and entering the lively side takes an act.

**No dial, and (decided 2026-11-11) no shoo.** The shoo described below was declined by the author and is not built. The author answered (2026-11-10): keep settings to a minimum and make Peak adjust itself; prefer written principles and unwritten rules to options, because people open Settings only when they must. So there is **no "liveliness" setting**. The room is read by the modes above, and by one more signal, the **shoo**: the person moving Peak away, dragging it off, or switching Quiet mode on soon after Peak did something. A shoo makes Peak quieter for the rest of the day (tier 0 and 1 only, no Play entered by chance), is kept in memory only and is never sent or counted for the consent (ADR-0029), and Peak never mentions it. The reverse, a person who keeps touching it, is already Play.

**How it is checked.** In a test build the page logs the mode and what it allowed; the author reads it against how the day went. An opt-in local counter "how often did the user move Peak away or switch Quiet on within 10 s of an action" would be a good measure of distraction, but a new counter needs a new consent version (ADR-0029), so it is only an option for later.

## 4. Does Peak need a constitution? Yes, a short one, and as a ranking.

**Why now.** The rules are already there, but each was written when a feature came up and they live in ten places: ADR-0013 (no guilt), ADR-0021 (companion, not assistant), ADR-0029 (focus safety), ADR-0031 and ADR-0045 (what it may sense), spec 06 section 1.6 ("never does" and the three-question filter), the privacy text. New features now **pull against each other**: liveliness against calm, depth of perception against privacy, strong feeling against restraint, a model's remark against silence. A list cannot say which wins. A constitution's real work is **the order of priority**. It also does two other jobs: it is what a later session, or an agent like me, reads to stay in character when the author is not there, and it is the public promise ("what Peak will never do") that makes a companion that watches the screen trustworthy.

**What it should not be.** Not a long text nobody reads; not sacred (it changes by an ADR like everything else); not a second copy of the ADRs (each article links to them). One page, ranked, each article with a test and an example. Name: **the charter** (*hiến chương*), less grand than a constitution.

**The charter is written** in `docs/charter.md` (adopted by ADR-0047); the draft articles below were its first form.

**Draft articles, highest first** (the order is the point; the wording is for the author to change):
1. **Trust first.** Never hurt the person's work, privacy or feelings. No guilt, no surveillance, no surprise cost. *Test: would the person be comfortable if they saw exactly what Peak just did and why?*
2. **The attention is theirs.** Peak is a guest in the corner of a working screen. It is quiet by default, lively only when invited or when it must get out of the way. *Test: if the person was concentrating, did this make them look up?*
3. **Gentle before sharp.** Slow before fast, soft before sudden. Strong feelings (fear, a fall, a sulk) are rare, caused, proportional, and end in recovery and warmth. *Test: is there a calmer way to show the same thing?*
4. **It knows shapes, not meaning.** It senses activity and the layout of the screen, never what is written on it, unless the person has switched on a sense in the open, and then only in memory. *Test: what exactly does this sense keep, and where?*
5. **A companion, not an assistant.** It remembers, it grows, it has its own tastes; it does not draft, summarise, search or fix. *Test: could the person get this from another assistant? then it does not belong.*
6. **It works without AI and the key is theirs.** Everything lovable survives with no brain connected.
7. **It never dies and never lies about itself.** Neglect makes it a little lonely; it does not pretend to be a person or a tool.
8. **Alive, within all of the above.** Within articles 1 to 7 it is free to surprise: that is what the corner of a screen is for.

**Where it lives and what changes.** `docs/charter.md` (or `spec/00-charter.md`), adopted by an ADR; the three-question filter of spec 06 section 1.6 moves into it; the README gets a short "What Peak promises" from articles 1 to 4; the website session is told at the next release. Each new story in the backlog gets one line naming the article it serves or the article it spends (a fall spends article 3, and says so).

## 5. Proposed stories (not in the backlog yet)
| Story | What | Size |
|---|---|---|
| CH-1 | The charter, the ADR and the README promise | S |
| CH-2 | The edge check: a cat that reaches the end of a surface stops (fixes the walk off a ledge into the air) | S |
| CH-3 | The attention mode (Work, Free, Play) as pure logic with tests, shown in the debugger, and the tempo tier on every action | M |
| CH-4 | The edge ladder: poses `peek` and `sit at the edge` (a rig change, the author looks first), then climbing down | M |
| CH-5 | The user's push: a drop in the air and a flick at an edge, the teeter and the fall, the limits of 1.3, wariness after a fall | M |
| CH-6 | ~~The shoo~~ (declined) and the retirement of the settings that are amounts (section 6): done 2026-11-11 | M |

## 6. The state today, against the charter (audit of 2026-11-10)

**Settings and the tray, against "few settings".**
| Item | What it is | Verdict |
|---|---|---|
| Language | a value Peak could not know exactly (auto, vi, en, ja) | keep |
| Start with Windows | a consent | keep |
| Updates (auto, ask, off) | a network consent | keep |
| Chattiness (quiet, normal, chatty) | an **amount** of behaviour: how often unprompted lines come (4 to 7, or 10 to 15 minutes, or never) | **retired 2026-11-11 (CH-6)**: fixed at 10 to 15 minutes and only in free or play; a person who had chosen Quiet is hushed (`PetData.hush`) |
| Gentle tone | a value (sarcasm or not) | keep |
| Quiet hours (on, start, end) | an **amount** (when to be silent) | **retired 2026-11-11 (CH-6)**: the night is the clock, 23:00 to 07:00, sleepy and silent |
| Brain (provider, key), Memory (learn, learn with AI) | credentials and consents | keep |
| Remarks after a reflex | a consent in effect (an event name and five numbers go to the person's own provider) | keep for now; it could follow the connected brain, to decide with the author |
| Ground map | a consent for a sense (on by default, ADR-0044) | keep |
| Usage figures (consent, daily) | consents | keep |
| Tray: Show or Hide, Quiet mode, Settings, Quit | the person's quick words: put it to sleep, hide it | keep; Quiet mode is the honest "less" |

**Behaviours, against the tempo ladder and the manners** (each is a finding, with the fix in the stories). **Fixed on 2026-11-10 (CH-2, CH-3): findings 1 to 5**; the numbers below are as found.
1. **"Free" starts after 5 seconds of no input** (`CALM_MS`), which is a pause in typing, not a rest. A walk and a perch (tiers 1 and 2) can then start while the person is thinking, with their eyes on the screen. The first mode threshold should be about **45 to 60 seconds**; 5 seconds can stay as "may be about to type" for tier 0 only (CH-3).
2. **A line is allowed after 6 seconds of no input** (`LINE_MS`): the same fault. Lines wait for Free, or follow a touch (CH-3).
3. **Walking along a ledge has no edge check**: the cat can walk off the end of a perch into the air (CH-2). Today the stay on a perch is 3 minutes and then it walks again. With a wall it now climbs down, but a perch by a hop has no way down and no edge.
4. **The cry (the exclaim bubble) and the full startle** of a lost seat play in any mode, including Work. The person closed the window, so the cause is theirs, but a bubble and a cry beside someone who is writing is tier 3 where tier 1 would do: in Work the beat should be short and **silent** (the jolt and the fall, no bubble); the words wait (CH-3).
5. **A perch by hop is tier 2 and spontaneous**; it is now allowed by `walkAllowed` only. With the fix in 1 it becomes Free-only. Climbing (tier 1) is the better default and is already chosen 50% of the time, and always when the rise is over 200 px.
6. **The hop out from under the Start menu or Search** (ADR-0046) is tier 2 but has a reason (getting out of the way): keep, and take the nearest free place (it does).
7. **No notion of a shoo exists**; the author declined it on 2026-11-11 (no change).
8. **Things already in line with the charter:** the notice beat before moving, escalation stages and shuffle bags (manners 2 to 4), "assume work" in the lane (it needs about 450 ms of a steady guess before acting), no guilt in any line pool, the privacy contract, Quiet mode, silence in a full-screen window and in presentation.

## 7. Not verified
Nothing here has been tried. The numbers (one slip in 3 hours, 4 recoveries in 5, 2 minutes of Play, 20 s back to Work) are guesses to be tuned on a test build the author looks at; the claim that the periphery is sensitive to sudden motion is general knowledge, not measured on this screen.
