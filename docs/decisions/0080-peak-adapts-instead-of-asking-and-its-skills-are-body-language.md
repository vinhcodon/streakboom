# ADR-0080: Peak adapts instead of asking, and its skills are body language

- **Status:** accepted as a **direction** (decided by the author on 2026-11-13 in a product discussion in Claude chat); the spec ([`../../spec/14-adaptive-peak.md`](../../spec/14-adaptive-peak.md)) is a draft and **no code is approved**: each item is approved by Vinh one by one.
- **Date:** 2026-11-13
- **Decided by:** Vinh (author), recorded by Claude (the app session) from [`../handoff/adaptive-peak-and-skills.md`](../handoff/adaptive-peak-and-skills.md), section 2

## Context
The handoff proposes that Peak notice how the person lives with it and offer changes, instead of a Settings page of tastes, and that it get a few **skills**: small actions of its own body triggered by what the person says. It asks for a spec and a plan, and keeps the decisions below as fixed.

## Decision
1. **A1.** No choices of taste (colour, accessory, voice, seat) are added to Settings. Peak notices and suggests.
2. **A2.** Skills are body language and presence only. They never touch the person's apps, files or data. No timers or reminders.
3. **A3.** Voice, in its first version, is a held hotkey only. No wake word.
4. **A4.** The first skill is "Lượn đi" (goodbye, go, come back). The phone, the usual place to sleep and the transformation are not chosen for the first slice.
5. **A5.** Calling or sending Peak away by words does not count toward Bond Days at this stage; it is counted separately.
6. **A6.** Quiet mode, hiding, the key, the language, privacy, and seeing and deleting what Peak has learned stay deterministic controls.

## Consequences
- The hypotheses are H17 to H22 in the register (the handoff's H1 to H6); thresholds are Vinh's, set before the data.
- Spec 14 (not 08, which is taken) holds the requirements; the plan puts the cheapest checks of H18 and H19 first, and S0 and S1 need no change to the app.
- This **does not reopen** ADR-0047 (the shoo stays declined: a pattern in the person's behaviour may only be the reason for a question) or the charter's rules on absence (no guilt, no "I missed you").
- **Voice is a new sense** (charter article 4, `AGENTS.md` rule 4): it needs its own ADR, an open consent, and a change of the README, `privacy.md` and the website before any code.
- Open questions are in spec 14 section 13 and wait for Vinh.
