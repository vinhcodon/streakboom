# Plan: implementing "Bond Days" (companion to `spec/05-north-star-metrics.md`)

Status: **decisions D1 to D8 answered on 2026-11-08 (all as recommended, except D1: commit the revert, no release). Waiting for the go-ahead to start step 1.** Based on the local working tree on 2026-11-08 (see spec section 0 for how it differs from the handoff and from `main`).

## 1. Decisions (answered by Vinh, 2026-11-08; the recommendation column is what was chosen, except D1)

| # | Decision | Recommendation | Why it matters |
|---|---|---|---|
| D1 | What to do with the Bond Days prototype that is already in `main` (`850d896`) and in the 0.1.14 installer, while the local tree has it removed (uncommitted)? | **Chosen: commit the revert, do not release yet.** The prototype stays only in history and in the 0.1.14 installer until the next release; Bond Days is re-implemented from this plan (step 1 starts from empty files, not from `HEAD`). | Everything in step 1 below depends on it. It also decides whether a corrective release is needed. |
| D2 | Consent: new wording plus a consent version (`consentV`), so people who opted in earlier are not counted until they agree again (spec 6.3). | Yes. | The 0.1.14 build records `days` for any user with consent on, which is wider than what they agreed to. The founder's device is the only known one, but outside users will be added. |
| D3 | May a double-click on an unprompted line count as "engaged" (opening chat)? Typed messages never do. | Yes (spec 5.2). Alternative: only scratch, rub and poke engage a line, which keeps chat fully outside. | It is the one path by which chat habits can still produce a Bond Day. |
| D4 | The set of lines counted as `shown` (spec 5.3): proactive lines and milestones only; not launch greetings, not replies, not cards. | As specified. | Changes the engagement rate by a lot. |
| D5 | Retention definition: present in `[n, n+1]` days after first launch (one-day tolerance). | As specified; strict `n` stays computable. | Comparability with later numbers. |
| D6 | `min`: count a minute only when the gap since the previous tick is at most 2 minutes; presence = `min >= 5`. | As specified. | A sleeping laptop must not look present. |
| D7 | Add the `quiet` counter now; leave "hide-pet rate" out (it needs a new Rust event). | Yes. | The handoff lists hide-pet rate as a guardrail; it cannot be measured today. |
| D8 | Extend the export with `config` (`gentle`, `freq`) and `autostart`. | Yes. | Needed for the Character and Presence inputs. |

Because D1 is a revert, step 1 starts from empty files. The next release (whatever it contains) removes the counters from installed copies; until then 0.1.14 users who opted in are still recorded locally (nothing is sent).

## 2. Ordered steps

Each step is small enough to review alone; every step ends with `npm run check` and `npm test` green (and `cargo test` for step 7 only if Rust changes).

