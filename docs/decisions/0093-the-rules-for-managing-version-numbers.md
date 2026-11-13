# ADR-0093: The rules for managing version numbers

- **Status:** accepted (answered by the author on 2026-11-13 as multiple choice); **point 3's `preview.json` rule is amended by ADR-0094** (2026-11-14); the rules are written in [`../../spec/16-versioning.md`](../../spec/16-versioning.md). Completes ADR-0090 (the channels) and settles its open point 9 (a Stable fix while `main` carries unfinished work). No code is changed by this record; the checks of spec 16 section 10 are a later story (PV-9).
- **Date:** 2026-11-13
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
With an even middle number for Stable and an odd one for Preview (ADR-0090), the author asked how the three numbers should move, what makes a build a Preview or a Stable, and what the rule must be so that every release follows it.

## Decision
1. **What each number means** (spec 16 sections 1 and 2): the patch moves with every build handed out inside a line; the middle number moves only when the channel changes, by 1 when a Preview line starts and by 1 when it is promoted, so it alternates odd and even; the major moves only by the author's decision. The size of a change never picks the number.
2. **A Stable fix while `main` carries unfinished work:** a fix is released **only when `main` is shippable**; otherwise it waits for the next promotion, which may be brought forward. A release branch of the Stable line (plan step PV-7) is built only the day a fix cannot wait.
3. **Preview testers stay on Preview across a promotion:** the next Preview line is published on the same day as the Stable (0.6.0 and 0.7.0 together), and `updates/preview.json` shows the newest of both, so a Preview tester skips the Stable and is not moved to the Stable channel. The author's first principle (a Preview goes to its next patch or to the next Stable) holds for the Stable channel and for a tester who chooses it; testers are kept on Preview by this rule.
4. **A Stable is cut from the commit of the last Preview** of its line, with only the version files and the release documents changed: what the testers used is what everyone gets.
5. **The major number stays 0** until the author orders 1.0 by an ADR; 1.0.0 must be a Stable (an even middle number), then 1.1.x is Preview and 1.2.0 Stable.

## Consequences
- Spec 16 is the written rule; `docs/releasing.md` points to it. Every release is checked against it.
- Releasing a Stable now includes publishing the next Preview line the same day (spec 16 section 10 proposes a reminder and a test that `preview.json` ends at the highest version whatever the order).
- Not yet tried: a Preview taking a Stable, a Stable published after a Preview, pruning past two releases in a channel.
