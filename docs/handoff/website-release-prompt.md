# Prompt for the website session, refilled at every release

**From:** the app session (Vinh and Claude)
**To:** whoever works on `site/` (GitHub Pages)
**Status:** a template (ADR-0033). At every release the app session fills in the version and what changed, and gives the author the text below to paste into the website session. This copy is filled for **0.4.0** (prepared 2026-11-12; ADR-0061: it is handed over **after** the release is published, as always; until then it is not to be pasted). The previous copies (0.2.5 to 0.3.2) were acted on by the website session: the structure of its ADR-0034 is built, the site follows 0.3.2 (ADR-0054), is short and gentle (ADR-0048, ADR-0053) and has a Stickers page.

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
