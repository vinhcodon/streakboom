# 18. Brand and licensing (draft, not decided)

**Status:** a draft written 2026-11-15 from the handoff `docs/handoff/licensing-and-brand-assets.md`; the direction is proposed in ADR-0124 and **waits for the author's choice**. Nothing here changes `LICENSE`, the README, CONTRIBUTING or the website until the author approves each text. **Not legal advice; a lawyer has to confirm** (ADR-0071: the lawyer comes after the alpha).

## 1. What this spec is for
To say, in one place, what is free to take and what is kept, so that the people who use, fork or write about Streakboom know the rules and the author keeps the right to make stickers and goods of Peak. The facts are in [`docs/plans/brand-inventory.md`](../docs/plans/brand-inventory.md).

## 2. The proposed rules (direction B2, ADR-0124)
| ID | Rule |
|---|---|
| BL-1 | **The code stays MIT**, the whole repository as today, and so does the art of Peak that is part of the app (the rig, the app icons, the images the website uses). The licence of past releases is not changed. |
| BL-2 | **The names Streakboom and Peak (as the cat of Streakboom) and the logo are kept** by a trademark policy (`TRADEMARK.md`): anyone may name them to describe, review, write about or link to the project, and may fork the code; a fork that is changed must not use the names or the logo, and nothing may suggest an official product. |
| BL-3 | **The stickers already published stay CC BY 4.0** (ADR-0051: free to use and share, also commercially, with credit). The repository gets a licence file in the stickers folder that says so, to remove the double statement (MIT through the repository, CC BY 4.0 on the website). |
| BL-4 | **New stickers and the designs for goods** (clothing, accessories, prints) are made under separate terms (`ASSETS.md`): free to share in chats, on social media and in articles with credit; not to be printed on products, sold, put in another pack or content library, or used to train a model, without the author's permission. They are kept **outside the MIT repository** (a separate folder with its own `LICENSE`, or a separate repository). |
| BL-5 | **The date matters:** the new terms apply from the day they are published. What was published before is as it was (MIT for the code and the art in the app, CC BY 4.0 for the stickers). Every text says the date. |
| BL-6 | **Contributions:** the code is welcome under MIT as now. New art for the character is not taken without a separate agreement. |
| BL-7 | **Forks:** a fork may keep the app art (it is MIT) but not the names or the logo, and must say it is not official. |
| BL-8 | **Nothing in the privacy promises or the charter changes.** |

## 3. What the code signing programme asks
The conditions of SignPath Foundation (read 2026-11-15): an OSI-approved licence without commercial dual licensing for all components, and no proprietary component. A trademark policy is not a licence on a component, so B2 should fit; carving the cat's art out of MIT inside the installer (B1) probably would not. **To be confirmed with SignPath in writing** before the application (ADR-0088 puts it late in the plan).

## 4. Open choices (for the author)
Which option (B1, B2, or only the trademark policy); whether to change the sticker licence from CC BY 4.0 for new stickers; where the new stickers and merch designs live; how far fan art and user-made stickers may go; whether a changed fork must rename always or only when distributed. See ADR-0124.

## 5. Not decided and not checked
Trademark registrations and their availability, the copyright position of art made with an AI's help, and the wording of the terms: for a lawyer (`docs/plans/peak-origin-and-lawyer-questions.md`).
