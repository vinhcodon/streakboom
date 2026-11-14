# Prompt for the website session, refilled at every release

**From:** the app session (Vinh and Claude)
**To:** whoever works on `site/` (GitHub Pages)
**Status:** a template (ADR-0033). At every release the app session fills in the version and what changed, and gives the author the text below to paste into the website session. This copy was filled for **0.4.0** (published 2026-11-12, acted on by the website session: ADR-0062 to ADR-0064) and has a short **0.4.1** addition at its end (published 2026-11-12, a patch). The previous copies (0.2.5 to 0.3.2) were acted on by the website session: the structure of its ADR-0034 is built, the site follows 0.4.0 (ADR-0062; ADR-0063 and ADR-0064 are its research link and its right-click demo), is short and gentle (ADR-0048, ADR-0053) and has a Stickers page.

---

## The prompt (paste this)

You are the session that owns `site/` in the repository `vinhcodon/streakboom` (the website streakboom.com, served by GitHub Pages). The app session has just released **version 0.4.0**, "the alignment release": it removes what made Peak a character who needs you, and adds an adults-only statement and a few safety rules. Read `CHANGELOG.md` (the 0.4.0 entry), `docs/charter.md` (article 7 and the line "What Peak is for" changed), `docs/decisions/0056` to `0059`, and `spec/12-foundation-alignment.md`. The research behind it is `docs/foundation/` (you may link to the research, but do not quote figures from it as facts: most of it was read as abstracts).

**Where to work:** on `main`, after the release (it is merged and published; `git pull` first). Commit only `site/` and `scripts/site/` by explicit paths (ADR-0023, never `git add -A`). Push to `main` when your build passes; the push redeploys the site.

**The Pages build is red until you follow.** `node scripts/build-site.mjs` reads the README and checks the site against it; since the release it stops on the number of hand-written lines (the README says 263, the site says 267). The site that is online is the 0.3.2 one and stays so until your build passes (the author accepted this, ADR-0061). Please make it pass first (the number), then do the rest of section 1, and tell the author when it is green.

