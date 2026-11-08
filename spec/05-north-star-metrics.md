# 05. North star and metrics: "Bond Days"

Status: **decisions D1 to D8 answered by Vinh on 2026-11-08 (section 7). Implemented on 2026-11-08 (`app/src/lib/bond.ts`, `state.ts`, the pet window, Settings > Privacy), not yet released and gestures, minutes and the reaction rule were seen in the real window (engagement through a test hook), the rest is listed as not verified; see `../docs/plans/bond-days.md` for the checks that remain.**
Settled choices are recorded in ADR-0021 (positioning) and ADR-0022 (this north star); the claims it tests are hypotheses H5 and H8 in `../docs/hypotheses/README.md`; the order of work is in `../docs/plans/roadmap.md`. Written 2026-11-08 from the local working tree (not from GitHub `main`), after reading `app/src/lib/state.ts`, `telemetry.ts`, `bus.ts`, `memory.ts`, `app/src/routes/+page.svelte` and `settings/+page.svelte`, the README privacy section and specs 01 to 04. Input: `docs/handoff/north-star-bond-days.md`.

## 0. What the repository looks like today (and where the handoff is out of date)

The handoff said the local tree was ahead of `main` with uncommitted multi-provider work and that the exploratory Bond Days edit had been reverted. That is no longer true. Facts checked on 2026-11-08:

| Handoff says | Today |
|---|---|
| Multi-provider work is uncommitted and local only | It is committed, pushed and released: commits `2f43263` (0.1.13: Claude, new Settings) and `7ed4ef6` (0.1.14: OpenAI). |
| The exploratory Bond Days edit was reverted, "no code was changed" | A version of it **is in `HEAD`** (`850d896`, "Update Cargo.lock for 0.1.14"): `DayStat`, `bumpDay`, `bondDays`, `chatShare`, `parseDays`, `count()`, `markShown()`, `engage()`, a `days` array in the Copy stats export, and 5 tests. It reached `main` by accident, when a `git add -A` swept up working-tree changes from another session, and it was compiled into the 0.1.14 installer (built 14:53, after the files were edited at 14:47). |
| Local tree has `+page.svelte`, `state.ts`, `bus.ts`, `ui.ts`, `settings` uncommitted | The only uncommitted differences now are the **removal** of that prototype from five files (`bus.ts`, `pet.test.ts`, `state.ts`, `+page.svelte`, `settings/+page.svelte`). `ui.ts` is clean. |

So three states exist at once: `main` and the 0.1.14 installer have the prototype, the local tree does not. This spec does not touch any of them. **What to do about it is the first decision for Vinh (D1 in the plan)**; this document describes the target design and, where the prototype differs from it, says so.

Other handoff statements checked against the code:

- Section 4 is right that `recordEvent` records each event once per install (`telemetry.done`), that `active_d3` / `active_d7` are tracked from `streak`, that the queue cap is 200, that `parseTelemetry` returns empty data unless consent is `on`, and that "Copy stats" exports `{app, version, installId, events}` only. Note that `active_d3` / `active_d7` mean "the current streak of consecutive launch days reached 3 / 7", which is not retention (see 3.3).
- "Bubbles auto-hide after a timer, there is no dismiss action": true for spoken lines (`showBubble`: 4 s plus 60 ms per character, or longer for some). It is **not** true for the card panels (name question, start-with-Windows question, consent, update offer, tour, brain request): they have explicit buttons ("Not now", "Skip") and idle timers of 12 to 90 s. "Ignored" can only be inferred for spoken lines.
- The interaction handlers list in the handoff misses the pet-initiated prompts added since: `memSay`, `shareNextMark`, `askInput`, `startTour`, the start-with-Windows card. They matter for question 3.
- `memory.touches.scratch` counts head scratches **and** belly rubs (both call `touch("scratch")`), while `data.gestures.scratches` and `.rubs` are separate. The handoff's baseline ("17 scratches in memory counters, 28 scratches and 7 rubs in pet counters") is consistent with that, but it means the memory counters cannot be used to separate the two gestures.
- `startup.done` becomes true when the user says yes to the start-with-Windows card or turns it on in Settings, and is never reset when they turn it off again. It is an upper bound, not the current state.
- Two defects in the prototype in `HEAD` are corrected in this spec: `bondDays` steps back with `now - i * 24 h` (wrong across a daylight-saving change), and `bumpDay` only compares with the last array entry (wrong if the clock moves backwards). The prototype also matches the handoff where it matters: `engage()` is called from `singleClick`, `onDblClick`, `onBellyRub` and `onHeadScratch` only, never from `sendChat`, and `chat` is counted after the usage gate. It does not yet have `quiet`, consent versioning, the `min` sleep guard or the extra export fields.
- README privacy section (lines 37 to 42) and `ui.ts` consent wording still describe "funnel event names" only; both need new wording (6).

