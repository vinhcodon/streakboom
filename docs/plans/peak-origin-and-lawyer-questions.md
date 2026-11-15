# How Peak was made (R6) and the questions for a lawyer

**Status:** a statement of facts as the repository and the author tell them, written 2026-11-15, with **no legal conclusion**. It is meant to be shown to a lawyer.

## 1. The creative process, as recorded
- The author asked for a desktop pet. **Claude (an AI assistant made by Anthropic) proposed three concept sketches**; the author **chose the "mochi cat" direction** (ADR-0011) and adjusted it over time (colours, shapes, the stickers' look: `docs/plans/sticker-*.md`, ADRs 0049 to 0085).
- **The cat is drawn as vector shapes in code** (`app/src/lib/rig/`), written with Claude's help, then checked and changed by the author. The key poses, the springs and the drawing code are in the repository with its history (`git log`).
- **The stickers** are produced by a script (`build_stickers.py`) from those drawings, with the author's decisions on the list, the lines and the look.
- The names were chosen by the author. The README and the website say that Peak is an original character, not based on any existing character, brand or mascot.
- The repository has been public under the MIT licence since it opened; Stable versions and Preview builds are published on GitHub.

## 2. What to show a lawyer
This document, [`brand-inventory.md`](brand-inventory.md), the drafts in [`../drafts/`](../drafts/README.md), ADR-0051 (CC BY for the stickers), the git history of `app/src/lib/rig/` and of the stickers, and the site texts.

## 3. Questions for one short meeting
1. How much copyright protection does a character have in Vietnam and in the markets that matter when its first sketches and part of its code were produced with an AI's help, and the author chose, directed and changed the result?
2. Can "Streakboom" and "Peak" be registered, and for which classes (software, stickers and digital goods, clothing and accessories)? "Peak" is a common word: is the combination with the cat registrable, and is it free?
3. How should the trademark policy and the sticker and merch terms be worded so that they match the direction chosen (B2), with the code and the app's art staying under MIT and the stickers already published under CC BY 4.0?
4. Is the plain statement "new terms apply from this date; what was published before stays as it was" enough, and how should it be shown?
5. Does anything in the way the app, the website and the stickers are published conflict with the terms of the code signing programme the project will apply to (see the inventory, section 3)?
