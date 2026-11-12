# ADR-0066: The default language comes from what the person has already told their system, never from the IP address

- **Status:** accepted (answered by the author on 2026-11-12); the app part is built on `main` and not released (0.4.1); the website part is a request to the website session
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the app session)

## Context
The author asked whether the default language of the app and of the website follows the system, and whether the language of the machine and the location given by the IP address should count as well.
- **The app** (checked 2026-11-12): the setting is "Auto" by default; it read only the first language of the system (`navigator.language`): Vietnamese for `vi`, Japanese for `ja`, English for everything else. Settings has Auto, Vietnamese, English and Japanese.
- **The website:** three static pages per kind (`/`, `/vi/`, `/ja/`) with hreflang and an English `x-default`. It detects nothing; everyone lands on English unless they choose.
- **An IP lookup** needs a call to a third party from the person's machine or browser, which tells that party the person's address; the app sends nothing anywhere unless the person turns something on (ADR-0031); and ADR-0059 already decided that the app does not guess the country (the help text follows the language, not the country). Location is also a poor stand-in for language (a VPN, a trip, a Vietnamese reader living in Japan or the United States). Google's guidance for sites in several languages says not to adapt content by IP, to avoid automatic redirects between language versions (its crawler comes from the United States with no language header, so it would not see the other versions), and to use separate URLs, hreflang and visible links to switch (opened 2026-11-12).

## Decision
1. **No IP address and no location, in the app and on the website.** The sources of the default language are only: the person's own choice, then what their system or browser already says (its ordered list of preferred languages), then English.
2. **App:** the language is the person's choice in Settings; else the **first language of the system's ordered list of preferred languages** that the app has (Vietnamese, Japanese, English), else English (`resolveLang`, now given `navigator.languages`). A language the app lacks is skipped (a list `fr, vi` gives Vietnamese); an English first still gives English, because the person put it first. **The first card of the tour has a picker** (Tiếng Việt, English, 日本語), each in its own name, so that a wrong guess is fixed at once; choosing stores the language as an explicit choice, like Settings.
3. **Website (a request, the website session decides and writes the ADR):** no redirect. Keep separate URLs and hreflang. Add a visible switcher on every page if it is not there, and a **dismissible suggestion** ("Xem bằng tiếng Việt?") based only on the browser's `navigator.languages`, remembered in the browser, with no call to any service. `docs/handoff/website-language-suggestion.md`.

## Alternatives considered
IP geolocation as a hint on the web only (a call to a third party and a line in the privacy page, a weaker signal than the browser language); the same in the app (rejected for the reasons above); only the improved list without a picker (smaller, but a wrong guess is found only in Settings); no change.

## Consequences and when to revisit
A person whose list starts with English but who reads Vietnamese sees English until they use the picker or Settings; that is what their system says. Not checked: which Windows setting `navigator.languages` of WebView2 follows (the display language or the list of preferred languages). The installer is English only (`displayLanguageSelector: false`); whether the installer can be offered in Vietnamese and Japanese was not looked into. Revisit if the first-run picker is mostly changed (the guess is poor) or never used.

## Sources
`app/src/lib/selector.ts` (`resolveLang`), `app/src/routes/settings/+page.svelte`, `site/` and `scripts/site/pages.mjs` (hreflang); Google Search Central, "Managing multi-regional and multilingual sites"; ADR-0031, ADR-0059.
