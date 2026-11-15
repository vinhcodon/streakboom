# 18. Brand and licensing (direction chosen, texts are drafts)

**Status:** written 2026-11-15 from the handoff `docs/handoff/licensing-and-brand-assets.md`; the direction was chosen on 2026-11-15 in ADR-0125 (B2, with every sticker CC BY 4.0); the texts are drafts and each needs the author's approval. Nothing here changes `LICENSE`, the README, CONTRIBUTING or the website until the author approves each text. **Not legal advice; a lawyer has to confirm** (ADR-0071: the lawyer comes after the alpha).

## 1. What this spec is for
To say, in one place, what is free to take and what is kept, so that the people who use, fork or write about Streakboom know the rules and the author keeps the right to make stickers and goods of Peak. The facts are in [`docs/plans/brand-inventory.md`](../docs/plans/brand-inventory.md).

## 2. The rules (direction B2 with the author's change, ADR-0125)
| ID | Rule |
|---|---|
| BL-1 | **The code stays MIT**, the whole repository as today, and so does the art of Peak that is part of the app (the rig, the app icons, the images the website uses). The licence of past releases is not changed. |
| BL-2 | **The names Streakboom and Peak (as the cat of Streakboom) and the logo are kept** by a trademark policy (`TRADEMARK.md`): anyone may name them to describe, review, write about or link to the project, and may fork the code; a fork that is distributed under a changed character or code must not use the names or the logo, and nothing may suggest an official product. |
| BL-3 | **Every sticker is free under CC BY 4.0**, the published ones and the ones made later (free to use, share and adapt, also commercially, with credit to Streakboom). The stickers folder has a licence file that says so, which ends the double statement (MIT through the repository, CC BY 4.0 on the website). CC BY gives **no right in the names or the logo**. |
| BL-4 | **Fan art and stickers people make from Peak** follow from BL-3 and BL-2: free, also commercially, with credit; not to be presented as official; the names and the logo are not to be used as the brand of another product. |
| BL-5 | **The date matters:** the texts apply from the day they are published. What was published before is as it was. Every text says the date. |
| BL-6 | **Contributions:** the code is welcome under MIT as now. New art for the character is not taken without a separate agreement. |
| BL-7 | **Forks:** free to make and use. A fork that is distributed must rename, say it is not official, and not use the logo. A fork for one's own use need not rename. |
| BL-8 | **Nothing in the privacy promises or the charter changes.** |
| BL-9 | **Open:** designs for goods that are not stickers. Until the author says, they are his own work with no licence given, and BL-2 covers the names. |

## 3. What the code signing programme asks
The conditions of SignPath Foundation (read 2026-11-15): an OSI-approved licence without commercial dual licensing for all components, and no proprietary component. A trademark policy is not a licence on a component, so B2 (with CC BY stickers) should fit; carving the cat's art out of MIT inside the installer (B1) probably would not. **To be confirmed with SignPath in writing** before the application (ADR-0088 puts it late in the plan).

## 4. Open choice
Only BL-9 (designs for goods that are not stickers) is open; the other four questions of the handoff are answered in ADR-0125.

## 5. Not decided and not checked
Trademark registrations and their availability, the copyright position of art made with an AI's help, and the wording of the terms: for a lawyer (`docs/plans/peak-origin-and-lawyer-questions.md`).
