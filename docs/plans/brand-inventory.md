# Brand and licence inventory (R1) and the SignPath check (R2)

**Update (2026-11-15, later the same day): the author decided to keep MIT and CC BY as before, with no trademark policy (ADR-0126), so the options B1 and B2 of section 3 and the questions for SignPath are no longer needed; the inventory (section 1) and the findings (section 2) stay true and are what spec 18 rests on.**

**Status:** written 2026-11-15 for the handoff [`licensing-and-brand-assets.md`](../handoff/licensing-and-brand-assets.md); **not legal advice, every legal statement here needs a lawyer to confirm**. Facts about the repository were read on 2026-11-15; facts about SignPath were read on the same day from its public page.

## 1. What makes up the identity of Peak, and under which licence it stands today
| Thing | Where | Licence today | Note |
|---|---|---|---|
| The drawing code of the cat (poses, springs, shapes) | `app/src/lib/rig/` (`draw.ts`, `engine.ts`, `keys.ts`), copied for the website to `site/peak/` | MIT (the repository `LICENSE`, "Copyright (c) 2026 Vinh Codon") | The cat exists only as this code |
| The colour palette of Peak | inside the rig code | MIT | |
| App icons | `app/src-tauri/icons/*`, `app/static/favicon.png`, `assets/peak-icon-1024.png` | MIT | Generated from the rig code (README, Art and credits) |
| Website images | `site/assets/` (`peak-logo.png`, `og-image.jpg`, `apple-touch-icon.png`, favicons, `sticker-preview.png`) | MIT (they are in the repository); the sticker preview shows CC BY stickers | |
| **The published stickers (set v2)** | `docs/plans/assets/stickers/set-v2/` (`en`, `ja`, `vi`, `manifest.json`), built by `build_stickers.py`; shown by the website | **Two statements at once:** MIT (they are in the repository, no other `LICENSE` there) **and CC BY 4.0** (the website says so: `st_license`, ADR-0051) | **The handoff says "no stickers in the repository": they are.** The two licences do not agree; CC BY 4.0 is the one the author chose and published |
| Sticker drafts and character sheets | `docs/plans/assets/stickers/` (`direction-v1`, `set-v0`, `set-v1`, `pack-*-draft`, `list-draft`), `docs/plans/assets/sticker-character-sheet.svg` | MIT (not published as a set) | |
| Fonts of the stickers | `docs/plans/assets/stickers/fonts/` | Their own: Be Vietnam Pro and M PLUS Rounded 1c, SIL OFL (the notice is beside the font) | Not Peak's identity; the OFL stays |
| Texts of the brand | README ("Art and credits"), the website (`site/strings.mjs`: the footer line `foot_a`, the FAQ "Is it really free?", `f8_p`, `glance`), `docs/features.md` | MIT is stated for the code and the art | |
| The names **Streakboom** (the program) and **Peak** (the character) | `productName` and `identifier` (`com.streakboom.app`) in `tauri.conf.json`, the repository `vinhcodon/streakboom`, the website domain, the installer, every text | No trademark policy exists; no registration was found in the repository | "Peak" is a common English word: a mark would be about the combination ("Peak, the cat of Streakboom") |
| The logo | `site/assets/peak-logo.png` | MIT as a file; no logo policy | |
| The character's origin | README, the website footer | stated: original, concept sketches by Claude, the author chose the direction, the rig written with Claude | see [`peak-origin-and-lawyer-questions.md`](peak-origin-and-lawyer-questions.md) |

Other licence statements found: `app/package.json` has `"license": "MIT"`; **`app/src-tauri/Cargo.toml` has no `license` field** (a small gap: `authors = ["streakboom"]`); the badge and the line "Free and open source. MIT licensed." in the README; "The code and art are under the MIT license, and so are your contributions" in `CONTRIBUTING.md`; `CODE_SIGNING.md` says the repository is public under MIT; the dependency licences are listed in `docs/dependency-licenses.md` (no proprietary component).

## 2. What was found that changes the question
1. **The stickers are already published under CC BY 4.0** (ADR-0051, 2026-11-11), which allows anyone to use, adapt and sell them with credit. It cannot be taken back for what was published. Terms that forbid sale or printing can apply only to **new** stickers and merch designs, and the text must say from which date.
2. **The same sticker files carry two licences** (MIT through the repository, CC BY 4.0 on the website). A licence file for that folder that says CC BY 4.0 would remove the double statement; it is a text change, to be approved.
3. **The project is not unpublished**: Stable 0.10.0 and older versions are public under MIT. New terms start from their date; what was published stays as it was.
4. **The timing is already decided elsewhere**: ADR-0071 (the lawyer after the alpha) and ADR-0088 (the SignPath application is among the last items; features freeze while the alpha runs).

## 3. SignPath Foundation (R2), read on 2026-11-15
Source: [signpath.org/terms](https://signpath.org/terms.html) (the page shows no date and calls its code of conduct a draft). Quoted conditions:
- "The project must use an OSI-approved Open Source license without commercial dual-licensing for all components."
- "The project may not contain any proprietary, non open-source component."
- "A code signing policy must be specified on the project's home page." (we have it: ADR-0076, `CODE_SIGNING.md`)
- The page **says nothing about names, trademarks, branding or artwork.**
Secondary sources (a blog, issue threads of other projects; not authoritative) add: the team that signs must also maintain the code, builds must be verifiable (ours are made in CI, ADR-0072), the team uses multi-factor authentication, and each release is approved by hand. See the search results of 2026-11-15, for example [a Zenn article on the application](https://zenn.dev/shm_7ec/articles/signpath-oss-code-signing?locale=en) and [foropensource.com](https://foropensource.com/company/signpath/).

**What this means for the options (a reading, not their ruling):**
| Option | Reading |
|---|---|
| **B1**, the cat and its art carved out of MIT with a non-commercial term, inside the app | The art is part of the installer: likely **a proprietary or non-OSI component**, so likely **not allowed**. Ask SignPath before anything |
| **B2**, MIT for the code and the cat's art in the app; trademark policy for the names and the logo; separate terms for new stickers and merch kept outside the app | Nothing in the published conditions is touched. A trademark policy is not a licence on a component. Likely allowed; **ask SignPath once to confirm**, in writing |
| **B0**, change nothing but add the trademark policy and the sticker licence file | The same reading as B2, with nothing new for merch beyond the name and logo |

**To ask SignPath** (their application or contact form; not done): Does a trademark policy for the project's name and logo, with the code and the character's art in the installer staying under MIT, affect eligibility? Do stickers published separately under CC BY 4.0, not part of the installer, matter? Are there conditions about the logo they show in our code signing policy?

## 4. What I could not check
The state of any trademark registration ("Streakboom", "Peak") anywhere; whether the name "Peak" for software, stickers and goods is free in the markets that matter; the copyright position of art made with an AI's help (varies by country). These are for a lawyer (questions in [`peak-origin-and-lawyer-questions.md`](peak-origin-and-lawyer-questions.md)).
