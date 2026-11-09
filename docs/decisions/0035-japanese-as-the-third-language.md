# ADR-0035: Japanese is the third language, in full, in a warm casual voice, labelled beta

- **Status:** accepted (decisions 2026-11-09; built 2026-11-09, not released; not read by a native speaker)
- **Date:** 2026-11-09
- **Decided by:** Vinh (author), with Claude

## Context
The author asked for Japanese in the app. Today the interface, Settings, the 182 hand-written lines per language, the memory lines and the AI prompts exist in Vietnamese and English. No native Japanese reader is available to review the text (the Vietnamese lines have the same open item).

## Decision
1. **Scope: as complete as Vietnamese.** The interface, Settings and the tour, the whole pool of scripted lines (about 180), the memory lines and the prompts to the brain. Peak speaks Japanese throughout, not a mix.
2. **Voice: warm and casual.** Friendly sentence endings (「〜だよ」「〜ね」「〜かな」) as a friend would speak to you, the same deadpan and gentle teasing as in the other languages (the "gentle tone" switch still removes the sarcastic ones); no cat-speak endings like 「にゃ」, no polite 「です／ます」 form for scripted lines.
3. **Beta label.** Settings lists the language as **日本語 (beta)** because the text was written by Claude and not read by a native speaker. The label comes off when someone has checked it; the open item is in `docs/plans/verification-debt.md`.
4. **Selection.** The language setting gets a third value; "auto" picks Japanese when the system language is Japanese (`ja`), Vietnamese for `vi`, and English otherwise. The brain answers in the language of the latest message (ADR-0015), so Japanese chat already works at the brain's quality (not tried).

## Alternatives considered
The interface and half the lines (rejected: Peak would switch between Japanese and English); the interface only (rejected: it loses the character); polite 「です／ます」 or cat-speak endings (rejected for tone); no label (rejected: native readers could meet odd lines without warning).

## Consequences
- A big content change: every line pool, the memory pools and the UI table gain a third language; tests that check that the pools match across languages now cover three.
- The website text and the README gain a language; the website session is told at the next release.
- **Not verified:** the Japanese text by a native reader (the main risk), fonts and line breaking in the pet's bubble and Settings, and how the brains' answers read in Japanese.
