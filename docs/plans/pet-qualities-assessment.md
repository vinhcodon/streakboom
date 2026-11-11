# Assessment: the five qualities of the pet against what exists (snapshot 2026-11-08, version 0.2.2)

Status: a dated snapshot of our own judgment, written from the code and the documents. **No outside user has tested anything yet** (the closed alpha has not started); the only data is the author's device (n = 1, and its per-day counters were wiped on 2026-11-08 by data restores). Ratings are therefore engineering judgments, not measurements. The framework comes from a product discussion between Vinh and Claude in chat; the work that follows from it is in [`backlog.md`](backlog.md).

## The five qualities (in priority order) and the principle
1. **Presence.** The pet is always there and reacts lightly to context: you type steadily and it sits still, you are idle and it plays. An assistant only appears when called.
2. **Continuity and growth.** The pet remembers the shared history and grows with your real behavior (working hours, rest rhythm, habits). The longer you keep it, the higher the cost of leaving. The main moat.
3. **A consistent personality.** One character with its own habits and "taste". People attach to a character, not to a feature.
4. **A two-way care loop.** You care for the pet and it answers with a change you can see. The word "nuôi" (raise) lives here.
5. **Proactive but frugal.** The pet starts things, but one line or one gesture at a time, and never takes focus.

**Principle:** the intelligence belongs in timing and tact (when to stay quiet, when to nudge), not in the length or quality of answers. This matches ADR-0021 (companion, not assistant) and the daily AI limits (ADR-0008, ADR-0027).

## Summary

| # | Quality | Level now | Biggest gap |
|---|---|---|---|
| 1 | Presence | medium | The pet does not know the context: no typing or idle signal. |
| 2 | Continuity and growth | medium-low | Growth is invisible; the moat is only a hypothesis. |
| 3 | Consistent personality | fairly good | No habits or "taste" of its own; Vietnamese lines not reviewed by a native reader; Claude and OpenAI voices untested with real keys. |
| 4 | Two-way care loop | **weakest** | The pet's answer is a moment, not a lasting change; no needs, no feeding or play. |
| 5 | Proactive but frugal | **strongest** | Timing is random, not contextual; ignored lines are measured but not used. |

Across 1 and 5 the missing piece is the same: **a context signal** (is the user typing right now?).

## 1. Presence
**Built:** always on top, transparent, clickable only where the cat is; idle behaviors (look, walk the screen edge, drowsy, sleep, wake); eyes follow the cursor over the pet; start with Windows (opt-in, off by default).
**Gaps:**
- Context is limited to time of day, session length and a "nothing happened for a while" timer. The app has no input hook by design (spec/05 section 5, the pet window is click-through), so it cannot see typing. "Sits still while you type, plays while you are idle" is not built.
- Presence has a cost: the 8-hour soak measured about 17% of one core on average (all seven processes, 80 minutes, 4 logical cores) while memory stayed flat at 121 to 127 MB. The documents say walking costs a few percent of one core and idle CPU must be near 0. If the number holds, the pet is too heavy to keep running. Not yet explained (walking share, WebView2 helper processes).
- Start with Windows is off on the author's machine and has not been tested across a reboot (A7).
**Measured by:** days present (`min >= 5`), the start-with-Windows rate (`autostart` in the export). `min` counts a desktop left on overnight.

