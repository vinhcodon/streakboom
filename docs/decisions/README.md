# Decisions

What was **decided**, why, and what was rejected. One short file per decision (an architecture decision record). A decision is not a hypothesis (see `../hypotheses/`): it is settled until someone reopens it on purpose.

**Rules**
- A new decision gets the next number. A changed decision gets a new record that says "supersedes ADR-NNNN", and the old one is marked superseded; do not rewrite history.
- Every decision names its source (a spec section, a log entry or a handoff) so the reasoning can be checked.
- The specs in `../../spec/` describe how the product works now; these records say why. If they disagree, fix the spec or write a new record.
- The commit history dates everything to 2026-11-07 and 2026-11-08, so dates here are approximate: "alpha 1.0 planning" means decided before the build started.

| ADR | Decision | Status | Date |
|---|---|---|---|
| [0001](0001-byok-no-hosted-inference.md) | Bring your own key; the app hosts no inference | accepted | alpha 1.0 planning |
| [0002](0002-audience-and-two-stages.md) | Mass market first; a naive pet first, a brained pet second | accepted | alpha 1.0 planning |
| [0003](0003-windows-only-alpha.md) | Windows 10/11 only for the alpha | accepted | alpha 1.0 planning |
| [0004](0004-tauri-svelte-stack.md) | Tauri 2 with SvelteKit (Svelte 5, TypeScript) | accepted | alpha 1.0 planning |
| [0005](0005-memory-budget-and-software-rendering.md) | About 120 MB total memory; WebView2 runs with --disable-gpu | accepted | alpha 1.0 spikes |
| [0006](0006-three-windows-single-state-owner.md) | Three windows; the pet window is the only owner and writer of state | accepted | 2026-11-08 |
| [0007](0007-keys-in-credential-store.md) | API keys live in the OS credential store and never reach the pet window | accepted | alpha 1.0 planning |
| [0008](0008-providers-one-active-api-keys-only.md) | Gemini, Claude and OpenAI, one brain in use at a time, API keys only | accepted | 2026-11-08 |
| [0009](0009-opt-in-local-telemetry.md) | Telemetry is opt-in, anonymous and local; nothing is sent | accepted | alpha 1.0 planning |
| [0010](0010-distribution-and-updates.md) | GitHub Releases, signed auto-update, unsigned installer for the alpha, update modes | accepted | 2026-11-08 |
| [0011](0011-mochi-cat-2d-gestures.md) | A flat 2D mochi cat, controlled by gestures instead of buttons | accepted | 2026-11-08 |
| [0012](0012-spring-driven-canvas-rig.md) | Motion is a spring-driven blend of hand-drawn key poses on a canvas; idle means no redraw | accepted | 2026-11-08 |
| [0013](0013-no-guilt-playful-character.md) | The pet never dies; the tone is playful and mildly sarcastic, with a gentle switch | accepted | alpha 1.0 planning |
| [0014](0014-memory-design.md) | The pet remembers little, locally, and the user controls it | accepted | 2026-11-08 |
| [0015](0015-language-follows-the-user.md) | Interface language is a setting; the chat answers in the language the user writes in | accepted | 2026-11-08 |
| [0016](0016-emotions-tagged-by-the-model.md) | The pet acts out the feeling of a chat answer, named by the model | accepted | 2026-11-08 |
| [0017](0017-settings-left-navigation.md) | Settings: a left navigation with one page per section | accepted | 2026-11-08 |
| [0018](0018-start-with-windows-opt-in.md) | Start with Windows is an opt-in, asked politely once or twice | accepted | 2026-11-08 |
| [0019](0019-first-run-tour.md) | A four-card first-run tour, replayable from Settings | accepted | 2026-11-08 |
| [0020](0020-no-streaming-for-now.md) | Streaming chat replies are not built | accepted | 2026-11-08 |
| [0021](0021-positioning-companion-not-assistant.md) | The pet is a companion, not an assistant | accepted | 2026-11-08 |
| [0022](0022-north-star-bond-days.md) | North star: Bond Days, with decisions D1 to D8 | accepted (built; released in 0.1.15) | 2026-11-08 |
| [0023](0023-process-commit-explicit-paths.md) | Commit only the files you changed; never git add -A in a shared checkout | accepted | 2026-11-08 |
| [0033](0033-every-release-includes-the-same-housekeeping.md) | Every release also audits the documents, refreshes the README, checks the names and hands the website session a prompt that asks for an SEO and GEO structure proposal | accepted (a standing rule) | 2026-11-09 |
| [0034](0034-website-structure-for-search-and-ai-engines.md) | The website gets static pages per language (`/` and `/vi/`), built by a small script for GitHub Pages, with structured data, `llms.txt` files, `robots.txt` that allows crawlers and no visitor tracking | accepted (decisions only; nothing built) | 2026-11-09 |
| [0032](0032-hops-and-falls-and-how-they-are-tried.md) | Hops and falls move the window along an arc; a test build tries them from a temporary menu; a dropped Peak stays where it is | accepted (built; released in 0.2.5) | 2026-11-09 |
| [0031](0031-the-sensory-contract-and-senses.md) | Peak perceives shapes and activity, never meaning; it may sense the ground under it; it notices before it acts; a sleeping cat wakes when crowded | accepted (partly built; see the record) | 2026-11-09 |
| [0030](0030-terrain-as-a-cost-field.md) | The desktop is terrain: a cost field of fixed relief and the user's attention (memory only); the cat moves away from the user's work; window geometry is a later separate permission | accepted (partly built in 0.2.5) | 2026-11-09 |
| [0029](0029-focus-safety-recent-input-and-pointer-fade.md) | Focus-safety uses recent input and the pointer and fades the cat; no hook, no window geometry | accepted (built, released in 0.2.4) | 2026-11-08 |
| [0028](0028-latest-two-releases-notes-in-changelog.md) | GitHub keeps the latest two releases; the notes of every version live in CHANGELOG.md | accepted (done) | 2026-11-08 |
| [0027](0027-separate-note-cap-and-in-character-refusal.md) | Fact-noting has its own daily cap; "enough for today" is said in character, never with numbers | accepted (done; released in 0.2.1) | 2026-11-08 |
| [0026](0026-first-official-release-0-2-0.md) | 0.2.0 is the first official release; the 0.1.x development builds are withdrawn | accepted (done 2026-11-08) | 2026-11-08 |
| [0025](0025-update-delivery-with-fallbacks.md) | Update delivery has two manifest addresses, the installer through the GitHub API, and a retry | accepted (built; not yet released) | 2026-11-08 |
| [0024](0024-mascot-name-peak.md) | The mascot is named Peak; each user can name their own pet | accepted | 2026-11-08 |
