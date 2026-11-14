# ADR-0110: The story behind Peak is a page of its own, in three languages

- **Status:** accepted (Vinh answered the questions of the proposal on 2026-11-14); **built on a branch, not published** (the author sees it first)
- **Date:** 2026-11-14
- **Decided by:** Vinh (author)
- **Source:** `docs/handoff/website-story-behind.md` (the text of sections 7 and 8, approved by the author)

## Context
The app session handed over the story of why Peak exists, in Vietnamese and English, to be put on streakboom.com word for word. The site has a mechanism for pages in every language (parallel pages, hreflang, the header buttons, the language suggestion), and a main menu that fits four items from 360 px.

## Decision
1. **Addresses:** `/story/` (English), `/vi/story/`, `/ja/story/`; one sitemap entry each, with `hreflang` and `x-default`; a line in `llms.txt`. The menu is **How it works, Privacy, Stickers, Story**: **Install is removed from the menu** (the home page keeps its download button, the logo leads home) and **Install joins the footer** (it is the same link, `#install` on the home page of the language), so a page other than the home page still has a way to the download.
2. **Text:** the Vietnamese and the English are the author's words, character for character (a script compared the built pages with sections 7 and 8 of the handoff: no difference). Nothing is added: no introduction, no call to action, no figure, no buttons under the text.
3. **Japanese:** an AI translation, close to the sense, labels `彼：` and `わたし：`; the title is `Peak誕生の物語`. It has **no native reader** (like the other Japanese texts of the site) and is listed in `verification-debt.md`.
4. **Two voices:** the author's voice is plain text under the name `Vinh Codon`; Peak's voice is a soft block (the colour of the cards, a gold edge, the small Peak logo, static) under the name `Peak`. The scene line is its own italic line. The dialogue is a blockquote with its labels (`Anh ấy:` / `Tôi:`, `Him:` / `Me:`, `彼：` / `わたし：`). No script, no motion; the colours come from the same variables as the rest of the site, so the dark theme follows.
5. **Page title, description and Open Graph** are its own, in each language; the share picture is the site's. The language suggestion applies (same-page translation).
6. **Not done, on purpose:** the lines of Peak in the article are **not** changed to match the app, and the app is not touched (see the note `docs/handoff/website-story-behind-report.md`: they differ, and the author decides which side changes).

## Consequences
- The build checks the language suggestion on the three pages and the tests (`checks.test.mjs`) fix the structure: five voices, two of them Peak, the dialogue as a blockquote with its labels, four menu items with Story last, Install in the footer and not in the menu, no script of the site.
- The string `nav_install` is now used by the footer only.
- **Not verified:** a real phone and Safari; a screen reader; a native reader for the Japanese; that search engines index the page (nothing in the site stops them: `robots.txt` allows all, the page is in the sitemap, there is no `noindex`, the canonical is its own address; the reason the site is not indexed is not known and is not decided here).
