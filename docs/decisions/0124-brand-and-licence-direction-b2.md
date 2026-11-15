# ADR-0124: The brand and the licence: the code stays MIT, the names and the logo are kept, every sticker is free under CC BY 4.0

- **Status:** accepted on 2026-11-15 (the author chose direction B2 and changed it in one point: **all stickers, the published ones and the future ones, stay free under CC BY 4.0**; forks rename only when they distribute). The texts are **drafts, none in force**: each is approved by the author before it is committed. Not legal advice; a lawyer has to confirm (ADR-0071).
- **Date:** 2026-11-15
- **Decided by:** Vinh (author), recorded by Claude (the app session) from the handoff `docs/handoff/licensing-and-brand-assets.md`

## Context
The author asked for direction B: keep the code open and keep a right to make goods of Peak. Three facts found on 2026-11-15 ([`docs/plans/brand-inventory.md`](../plans/brand-inventory.md)) shaped it:
1. **The stickers already published are under CC BY 4.0** (ADR-0051), which allows commercial use and cannot be taken back; the same files also sit in the MIT repository (`docs/plans/assets/stickers/set-v2/`), so they carry two licences.
2. **SignPath Foundation** asks for an OSI-approved licence for all components and no proprietary component; its published conditions say nothing about names or artwork. A cat carved out of MIT inside the installer would probably break the first condition.
3. The timing is set by ADR-0071 and ADR-0088 (the lawyer after the alpha, the SignPath application late).

## Decision
1. **The code stays MIT**, the whole repository, and so does the art of Peak that is part of the app (the rig, the app icons, the website's images).
2. **The names Streakboom and Peak (as the cat of Streakboom) and the logo are kept** by a trademark policy (draft: `docs/drafts/TRADEMARK.md`, English and Vietnamese).
3. **Every sticker is free under CC BY 4.0**, the published set and the stickers made later (the author's change to the proposal): free to use, share and adapt, also commercially, with credit to Streakboom. The repository gets a licence file in the stickers folder that says so (draft: `docs/drafts/STICKERS-LICENSE.md`), which ends the double statement. **The CC BY licence does not give any right in the names or the logo**: the trademark policy still applies (a sticker may be shared and sold with credit, but not presented as official, and the names and the logo are not to be used as the brand of another product).
4. **No separate terms for stickers and no separate place for them**: there is no `ASSETS.md`; new stickers live where the others do. **Fan art and stickers that people make from Peak** follow from CC BY (free, also commercially, with credit) and from the trademark policy (no official look, no names or logo as a brand).
5. **Forks are free to make and use; a fork that is distributed under a changed character or code must rename**, say it is not official, and not use the logo.
6. **Not decided and left open:** whether *designs for goods* that are not stickers (a shirt design, a poster) are also CC BY; the default until the author says otherwise: they are the author's own work, no licence given, and the trademark policy covers the names. The right to goods then rests on the names and the logo, **not on the art**: anyone may print the published stickers with credit.
7. **The text that changes** (each approved first): `TRADEMARK.md`, the licence file of the stickers, the README (the licence line and the art paragraph), CONTRIBUTING, `Cargo.toml` (`license = "MIT"`), and the website through its session (footer, sticker page, FAQ). SignPath is asked once, in writing, before the application.

## Options not taken
- **B1** (carve the character out of MIT with a non-commercial term): probably incompatible with SignPath and with ADR-0051.
- **B0** (only the trademark policy and a sticker licence file): taken in substance, with the trademark policy; spec/18 keeps the rest as proposed rules.
- **New stickers under separate terms** (the first proposal of this ADR): declined by the author in favour of CC BY for all stickers.

## Charter check
No article is touched; the privacy promises and the manners are unchanged.

## Consequences
- The author keeps **no exclusive right to the art of the stickers**: a seller with credit can print them on goods. What stays his is the name, the logo and the claim to be the official source. This was accepted by choosing CC BY for all.
- The draft terms of `ASSETS.md` are dropped; `STICKERS-LICENSE.md` replaces them.
- A lawyer is still needed for the trademark side (can the names be registered) and for the AI-assisted origin of the art (`docs/plans/peak-origin-and-lawyer-questions.md`).
