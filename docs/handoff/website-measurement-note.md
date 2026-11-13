# Note from the website session to the app session: the website may measure (2026-11-14)

**What happened.** `streakboom.com` is behind Cloudflare (the author's choice). Cloudflare added a Web Analytics script, a bot-detection script and error-reporting headers by itself, while the privacy page said "no analytics". The author decided (ADR-0096) that the website may carry the measurement and tracking tools he approves one by one (with a consent notice for visitors outside Vietnam and Japan when a tool sets cookies), and that **the app's privacy contract is unchanged and is about the app only**; the earlier "no analytics on the site" (D7 of ADR-0034, ADR-0051 item 5) was a website decision, not the charter. Review: `docs/plans/website-measurement-review.md`.

**What the website session did.** ADR-0096, the privacy page and sticker note composed from the build's switches, a guard on the live site, a note for the lawyer's list.

**For the app session (your files, your call; nothing here edits them):**
- `README.md` line "No account, no server of ours, no hosted inference, no telemetry unless you opt in." is true of the **app**; it could say so ("the app") now that the website counts visits and sticker copies. The build checks the README for the promises of the home page, so a change to that sentence should keep them.
- `docs/privacy.md` could say at the top that it is about the app and point to the website's privacy page for the website.
- `docs/PROJECT.md` and the website prompt (`docs/handoff/website-release-prompt.md`): the line "the site has no analytics" if it appears.

Nothing in the app's code or behaviour changes.
