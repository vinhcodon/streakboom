# ADR-0133: A Facebook Page for Streakboom and Peak

- **Status:** accepted on 2026-11-17. The author asked for the Page, created it, approved the cover and profile pictures ("Dùng được") and, having no preferences for the rest, asked Claude to choose ("bạn chọn giúp hết"); the choices below are those defaults and the author may reopen any of them.
- **Date:** 2026-11-17
- **Decided by:** Vinh (author) for the Page and the pictures; Claude (the app session) for the defaults

## Decision
1. **One Facebook Page, named Streakboom, category Software**, created by the author on 2026-11-17 (Page ID 1496647720191656, https://www.facebook.com/profile.php?id=61596355604714). Peak is its face: the profile picture is the app icon, the cover is Peak with the slogan. The readable name `@streakboom` was set by the author on the same day (https://www.facebook.com/streakboom).
2. **The voice is the charter and the slogan of ADR-0104**, in Vietnamese first with English beside it (the Japanese is left out until a native speaker has read it). No health claim, no character that needs the person, no claim that Peak reads or understands content; the same word lists as the website. The About text says the app is for adults (18+).
3. **The first five posts** are in `docs/plans/facebook-launch-posts.md`: an introduction, what Peak does not do, privacy in plain words, the stickers, and the optional chat. About two or three posts a week to begin with; one picture or a clip under 10 seconds each.
4. **Links go in the first comment**, and the first post says plainly that the installer is not code-signed yet and Windows SmartScreen will warn (README, Code signing policy).
5. **The author alone runs the Page and answers messages and comments, in two or three days, with no automatic reply.** No paid promotion (boost or ads) for now; if the author wants it, that is a new decision with its own limits.
6. **The Page counts for nothing inside the app.** No code, no new sense, no telemetry; the only measurement is the short links and the public numbers of the Page itself.

## Why
A Vietnamese-speaking audience is on Facebook and Zalo, and the stickers (ADR-0051) already need a place that people can see and share. A Page is free, the author keeps the account, and nothing in the app changes (charter: the Page may not become a reason for Peak to need the person).

## Rejected
- **Posting for the author through an automated tool.** The edit dialogs of Facebook did not open in an automated session, and automation can get the account limited; the author uploads and posts.
- **A Facebook group** instead of a Page: a group needs a moderator every day.
- **Several channels at once.** One channel first; the number of downloads that come from it is the test (see `docs/plans/backlog.md`, E33).

## Consequences
- The website gets a link to the Page and `sameAs` in its structured data: a handoff note, `docs/handoff/website-facebook-page.md`; the app session does not edit `site/`.
- The share preview of the website on Facebook (W-3) can now be looked at in the Sharing Debugger.
- **Not verified:** the pictures as Facebook shows them (desktop and phone crops), the posts read by the author, the Page as seen by a visitor who is not signed in, whether the sticker page copies on a phone. Each is in `docs/plans/verification-debt.md` (V-169, V-170).
