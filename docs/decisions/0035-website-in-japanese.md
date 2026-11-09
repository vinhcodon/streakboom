# ADR-0035: The website also exists in Japanese, and says plainly that the app does not

- **Status:** accepted (built and deployed 2026-11-09)
- **Date:** 2026-11-09
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
The author asked for a Japanese version of the website. The app itself is not in Japanese: its screens (`UI` in `app/src/lib/ui.ts`) and Peak's 182 built-in lines per language exist in English and Vietnamese only (`Lang` is `en | vi`). With an AI brain Peak answers in the language the user writes in (README), but that has not been tried in Japanese. The site is built from one source in three languages by `scripts/build-site.mjs` (ADR-0034).

## Decision
- **Add `/ja/` and `/ja/privacy/`**, built the same way as the English and Vietnamese pages (same sections, same facts, same JSON-LD and FAQ). `hreflang` now has `en`, `vi`, `ja` and `x-default` (English) on every page that exists in all three languages; the sitemap, `llms.txt` and the language links list them. The language switch is two plain links (the other two languages). The changelog and the 404 page stay English only; the Japanese pages link to the English changelog and say so.
- **Say what the app is not.** A visible note on every home page (under the status note), a new "At a glance" item and a new FAQ entry ("Is the app available in Japanese?") state that the app's screens and Peak's built-in lines are in English and Vietnamese, that with an AI brain Peak answers in the language you write in, and that this has not been tried in Japanese. Nothing promises a Japanese version.
- **Names of things in the app stay as the app shows them.** Because the app's screens are not in Japanese, the Japanese text gives the app's own words next to the Japanese ones where a person must find them: SmartScreen's "詳細情報 (More info)" and "実行 (Run anyway)", Settings, "Memory", "Copy stats", "Daily activity counts".
- **The build guards the translation:** every key English has must exist in Japanese (and Vietnamese), lists must have the same number of items, and placeholders (`{version}`, `{date}`, `{exe}`) must survive; the banned-claims list has Japanese patterns (100% free, hand-drawn, a macOS or code-signing promise). Dates are written `2026年11月9日`. Japanese gets a Japanese-capable font and looser lines (`site/style.css`).
- **The header's link row** moves under the brand below 1000 px and scrolls sideways (the Japanese labels are long and three languages need two language links).

## Alternatives considered
A Japanese page without the note that the app is not in Japanese (rejected: it would suggest more than exists); machine translation only (the text was written by Claude and has to be read by a native speaker, see Consequences); a Japanese share image (not now: `og-image.jpg` has English and Vietnamese text; the `og:locale` is `ja_JP`); a Japanese changelog (the notes are written in English by the app session).

## Consequences
- Three languages to keep in step: any new sentence on the site needs a Japanese version or the build fails.
- Not verified: the Japanese text was written by Claude and has not been read by a Japanese speaker (tone, terms such as 「頭脳」 for the AI brain, 「おやすみモード」 for Quiet mode); how Japanese search engines treat the pages; the share image has no Japanese text; whether the AI brains answer well in Japanese.

## Sources
ADR-0034, `site/strings.mjs`, `app/src/lib/ui.ts`, README (the languages of the pet and of the brain).
