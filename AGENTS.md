# AGENTS.md: instructions for AI coding assistants (and a quick card for people)

Streakboom is a desktop pet for Windows (Peak, a mochi cat), Tauri 2 (Rust) + SvelteKit/Svelte 5 + TypeScript. It works without AI; with the person's own API key it can chat. **Read [`docs/PROJECT.md`](docs/PROJECT.md) first** (mission, strategy, state, architecture, rules, where everything is), then [`docs/charter.md`](docs/charter.md) (the ranked principles every behaviour is checked against). This file is only the card.

## Commands (from `app/`)

```powershell
npm install
npm run tauri dev          # run with hot reload
npm test                   # pure logic, node --test, TypeScript run directly (Node 24+)
npm run check              # svelte-check
cd src-tauri; cargo test   # Rust core
node ../scripts/audit-docs.mjs   # documents agree with each other and with the code (from the repo root)
node scripts/build-site.mjs      # the website build (from the repo root); it also checks the README
```

A change to code is not done until the tests for its pure logic pass, the spec and the README are fixed in the same commit if users can see the change, and the audit is clean.

## Rules that are not negotiable

1. **Commit explicit paths only, never `git add -A`.** Other sessions share this checkout (the website, the stickers). Do not edit `site/` or `scripts/site/` (the website session owns them): write a note in `docs/handoff/` instead.
2. **Do not push, release or publish unless the author asks.** A release is ordered by name ("Phát hành 0.x.y"). Push `main` before publishing; write release notes **without double quotes**.
3. **Never ask for, print or store an API key, token or the updater's private key.** Never put one in a file or a request.
4. **Privacy contract:** Peak senses shapes and activity, never meaning (no key logging, no screen or window-title reading, nothing sent unless the person turns it on). A new sense is a decision, not a feature.
5. **No health claims** (no "healing", "therapy", "reduces anxiety, depression, loneliness") and **no character that needs the person** (hunger, sadness, guilt, streaks, "I missed you"). The audit fails on the words; the tests fail on the lines.
6. **A decision is an ADR.** Ask the author as a multiple choice, write `docs/decisions/NNNN-…md`, add it to the index. List the folder **and `origin/main`** for the next free number (the website session writes ADRs too).
7. **Say what was not verified**, and add each unverified item to `docs/plans/verification-debt.md`. Do not call a thing "works" that nobody saw.
8. **The author looks at a test build before any motion or art change is committed.**

## Where things go

| You are adding | Put it in |
|---|---|
| A behaviour or a rule of the product | the spec (`spec/NN-….md`), a story in `docs/plans/backlog.md`, an ADR if it is a choice |
| A belief that is not proven | `docs/hypotheses/README.md`, with what would settle it |
| Evidence from research | `docs/foundation/` (cite the source and the date; a rule changes only by an ADR) |
| A measurement, a spike, what was learned | `docs/engineering-log.md` (appended, never rewritten) |
| Something built but not checked | `docs/plans/verification-debt.md` |
| A note from another session | `docs/handoff/` (never edit a note after receipt; the index says what became of it) |
| A new field in `pet.json` or `memory.json` | **Add only**: never rename, delete or change the meaning of an existing field (Stable and Preview share the files, ADR-0090); read it with a default so an older build still works; the test is `app/src/lib/channel-data.test.ts` |
| A user-visible change | `CHANGELOG.md` (`## x.y.z (date)`, then lines starting with `- `, the first one a short bold sentence) and the README if it changes a promise |

## Style

English in code, comments, commits and public texts; the conversation with the author is in Vietnamese. Commit messages say what and why in one or two plain sentences. Prefer the existing patterns (pure logic in `app/src/lib/*.ts` with a `.test.ts` beside it; Rust in `app/src-tauri/src/`). Do not add a setting for an *amount* of behaviour (charter: few settings).

## Keeping the documents true

Every release: run `node scripts/audit-docs.mjs`, update the snapshot and section 4 of `docs/PROJECT.md`, the README status line, and the website prompt (`docs/handoff/website-release-prompt.md`); check the author's name (Vinh Codon); record what was not verified. The full list is in `docs/releasing.md` and ADR-0033 and ADR-0070.
