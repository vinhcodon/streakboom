# Streakboom: the project in one place

**Read this first.** It is the entry point for anyone who comes to the repository cold: a new contributor, a new session of an AI assistant, the author after a long break. It gives the picture and the rules, and says where each fact lives. It is not a second source of truth: every claim here points at the document that owns it, and when they disagree **the owner wins** (this file is fixed in the same change, see "Keeping this file true").

> **Snapshot** (checked by `scripts/audit-docs.mjs`): version **0.4.2**, date **2026-11-13**. The newest decision record is the highest number in [`decisions/`](decisions/README.md). What is open is in [`plans/verification-debt.md`](plans/verification-debt.md) and [`plans/backlog.md`](plans/backlog.md).

## 1. What this is

**Streakboom** is an open-source (MIT) desktop pet for Windows 10/11. The character is **Peak**, a golden mochi cat that lives in the corner of the screen, reacts to being stroked, poked and carried, perches on the edges of windows, speaks Vietnamese, English or Japanese (Japanese is a beta), and keeps the person company. It works with no AI at all (a mood and closeness model and hand-written lines); with the person's **own API key** (Gemini, Groq, Claude or OpenAI) it can also chat. The author is Vinh (GitHub `vinhcodon`, display name Vinh Codon) and works with Claude; the owner of every decision is the author.

- **Mission** (ADR-0057): a small friend who makes the workday lighter and leads you back to real life. It has succeeded when the person lives well and needs it less. It makes **no health claim**: never "healing", "therapy", "clinically proven", never that it reduces anxiety, depression, ADHD or loneliness; the audit fails on those words in the README and the app's texts.
- **Audience** (ADR-0056): adults, 18 and over (self-declared; whether that is enough waits for a lawyer, [`foundation/legal-questions.md`](foundation/legal-questions.md)). Never write "safe" or "adults only" as a promise.
- **Positioning** (ADR-0021): a companion, not an assistant. It does not draft, summarise, search or fix.

## 2. The principles, ranked

[`charter.md`](charter.md) is the one page that ranks what Peak is for, so that the higher idea wins: (1) trust first; (2) the attention is theirs; (3) gentle before sharp; (4) it knows shapes, not meaning; (5) a companion, not an assistant; (6) it works without AI and the key is theirs; (7) it never dies, never lies about itself, and the person's absence costs nothing; (8) alive, within all of the above. It also holds "few settings" (a setting exists only for a consent, a credential or necessity, or a value Peak cannot infer; never for an *amount* of behaviour) and seven manners (yield first, look before moving, one thing at a time, never the same trick twice, when unsure assume the person is working, slow when nobody asked for fast, come back warmly). **Every new behaviour is checked against it**, and every story names the article it serves or spends. The charter changes only by an ADR.

## 3. Strategy and evidence

- **North star** (ADR-0022, [`../spec/05-north-star-metrics.md`](../spec/05-north-star-metrics.md)): **Bond Days**, the days in the last 7 with a deliberate care gesture (scratch, rub, or a reaction to an unprompted line). It is counted locally, opt-in, and the person can copy the stats by hand; **nothing is sent anywhere**. Guardrails beside it: the chat share, how often it is hidden or put in Quiet mode, processor and memory. Chat and plain pokes do not count. Its thresholds are not set (no baseline exists).
- **The evidence** ([`foundation/`](foundation/README.md), ADR-0058): a research foundation (English and Vietnamese). Its conclusions that bind the product: evidence for a screen pet helping anyone is almost absent, so no claim; the biggest risk is a character that *needs* the person (hunger, sadness, guilt, streaks, holding people back when they leave); everything that does is removed (0.4.0). Most sources were read as abstracts; **only principles and decisions are protected, the evidence stays editable**. Its eleven hard rules are the review checklist ([`foundation/charter-alignment.md`](foundation/charter-alignment.md); the verified state is in [`plans/foundation-review.md`](plans/foundation-review.md) and [`../spec/12-foundation-alignment.md`](../spec/12-foundation-alignment.md)).
- **Hypotheses** ([`hypotheses/`](hypotheses/README.md)): what we believe and have not proven (H1 to H16: who installs and why, whether the pet without AI is kept for a week, whether bond is made of care and not chat, the stickers, the terrain behaviour...). All are **untested**; the register says what would settle each one, and a section reads them against the foundation. A hypothesis becomes a decision only with evidence and an ADR.
- **What is deliberately not done:** selling anything (first measure demand, and only after a 90-day gate in the foundation); a keyless trial through a proxy (measure first); voice (only after a legal gate); Product Hunt (after a small observed group); a macOS port. See the earlier plan [`handoff/requirements-draft-v0.4.md`](handoff/requirements-draft-v0.4.md) (kept as received; the review in `plans/foundation-review.md` says what became of it).