### 1. Bring the site in line with the app (do this now)
- **The number of lines:** the README now says `263 hand-written lines per language` (it said 267; the real pools held 272 and have 263 now). Change it in all three languages (`f1_p` and wherever else it is said); the build checks it.
- **The promise "it never guilts you and never dies" (`pr2`, three languages) says "if you stay away it only gets a little lonely": that is no longer true.** The README's sentence is now: "Your absence costs nothing: it sleeps while you are away and is glad when you are back." Please change `pr2` in English, Vietnamese and Japanese to say the same, and search the whole site, the structured data and `llms.txt` / `llms-full.txt` for "lonely", "miss", "streak", "chuỗi", "cô đơn", "さみしい", "連続" and for anything that says Peak has needs. The README's other promises are unchanged (the build still checks: "never reads what you type", "never dies or starves", "alive without any AI", "companion, not an assistant", "just under its feet", the memory range and the processor figures).
- **Adults only:** the README, the app's first tour card and the Brain page now say Streakboom is made for adults (18+). Say it once, plainly, where the download is (for example under the button and in the FAQ), in three languages. **Do not write "safe", "safe for everyone" or "adults only" as a promise** (a lawyer has not yet said what age check is enough; `docs/foundation/legal-questions.md`). "Made for adults (18+)" is the wording.
- **The mission (ADR-0057):** "a small friend who makes the workday lighter and leads you back to real life." You may use it as the one-line description (not as a promise and not as a health claim). **Never say** healing, therapy, "clinically proven", that Peak reduces anxiety, depression, ADHD or loneliness, or that it replaces friends or professionals. The audit now fails on those words in the README and the app's texts; please check `site/` the same way (`node scripts/audit-docs.mjs` also names the site files that contain them).
- **Behaviour that changed (describe as behaviour):** no streak and no counting of days; no "lonely" mood; a right click on Peak **pushes** it (a left click always pokes) and the pet has **no right-click menu** any more (Settings, Quiet mode, Quit and Show / Hide are in the tray icon's menu; a left click on the tray icon shows or hides Peak; a hidden Peak shows no bubble); three gentle lines that point toward a person or a window; Settings, About has a short "If you need help now" text. In chat, the locked part of the prompt now makes Peak answer a goodbye with one short line, drop the jokes and point to real people if you seem in danger, and be glad when you speak of friends. **Do not claim it detects a crisis:** it does not read your messages for that; it is a rule for how it answers.
- **Settings and FAQ:** the FAQ and any text that names "Longest streak", the pet's right-click menu, or "right-click me" for Settings must go (the intro line of the app now says "from the tray icon").
- **Numbers and claims:** no new measurement was made for 0.4.0 (the changes do not touch what costs processor time). Keep the 0.3.2 figures.
- **The author's name** is **Vinh Codon** (check `site/` once more).
- **Releases:** GitHub keeps the newest two (`v0.4.0`, `v0.3.2`) after the release; never link a version-specific file; the download button points at `releases/latest`.
- **The Stickers page** is yours and does not change in this release. A reminder: the sticker texts are replies ("sorry", "too much for me"), not needs; keep it so.

### 2. Propose the next improvements for search engines (SEO) and AI answer engines (GEO)
As at every release, review the structure of ADR-0034 and the short, gentle site of ADR-0048 against the new facts and **propose** (as multiple choice for the author, with the trade-offs; the author decides, and each choice gets an ADR). This time also propose: where the research page, if any, should live and how it is labelled (it is evidence, not a claim); and whether the charter page should carry the mission line.

### 3. Report back
Summarise what changed, list what you did not verify (the state on the Pages host, other browsers, a phone, a Japanese reader), and add any unchecked item to the website section of `docs/plans/verification-debt.md`.

---

## 0.10.0 (published 2026-11-14): one new thing to show, nothing to restructure
- **The Pages build:** the README changed its status line (v0.10.0); `docs/features.md` has a new bullet (it steps aside when asked) and a new row (double right-click, or type xê ra, move over, どいて); `CHANGELOG.md` has a new first entry whose first sentence is the short bold **"You can ask Peak to step aside."** (the home page shows it). The entry does not name Previews or test builds, as the build requires (ADR-0101).
- **What to say, if the site has a features list or an FAQ:** you can ask Peak to get out of the way by double right-clicking it or typing a short phrase; it walks away from the pointer and never leaves; in a light chat, "go away" is taken as a joke unless said three times; the date and part of the day are now right in the model's own lines. Nothing needs a new page. For SEO and answer engines (GEO): keep the short plain sentence "You can ask Peak to step aside" near the features, in the three languages.
- **Still not for the site:** Previews and test builds (ADR-0089, ADR-0095); `update-trace.log` and `leave-trace.log` need not be mentioned (local files, numbers only).
- **GitHub keeps the newest two Stable releases:** `v0.10.0` and `v0.8.1` (`v0.8.0` is deleted when 0.10.0 is published); Preview `v0.11.0` and `v0.9.8`.

## 0.8.1 (a fix, published 2026-11-14): nothing to change on the site
- **The Pages build:** the README changed only its status line (v0.8.1); `CHANGELOG.md` has a new first entry whose first sentence is the short bold **"Peak no longer vanishes in the middle of the screen when you send it away."** (the home page shows it). `tauri.conf.json` says 0.8.1, so the build's check that a release `v0.8.1` is published (ADR-0065) passes once it is.
- **Behaviour to know about:** none new to announce; the walk to the edge is faster and Peak stays if it cannot reach the edge. The new local file `leave-trace.log` holds only step names and numbers, is never sent, and need not be mentioned on the site. Previews and test builds stay unannounced (ADR-0089, ADR-0095, ADR-0101).
- **GitHub keeps the newest two Stable releases:** `v0.8.1` and `v0.8.0` (`v0.6.0` is deleted when 0.8.1 is published); Preview `v0.9.2` and `v0.9.1`.

## 0.8.0 (published 2026-11-14): one new thing to show, nothing to restructure
- **The Pages build:** the README changed its status line (v0.8.0) and `docs/features.md` has a new bullet and a new row (a skill: type lượn đi, go away or 消えて in the chat box and Peak leaves for 20 minutes); the first sentence of `CHANGELOG.md` is now the short bold **"You can send Peak away."** (the home page shows it). `tauri.conf.json` says 0.8.0, so the Pages build is red between the push of the version files and the publishing of the release, on purpose, as before.
- **What to say, if the site has a features list or an FAQ:** you can send Peak away by typing a plain command in the chat box (it needs a brain connected for the chat box), it leaves for 20 minutes and comes back at the same edge, or at once from the tray; it also keeps still and quiet in full-screen programs and presentations. Do not claim more: the model's reliability is not measured and two monitors, the three languages and the laptop lid are not reported as checked.
- **Still not for the site:** Previews and test builds (ADR-0089, ADR-0095): pre-releases, never the download or the changelog; the small link Test builds... in Settings is not announced.
- **GitHub keeps the newest two releases of each channel:** Stable `v0.8.0` and `v0.6.0` (`v0.4.2` is deleted when 0.8.0 is published); Preview `v0.9.0` and `v0.7.7`.

## 0.6.0 (the first Stable after two Preview builds, published 2026-11-13): nothing to change on the site
- **The Pages build:** the README only changed its status line (v0.6.0); `CHANGELOG.md` has a new first entry whose first sentence is the short bold **"Nothing you can see changes."** (the home page shows it); `tauri.conf.json` says 0.6.0, so the build's check that a release `v0.6.0` is published (ADR-0065) passes once it is. **Between the push of the version files and the publishing of the release, the Pages build is red on purpose** (the same accepted flow as before); the push of the update manifest that follows deploys it.
- **Behaviour to know about:** none visible. Two release channels now exist (ADR-0090, ADR-0093, spec 16): a Stable has an even middle number (this one), a Preview an odd one. **Previews are GitHub pre-releases and must never become the download, the version or the changelog on the site**; `releases/latest` skips them (tried on 2026-11-13). Their notes are in `CHANGELOG-preview.md`, which the site must not read. The note `website-preview-channel.md` has the details.
- **GitHub keeps the newest two releases of each channel:** Stable `v0.6.0` and `v0.4.2` (`v0.4.1` is deleted when 0.6.0 is published); Preview `v0.7.0` and `v0.5.1`.

## 0.4.2 (a small patch, published 2026-11-13): nothing to change on the site
- **The Pages build stays green:** the README only changed its status line (v0.4.2). The behaviour of the app is the same as 0.4.1; the installer now also installs `THIRD-PARTY-NOTICES.md` next to the program. It is the first release built by GitHub's CI (finished on the author's computer); it is still not code-signed, so the honest "Code signing policy" wording stays.
- **GitHub keeps the newest two releases:** `v0.4.2` and `v0.4.1` (`v0.4.0` is deleted when 0.4.2 is published).

