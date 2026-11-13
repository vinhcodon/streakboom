# To the website session: Preview releases exist soon, and must never become the download

**From:** the app session (Vinh and Claude)
**To:** the session working on `site/`
**Date:** 2026-11-13
**Status:** a heads-up, **not tied to a release**; nothing is built yet (plan: [`../plans/preview-channel-plan.md`](../plans/preview-channel-plan.md); decision: ADR-0090, with ADR-0089).

## What is coming
Two channels. **Stable** is what the site shows today (an even middle number: 0.4.x, 0.6.x). **Preview** is a build the author hands to a few adults (an odd middle number: 0.5.x, 0.7.x). Previews are published on GitHub as **pre-releases** and update inside the app through `updates/preview.json`.

## What to look at (nothing to change now)
1. **The download button and the release check (ADR-0065)** must read only the Stable release: `releases/latest` skips pre-releases by GitHub's rule (not verified by the app session; please check it on the day). The "there is no published release v<version>" check must not fail because a pre-release exists, and must not pass because one does.
2. **The version shown on the site and the changelog** come from `CHANGELOG.md` and `tauri.conf.json` on `main`. They will keep saying the last Stable version: the Preview version is written only in the CI build folder. Preview notes are in `CHANGELOG-preview.md`, which the site must **not** read.
3. **No page, sitemap entry or `llms.txt` line** should name a Preview, unless the author later asks for one.

## Report back
Only if something in the build would break; add anything unchecked to the website section of `docs/plans/verification-debt.md`.