## 4. State of the product

- **Released versions** (notes of each in [`../CHANGELOG.md`](../CHANGELOG.md), GitHub keeps the newest two): 0.2.0 the first official release (naive pet, key flow, memory, gestures, signed auto-update); 0.2.1 to 0.2.5 chat cap, lighter redraw, focus-safety, hops, the typing lane; 0.3.0 Japanese and Groq; 0.3.1 reactions as events, falls when the seat goes; 0.3.2 the desktop as terrain version 2 (perching, climbing, the edge ladder, the push, the attention modes, the charter, the retired settings); **0.4.0** the alignment release (absence costs nothing, no streak, 18+, chat safety rules, right click pushes, no pet menu); **0.4.1** one Peak at a time, the tray menu in the chosen language, the language guess from the system's list; **0.4.2** the license notices of the open-source packages are installed with the program (the first release built by GitHub's CI, finished on the author's computer).
- **Verified vs not:** many things are built but not yet checked on other machines, with real keys or by the author; they are all listed in [`plans/verification-debt.md`](plans/verification-debt.md) (V-n for the app, W-n for the website). Read it before trusting that something "works".
- **Backlog and roadmap:** [`plans/backlog.md`](plans/backlog.md) (epics E1 to E19 with progress; about 93 of 163 stories done on 2026-11-12), [`plans/roadmap.md`](plans/roadmap.md) (**version 2, ADR-0071**: close what is open, get free code signing from SignPath Foundation through releases built in CI (in parallel, not blocking), make the product checkable, get it ready to be watched, then a **closed alpha with 5 to 8 Vietnamese-speaking acquaintances**, then decide; a lawyer after the alpha and before anything public; features only as small fixes in between). The bottleneck is evidence, not features: nobody outside the author has used it, nothing ran on a second machine, and the north star has no baseline. Open next: see the roadmap's R0 to R3, a native reader for the Japanese text, a lower processor use (about 4 to 6% of one core standing is the floor with software drawing).
- **The website** (streakboom.com, owned by another session, [`website.md`](website.md)) follows each release after it is published.

## 5. How it is built (one page)

