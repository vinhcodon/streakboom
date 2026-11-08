# Handoff: North Star metric for Streakboom ("Bond Days")

**From:** product discussion in Claude chat (Vinh + Claude), 2026-11-08
**To:** Claude Code, working in this repo
**Ask:** turn this into (1) a spec at `spec/05-north-star-metrics.md` and (2) an implementation plan with a test plan. **Do not write feature code until Vinh has reviewed the spec and plan.**

> No code was changed to produce this handoff. An exploratory edit made during the discussion was reverted; the working tree is as Vinh left it. Note that Vinh's local tree is ahead of GitHub `main` (uncommitted multi-provider work touching `+page.svelte`, `state.ts`, `bus.ts`, `ui.ts`, `settings/+page.svelte`). Base the spec and plan on the local tree, not on `main`.

---

## 1. Why this exists

Streakboom is a desktop **companion**, not an assistant. The discussion settled on this positioning:

- Assistants sell **capability** (ask, get a deliverable). The pet should sell a **relationship**: presence, memory, growth, a consistent character.
- Traits to focus on, in order: presence, continuity/growth, consistent character, a two-way care loop, initiative with restraint (one line, never taking focus).
- Principle: if a feature can be replaced by typing a prompt into another AI assistant, do not build it. The pet's output is feelings and behavior, not deliverables. Heavy work should be handed to an assistant the user already has.
- Three-question filter for any feature: (1) can the user do this by prompting another assistant? then drop it; (2) does it make the pet more attached, more remembering, or visibly growing? if not, drop it; (3) with all AI switched off, is the pet still lovable? if not, it is an assistant in a cat costume.

The north star must measure the bond, so it must **not reward chat usage**.

## 2. Decisions already made (do not reopen without asking Vinh)

| # | Question | Decision |
|---|---|---|
| 1 | Does chat count toward the north star? | **No.** Chat is excluded. |
| 2 | Alpha targets? | **Wait for data.** Record a baseline with a few outside users first; set no threshold now. |
| 3 | Is hitting the daily chat cap (58 of 60 on one day) good or bad? | **Unknown.** Track chat share as a watch metric and decide later. |
| 4 | Add a per-day counter set to telemetry? | **Yes**, to be specified and planned here. Counts only, no content, same opt-in as today. |

## 3. The metric set (proposal to be formalised in the spec)

**North Star: Bond Days per week.** Number of days among the last 7 (today included) with at least one voluntary act of care:
head scratch, belly rub, or a reaction to one of the pet's unprompted lines ("engaged").
Chat and plain pokes do **not** count.

| Group | Input metric | Source |
|---|---|---|
| Presence | days the app ran; start-with-Windows rate | new counter; `startup.done` |
| Reciprocity | share of unprompted lines the user reacts to | new counters `shown`, `engaged` |
| Continuity | D3 / D7 / D30; reaching closeness tier 2 and 3; pet named | `streak`, `closeness`, `memory.petName` |
| Character | rate of turning gentle tone on; repeated-line rate | `settings.gentle`, `recent` |

**Guardrails (drift towards "assistant"):**
- Chat share = `chat / (chat + scratch + rub)`. A steady rise means the pet is becoming a chatbot. Threshold: undecided (see decision 3).
- Hide-pet rate and Quiet-mode usage.
- CPU/RAM (current target <= 120 MB, idle near 0 CPU).

**Secondary, not the north star:** BYOK conversion (`key_valid`). It serves monetization, not bonding.

## 4. What the code does today (verified by reading the repo)