## 2. Continuity and growth
**Built:** local memory (the pet's name, what to call the user, a usual part of the day after 8 sessions, touch counts, shared milestones at 7, 30 and 100 days), short facts noted from chats (with a brain, editable, at most 20), closeness tiers 1 to 4 and a streak, all in local files the user controls (ADR-0014).
**Gaps:**
- Growth is **not visible**. Closeness only changes which lines the pet may say; the cat looks the same on day 1 and day 100.
- "Grows with your real behavior" is thin: habit counts per hour and weekday feed one kind of line; there is no rest rhythm and no use of working hours beyond that.
- Switching cost is small: the memory is a few names and facts, and without a brain there are no facts. The moat is a hypothesis (H6, untested), and nothing retention-related has been measured.
**Measured by:** D3, D7, D30 (present on that day), tier 2 and 3 reached, the pet named (planned events built in 0.1.15).

## 3. A consistent personality
**Built:** one character (Peak, a round mochi cat), a tone guide (playful, mildly sarcastic, never about the user's worth; a Gentle switch), 182 hand-written lines per language, the same persona for chat, a feeling tag on every chat answer acted out as a pose (nod, smirk, gasp, curious, sad, and so on), the pet's voice in errors and refusals.
**Gaps:**
- No habits or taste of its own (a favorite spot, a favorite time of day, quirks that repeat) beyond the mood and the tier.
- The Vietnamese lines have no native reviewer (open item in spec/03).
- The Claude and OpenAI brains have never run with real keys, so a drift of voice between brains is unknown (A6).
- Whether people like the character is not measured; only the Gentle share is.
**Measured by:** the Gentle share of installs. Everything else needs observed alpha sessions.

## 4. A two-way care loop (the weakest)
**Built:** a head scratch and a belly rub raise mood and closeness (with a daily cap) and the pet answers with a pose (purr, or the "trap" huff); returning after an absence is greeted; the "lonely but hopeful" band; Bond Days counts care (scratch, rub, a reaction to an unprompted line).
**Gaps:**
- The pet's answer is momentary. There is no lasting visible change from care, no needs, and nothing to feed or play with (the "snack" and "play" line pools exist and are unused).
- By decision (ADR-0013) the pet never dies, starves or gets sick, so the pull cannot come from guilt; it has to come from something else, and that something is not built.
- The daily cap on closeness gain slows any progression.
**Measured by:** Bond Days (the north star), the engagement rate, the `rub` and `engaged` counters (hypotheses H5, H8).

## 5. Proactive but frugal (the strongest)
**Built:** at most one line every 10 to 15 minutes (a fixed 10 to 15 minutes since the chattiness setting was retired, ADR-0047), at most 110 characters, never taking the keyboard focus for plain speech; silent in fullscreen and presentation, quiet hours, Quiet mode, while dragging, while another bubble or a panel is open, and (0.2.2) while the pet is asleep or dozing off; gesture hints at least 20 hours apart; about half the lines written by the model within daily limits.
**Gaps:**
- Timing is random inside the interval, not contextual: a line can appear while the user is concentrating.
- The reaction data (`engaged`, `shown`) is collected but not used to adapt the frequency; that waits for a baseline.
- Silence in fullscreen has one positive report (A4); presentation mode, screen sharing and a game are not tried.
- Dismissals and hiding the pet cannot be measured (the hide rate needs a Rust event).
**Measured by:** the engagement rate (`engaged / shown`), Quiet mode use, ignored lines; not yet the hide rate.

## The plan to measure the north star (Bond Days)
**Defined (spec/05):** `care(d) = scratch + rub + engaged`; `bond(d) = 1` if `care(d) >= 1`; **BD7** = the number of bond days in the last 7 (0 to 7); reported per cohort as the mean and the share of installs at 0, 1 to 3, 4 to 7. Chat and plain pokes are outside it. Guardrails: chat share, Quiet mode use, the hide rate (not measurable), CPU and RAM (measured by hand). **No thresholds are set until a baseline exists** (a fixed decision).
**Built (0.1.15 onward):** the per-day counters (`scratch`, `rub`, `poke`, `chat`, `shown`, `engaged`, `min`, `quiet`), consent version 2 (counted only after the user agrees), the "Copy stats" export with `days`, `config` and `autostart`, the funnel events `tier_2`, `tier_3`, `pet_named`. Stats are opt-in and nothing is sent automatically; "Copy stats" is the alpha channel.
**Missing:**
- No outside data: Phase 5 has not started and nobody is recruited. There is no tool yet to compute BD7, D3 and D7 from a set of exports.
- No baseline of our own: the author's per-day counters were wiped on 2026-11-08 by data restores.
- Not verified: the `chat` counter against a real chat, `quiet`, the midnight rollover, the exported JSON as it lands on the clipboard, a fresh install's consent card.
**Coverage of the five qualities by the metrics:** care is measured well (it is the north star); continuity partly (D3, D7, tiers, naming); presence partly (days present, autostart, but overnight idle is counted); proactive partly (engagement rate; no hide rate); personality almost not at all (a Gentle share only), so "do people like Peak" needs the observed alpha sessions.

## What was not verified in this assessment
Everything here is a reading of code and documents. The CPU figure comes from one 80-minute sample on one machine and has not been broken down by process or by state. No user has been asked whether any of the five qualities is felt.
