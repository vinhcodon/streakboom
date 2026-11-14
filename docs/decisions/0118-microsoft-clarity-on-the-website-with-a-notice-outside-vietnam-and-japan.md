# ADR-0118: Microsoft Clarity on the website, with a notice outside Vietnam and Japan

- **Status:** accepted (Vinh named Clarity and chose the two points below on 2026-11-15); **built; the author gave the project id on 2026-11-15 and it is in the build (switched on); not published until he says so**
- **Date:** 2026-11-15
- **Decided by:** Vinh (author)
- **Builds on** ADR-0096 (decisions 2, 4 and 8: each tool is approved by the author and listed; the first tool that sets a cookie brings the consent notice; the build and the live check refuse what the words do not say)

## Context
The author set up Microsoft Clarity for streakboom.com. Clarity records how pages are used (clicks, scrolling, mouse movement) as replays and heat maps, sets cookies (`_clck`, `_clsk`) and sends what it records to Microsoft. It is the first tool of the site that sets a cookie, so ADR-0096 decision 4 applies: a notice of the site's own for visitors outside Vietnam and Japan, before the tool runs for them.

## Decision
1. **The switch** is `clarity.projectId` in `scripts/site/catalog/measurement.json`; empty means off (no loader, no notice, no word of Clarity on any page). With an id, the build puts one inline loader at the end of every page.
2. **Who is asked (the author's choice):** a visitor whose **time zone** is Asia/Ho_Chi_Minh, Asia/Saigon or Asia/Tokyo gets Clarity at once; every other visitor, and a visitor whose zone is unknown, sees a quiet first-party bar (a sentence, **Accept**, **No thanks**) and Clarity loads only after Accept. The language of the browser is **not** used to place a visitor (a Vietnamese-speaking visitor in Europe is asked). No third-party consent script.
3. **Always respected:** Do Not Track and Global Privacy Control (nothing loads, nothing is asked), an earlier **No thanks** (kept everywhere, also in Vietnam and Japan), an earlier Accept. The answer is kept in the visitor's own local storage under `streakboom-clarity` and goes nowhere. Where storage is blocked a visitor outside Vietnam and Japan is asked on every page and nothing is remembered.
4. **All pages carry it (the author's choice), with Clarity's masking set to Strict by the author in the Clarity dashboard.** The search box of the sticker pages also has `data-clarity-mask="True"`, so what a visitor types there is hidden from a recording even if the dashboard setting is lowered.
5. **The words follow the build:** the privacy paragraph "This website" says that the site sets no cookies **of its own**, names Clarity, what it records, its cookies, that it sends to Microsoft, who it runs for and the signals that stop it; the sticker note says that clicks and mouse movement may be recorded and that the search text is hidden. All in three languages (the Vietnamese and Japanese are AI-written, no native reader).
6. **The guards:** the build refuses a loader with another id or any other address, two loaders, a missing loader, any use of `fetch`, cookies or more local storage than the visitor's answer, the notice in the static HTML (crawlers must not see it), and any trace of Clarity or its words while the switch is off. `livecheck.mjs` reads the live pages after each deploy and fails when the loader is not there while the switch is on, or is there while it is off.

## Consequences
- The visit count of Cloudflare Web Analytics stays; Clarity adds the behaviour of visitors (where they click, how far they scroll), so the two overlap for visit counts.
- To switch on, the author puts the project id (the last part of the address of the tag Clarity gives, 8 to 12 lower-case letters and digits) in `measurement.json`; the id is public, not a secret. Not before the masking is set to Strict.
- The legal reading (consent rules in the EU and the UK, the rules in Vietnam and Japan, Microsoft's terms for Clarity) was **not** checked with a lawyer; a time zone is a rough way to place a visitor, not proof of where they are.
- **Not verified:** that Clarity works with this loader on the live site (no project id yet); that the masking hides the text as the words say (the dashboard setting is the author's); that Clarity sets only `_clck` and `_clsk`; how the bar looks on a phone; the Vietnamese and Japanese words.
