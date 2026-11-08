# To the website session: update the Pages site for the first official release (0.2.0)

**From:** the app session (Vinh and Claude), 2026-11-08
**To:** whoever works on `site/` (GitHub Pages, `.github/workflows/pages.yml`)
**Status:** a reminder; nothing in `site/` was changed by this note. Please read the README and `docs/decisions/0026-first-official-release-0-2-0.md` first.

## Update 2026-11-08 (later): version 0.2.1 and the one-release policy
- The current version is **0.2.1** (a small fix: fact-noting no longer uses up the daily chat limit; the pet's "enough for today" line is in character). Use 0.2.1 where this note says 0.2.0; the status wording becomes "First official release line (v0.2.1)" or simply the current version.
- **GitHub keeps only the latest release** (ADR-0028). `v0.2.0` is deleted too. The notes of every version are in **`CHANGELOG.md`** at the repository root (raw: `https://raw.githubusercontent.com/vinhcodon/streakboom/main/CHANGELOG.md`).
- So the site's "updates" section (`site/app.js` reads `releases?per_page=5`) will always show one release. Better: build it from `CHANGELOG.md` (fetch the raw file, show the newest few entries, keep working if the fetch fails) and keep the download button on `releases/latest`.
- Everything else below still applies.

## What changed
1. **Streakboom 0.2.0 is the first official release.** The 0.1.x builds were development builds. All 17 old GitHub releases and tags (v0.1.0 to v0.1.16) were deleted; only the latest release remains in Releases (v0.2.0 at the time of writing, now v0.2.1) (the git history is kept).
2. **Old links are dead.** Any link to `releases/tag/v0.1.x` or `releases/download/v0.1.x/...` returns 404. Only use `.../releases/latest` and the browser_download_url of the latest release.
3. The app icon is now Peak's face (`assets/peak-icon-1024.png`).

## Things on the site to check and update
- **Status wording.** `site/i18n.js` `alpha_note` says "Closed alpha, Windows 10/11 only...". Replace with the first official release wording used in the README: "First official release (v0.2.0), Windows 10/11 only. The installer is not code-signed yet, so SmartScreen will warn: More info, then Run anyway." Keep the limits visible: the Claude and OpenAI brains have not yet been tried with real keys (Gemini has).
- **Release list.** `site/app.js` reads `releases?per_page=5` from the GitHub API: with one release the "updates" section must still look right (no empty state, no "load more"), and it must survive an API failure (GitHub's download paths and sometimes the API answered 504 or 500 on 2026-11-08).
- **Download button and install step.** The file name is now `Streakboom_0.2.0_x64-setup.exe` (the `s1` text uses `<version>`; check it). The button must point to the latest release.
- **What it does.** Bring the feature text in line with the README (it was rewritten): a pet that is alive with no AI; gestures including the belly rub (usually liked, sometimes a trap); eyes that follow the cursor over the pet; memory the user controls (name, what to call you, a usual part of the day, short facts, all editable and deletable in Settings, Memory); three optional brains, bring your own key (Gemini free tier; Claude and OpenAI paid, and a Claude Pro/Team or ChatGPT Plus subscription does not include API access); each answer carries a feeling the pet acts out; answers in the language you write in; polite behavior (quiet in fullscreen, quiet hours, Quiet mode); updates (install automatically, ask first (default), or never check) and start with Windows (off by default).
- **Privacy.** The README's privacy section is the reference. Facts to carry: keys stay in the Windows Credential Manager; what the pet noted from chats is sent to the brain you use with later chats; usage stats are opt-in, nothing is sent automatically, "Copy stats" is a manual export; a second switch adds a few per-day counts (scratches, rubs, pokes, messages sent, lines the pet said and you reacted to, minutes running, times Quiet mode was switched on), never any text.
- **Updates FAQ (`q5`/`a5`).** Install modes as above; the app reads its update manifest from the repository first and from the release second; copies older than 0.2.0 that cannot update need one manual install.
- **Peak and credits.** Peak is the character's name; each person can name their own pet. The art credit in the README (the "mochi cat" direction chosen from concept sketches proposed by Claude, the rig written with Claude's help, no image files, MIT license) should match on the site; do not claim hand-drawn or fully AI-generated.
- **Roadmap and claims.** Do not promise a macOS version, code signing or a stats server: they are open items. Do not claim "100% free": the app is free, the AI brains are billed by the provider (Gemini has a free tier).
- **Build trigger.** `pages.yml` rebuilds the site when `site/**`, `app/src/lib/rig/**` or `scripts/build-site.mjs` change, because the interactive Peak reuses the app's rig. The rig has not changed in 0.2.0; a content-only change needs no rig change.

## Not verified
The state of the site on the Pages host was not looked at; this list comes from reading `site/index.html`, `site/app.js` and `site/i18n.js` without editing them.
