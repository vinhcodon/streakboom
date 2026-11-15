# ADR-0124: The brand and the licence: the code stays MIT, the names and logo are kept, new stickers and goods have their own terms (proposed)

- **Status:** **proposed on 2026-11-15, waiting for the author's choice** (the choices are in point 3). Not legal advice; a lawyer has to confirm (ADR-0071).
- **Date:** 2026-11-15
- **Decided by:** to be decided by Vinh (author); prepared by Claude (the app session) from the handoff `docs/handoff/licensing-and-brand-assets.md`

## Context
The author chose direction B: keep the code open and keep the right to make merch and commercial stickers of Peak. The handoff offers B1 (carve the character out of MIT) and B2 (keep MIT for the code and the art in the app, protect the names, the logo and new designs). Three facts found on 2026-11-15 ([`docs/plans/brand-inventory.md`](../plans/brand-inventory.md)) shape the choice:
1. **The stickers already published are under CC BY 4.0** (ADR-0051), which allows commercial use; this cannot be taken back. The same files also sit in the MIT repository (`docs/plans/assets/stickers/set-v2/`), so they carry two licences.
2. **SignPath Foundation** asks for an OSI-approved licence for all components and no proprietary component, and its published conditions say nothing about names or artwork. A cat carved out of MIT inside the installer (B1) probably breaks the first condition; B2 probably does not.
3. The timing is already set by ADR-0071 and ADR-0088 (the lawyer after the alpha, the SignPath application late).

## Options
1. **B2 (recommended):** the code and the art of the app stay MIT; the names and the logo get a trademark policy; the stickers already published stay CC BY 4.0 with a licence file that says so; **new** stickers and designs for goods get separate terms and live outside the MIT repository. Details: spec/18 (BL-1 to BL-8).
2. **B1:** the cat's art leaves MIT with a non-commercial term. Stronger for merch, probably incompatible with SignPath; would need their written answer first and a new licence for the app art.
3. **B0:** only the trademark policy and the sticker licence file; no new terms for merch. The least change; the right to merch rests on the names and the logo alone.

## Charter check
No article is touched: the privacy promises and the manners are unchanged (spec/18 BL-8).

## Consequences if B2 is chosen
Texts to change, each approved by the author before it is committed ([`docs/drafts/license-text-changes.md`](../drafts/license-text-changes.md)): the README (the licence line and the art paragraph), CONTRIBUTING, the website footer and the sticker page (through the website session), a `LICENSE` file in the stickers folder, `TRADEMARK.md`, `ASSETS.md`. A small gap to close at the same time: `Cargo.toml` has no `license` field. SignPath is asked once, in writing, before the application.
