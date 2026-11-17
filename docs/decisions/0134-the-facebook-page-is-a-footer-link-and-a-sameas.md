# ADR-0134: The Facebook Page is a footer link and a sameAs, nothing more

- **Status:** accepted (the author chose the placement from a multiple choice on 2026-11-17); **built, not published**
- **Date:** 2026-11-17
- **Decided by:** Vinh (author)
- **Follows** ADR-0133 of the app session (the Page exists; its handoff to the website session is `website-facebook-page.md`)

## Context
The author created a Facebook Page for Streakboom and Peak, at `https://www.facebook.com/streakboom` (the form with the username; the old `profile.php?id=...` address is not used). The app session asked the website to link it, without any Facebook script, button or counter (the privacy page says nothing is sent to anyone).

## Decision
1. **One link named "Facebook" in the footer of every page** (home, how it works, stickers, story, privacy, changelog; three languages with the same name), right after GitHub, a plain link like the others. The author chose this over a separate line near the download. The 404 page has no such link.
2. **`sameAs`** of the SoftwareApplication data of the three home pages is `[GitHub repository, Facebook Page]`. The author's own `sameAs` stays his GitHub profile: the Page is the project's, not his.
3. **Nothing of Facebook runs:** no script, pixel, like button, widget or counter, and nothing about followers or likes. The build refuses the link in any other form (the `profile.php` address, a second link, another label), a Facebook script or pixel or like button, and a missing `sameAs`; the existing rule against third-party scripts still holds.

## Consequences
- The privacy page does not change: a link makes no request until a visitor follows it.
- **Not verified:** the share preview on Facebook (W-3: the title, description and `og-image.jpg`, never looked at). After this is published the author pastes the home page and a sticker page into the Sharing Debugger (developers.facebook.com/tools/debug) and presses Scrape Again; it needs his Facebook login, which the website session does not have.
