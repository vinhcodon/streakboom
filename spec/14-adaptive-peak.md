# 14. Adaptive Peak: Peak notices, suggests and answers in body language

**Status:** **draft for Vinh's review, 2026-11-13.** A hypothesis, not a plan to build: the decisions A1 to A6 below are Vinh's (ADR-0080); everything else is a proposal, and **nothing here may be coded until Vinh approves each item** (the handoff's rule, and `AGENTS.md`). Source: [`../docs/handoff/adaptive-peak-and-skills.md`](../docs/handoff/adaptive-peak-and-skills.md). The feasibility analysis is [`../docs/plans/adaptive-peak-feasibility.md`](../docs/plans/adaptive-peak-feasibility.md) and the order of work [`../docs/plans/adaptive-peak-plan.md`](../docs/plans/adaptive-peak-plan.md).

**Numbering.** The handoff asked for `spec/08`; `spec/08-perception.md` exists, so this is spec 14 (**Vinh may renumber**).

**Merged with `customization-hypothesis.md`.** That file was added to the repository later on 2026-11-13 and has been read; the merge is [`15-customization.md`](15-customization.md) (spec 15): the three tiers (colour, accessory, voice) are the store of what Peak can change in itself, the way of speaking changes from "the person chooses" to "Peak proposes", and its hypotheses became H23 to H26. Section 7.3 below only points there.

## 1. The idea

Instead of a Settings page of tastes, **Peak notices** how the person lives with it (where they put it, when they touch it, how often they send it away) and **offers** a change when it has the means to carry it out. Those means are **skills**: closed, small, reversible actions of its own body, triggered by what the person says in the chat box, or later by holding a key. Examples from the handoff: "lượn đi" and Peak says goodbye and goes; hold a key and Peak raises a phone to its ear; say something about a place and Peak goes to its usual spot and sleeps.

## 2. Decisions already taken (Vinh, 2026-11-13; ADR-0080)

| # | Decision |
|---|---|
| A1 | **No choices of taste in Settings** (colour, accessory, voice, seat). Peak notices and suggests. |
| A2 | **Skills are body language and presence only.** They never touch the person's apps, files or data. No timer, no reminder, nothing an assistant does. |
| A3 | **Voice, first version: a held hotkey only** ("press and hold to talk"). No wake word. |
| A4 | **The first skill is "Lượn đi"** (say goodbye, go, come back). The phone, the favourite sleeping place and the transformation are **not chosen** for the first slice. |
| A5 | **Calling or sending the cat away by words does not count toward Bond Days** in this stage. It is counted separately. |
| A6 | **Safety and privacy controls stay deterministic buttons**, never a negotiation with the cat: Quiet mode, hiding, the key, the language, privacy, and seeing and deleting what Peak has learned. |

Earlier decisions still stand: the bond is the core, workplace humour is the voice, the north star is Bond Days, nothing is sold, no Personality Packs, no user-contributed content.

## 3. How it fits the charter ([`../docs/charter.md`](../docs/charter.md))

| Charter | What this spec does about it |
|---|---|
| 1 Trust first | A skill is reversible by one word or one click; nothing is silent; the person sees and deletes what was learned (A6) |
| 2 The attention is theirs | Suggestions use the existing unprompted slot (every 10 to 15 minutes, `free` or `play` only); the return from "away" waits for the person to be free; no second channel of interruption |
| 3 Gentle | A leave is a walk, not a vanish; a return is a landing, not an arrival |
| 4 Shapes, not meaning | Counts and coarse places only. Voice is a new sense: off, switched on in the open, its own ADR (section 9) |
| 5 Companion, not assistant | Skills are the cat's body (P1); no reminders, no tools |
| 6 Works without AI | Tier 1 needs no key. Voice needs one provider (open question) |
| 7 Never dies, absence costs nothing | "Away" is not saved, is never a sulk, never counted aloud, and a banned-patterns test covers the new lines |
| Few settings | No setting for an amount of behaviour. The only new settings are a consent (voice), a value Peak cannot infer (the hotkey) and Forget buttons |
| The declined shoo (ADR-0047) | Frequent hides or Quiet starts may only be the reason for a **question**, never a silent change |

## 4. The hypotheses

The handoff numbers its hypotheses H1 to H6; the register already has H1 to H16, so they are registered as **H17 to H22** ([`../docs/hypotheses/README.md`](../docs/hypotheses/README.md)). **Thresholds are not set: Vinh sets them before looking at data** (the register's rule).

| Register | Handoff | Statement | Refuted if (from the handoff) | Threshold |
|---|---|---|---|---|
| H17 | H1 | Local counts of behaviour are enough for Peak to make suggestions people accept | the acceptance rate is low, or people hide Peak or start Quiet mode more after suggestions | Vinh, with a baseline |
| **H18** | **H2** | A local table of phrases (en / vi / ja) covers most real commands, so a model is only needed for the vague ones | most real commands do not match the table | **Set by Vinh 2026-11-13:** supported at **70 % coverage or more with 2 % false positives or fewer**; refuted under 40 % coverage (the handoff's own rule); between 40 % and 70 % Vinh reads the misses and decides |
| **H19** | **H3** | "Lượn đi" adds feeling and is not used as a substitute for Quiet mode in a way that lowers Bond Days | people leave Peak and do not call it back, or Bond Days fall | **Set by Vinh 2026-11-13:** refuted if the people who use "Lượn đi" have lower Bond Days than those who do not, or more than half do not call Peak back and let the time run out; always read with the five end-of-week questions |
| H20 | H4 | A small model (Flash / Flash-Lite and the others) keeps to a short closed list reliably | wrong or invented skills are common | Vinh |
| H21 | H5 | A held hotkey to talk is used for real, not once | uses fall quickly after the first week | Vinh |
| H22 | H6 | Learning from behaviour locally does not feel like being watched | a survey or the off-rate says it is uncomfortable | Vinh |

H18 and H19 are the ones to settle first; the plan orders the work so that they are answered at the least cost.

## 5. How a command is understood: two tiers and the life of a skill

1. The person types (or, later, says) something.
2. **Tier 1, the local table** ([`intents.ts`](../app/src/lib/) when built): normalise (lower case, with and without diacritics for Vietnamese, NFKC and kana folding for Japanese, strip final polite words and punctuation); the **whole** message, about six words or fewer and with no question mark, must equal a phrase or fit a pattern. A match acts at once if it is `exact`; a `pattern` match first shows the `ask` card. Two skills may not share a phrase (a test). It needs no key and no network.
3. **Tier 2, the model** (only if tier 1 found nothing and a key is connected): the reply may begin with `[skill:name]`, in the same way it already begins with a mood tag (`mood.md`, `split_mood` in `brain.rs`). One extra persona layer, `skills.md`, says to use it only when the last message is plainly a command from the closed list. The client **checks the name against the list** before doing anything and takes **no parameters** in the first slice. *Proposal, instead of native function calling (feasibility, item 3): one parser for four providers, no extra call, nothing to pass.*
4. **Hiding the wait.** While the model thinks (one to three seconds) Peak already reacts locally (`think` or ears up).
5. **The safety gate** (section 6). It decides whether the skill may run now.
6. **Execution** with poses and movement that exist.
7. **Undo**: one word ("quay lại đi") or one click (the tray), always.

A tier-1 hit makes no API call. A tier-2 skill is one ordinary chat turn and counts as one toward the 60 a day. (Vinh confirms: Q7.)

## 6. The safety gate (every skill, no exceptions)

A skill does not run, or waits, when any of these is true: Quiet mode is on; the clock says night (23:00 to 07:00) and the skill is not the goodbye the person just asked for; `is_busy` (a fullscreen program, presentation mode, a locked session); a panel is open; Peak is being held or is falling; a cooldown for that skill has not passed; or **the person is typing** (the focus-safety rules, spec 06 section 3, apply to every movement). A skill the **person** just triggered is allowed to run in `work` mode (they asked), but its **automatic parts** (the return, the suggestions) are not.

Gap (closed 2026-11-14): `is_busy` was used only before an unprompted line and before an update, and the movement path passed `busy: false`. AP-08 wires it into the focus decision, so while the person is in something full-screen, presenting, or the session is locked, Peak starts no walk, hop or perch, stops a walk in progress and shows no unprompted line. It does not see a window shared in Teams, Zoom or Meet; Quiet mode and Hide remain the person's answer (feasibility, item 8).

## 7. The skills

### 7.1 First slice: "Lượn đi" (leave)

**What the person sees.** They write "lượn đi" (or "go away", "消えて", and the others in the table). Peak answers with **one short goodbye line** in its voice (the persona rule that a goodbye gets one line and then stops), nods, walks to the nearest side edge of its work area, and leaves. After a while it comes back at the same edge, lands, and goes on as before.

**States.** *Away* is a new logical state that is neither Quiet nor the person's own Hide:
- the window is hidden and a return time is set; no page timer may speak or move while away;
- it is **not saved**: after a restart Peak is simply on screen;
- the tray's Show / Hide, or a left click on the tray icon, ends it at once and cancels the timer (the call back);
- the return waits (retries after 5 minutes) while the safety gate says wait; a return in `work` mode is allowed, but quiet: no line at all.

**Lines.** A new pool of goodbye and return lines in the three languages, under the existing banned-patterns test: no guilt, no counting of time away, no "missed you", no reproach, no "come back soon" (a character that needs the person is forbidden).

**Decided (Vinh, 2026-11-13, ADR-0086; 2026-11-14, ADR-0097):** it stays away **20 minutes** and is called back at once with the tray (Show). **Built 2026-11-14 as S2 (not released, not yet seen):** a short goodbye (six per language, `farewell.ts`), the walk to the nearer side edge, the hide by Rust, the return at the same edge with a stretch and no line, the 5-minute retry while a full-screen program runs, only on a Preview build until 0.7.7 and **on every build from Stable 0.8.0 (ADR-0100)**; a pattern match asks nothing yet (not built); needs a connected brain for the chat box. **Cost:** no new art; the walk, the nod, the hide and a timer.

**Walk rule (ADR-0102, built 2026-11-14, not yet seen):** Peak trots to the edge at 110 px/s and has `clamp(distance/110 x 1.3 + 2 s, 6 s, 20 s)` to get there; if it does not, it stays where it is and the leaving is cancelled. It never vanishes away from an edge, and the leave is counted when the window is hidden.

**What is measured:** leaves a day; returns by timer against calls back by the person; the same person's Quiet starts and hides before and after; Bond Days of leavers against non-leavers. All as counts, and **separate from Bond Days** (A5).

### 7.2 Candidates for later slices (not chosen; costs for reference)

| Skill | Cost and blockers |
|---|---|
| Hotkey, then the phone to the ear ("alo") | A global hotkey (new dependency, a spike), a microphone permission, a new pose and a consent; see section 9 |
| Go to the usual place and sleep | The hardest: remembered places by screen zone (not window names), multi-monitor and DPI, walking in more than one direction (the expensive state), and the "favourite places" of spec 06 |
| Transformation | A new set of animations from nothing; the most expensive and the most doubtful against the charter |

The real bottleneck is **new poses and states in the rig**, not the model's function calling. Each candidate gets a cost estimate in art and CPU before it is chosen.

### 7.3 What Peak can change in itself (the merge)

The store of what can change on Peak itself, in three tiers: **colour**, **accessory** and **voice**, is specified in [`15-customization.md`](15-customization.md). The change of this spec is only in how it is reached: the person does not pick from a list; Peak **proposes** (section 8) and applies on yes, or the person asks in words (a skill of the closed list, which spec 15 asks Vinh to decide: N11). Nothing is sold, and there is no content made by users.

## 8. Learning from behaviour and making suggestions

**Counted locally, in `memory.json`** (the pet's memory, visible and deletable in "What the pet remembers"; the `learn` switch turns it off): where the person drops the cat (a 3 by 3 grid per monitor), the parts of the day it is touched, how often it is hidden or put in Quiet mode, the ratio of chat to touch (already a guardrail), and the suggestions shown, accepted or declined with the date. **Not counted, not read:** what is typed, what is on the screen, window or application names. *Vinh approves the final list (Q4).*

**Suggestions** reuse the `ask` card (a yes and a later), come only in the existing unprompted slot, say their reason in Peak's voice, and are limited: at most one a week (a number for Vinh, Q5), never two kinds in a day, never before closeness tier 2 or in the first three days; *later* silences that kind for 14 days, a second *later* for 60, a *yes* is not asked again and is shown in Settings with a Forget. Accepting is a voluntary act that could count as `engaged` for Bond Days; whether it does is Vinh's call (N6), because it would let the engine raise its own measure.

## 9. Voice (hold a key and talk)

Replaces the voice item of `requirements-draft-v0.4.md` (E1); the wake word moves to "later, optional, on the machine" and is out of scope.

- **R:** a global hotkey, hold to talk, a default that rarely clashes and can be changed; a clear message when registration fails; no key logging and no polling of the keyboard (only the registered combination, through the official global-shortcut plugin).
- A visible **listening** state in the cat (`curious` and a mark in the bubble), a stop at release or at 15 seconds, the stream closed at once.
- A clip is a WAV, 16 kHz mono, a few hundred KB, kept in memory, sent once and discarded.
- **Gemini only** in the first version (the other providers have no direct audio input); said in Settings. *Vinh decides (N4).*
- **Privacy:** a new sense, so: off by default, a consent card that says what is sent and to whom, the sentence about the free Gemini tier in `privacy.md` and the Brain page, the README and website changed together, and **its own ADR before any code**. Not counted in Bond Days.
- Order against the first skill slice: Vinh decides (the handoff's R5); the plan puts it after H18 and H19.

## 10. Requirements (numbered, with acceptance)

| ID | Requirement | Accepted when |
|---|---|---|
| AP-01 | The intent table for the closed skill list, in the languages Vinh orders (Q6) | the module has no I/O; a test fails when a phrase is in two skills; the survey halves give the coverage and the negative set the false-positive rate, both reported |
| AP-02 | "Lượn đi" with the whole life of section 5 | leave, away, call back, return and undo each seen by Vinh in a test build; Quiet, hide and away do not mix |
| AP-03 | A model skill through a tag, closed list, client check, fall back to tier 1 | a harness result for each provider; no skill without a name on the list; no change to the 60 a day |
| AP-04 | The safety gate for every skill | a test per condition of section 6 |
| AP-05 | The hotkey, hold to talk | the spike answers repeat and release; the key can be changed; no focus is taken from the app being typed in |
| AP-06 | A short recording to the brain | format and limit checked on the day; the mic closed at release; indicator seen |
| AP-07 | Local behaviour counters and suggestions | in `memory.json`; Forget and the learn switch remove them; frequency rules tested |
| AP-08 | `is_busy` applies to movement and to the return | a test that the walk and the return respect busy. **Built 2026-11-14** for movement and unprompted lines (`decideFocus` with `busy`; the hit-test thread reads `is_busy` about once a second); the return from "Lượn đi" will use the same answer; **not yet seen on a screen** (a full-screen video, a presentation, a locked screen) |
| AP-09 | Counters: skills used, undo rate, suggestions accepted and declined, hide rate; calls and sends-away separate from Bond Days | in "Copy stats" as counts only; Bond Days unchanged by them |
| AP-10 | New lines under the banned-patterns test | the test passes in three languages |

## 11. Privacy

No contents. Counts, coarse places in a grid, dates. Nothing leaves the machine except through what already does: "Copy stats", and the chat with the provider the person chose. Voice, if built, sends a clip to that provider only while the key is held. The person can see and delete everything Peak has learned; the "learn off" switch stops it. The words of the README, `privacy.md`, the Brain page and the website are changed in the same commit as any code that changes the truth (`AGENTS.md`).

## 12. Constraints

RAM 120 MB at most; idle at about 0 % CPU (a skill must not add idle cost; a walk to the edge is measured with the recipe in the engineering log before any claim); the tray and Quiet mode keep working; no content from users; nothing sold; Windows first.

## 13. Open questions (recorded; Vinh decides, nothing is assumed)

From the handoff (section 13):
- **Q1.** *Answered 2026-11-13 (ADR-0086): Peak is back after **20 minutes**, at the edge it left by; the person calls it back at once with the tray (Show).*
- **Q2.** Is the phone animation in the first slice, together with the hotkey? (Now: no.)
- **Q3.** What is the second skill: phone, go to sleep at a place, or transformation?
- **Q4.** The list of signals Peak learns from (section 8): approve or cut.
- **Q5.** At most how many suggestions a week, and how long to back off after "later"? (Proposal: 1, then 14 and 60 days.)
- **Q6.** The intent table in three languages at once, or English and Vietnamese first?
- **Q7.** Does a model skill count toward the 60 chat turns a day? *With the tag approach it is one turn like any other; recommended: no separate count.*
- **Q8.** Does the unstaged multi-provider version change the chat and call structure? *Answered by the code: it is committed and released; four providers with four shapes (feasibility, item 3).*

New, from this analysis:
- **N1.** *Answered 2026-11-13: the spec stays number 14.*
- **N2.** The thresholds for H17 to H22 (the register's rule: before looking at data). *Answered 2026-11-13 for H18 and H19 (section 4); H17 and H20 to H22 are still open.*
- **N3.** *Answered by doing, 2026-11-14 (ADR-0098): the tag.*
- **N4.** Voice for Gemini only in the first version, or wait.
- **N5.** The default hotkey, and whether it can be changed (a setting by necessity).
- **N6.** Does pressing the suggestion's button count as `engaged` for Bond Days?
- **N7.** *Answered 2026-11-14 (ADR-0098): it acts at once, from a short message (at most 10 words, no question mark), through the same gates; the goodbye is Peak's own line; undo is the tray.*
- **N8.** What "đi ngủ đi" does until a `sleep` skill exists: yawn and go drowsy, or pass to chat.
- **N9.** Whether "away" survives a restart (recommended: no).
- **N10.** *Answered 2026-11-13: the file was found and is read; see spec 15.*

## 14. What could not be verified

See the end of the feasibility document. In short: no hotkey, microphone, audio format, screen-share behaviour, model reliability or walking cost was tried; the numbers in section 8 and the thresholds are proposals.
