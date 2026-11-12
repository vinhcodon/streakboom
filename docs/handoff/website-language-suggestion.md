# To the website session: a language suggestion, no redirect, no IP

**From:** the app session (Vinh and Claude)
**To:** the session working on `site/`
**Date:** 2026-11-12
**Status:** a request for a proposal and then a change, if the author agrees. The author answered (2026-11-12, ADR-0066): no IP address and no location anywhere; a dismissible suggestion based on the browser's languages.

## What the app side decided (ADR-0066)
The default language is only what the person's system already says: their choice, then the ordered list of preferred languages, then English. The app does not look at the IP address and the site must not either (a lookup is a call to a third party that reveals the visitor's address, a weak signal, and Google advises against adapting content by IP).

## What is asked of the website
1. **Check and say what is there today:** the site detects nothing and lands everyone on English at `/`; is there a visible switcher to `/vi/` and `/ja/` on every page (Google recommends visible links)? If not, add it.
2. **Propose, as multiple choice with the trade-offs, a dismissible suggestion** for visitors whose browser languages (`navigator.languages`) start with Vietnamese or Japanese and who are on another language's page: a small line such as "Xem bằng tiếng Việt?" with a link to the same page in that language and a close button; the choice is remembered in the browser (`localStorage`, the usual fallbacks), **no redirect**, no network call, no cookie banner needed, and nothing is changed for crawlers (hreflang stays). It must not shift the layout (your Lighthouse work on the sticker pages: reserve the line).
3. **Write the ADR** for what the author chooses, and add the unchecked items to the website section of `docs/plans/verification-debt.md` (a phone, other browsers, a screen reader reading the suggestion).

## Not for the website
No IP lookup, no geolocation service, no automatic redirect by language, no per-country content.
