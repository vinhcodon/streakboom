# Handoff for the website session: the Facebook Page

Written 2026-11-17 by the app session for the website session (`site/` and `scripts/site/` are yours; the app session does not touch them). Decision record: [`../decisions/0133-a-facebook-page-for-streakboom-and-peak.md`](../decisions/0133-a-facebook-page-for-streakboom-and-peak.md).

## What happened
The author created a Facebook Page for Streakboom and Peak on 2026-11-17.

- Page: https://www.facebook.com/profile.php?id=61596355604714 (Page ID 1496647720191656).
- A readable address (`https://www.facebook.com/streakboom`) does **not** exist yet. When the author claims it, he will say so; until then use the address above.

## What to do (the author decides the details with you)
1. **A link to the Page** in the footer or the "where to find us" place, in the three languages, with a name that is the same in all of them ("Facebook"). Open it in the same way as the other outside links. Nothing about followers, likes or counts on the site.
2. **`sameAs`** in the Organization or SoftwareApplication structured data, with the Page address, next to the GitHub address already there. Keep it to addresses that exist and that the author owns.
3. **Do not** add a Facebook script, a like button, a pixel or any widget: the privacy page says nothing is sent to anyone and the build checks that the site has no third-party requests.
4. **Share preview (W-3):** the title, description and `og-image.jpg` have never been looked at on Facebook. After the next publish, paste the home page and a sticker page into the Sharing Debugger (developers.facebook.com/tools/debug) and press Scrape Again; report what you see.

## For the audit
The Page is not a claim of the product, so no spec changes. The words on the Page follow the charter (no health claim, no character that needs the person); the posts are in `../plans/facebook-launch-posts.md`.
