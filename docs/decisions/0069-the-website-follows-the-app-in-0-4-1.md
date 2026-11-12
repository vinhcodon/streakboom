# ADR-0069: The website follows the app in 0.4.1: the language list, the tray menu, one Peak

- **Status:** accepted (the release prompt for 0.4.1 asked for a review, not for a decision; nothing here needed the author's choice); **built on 2026-11-12**
- **Date:** 2026-11-12
- **Decided by:** Claude (the website session), after the release prompt for 0.4.1 and ADR-0066, ADR-0068

## Context
Version 0.4.1 (published 2026-11-12) made three changes the site could describe: only one Peak runs at a time (a second start shows the hidden Peak instead of opening another, ADR-0068); the tray icon menu follows the language chosen in the app; Auto reads the system's whole list of preferred languages, takes the first that Peak has (Vietnamese, Japanese, English), never the IP address or the location, and the first tour card has a picker (ADR-0066). GitHub now keeps `v0.4.1` and `v0.4.0` (v0.3.2 was deleted).

## What was checked and changed
1. **The Pages build** passes with 0.4.1, including the live check of ADR-0065: the release `v0.4.1` is published and has `Streakboom_0.4.1_x64-setup.exe`, so the Download button points at it (a local build with `STREAKBOOM_DOWNLOADS=live` against the real GitHub API). The README sentences the build reads were not changed.
2. **The home page** shows the first sentence of the newest note: "Only one Peak runs at a time.", in bold.
3. **Outdated wording found and changed:** the FAQ "Is the app available in Japanese?" said Auto "picks it on a Japanese Windows" (the first language only). It now says Auto takes the first language of the system's list that Peak has, never from the IP address or the location, and that the first tour card and Settings change it (three languages, still short). The build now fails on the old wording.
4. **Said as behaviour:** the tray-icon row of the gestures table adds that the menu follows the language and that starting Streakboom again never opens a second Peak: it shows the hidden one.
5. **Nothing else on the site was out of date:** no text said that a second start opens another Peak or that the tray menu is English only; the 0.3.2 processor figures stay (no new measurement); the 18+ line is still self-declared.

## Consequences
- ADR-0067 (the language suggestion on the site) and ADR-0066 (the app's Auto) now describe the same rule from both sides: the browser's or the system's list, never the IP.
- Not verified: the app's behaviour (the tray menu in Vietnamese and Japanese, the tour picker, a second start while Peak is hidden, the update from 0.4.0 to 0.4.1) is the app session's list; the site only repeats what the CHANGELOG and README say. The new Vietnamese and Japanese sentences have no native reader.

## Sources
`CHANGELOG.md` 0.4.1, `docs/handoff/website-release-prompt.md` (0.4.1), ADR-0065, ADR-0066, ADR-0067, ADR-0068.
