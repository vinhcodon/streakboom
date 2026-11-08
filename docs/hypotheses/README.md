# Hypotheses

What we **believe but have not proven**, and how we would find out. A hypothesis is not a decision (see `../decisions/`): it can be wrong, and the product should change if it is. Nothing here has been tested with outside users yet: the closed alpha has not started, and the only data is from the author's own device (one user).

**Rules**
- Every hypothesis has an owner-visible status: `untested`, `testing`, `supported`, `refuted`, `superseded`, or `conflict` (needs a decision).
- Every hypothesis names the metric or observation that would settle it, and what result would count as support or refutation. Thresholds are set **before** looking at data; where they are not yet set, the row says so.
- When a hypothesis is settled, record the outcome here and, if it changes the product, write a decision record.
- Technical assumptions are listed separately at the end: they are things we rely on but have not verified.

## Register

| ID | Hypothesis | Status | Settles it | Source |
|---|---|---|---|---|
| H1 | Knowledge workers who spend 8+ hours at a PC will install an animated desktop pet because they feel isolated and screen-tired. | untested | Download intent and D3/D7 retention in the closed alpha | original spec 01 |
| H2 | Power users will create and paste their own API key (starting with the free Gemini tier) to unlock a smart pet without a subscription. | untested | Share of users who complete the key flow with a valid key (`key_valid`) | original spec 01 |
| H2b | A fraction of engaged naive-mode users will paste a key when the pet asks at a moment of high engagement. | untested | Funnel `brain_request_shown` to `first_ai_message`. Suggested starting points (assumptions, not benchmarks): under 20% is a reason to rethink, over 50% is healthy. | original spec 01 |
| H3 | Users prefer quick bubble chat and proactive prompts over opening a browser tab to ask an assistant something trivial. | **conflict** | Chat share and chat per session (watch metric). See the note below. | original spec 01 |
| H4 | A pet with no AI (scripted lines, mood and closeness, time-of-day reactions) is engaging enough to keep for 7 days. | untested | D3/D7 retention in naive mode, separate from the upgrade rate | original spec 01, spec/03 |
| H5 | The bond is made of voluntary care and reciprocity, not of chat: Bond Days (days in the last 7 with a scratch, a rub or a reaction to an unprompted line) predicts keeping the pet better than chat usage does. | untested | Compare retention of installs with high versus low Bond Days, controlling for chat; needs the baseline first (no threshold set) | handoff, spec/05 |
| H6 | Remembering (a name, what to call the user, a part of the day, short facts) makes the pet feel more like theirs. | untested | Share of installs that name the pet; reaching closeness tier 2 and 3 (`pet_named`, `tier_2`, `tier_3`, planned events); interviews | decision ADR-0014 |
| H7 | Some users will pay for a Claude or OpenAI brain because it is smarter than the free Gemini one. | untested | Not measurable from telemetry (the brain is deliberately not recorded); needs interviews with observed alpha users | ADR-0008 |
| H8 | Rubbing the belly (usually liked, sometimes a trap) and an emotional reaction to answers raise the number of care acts per active day. | untested | `rub` and `engaged` counters once Bond Days is built (planned) | decisions ADR-0011, ADR-0016 |

### Conflict: H3 versus the companion positioning
H3 says the pet is useful because chat is convenient. The positioning decision (ADR-0021) says the pet is not an assistant, and the north star deliberately excludes chat. Both cannot lead the product. For now chat is kept as a watch metric (chat share), which is what the author decided. **Vinh needs to say whether H3 is retired, kept as a secondary hypothesis, or replaced by H5.**

### What the one data point says (the founder's device, 2026-11-08, about a day after install)
A sanity check, not evidence (n = 1, the founder): 45 pokes, 17 scratches and 40 chats in the memory counters (28 scratches and 7 rubs in the pet counters), both daily AI caps reached, and 128 menu opens before a key was connected. Chat was the heaviest single mode: exactly the drift the Bond Days guardrail is meant to detect. These numbers come from the handoff and were not recomputed.

## Technical assumptions not yet verified

These are relied upon and need checking before a wider release.

| ID | Assumption | How to check |
|---|---|---|
| A1 | The alpha budget holds on other machines: at most 120 MB total, near 0% CPU idle, 7 to 15% of one core while walking. Measured on one machine only. | Run the measurement recipe in `../engineering-log.md` on a second and a lower-end machine, including an integrated-GPU-only one |
| A2 | `--disable-gpu` has no visual problems (tearing, flicker) with the animated rig. | Look at it on several machines and at 125% and 150% DPI |
| A3 | Multi-monitor and mixed-DPI behavior (clamping, bubble placement, click-through) is correct. | Manual matrix in `../../spec/04-technical-design.md` section 6 |
| A4 | Fullscreen and presentation detection (`SHQueryUserNotificationState`) works with real games, videos and screen sharing. | Manual tests with real apps |
| A5 | An 8-hour session does not grow memory. | Soak test |
| A6 | The Claude and OpenAI clients work with real keys: model names, the credit and quota error texts, regions, reasoning models returning empty answers. | A tester with a paid key from each provider; copy the error details |
| A7 | Start with Windows survives a real reboot and an update. | Reboot test on the installed build |
| A8 | Testers will accept the SmartScreen warning of the unsigned installer. | Observe the first alpha users; note drop-off at the install step |
| A9 | The first-run tour, the belly-rub trap rate, the mood tags and the new Settings pages feel right to a person seeing them for the first time. | Observe 5 to 10 first-time users (also a goal in spec/02) |
| A10 | The 0.1.14 installer, which contains the reverted Bond Days prototype, records nothing for people who have not opted in. | Read `pet.json` on a build with consent off |
