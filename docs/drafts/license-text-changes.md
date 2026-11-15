# Proposed changes to the licence texts (before and after; none applied)

**Status:** proposals of 2026-11-15 for ADR-0124 (accepted: B2, every sticker CC BY 4.0). Each change needs the author's approval before it is made; the website texts are made by the website session (see [`../handoff/website-brand-terms.md`](../handoff/website-brand-terms.md)). Not legal advice.

## README.md
- **Line 67 (feature list).** Before: `Free and open source. MIT licensed. Updates are signed; ...` After: `Free and open source: the code is MIT licensed. The names Streakboom and Peak and the logo are kept (see TRADEMARK.md). Updates are signed; ...`
- **"Art and credits" (the sentence "so the art is covered by the same MIT license as the code").** Keep it for the art of the app, and add: `The stickers published before DATE are under CC BY 4.0; the stickers, published and future, are CC BY 4.0 (see the licence file of their folder).`
- **"License" section.** Before: the single line "MIT", linked to the LICENSE file, followed by "Copyright (c) 2026 Vinh Codon." After: the same, plus `The names and the logo: see TRADEMARK.md. The stickers: see the licence file in their folder.`

## CONTRIBUTING.md (line 56)
Before: `The code and art are under the MIT license, and so are your contributions.` After: `The code and the art of the app are under the MIT license, and so are your contributions. New art for the character is not taken without a separate agreement; the names and the logo are covered by TRADEMARK.md.`

## The stickers folder (new file)
`docs/plans/assets/stickers/set-v2/LICENSE` (or one level up): the text of CC BY 4.0 for the stickers, for all the stickers, with the line `Published 2026-11-11 under ADR-0051; the repository's MIT licence does not apply to these files.` Draft: [`STICKERS-LICENSE.md`](STICKERS-LICENSE.md). This ends the double statement. The fonts keep their own SIL OFL notices.

## `app/src-tauri/Cargo.toml`
Add `license = "MIT"` (a gap found in the inventory; no change of terms).

## The website (through the website session)
- Footer (`foot_a`): add a link to TRADEMARK.md after `MIT License.`
- The sticker page (`st_license`): keep the CC BY 4.0 line; it now covers every sticker, so add that the names and the logo are not licensed by it.
- The FAQ "Is it really free?": add that the names and the logo are kept.