## 1. Decisions that are fixed (from the handoff, not reopened)

1. Chat does **not** count toward the north star.
2. No alpha targets yet: record a baseline with a few outside users first. This spec gives formulas and no thresholds.
3. Whether reaching the daily chat cap is good or bad is unknown: chat share is tracked as a watch metric.
4. A per-day counter set is added to telemetry: counts only, no content, opt-in.

## 2. Principle

The pet sells a relationship, not capability. The north star must therefore reward voluntary acts of care and reciprocity, and must not reward using the pet as an assistant. Everything below follows from that.

## 3. Metrics

### 3.1 Definitions

- **Day** = a local calendar date, `YYYY-MM-DD`, taken at the moment the event happens (the same `dayKey` used for streaks).
- **Last 7 days at time t** = the local dates of t, t minus 1 day, ... t minus 6 days, computed by calendar arithmetic (`Date.setDate`), not by subtracting 24 hours.
- For a date `d`, the counters are those of section 4. A date with no entry has all counters 0.
- `care(d) = scratch(d) + rub(d) + engaged(d)`
- `bond(d) = 1 if care(d) >= 1, else 0`
- **BD7(t) = sum of bond(d) over the last 7 days at t.** An integer from 0 to 7.

### 3.2 North star: Bond Days per week

Per install: `BD7`, read at a fixed moment (each Sunday at the end of the day for reporting; the pet window never needs to compute it except for display).

Per cohort, for alpha reporting: the **mean BD7**, and the distribution (share of installs with BD7 = 0, 1 to 3, 4 to 7). No target. Only installs with at least 7 calendar days since their consent date are counted (so the window is complete), and the cohort is stated with every figure (n installs, dates).

Chat and plain pokes are outside `care`. A belly rub counts even when it turns out to be a trap (`huff`): the act of care is the user's, the outcome is the pet's.

### 3.3 Input metrics

| Group | Metric | Exact definition | Source |
|---|---|---|---|
| Presence | Days present, last 7 | days with `min >= 5` among the last 7 | `days[].min` |
| Presence | Start-with-Windows rate | share of installs whose Windows autostart is on at export time | new `autostart` field in the export (read from `autostart_get` when "Copy stats" is pressed); `startup.done` is only an upper bound |
| Reciprocity | Engagement rate | `sum(engaged) / sum(shown)` over the last 7 days, per install; undefined when `shown = 0` | `days[].engaged`, `days[].shown` |
| Reciprocity | Ignored lines | `shown - engaged` (never negative: a line is counted engaged at most once) | derived, not stored |
| Continuity | D3, D7, D30 | present (`min >= 5`) on some date in `[n, n+1]` calendar days after the first-launch date | `first_launch` event time (it is back-filled with `firstSeen` at consent) plus `days`; D30 is readable while the 60-day window still covers it |
| Continuity | Closeness tier 2 and 3 reached; pet named | once-only events `tier_2`, `tier_3`, `pet_named` | new funnel events through the existing `recordEvent` (3.5) |
| Continuity | Streak reached 3 / 7 | `active_d3`, `active_d7`, unchanged | `streak`; keep the events, but call them "streak reached", not retention |
| Character | Gentle tone on | share of installs with `settings.gentle` at export time | new `config` object in the export (3.5) |

Dropped from the handoff: **repeated-line rate**. The line picker (`pick`) avoids the last 24 lines by construction, and `recent` holds only 24 ids, so the rate is close to 0 and cannot be measured over time without a counter that would add nothing. If lines are found repeating, that is a content-pool bug to fix, not a metric.

### 3.4 Guardrails (drift toward "assistant")

| Guardrail | Definition | Note |
|---|---|---|
| Chat share | `sum(chat) / (sum(chat) + sum(scratch) + sum(rub))` over the last 7 days; undefined when the denominator is 0 | Only meaningful for installs with a brain (a `key_valid` event exists); without a brain `chat` is always 0 and the share is trivially 0. Threshold undecided (fixed decision 3). Units differ (messages versus gestures); read the trend, not the level. |
| Quiet mode use | `sum(quiet)` over the last 7 days (times Quiet mode was switched on) | Counted in the pet window on the existing `quiet-changed` event. |
| Hide-pet rate | **Not measurable in v1** | Hiding is done from the tray (`toggle` in Rust); the pet window is not told. Needs a Rust event; deferred, listed in the plan as optional. |
| CPU / RAM | RAM <= 120 MB, idle CPU near 0 | Not telemetry. Measured by hand with the recipe in `docs/engineering-log.md` (WebView2 debug port, 5 s windows). The counters add no timers, so they must not change it. |

### 3.5 Secondary, and what the export gains

