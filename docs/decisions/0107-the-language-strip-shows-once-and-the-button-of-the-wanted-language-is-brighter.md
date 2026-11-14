# ADR-0107: The language strip shows once, and the button of the wanted language is a little brighter

- **Status:** accepted (Vinh chose "Chỉ một lần, mỏng hơn, nút nổi nhẹ" on 2026-11-14); **built**
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), after saying that the strip "always appears" and looks out of place
- **Amends** ADR-0067 (decisions 1 and 3)

## Context
ADR-0067 shows a strip above the header whenever the first language the browser asks for is not the page's, and only a click on the close button or on the link makes it go away. For a visitor whose browser is English and who reads a Vietnamese page it is on every page, and in a private window it comes back after being closed. It is a full-width coloured band on every page: that asks for attention, which the charter keeps for the person (article 2), and it repeats the language buttons the header always has.

## Decision
1. **The strip shows once per browser and language.** The language is written to the same local list as soon as the strip is **shown**, not when it is closed or followed: the next page and the next visit show nothing. Nothing else changes: the same rule picks the language, no redirect, no request, no cookie, no IP, no location. Where the storage is blocked (a private window) the strip may still show on each page: nothing is stored, nothing can be remembered.
2. **It is thinner and quieter:** smaller text, no coloured background (a hairline below), a plain link, a close button of 36 px (it was 40).
3. **The header button of the wanted language is a little brighter on every page** (a soft tint of the gold), whether or not the strip has been shown: the script puts `data-want` on `<html>` and the style does the rest. A visitor who missed the strip still finds the way, and a visitor whose browser is already in the page language sees nothing different.
4. **Not done, on purpose:** the strip does not carry other information (news, facts about Peak, a counter). It is on every page, so anything put there would be a permanent pull on the eye, the site does not know anything about the person's own Peak (it senses locally and sends nothing), and the playful words already have places that are not everywhere (the tagline of the home page).

## Consequences
- The text of the privacy page about this ("the language suggestion ... stays in this browser only") stays true: the same key keeps the languages already shown.
- The tests run the script against a fake page: it shows once, the second page with the same storage shows nothing, the button of the wanted language is marked even after the strip was shown, a damaged list is ignored, blocked storage does not throw.
- **Not verified:** how it looks and feels on a real phone and in Safari; the tint of the button against the gold border in the dark theme; that a visitor who sees the strip once and ignores it finds the button (the tint is soft).