## 0.4.1 (a patch, published 2026-11-12): what to check on the site, nothing urgent
- **The Pages build stays green:** the README keeps `263 hand-written lines per language`, "Your absence costs nothing" and the other phrases your build checks; only the status line (v0.4.1) and one sentence in the roadmap changed.
- **Behaviour to know about:** only one Peak runs at a time (a second start of the program no longer opens a second pet, and brings the running one back if it was hidden: ADR-0068); the tray icon menu follows the app's language; the app's Auto language reads the system's whole list of preferred languages, with a picker on the first card of the tour, and **never** uses the IP address or location (ADR-0066, which is the app side of your ADR-0067).
- **FAQ and download text:** if any text says that starting the program again opens a second Peak, or that the tray menu is English only, it is out of date.
- **GitHub keeps the newest two releases:** `v0.4.1` and `v0.4.0` (`v0.3.2` was deleted); the download button stays on `releases/latest`; your Pages check that the file is published (ADR-0065) should now see the 0.4.1 installer.

---

## Note of 2026-11-12: the README was restructured (no action unless a check fails)
The README is now short (about 110 lines) and written for developers; the detail moved to `docs/features.md`, `docs/privacy.md`, `docs/development.md`, `docs/releasing.md` and `docs/website.md` (ADR-0070), and `docs/PROJECT.md` is the entry point. **Every sentence your build checks is still in the README** (263 lines, the memory and processor figures, "just under its feet", the five promise phrases) and the build passes. Please: (1) if `llms.txt`, `llms-full.txt` or any page calls the README "the reference text for features, privacy and status", point at `docs/features.md`, `docs/privacy.md` and `docs/PROJECT.md` as well or instead; (2) the repository now has `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue forms and a CI workflow (tests, audit, your site build, on pull requests and by hand): a site page for contributors could link them; (3) `docs/website.md` is the former README section about the site: keep it true when your build changes (you own its content).