- BYOK conversion (`key_valid`) is a monetization metric, not a bonding one. Unchanged.
- The "Copy stats" JSON gains `days` (the counter array), `config` (`{gentle, freq}`: two settings, no language, no key, no provider name) and `autostart` (a boolean read at copy time). Nothing is sent automatically; the export remains the alpha channel.

## 4. Per-day counters

### 4.1 Schema (version 1)

Stored in `pet.json` under `telemetry.days`, newest last.

```
DayStat {
  d: "YYYY-MM-DD",   // local date, unique in the array, ascending
  scratch, rub,      // head scratches, belly rubs (care gestures)
  poke,              // plain single clicks that registered
  chat,              // messages the user sent to the model
  shown, engaged,    // unprompted pet lines shown / reacted to within 30 s
  min,               // minutes the app ran with the machine awake
  quiet              // times Quiet mode was switched on
}
```

Invariants (enforced when loading, as `parseTelemetry` does today): every counter is an integer from 0 to 1,000,000 (`min` at most 1,440); `d` matches `^\d{4}-\d{2}-\d{2}$`; entries are sorted by `d` and unique by `d` (duplicates are merged by summing); at most 60 entries (the newest). With consent off, or with the old consent version (6.3), `days` is always `[]` whatever the file says. Counts only: no text, no window titles, no hour of day, no durations other than `min`.

### 4.2 When each counter changes (all in the pet window, which owns state)

| Counter | Incremented when | Where today |
|---|---|---|
| `scratch` | a head scratch is detected | `onHeadScratch` |
| `rub` | a belly rub is detected, trap or not | `onBellyRub` |
| `poke` | a single click registers, i.e. not suppressed by a drag and more than 3 s after the previous registered click | inside the `if (now - lastClickSay > 3000)` block of `singleClick` |
| `chat` | a message passes the usage gate and is sent to the model | `sendChat`, after `aiGate` succeeds (the same place `interact(data, "how", ...)` runs). Opening the chat and scripted "how are you" replies without a brain are not messages. |
| `shown` | an unprompted line is displayed: see 5.3 | `fireProactive` (scripted and AI), `shareNextMark` |
| `engaged` | the user reacts to such a line within 30 s, once per line: see 5.2 | `engage()` called from `singleClick`, `onHeadScratch`, `onBellyRub`, `onDblClick` |
| `min` | once per minute by the existing `minuteTimer`, only when the wall-clock gap since the previous tick is at most 2 minutes (a machine that slept does not add the sleep) | `minuteTimer` (no new timer) |
| `quiet` | Quiet mode is switched on | the `quiet-changed` listener |

A counter increment is a pure function (`bumpDay`) that finds today's entry **by date** (not just the last element), creates it if missing, and keeps the array sorted and capped.

## 5. Answers to the open questions (section 7 of the handoff)

**5.1 Does a plain poke count as care?** No. It stays outside Bond Days and is stored (`poke`) because it is cheap and shows playful presence. A poke made within 30 s of an unprompted line still makes the line "engaged" (that is reciprocity, 5.2), but a poke alone never makes a Bond Day.

**5.2 Does a double-click on an unprompted line count as "engaged" even though it opens chat?** Yes, once per line, because answering the pet's line is exactly the reciprocity being measured. What never counts is a **typed message**: `sendChat` must not call `engage()` (the prototype in `HEAD` correctly does not). Residual risk: a chat-heavy user can earn a Bond Day by double-clicking after a line and then chatting. That is a decision for Vinh (D3): the alternative is to let only scratch, rub and poke engage a line, which keeps chat completely out.

**5.3 Which prompts count as `shown`?** Only pet-initiated spoken lines that arrive unprompted during normal use: the lines chosen by `fireProactive` (idle, morning, night, long, gesture hints, brain hint, and AI-written ones) and shared milestone lines (`shareNextMark`). Not counted: the greeting and return line at launch (the user has just started the app and the reaction is confounded), memory lines at launch, replies to the user's own actions (click, scratch, rub, huff, belly, "how"), and the card prompts with explicit answers (name, what to call you, start with Windows, consent, update, tour, brain request), whose acceptance is already visible in their own records (`memory.petName`, `startup`, `telemetry.asks`, `update`, `tour`, the funnel events). Gesture hints are included although they invite the gesture: they are still unprompted lines, and the effect is visible because hint lines are a known subset (`hint` and `hintbelly` triggers).

