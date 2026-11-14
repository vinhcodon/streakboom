# ADR-0097: "Lượn đi", the first slice: the author's answers

- **Status:** accepted (answered by the author on 2026-11-14 as multiple choice); built as story AP-S2, **not released**, **not yet seen by the author**. Follows ADR-0080 (A1 to A6), ADR-0086 (20 minutes, the tray to call back) and spec 14 section 7.1.
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
Step S2 of the adaptive plan is the smallest "Lượn đi" for the author to use himself. Four points of how it looks and where it exists were put to him.

## Decision
1. **The goodbye:** one short line in Peak's voice, **written in advance in the three languages** (six each, in their own list, `app/src/lib/farewell.ts`, not in the counted pools of scripted lines). They are warm, make no promise to return, name no time, ask nothing, and pass the banned patterns of every other line (`banned.ts`, now one shared table) plus a test of their own. Peak says it first, then goes.
2. **How it leaves:** it **walks to the nearer side edge, then the window is hidden** (the existing walk; no new art). The walk is given up after 12 seconds (it then leaves where it stands).
3. **How it comes back:** after **20 minutes**, at the edge it left by, with a **stretch (the `wake` pose) and no line**; at once when the person shows it from the tray or starts the program again. If the person is in something full-screen or presenting it asks again after 5 minutes.
4. **Who has it:** **only a Preview build** (ADR-0089, ADR-0090). A Stable copy does not get it until it is promoted.

## Consequences
- Counted as `leave` and `callback` in the per-day stats (additive fields), **apart from Bond Days** (A5); only recorded with the person's consent, as every counter.
- It is a plain command typed in the chat box, matched as a whole message by the table of `intents.ts` (an exact phrase only; a pattern match would need a confirmation card, **not built**). Because the chat box exists only with a brain connected, a copy with no key cannot use it yet.
- Not saved: after a restart Peak is on screen. While it is away nothing moves, speaks or shows a panel.
- **Not yet tried by anyone** (V-127): the walk to the edge on a real screen, the hide and the return, the tray call back, the three languages of the goodbyes, how it feels.
