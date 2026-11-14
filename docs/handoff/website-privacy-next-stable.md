# Note for the website session: privacy facts that will come with the next Stable

- **From:** the app session. **Date:** 2026-11-15. **Status:** open, for the website session; **do not publish before the next Stable** (these are in Preview builds, which the site does not announce, ADR-0089 and ADR-0101).
- **What `docs/privacy.md` now says, in addition to Stable 0.10.0:**
  1. **The date goes to the chat model** with the time (a line like `10:05, Saturday 14 November 2026, morning`); no time zone, no place (ADR-0105 addendum, Preview 0.11.2).
  2. **Days you ask Peak to keep** (a birthday, an anniversary): kept in `memory.json` on the computer, at most 24, listed and removable in Settings, Memory; **sent with each chat you start** to the brain you chose, like the noted facts, and under the same switch (Preview 0.11.4, ADR-0115 last addendum). The cheer on the day is a scripted line and needs no key.
  3. **A failed update leaves a note** (`update-trace.log`: a status number and the GitHub quota, never sent); it asks `api.github.com/rate_limit`, which does not use up the quota (Stable 0.10.0 does not have it; Preview 0.9.8 and later do).
- **What to do when the next Stable is cut:** the app session will say so in `docs/handoff/website-release-prompt.md`; then update the privacy page and the "Remembers a little" card (`f4`) in the three languages. Until then nothing changes on the site, and the build still passes.
- **Not done by the app session:** nothing under `site/` or `scripts/site/` was edited.
