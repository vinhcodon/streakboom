# ADR-0051: The stickers go on the website first, as images, under CC BY 4.0

- **Status:** accepted (answered by the author on 2026-11-11); the page is not built yet (the website session builds it from `docs/handoff/website-stickers.md`)
- **Date:** 2026-11-11
- **Decided by:** Vinh (author), with Claude

## Context
The author wants to publish the 20 stickers on the website so that people can use them in their chats at once, and does **not** want to submit anything to Zalo, Telegram or any store for now. Zalo's registration page offers no way for a user to add a set that is not in its store (see `docs/plans/sticker-test.md`); a Telegram pack could be made without the author submitting to a store (Telegram's page says nothing about review) but needs the author's account and a side of exactly 512 px.

## Decision
1. **A gallery page on the website** where **the sticker itself is the button: tap or click to copy it** (no separate copy icon; the author dislikes the usual one), with a small paw-print confirmation. **On a phone that supports it, a Share action** opens the system share sheet. **No per-sticker Download and no ZIP** (the author, 2026-11-11). The stickers travel as **images, not as store stickers**, and the page says so.
2. **The website session builds it** from a handoff (`docs/handoff/website-stickers.md`); the app session does not edit the site.
3. **Licence: CC BY 4.0** (free to use and share, also commercially, with credit to Streakboom).
4. **No submission** to Zalo, Telegram or LINE for now; a Telegram pack stays an option for later.
5. **Privacy as in the app:** no cookies, no per-person counting; the effect on installs is counted in aggregate (the website session proposes how). *(Superseded for the website by ADR-0096, 2026-11-14: the app's rule is the app's only; the site may carry the tools the author approves.)*

## Alternatives considered
A Telegram sticker pack as well (later); a ZIP download only, or Share and Download buttons (the author chose Copy only, to keep the page simple); a static demo page built by the app session (declined: the website has its own session); a custom licence of free personal use without resale (declined in favour of CC BY).

## Consequences
- **CC BY is hard to take back:** anyone may reuse, remix and sell the artwork with credit. The author keeps the copyright and may still submit his own set to Zalo or LINE later, but cannot stop others from reusing what was published. Zalo's terms ask the submitter to be the owner of the set; that stays true.
- The plan's route changes: the web page is the first channel (it replaces the Zalo review as the start of the run); the thresholds stay (20 installs in 4 to 6 weeks) but the clock starts when the page goes live, to be confirmed by the author.
- The text font (Be Vietnam Pro, SIL OFL) allows this use.
- Revisit after the run, and if the licence causes trouble.