**Step 0. Settle D1 to D8, and the working-tree state.** The local tree has uncommitted edits (the prototype's removal, made by another session). Before anything is written: agree who commits what, work in a branch or a separate worktree, and commit only files named in this plan (an earlier blanket `git add -A` is how the prototype reached `main`).

**Step 1. Pure functions (no UI).** New file `app/src/lib/bond.ts`, so `state.ts` does not keep growing; `DayStat` and `Telemetry` stay in `state.ts` (they are part of `PetData`).
- `lastDates(now, n)`: the n local dates ending today, by calendar arithmetic.
- `bumpDay(d, key, now, n)`: only when consent is on and `consentV >= 2`; finds the entry by date, creates it, keeps ascending order, caps at 60.
- `bondDays(days, now)`, `chatShare(days, now)`, `engagementRate(days, now)`, `presenceDays(days, now)`, `retention(days, firstLaunchTs, n)`.
- `parseDays(v)`: validate, clamp, merge duplicates, sort, cap, `min <= 1440`.
- `minuteIncrement(prevTickMs, nowMs)`: 1 when `0 < gap <= 120 000` ms, else 0 (the sleep guard).
Files: `app/src/lib/bond.ts` (new), `app/src/lib/state.ts` (types, `parseTelemetry`, `setConsent`).

**Step 2. Schema and consent version.** Add `telemetry.days` and `telemetry.consentV` (missing in old files means 1); `setConsent(on)` from the new card sets 2, `off` clears everything as today; a new `setDailyCounts(on)` for the second switch; `parseTelemetry` returns empty `days` unless `consent === "on" && consentV >= 2`.
Files: `state.ts`, `state` tests.

**Step 3. Call sites in the pet window (thin).** In `+page.svelte` only, next to the existing handlers (function names, line numbers drift):
- `onHeadScratch`: `count("scratch")` and `engage()`.
- `onBellyRub`: `count("rub")` and `engage()` (before the trap decision, so a trap counts).
- `singleClick`: `engage()` at the top; `count("poke")` inside the existing 3 s throttle block.
- `onDblClick`: `engage()` after the `if (panel) return closePanel()` guard (D3).
- `sendChat`: `count("chat")` right after `recordAi` (after the gate). **No `engage()` here.**
- `fireProactive` and `shareNextMark`: `markShown()` only when a line was actually displayed (`say` / `aiProactive` / `memSay` returned true). Not in the start-up greeting, `memSay` at launch, click and gesture replies, or the card panels (D4).
- `quiet-changed` listener: `count("quiet")` when it turns on.
- `minuteTimer` (existing): `count("min", minuteIncrement(lastTick, now))`; keep `lastTick` in a plain variable. No new timer.
- `snapshot()`: put `days` (and the export fields of step 5) in `stats` only when consent is on.
Files: `+page.svelte`, `bus.ts` (`SettingsSnapshot.stats`).

**Step 4. New funnel events.** Add `tier_2`, `tier_3`, `pet_named` to `FunnelEvent`; record them with `track()` where closeness first reaches a tier (after `interact` / `startSession`) and in `answerInput` / `onMemPatch` when `petName` is first set. Once-only by the existing mechanism.
Files: `telemetry.ts`, `+page.svelte`.

**Step 5. Export.** "Copy stats" JSON adds `days`, `config: {gentle, freq}` (from the snapshot) and `autostart` (settings window calls `autostart_get` at copy time). Settings > Privacy shows a short plain-language list of what is counted.
Files: `settings/+page.svelte`, `bus.ts`, `ui.ts`.

**Step 6. Consent wording and documentation.** New `consentText` / `consentNote` / `statsHint` in both languages; the one-time card for people at version 1 (same style as the first card, `recordConsentAsk`-like counter, at most twice); the second switch in Settings > Privacy. Update the README privacy section and `spec/01`, `02`, `04` ("funnel events only"), and add an entry to `docs/engineering-log.md`.
Files: `ui.ts`, `state.ts` (`shouldAskDailyConsent`), `+page.svelte`, `settings/+page.svelte`, `README.md`, `spec/*.md`, `docs/engineering-log.md`.

**Step 7 (optional, only if D7 is extended).** A Rust event for the tray "Show / Hide" so a hide count can be added. Out of scope for v1.

## 3. Files affected (summary)

| File | Change |
|---|---|
| `app/src/lib/bond.ts` | new: pure functions |
| `app/src/lib/state.ts` | `DayStat`, `Telemetry.days`, `Telemetry.consentV`, parse and consent functions |
| `app/src/lib/telemetry.ts` | three new once-only events |
| `app/src/lib/bus.ts` | `stats.days`, export fields |
| `app/src/routes/+page.svelte` | call sites (step 3), consent card for version 1 |
| `app/src/routes/settings/+page.svelte` | export fields, second privacy switch |
| `app/src/lib/ui.ts` | wording, both languages |
| `app/src/lib/bond.test.ts`, `pet.test.ts` | tests |
| `README.md`, `spec/01`, `02`, `04`, `docs/engineering-log.md` | privacy and metric wording |
No Rust change, no new network call, no new timer.

## 4. Risks

1. **Consent scope (highest).** The prototype in the 0.1.14 installer records counters under the old consent. Mitigation: D2 and a corrective release; until then, tell the (few) opted-in users.
2. **Concurrent edits in the same checkout.** Another session edited the five files while this work was in progress, and its changes were committed and released by a blanket `git add -A`. Mitigation: step 0.
3. **Engagement inflation.** Hint lines invite the gesture; a click within 30 s for another reason counts. Mitigation: it is documented, compared across users, and hint lines are a known subset; the 30 s window and the set of shown lines are constants that can be tuned after the baseline.
4. **Chat leaking into the north star** through double-click engagement (D3).
5. **Counters that cannot be trusted:** `min` on desktops left on overnight, travel across time zones, clock changes. Documented in the spec; Bond Days itself does not use `min`.
6. **Write volume.** Each increment calls `scheduleSave` (a 500 ms debounce). Gestures, pokes and chat already do; the minute tick already saves. No change in the order of magnitude, but check it in the manual run.
7. **State size.** 60 days of 9 numbers is under 10 KB in `pet.json`.
8. **Scope creep into a dashboard.** Out of scope: reading and displaying metrics inside the app. Bond Days is computed offline from the exported JSON.

## 5. Test plan

### 5.1 Unit tests (`node --test`, pure functions)

- `lastDates`: 7 dates including today; across a month end and a year end; across a spring-forward and a fall-back day (use fixed timestamps and a forced time zone) with no date skipped or repeated.
- `bumpDay`: ignored when consent is off or `consentV < 2`; creates today's entry; increments by `n`; clock moved backwards to an existing date increments that entry instead of appending; array stays ascending and unique; capped at 60 (oldest dropped).
- `bondDays`: a day with only `poke` and `chat` is 0; `scratch`, `rub` or `engaged` each give 1; counts dates in the last 7 only (a date 7 days ago is excluded); an empty array is 0; entries outside the window are ignored.
- `chatShare`: null when the denominator is 0; chat only gives 1; equal chat and care gives 0.5; pokes are not in the denominator.
- `engagementRate`: null when `shown = 0`; 1 line shown and 1 engaged gives 1.
- `presenceDays`: `min` 4 is not present, 5 is.
- `retention`: D3 true when present on day 3 or 4, false on day 2 or 5; handles a missing first-launch event.
- `parseDays`: drops non-array, bad dates, negative or fractional or huge numbers, clamps `min` to 1,440, merges duplicates, sorts, caps; round trip of a valid array is identical.
- `parseTelemetry`: consent off gives `days = []`, empty queue, no id; consent on with `consentV = 1` gives `days = []`; `consentV = 2` keeps them; a file without `consentV` is version 1.
- `setConsent` / `setDailyCounts`: off deletes `days`; turning daily counts off deletes `days` but keeps the funnel queue.
- `minuteIncrement`: 60 s gives 1; 130 s gives 0; 0 and negative give 0.
- Engagement window, as a pure `engage(state, now)`: counts once per shown line; not after 30 s; two reactions to one line count once; a second shown line re-arms it.
- Funnel events `tier_2`, `tier_3`, `pet_named`: recorded once, only with consent.
- Regression: all 82 existing tests still pass.

### 5.2 Manual checks in the real window (none of this has been seen yet)

Use the installed build with `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222` to read `pet.json` and the page state, or open `%APPDATA%\com.streakboom.app\pet.json` directly.
1. Consent off: scratch, rub, poke, chat; `telemetry.days` stays empty and `pet.json` has no counters.
2. Consent on (version 2): each gesture bumps exactly one counter by one; a belly rub trap still counts `rub`; a registered poke counts `poke`, a throttled one does not; a message sent counts `chat`, opening the chat does not.
3. Engagement: force a proactive line (chatty mode, or lower the interval in a debug build), then scratch within 30 s: `engaged` is 1 and `shown` is 1; scratch again after 40 s: no second `engaged`; double-click within 30 s counts; typing a message alone does not.
4. Not counted as `shown`: the launch greeting, a click reply, the name question, the start-with-Windows card.
5. `min`: runs about 1 per minute; after closing the lid for 10 minutes it does not jump by 10.
6. Midnight: with the system date set to just before midnight, a gesture before and one after land on two dates.
7. Old consent: a profile that opted in before this change (consent on, no `consentV`) records no counters, sees the new card once, and records counters only after "Yes".
8. Export: "Copy stats" contains `days`, `config`, `autostart` and nothing else new; with consent off it contains none of them.
9. Idle cost: with the pet standing still, CPU is still near zero and no new timers appear in the DevTools Performance view; RAM unchanged.
10. Opt-out: turning stats off clears `installId`, `queue`, `days`.

### 5.3 Gate before release

`npm run check`, `npm test`, `cargo test` green; the manual checks above done on the founder's machine; the README and spec wording changed in the same commit as the code; a one-line note to the users who already opted in.

## 6. What could not be verified

- That the 0.1.14 build actually records counters on this machine: `pet.json` was read once and had no `days` key yet, so it is not confirmed that the build contains and runs the prototype; the commit history says it should.
- Whether the pet was seen running at all during the product discussion: it was not. Every behaviour above comes from reading code, not from observation.
- Engagement rates, the 30 s window, bubble durations and how often users react: all unmeasured; the window and the set of counted lines are guesses to be tuned with the baseline.
- How WebView2 timers behave while the machine sleeps or the window is hidden or occluded (the sleep guard assumes the minute timer is paused or delayed, not burst).
- Daylight-saving behaviour: only reasoned about; needs the forced-time-zone unit tests.
- The founder's baseline (45 pokes, 58 of 60 chats, and so on) was taken from the handoff and not recomputed.
- Whether people who opted in under the old wording would accept the new card, and how many alpha users there will be.
- Whether a Rust event for tray hide/show is cheap enough to include; not investigated.
- The effect of the second consent card on the first-run flow (it must not collide with the tour, the name question or the consent card); only reasoned about.
