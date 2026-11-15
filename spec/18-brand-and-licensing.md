# 18. Brand and licensing (the licences stay as they were)

**Status:** decided 2026-11-15 in ADR-0126 (it supersedes ADR-0125). Not legal advice. Nothing here changes `LICENSE`, the README, CONTRIBUTING or the website.

## Rules
| ID | Rule |
|---|---|
| BL-1 | **The code stays MIT**, the whole repository, and so does the art of Peak that is part of the app (the rig, the app icons, the website's images). "Copyright (c) 2026 Vinh Codon". |
| BL-2 | **The stickers stay CC BY 4.0** (ADR-0051): free to use, share and adapt, also commercially, with credit to Streakboom. |
| BL-3 | **No trademark policy and no separate terms for goods.** What the law gives anyone about names and logos applies; the author keeps no further right by licence. A new ADR may add a trademark policy later without changing MIT or CC BY. |
| BL-4 | **Forks** follow the MIT licence and nothing more. |
| BL-5 | **Nothing in the privacy promises or the charter changes.** |

## Optional consistency fixes (each only with the author's approval)
1. The stickers folder `docs/plans/assets/stickers/set-v2/` is inside the MIT repository and declared CC BY 4.0 on the website: a licence file there that says CC BY 4.0 (draft: `docs/drafts/STICKERS-LICENSE.md`) ends the double statement.
2. `app/src-tauri/Cargo.toml` has no `license` field: `license = "MIT"`.

## The facts
The inventory of what carries which licence is in [`docs/plans/brand-inventory.md`](../docs/plans/brand-inventory.md); the conditions of SignPath Foundation (an OSI licence for every component, no proprietary component) fit this arrangement. The history of the discussion (direction B2, the drafts) is in ADR-0125 and in the git history (commit `3728a95`).
