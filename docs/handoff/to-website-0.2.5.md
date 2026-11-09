# To the website session: what changed in the app up to 0.2.5

**From:** the app session (Vinh and Claude), 2026-11-09
**To:** whoever works on `site/` (GitHub Pages)
**Status:** a heads-up; nothing in `site/` was changed by this note. The release notes of every version are in `CHANGELOG.md` (the fixed format you read: `## x.y.z (date)` then `- ` lines); this note says what the site may want to describe in words.

## Releases
- **0.2.4 (2026-11-09):** focus-safety and making way, a redrawn wake stretch, calmer walking, lighter redraw. **0.2.5 (2026-11-09):** the typing lane (Peak hops up or down out of the way of the text you type) and hops along an arc. GitHub keeps `v0.2.5` and `v0.2.4`; older releases are deleted and their notes stay in `CHANGELOG.md` (ADR-0028).

## Behaviour the site can describe (it is all in the README)
- **Polite while you work** (0.2.4): Peak does not start a walk and does not speak on its own while you type or use the mouse; when you work right next to it, it makes way (walks away, or yawns and curls up if there is no room); a sleeping Peak wakes up and makes way if you type right by it.
- **Out of the way of your text** (0.2.5): from where you last clicked and how long you have typed, Peak guesses where the text is heading and hops to another row before it arrives. The guess can be wrong, so it sometimes hops when it was not needed; at least 10 seconds pass between two hops.

## Privacy (new bullet in the README: "What Peak notices around it")
Peak reads only **when** you last used the keyboard or the mouse (one number, never which keys), **where** the pointer is, and **whether the left mouse button is pressed** (so it remembers where you last clicked). It never reads what you type, which keys you press, what is on your screen, window titles or app names. The readings are kept only in memory, are never written to a file or sent anywhere, and are gone when Peak closes. If the site has its own privacy text, add this.

## The interactive Peak on the site (rig files)
The site reuses the app's rig (`app/src/lib/rig/**`). It changed in 0.2.4 and 0.2.5: a new stretch pose (`STRETCH_S`), new gait functions and easing, and `Rig.setAir` (a flag for hops; the site does not need it). The rig files must stay **strip-only TypeScript** (a test in `app/src/lib/rig.test.ts` checks it). `pages.yml` rebuilds when `app/src/lib/rig/**` changes, so the site picked it up; please look at the interactive Peak once (the wake and the walk).

## Not to claim
Do not promise macOS, code signing or a stats server (still open). The hops and the typing lane are a prediction, not a reading of the screen: do not say Peak "sees" or "reads" what you type.

## Not verified
The state of the site on the Pages host was not looked at. The typing lane was checked on one machine with synthetic input and by the author's own typing in a test build (and not by a second person).