- **Stack:** Tauri 2 (Rust core) + SvelteKit SPA + Svelte 5 runes + TypeScript, WebView2 with software drawing (`--disable-gpu`), a memory budget of about 120 MB (ADR-0004, ADR-0005). Three windows: the **pet window** owns all state and logic and writes the files; the **speech-bubble window** (created on demand) and the **settings window** are views that talk to it through events (ADR-0006). [`../spec/04-technical-design.md`](../spec/04-technical-design.md), [`development.md`](development.md).
- **The pet** (spec 03, 06, 09): mood and closeness, tiers, hand-written line pools by trigger, band and tone, in three languages (the counts are checked); gestures; a spring-driven vector rig drawn on a canvas (`app/src/lib/rig/`, ADR-0012); reactions as events with an appraisal, beats and words (ADR-0041); three attention modes Work/Free/Play with "when unsure, Work" (ADR-0047).
- **The desktop as terrain** (spec 07, 08, 10; ADR-0030, 0044, 0045, 0046): a coarse 16 by 9 grid of anonymous window ids kept in memory, from which it finds surfaces to hop onto or climb, walls, and the plane below to fall to. Nothing about titles or contents is read (ADR-0031: shapes and activity, never meaning).
- **Brains** (ADR-0001, 0007, 0008, 0037): the person's own key, kept in the Windows Credential Manager, sent only to the provider chosen; one brain in use; daily caps (chat, unprompted lines, notes); a locked part of the prompt that no setting can change (not a human, no secrets, no medical advice, a clean goodbye, a crisis rule, glad for the person's friends) in `app/src-tauri/persona/`.
- **Data:** `%APPDATA%\com.streakboom.app\` (`state.json`, `pet.json`, `memory.json`); telemetry opt-in, local, counts only ([`privacy.md`](privacy.md)).
- **Updates and release** ([`releasing.md`](releasing.md)): signed with a private key that is not in the repository; `scripts/release.ps1`; two manifest addresses (ADR-0025); GitHub keeps the two newest releases (ADR-0028).

## 6. Where everything is

| You want | Go to |
|---|---|
| What the product does now | [`../spec/`](../spec) (01 to 12) and [`features.md`](features.md) |
| What a decision was and why | [`decisions/`](decisions/README.md): one short record each; **find by topic below** |
| What is proven, believed, open | [`hypotheses/`](hypotheses/README.md), [`plans/verification-debt.md`](plans/verification-debt.md) |
| What to do next | [`plans/backlog.md`](plans/backlog.md), [`plans/`](plans/README.md) (grouped: now, product, stickers, website, releases) |
| The evidence and the law questions | [`foundation/`](foundation/README.md) |
| What happened, with measurements and what was not verified | [`engineering-log.md`](engineering-log.md) (history, appended, never rewritten) |
| Notes from other sessions or conversations | [`handoff/`](handoff/README.md) (kept as received; the index says what became of each) |
| How to build, test, release, edit the website | [`development.md`](development.md), [`releasing.md`](releasing.md), [`website.md`](website.md) |
| The map of all of this and its rules | [`README.md`](README.md) |

**Decisions by topic** (numbers are ADRs): product and scope 0001 to 0003, 0021, 0026, 0056, 0057, 0059; architecture and platform 0004 to 0006, 0012; brains and keys 0007, 0008, 0015, 0016, 0020, 0027, 0037, 0038; privacy and senses 0009, 0014, 0031, 0043, 0045; the pet and its manners 0011, 0013, 0019, 0022, 0024, 0029, 0041, 0047, 0055, 0066, 0068; terrain and movement 0030, 0032, 0044, 0045, 0046; release and updates 0010, 0025, 0026, 0028, 0033, 0061; the website 0034 to 0036, 0039, 0040, 0042, 0048, 0052, 0053, 0054, 0062 to 0065, 0067, 0069; stickers 0049 to 0051, 0060; process 0023, 0033, 0058, 0061, 0070.

## 7. Working rules (the author's, and why)

1. **Commit explicit paths, never `git add -A`**, and release from a clean tree (ADR-0023). Several sessions share the checkout (the app, the website, the stickers): stage only your own files, and do not edit `site/` or `scripts/site/` (the website session owns them; tell it through [`handoff/website-release-prompt.md`](handoff/website-release-prompt.md)).
2. **Do not push, release or publish unless the author orders it.** "Đẩy lên GitHub" is the order to push; each release is ordered, for example "Phát hành 0.4.2". A release is merged, `main` pushed **before** publishing (the tag goes on the head of the default branch at publish time), then `scripts/release.ps1 -Publish`, then the routine of ADR-0033.
3. **The author looks at a test build before any motion or art change is committed.** Build with `npm run tauri build -- --no-bundle` and start the exe on the real machine.
4. **Decisions go to the author as a multiple choice, and become an ADR.** List `decisions/` first to take the next free number (the website session also writes ADRs, so numbers collide: check `origin` before you commit one). A decision about behaviour is checked against the charter.
5. **After each task:** update the backlog and the progress, compare with the roadmap, propose the next stories, say what was **not** verified, and add each unverified item to `plans/verification-debt.md`.
6. **Never ask for, store or print API keys or tokens in the conversation.** The updater's private key stays at `~\.tauri\streakboom-updater.key` and is never shown; the Gemini key is read only by the author-run line-factory script.
7. **Privacy contract** (ADR-0031, amended by 0045): shapes and activity, never meaning. A new sense is a decision, in the open, off or in memory only.
8. **Languages:** the conversation with the author is in Vietnamese; the README, the public texts, the code and most documents are English; the foundation and the earlier requirements draft are Vietnamese.

## 8. Keeping this file true (the update rule)

Every release, and every change that alters a fact stated in this file, updates in the **same commit**: the snapshot at the top (version and date; the audit fails if the version is stale), section 4 (released versions, open next), the topic list in section 6 if a decision opened a new topic, and the README (version in the status line; the numbers the website checks). The routine of ADR-0033 and ADR-0070 lists the rest. `node scripts/audit-docs.mjs` checks links, indexes, versions, names, health-claim words and the README's size.

## 9. Pitfalls that cost time (learned)

- **Windows PowerShell 5.1:** `Set-Content -Encoding utf8` adds a BOM; `*>` and `2>&1` on native programs abort under `$ErrorActionPreference = Stop`; **a release note with double quotes breaks `gh release create`** (write the notes without them); native stderr can abort `release.ps1` (run it plainly).
- **The disk:** a Rust debug build cache grows to 4 to 15 GB (`app/src-tauri/target/debug`, and the shared `spike/src-tauri/target` used by `release.ps1`); when `cargo test` prints nothing, check the free space. `cargo clean --profile dev` is safe.
- **Sandbox:** an assistant's own shell may see a private copy of AppData; real-machine actions (the installed Peak, the real settings files, the tray) go through the terminal tool. Do not drive Windows virtual desktops from tests.
- **The tag bug:** `gh release create` puts the tag on the head of the default branch at publish time: push the release commit first.
- **The site build reads the README** and fails (so nothing deploys) if these change: "N hand-written lines per language", the memory range, the processor figures, "just under its feet", and the five promise phrases. Tell the website session before changing them.
- **Windows 11, several monitors, a clean install, a lower-end machine, real keys on three of four brains** have never been tried (they are in the debt list).