- `app/src/lib/telemetry.ts`: `FunnelEvent` is a list of funnel names only.
- `app/src/lib/state.ts`: `recordEvent` records each event **once per install** (`telemetry.done`), so nothing can show engagement over time. `active_d3` / `active_d7` exist in the type and are tracked from `streak`, but they only say "reached", not "kept coming back". Queue cap is 200 events; `parseTelemetry` re-validates everything and returns empty data unless consent is `on`.
- `app/src/routes/+page.svelte` (pet window, the only owner of state): interaction handlers are `singleClick`, `onDblClick`, `onHeadScratch`, `onBellyRub`, `sendChat`, `fireProactive` (+ `aiProactive`), and a 1-minute `minuteTimer`. `snapshot()` builds what the settings window gets, including `stats`.
- `app/src/routes/settings/+page.svelte`: "Copy stats" puts `{app, version, installId, events}` on the clipboard. Nothing is sent automatically.
- `app/src/lib/bus.ts`: `SettingsSnapshot.stats` carries `installId` and `events`.
- Bubbles auto-hide after a timer. There is no explicit "dismiss" action, so "ignored" can only be inferred from the absence of a reaction.

## 5. Baseline observation (n = 1, the founder's own device; a sanity check, not evidence)

From `%APPDATA%\com.streakboom.app\pet.json` and `memory.json` on 2026-11-08, about a day after install:
- 12 sessions that day, mostly started in the late morning.
- Touches: 45 pokes, 17 scratches in memory counters (28 scratches and 7 rubs in pet counters, which started earlier), 40 chats.
- AI use that day: chat 58/60 and proactive 6/6, so both daily caps were reached.
- `brain.menuOpens` 128 and `chatTries` 15 before connecting a key.
- Telemetry on; recorded events: `first_launch`, `first_interaction`, `key_pasted`, `key_valid`, `first_ai_message`.

Reading: chat is the heaviest single mode for this user, which is exactly the drift the guardrail is meant to detect.

## 6. Proposed data model (a proposal for the spec to confirm or change)

Add per-day counters under `telemetry`, recorded **only when consent is on**, deleted when consent is turned off, re-validated on load like the rest of `parseTelemetry`:

```
DayStat { d: "YYYY-MM-DD" (local day),
          scratch, rub, poke, chat,   // user gestures and messages
          shown, engaged,             // unprompted lines shown / reacted to
          min }                       // minutes the app was running
```

- Keep at most 60 days, newest last. Counts only, never content, never window titles.
- "Engaged" = the user pokes, scratches, rubs or double-clicks within 30 s of an unprompted line, counted once per line.
- Pure functions in `state.ts` (bump, Bond Days over the last 7 days, chat share), unit-tested with `node --test`; thin call sites in `+page.svelte`.
- Export the days through the existing "Copy stats" JSON as a `days` array.

## 7. Open questions the spec must answer

1. Should a plain poke count as care, or stay outside Bond Days? (Current proposal: outside.)
2. Does a double-click on an unprompted line count as "engaged" even though it opens chat?
3. Which prompts count as `shown`: only spoken lines, or also the name question, the start-with-Windows question and milestones?
4. How to treat day boundaries, time-zone changes and a laptop left on overnight (`min` can overstate presence)?
5. Should days be backfilled from `memory.json` (`days`, `touches`) for existing users, or start empty?
6. Is a retention metric (D7/D30) computed from `days`, from `firstSeen`, or both?
7. Privacy review: confirm the counters stay inside the existing opt-in wording and the Privacy section of the README and Settings.
8. A cheap way to count "ignored" lines without adding a dismiss control.

## 8. Constraints

- Keep the idle pet at roughly zero CPU; no new timers beyond the existing minute tick.
- No new network calls. Stats stay local; "Copy stats" remains the alpha export.
- State is owned by the pet window only; other windows send patches over `bus.ts`.
- Pure logic goes in `src/lib` with Node tests (`npm test`); run `npm run check` and `cargo test` as in the README.
- On Windows PowerShell 5.1, do not rewrite JSON/TOML with `Set-Content -Encoding utf8` (adds a BOM).

## 9. Deliverables requested from Claude Code

1. `spec/05-north-star-metrics.md`: definitions (exact formulas), event/counter schema, privacy statement, and answers to section 7.
2. An implementation plan: ordered steps, files touched, risks, and a test plan (unit tests for the pure functions, manual checks in the real window).
3. A short list of what could not be verified (the pet window was not seen running during the discussion).

Then stop and ask Vinh to review before coding.