**5.4 Day boundaries, time zones, laptops left on?**
- An event belongs to the local date at the moment it happens. A tick at 23:59 and one at 00:01 fall on two dates.
- If the clock moves backwards (manual change, time zone travel), `bumpDay` finds the existing entry for that date instead of appending a duplicate; loading merges duplicates by summing.
- "Last 7 days" uses calendar arithmetic, so a daylight-saving day of 23 or 25 hours neither skips nor repeats a date.
- `min` skips gaps larger than 2 minutes between ticks, so a laptop that slept does not count its sleep. A desktop left on and awake overnight still counts: the app has no input hook (the pet window is click-through) and the spec does not add one. That is why presence uses a threshold (`min >= 5`) and Bond Days does not depend on `min` at all.
- Travel across time zones can produce a day with two partial days or a gap; at alpha scale this is accepted and noted.

**5.5 Backfill from `memory.json`?** No; start empty. `memory.json` keeps only totals (`touches`, `days` as a count, `lastDay`) and no per-date data, so a backfill would invent per-day values, and data from before consent must not be recorded anyway. The only history reused is the `first_launch` event, which is already back-filled with `firstSeen` at consent. Consequence for the founder's device: the baseline in section 5 of the handoff (one day, one user) stays a sanity check, not part of any series.

**5.6 Retention from `days`, `firstSeen`, or both?** Both. The first-launch date comes from the `first_launch` event (which carries `firstSeen`); presence comes from `days` (`min >= 5`). `Dn` = present on some date in `[n, n+1]` calendar days after the first-launch date (a one-day tolerance, because a pet is used irregularly and weekends are common); the strict version (`n` only) can be computed from the same data. D30 needs the 60-day window, so it can be read until day 60. This is a choice Vinh may change (D5).

**5.7 Privacy review.** See section 6. In short: the counters are **new in kind** (per-day behaviour counts), so the existing opt-in wording ("funnel event names") does not cover them, and people who already opted in did not agree to them.

**5.8 Counting "ignored" lines without a dismiss control.** Ignored = `shown - engaged`, derived at read time from two counters. A line is counted `shown` when displayed and `engaged` if the user acts within 30 s (once per line). No dismiss control is added. Caveat: a line shown while the user is away is counted ignored; the pet window cannot tell away from absent, so compare rates across users and over time, not as an absolute. (Lines are already withheld during fullscreen/presentation, quiet hours and quiet mode.)

## 6. Privacy

### 6.1 What is recorded and what is not

Recorded when the user opts in: the funnel event names and timestamps already described, plus, per local date, eight counts (scratches, rubs, pokes, messages sent, lines shown, lines reacted to, minutes running, times Quiet mode was switched on) and, in the export only, two settings (`gentle`, `freq`) and whether start-with-Windows is on. Not recorded, ever: message text, the API key, which brain or model is used, names, facts the pet noted, window titles, the hour of the day, anything about other applications.

### 6.2 Where it goes

Stays in `pet.json` on the machine. Nothing is sent automatically and no network call is added. The user can read all of it: "Copy stats" puts the whole JSON on the clipboard, and nothing is shared unless they paste it somewhere by hand.

### 6.3 Consent

- The counters are recorded only when `telemetry.consent === "on"` **and** the consent version is at least 2 (`telemetry.consentV`; files without it are version 1).
- New wording for the card and for Settings > Privacy: "Can I count which steps people use in the app, and roughly how often you scratch, rub, poke and chat per day, to make me better? Only counts, never your chats, your key or anything personal."
- A person who opted in under the old wording stays at version 1: funnel events continue, counters do not. They are shown the new card once or twice, like the first one ("No thanks" has the same weight as "Yes"), and Settings > Privacy has a second switch, "Daily activity counts", that can be turned on or off at any time. Turning it off deletes `days`; turning stats off deletes everything (as today).
- The README privacy paragraph and specs 01, 02, 04 (which say "funnel events only") are updated in the same change as the wording. This is part of the work, not a follow-up.

## 7. Decisions (answered by Vinh, 2026-11-08)

| # | Decision | Answer |
|---|---|---|
| D1 | The prototype that reached `main` and 0.1.14 by accident | Commit the revert; do **not** release yet. Bond Days is rebuilt from this spec and the plan. |
| D2 | Consent for the daily counters | New wording plus a consent version; people who opted in under the old wording are asked again and are not counted until they agree (6.3). |
| D3 | Double-click on an unprompted line | Counts as "engaged", once per line; typed messages never do (5.2). |
| D4 | What counts as `shown` | Periodic proactive lines (scripted and AI) and shared milestones only (5.3). |
| D5 | Retention | Present in calendar days `[n, n+1]` after the first launch (5.6). |
| D6 | `min` and presence | A minute counts only if the gap since the previous tick is at most 2 minutes; present means `min >= 5` (5.4). |
| D7 | Quiet mode and hide-pet | Add the `quiet` counter now; hide-pet rate is deferred (it needs a Rust event). |
| D8 | Export | Adds `config` (`gentle`, `freq`) and `autostart` to `days` (3.5). |

## 8. What could not be verified

See `docs/plans/bond-days.md`, section 6.
