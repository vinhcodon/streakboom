# Decisions

What was **decided**, why, and what was rejected. One short file per decision (an architecture decision record). A decision is not a hypothesis (see `../hypotheses/`): it is settled until someone reopens it on purpose.

**Rules**
- A new decision gets the next number. A changed decision gets a new record that says "supersedes ADR-NNNN", and the old one is marked superseded; do not rewrite history.
- Every decision names its source (a spec section, a log entry or a handoff) so the reasoning can be checked.
- The specs in `../../spec/` describe how the product works now; these records say why. If they disagree, fix the spec or write a new record.
- The commit history dates everything to 2026-11-07 and 2026-11-08, so dates here are approximate: "alpha 1.0 planning" means decided before the build started.

| ADR | Decision | Status | Date |
|---|---|---|---|
| [0058](0058-foundation-as-evidence-home-and-v0-4-0-alignment.md) | `docs/foundation/` is the home of evidence; the charter is aligned to it by new ADRs after a review; 0.4.0 is proposed as the alignment release | **proposed** (direction agreed; scope waits for the review) | 2026-11-11 |
| [0057](0057-mission-wording-no-health-claims.md) | The mission is "a small friend that makes the workday lighter"; no healing or health claims anywhere public | accepted | 2026-11-11 |
| [0056](0056-scope-18-plus.md) | Streakboom is for people aged 18 and over (the age gate itself is open, waits for a lawyer) | accepted | 2026-11-11 |
| [0054](0054-the-website-follows-the-app-in-0-3-2.md) | The website follows the app in 0.3.2: the fifth promise, climbing, the retired settings, the new senses (the website session's record; its row was missing from this index) | accepted, built | 2026-11-11 |
| [0053](0053-a-four-item-menu-per-language-stickers-and-a-daily-download-history.md) | A four-item menu, the sticker page waits for per-language sets, and a daily history of downloads (the website session's record; its row was missing from this index) | accepted, built | 2026-11-11 |
| [0052](0052-a-download-counter-from-github-with-a-ledger.md) | A download counter on the website, read from GitHub and kept in a ledger (the website session's record; its row was missing from this index) | accepted, built and live | 2026-11-11 |
| [0051](0051-sticker-web-gallery-and-cc-by.md) | The stickers go on the website first (Copy, Share, Download, as images), under CC BY 4.0; nothing is submitted to Zalo, Telegram or LINE for now; the website session builds it | accepted | 2026-11-11 |
| [0050](0050-sticker-second-pass-sarcasm-lounging-and-mochi-sleep.md) | Sticker second pass: about 29% of the set teases (5 of 17), sticker 3 is a lounging cat with crossed legs, sticker 9 a curled-up mochi sleeper | accepted (drawn as a first pass) | 2026-11-11 |
| [0049](0049-sticker-test-on-zalo-decisions.md) | The sticker test on Zalo: the set is "Peak"; sticker 6 says the sample line with `sad`; no sarcasm in the first set; belly-request sticker kept as sticker-only art; no "hungry"; stills drawn outside the app; no download numbers needed; stop under 20 installs from stickers | accepted | 2026-11-10 |
| [0048](0048-a-short-gentle-website-with-the-charters-promises.md) | A short, gentle website: a short home, details behind links, the charter's promises, one round of the tour (the website session's record; its row was missing from this index) | accepted, built | 2026-11-10 |
| [0047](0047-the-charter-modes-falls-and-few-settings.md) | A charter ranks Peak's principles; three attention modes (Work, Free, Play; assume Work when unsure); a fall only by the person's push or a lost seat; few settings | accepted | 2026-11-10 |
| [0046](0046-peak-gets-out-from-under-what-covers-it.md) | Peak gets out from under a window it cannot be raised over (the Start menu, Search): it asks Rust about five points of its body, and hops to the nearest free place | accepted | 2026-11-10 |
| [0045](0045-vertical-terrain-falls-to-the-plane-below-and-the-screen-picture.md) | Peak climbs vertical surfaces and falls only to the plane below; the screen picture sense is allowed as an opt-in | accepted (decisions; being built) | 2026-11-10 |
| [0044](0044-the-terrain-from-regions-with-identity.md) | The desktop is a terrain of surfaces and costs built from regions with identity; the ground map is on by default; props wait; the overlay comes first | accepted (decisions; being built) | 2026-11-10 |
| [0043](0043-line-factory-model-remarks-and-the-ground-map.md) | A line factory run by the author, a model's remark after a reflex, and a ground map kept in memory; no top-up of lines by the connected brain yet | accepted (decisions; built after 0.3.1, not released) | 2026-11-10 |
| [0042](0042-the-website-follows-the-app-in-0-3-1.md) | The website follows the app in 0.3.1: the sense under Peak's feet, 267 lines, the fall | accepted (website session; built 2026-11-10, deployed since) | 2026-11-10 |
| [0041](0041-reactions-as-events-appraisal-beats-and-words.md) | Reactions are events with an appraisal, shown by a small library of beats and words from slots; the persona is layered and shown read-only | accepted (decisions; nothing built yet) | 2026-11-10 |
| [0040](0040-website-next-improvements-for-search-and-ai-engines.md) | Next improvements of the website for search and AI engines: keep the tour scene, a "How it works" page per language, Japanese search wording, generated structured data and llms files, a Lighthouse baseline and a size budget | accepted (decisions; nothing built) | 2026-11-09 |
| [0039](0039-the-website-follows-the-app-in-0-3-0.md) | The website follows the app in 0.3.0: Japanese as a beta, four brains (Groq says nothing about its terms), the notice beat, the primary mouse button; the build rejects the outdated wording | accepted (built and deployed 2026-11-09) | 2026-11-09 |
| [0038](0038-japanese-as-the-third-language.md) | Japanese is the third language, in full (interface, about 180 lines, memory lines, prompts), in a warm casual voice, labelled beta | accepted (released in 0.3.0 as a beta; not read by a native speaker) | 2026-11-09 |
| [0037](0037-groq-as-the-fourth-brain.md) | Groq is the fourth brain, offered right after Google, presented as a second free choice; its model names, errors and honest data and age text | accepted (released in 0.3.0; not tried with a real key) | 2026-11-09 |
| [0036](0036-the-hero-plays-a-day-of-peak.md) | The website's Peak plays "a day of Peak" by itself with captions, stops when the visitor acts, and settles into standing still after two rounds | accepted (built 2026-11-09) | 2026-11-09 |
| [0035](0035-website-in-japanese.md) | The website also exists in Japanese (`/ja/`, `/ja/privacy/`) and says plainly that the app itself is in English and Vietnamese only | accepted (built and deployed 2026-11-09) | 2026-11-09 |
| [0034](0034-website-structure-for-search-and-ai-engines.md) | The website gets static pages per language (`/` and `/vi/`), built by a small script for GitHub Pages, with structured data, `llms.txt` files, `robots.txt` that allows crawlers and no visitor tracking | accepted (decisions only; nothing built) | 2026-11-09 |
| [0033](0033-every-release-includes-the-same-housekeeping.md) | Every release also audits the documents, refreshes the README, checks the names and hands the website session a prompt that asks for an SEO and GEO structure proposal | accepted (a standing rule) | 2026-11-09 |
| [0032](0032-hops-and-falls-and-how-they-are-tried.md) | Hops and falls move the window along an arc; a test build tries them from a temporary menu; a dropped Peak stays where it is | accepted (built; released in 0.2.5) | 2026-11-09 |
| [0031](0031-the-sensory-contract-and-senses.md) | Peak perceives shapes and activity, never meaning; it may sense the ground under it; it notices before it acts; a sleeping cat wakes when crowded | accepted (partly built; see the record) | 2026-11-09 |
| [0030](0030-terrain-as-a-cost-field.md) | The desktop is terrain: a cost field of fixed relief and the user's attention (memory only); the cat moves away from the user's work; window geometry is a later separate permission | accepted (partly built in 0.2.5) | 2026-11-09 |
| [0029](0029-focus-safety-recent-input-and-pointer-fade.md) | Focus-safety uses recent input and the pointer and fades the cat; no hook, no window geometry | accepted (built, released in 0.2.4) | 2026-11-08 |
| [0028](0028-latest-two-releases-notes-in-changelog.md) | GitHub keeps the latest two releases; the notes of every version live in CHANGELOG.md | accepted (done) | 2026-11-08 |
| [0027](0027-separate-note-cap-and-in-character-refusal.md) | Fact-noting has its own daily cap; "enough for today" is said in character, never with numbers | accepted (done; released in 0.2.1) | 2026-11-08 |
| [0026](0026-first-official-release-0-2-0.md) | 0.2.0 is the first official release; the 0.1.x development builds are withdrawn | accepted (done 2026-11-08) | 2026-11-08 |
| [0025](0025-update-delivery-with-fallbacks.md) | Update delivery has two manifest addresses, the installer through the GitHub API, and a retry | accepted (built; not yet released) | 2026-11-08 |
| [0024](0024-mascot-name-peak.md) | The mascot is named Peak; each user can name their own pet | accepted | 2026-11-08 |
| [0023](0023-process-commit-explicit-paths.md) | Commit only the files you changed; never git add -A in a shared checkout | accepted | 2026-11-08 |
| [0022](0022-north-star-bond-days.md) | North star: Bond Days, with decisions D1 to D8 | accepted (built; released in 0.1.15) | 2026-11-08 |
| [0021](0021-positioning-companion-not-assistant.md) | The pet is a companion, not an assistant | accepted | 2026-11-08 |
| [0020](0020-no-streaming-for-now.md) | Streaming chat replies are not built | accepted | 2026-11-08 |
| [0019](0019-first-run-tour.md) | A four-card first-run tour, replayable from Settings | accepted | 2026-11-08 |
| [0018](0018-start-with-windows-opt-in.md) | Start with Windows is an opt-in, asked politely once or twice | accepted | 2026-11-08 |
| [0017](0017-settings-left-navigation.md) | Settings: a left navigation with one page per section | accepted | 2026-11-08 |
| [0016](0016-emotions-tagged-by-the-model.md) | The pet acts out the feeling of a chat answer, named by the model | accepted | 2026-11-08 |
| [0015](0015-language-follows-the-user.md) | Interface language is a setting; the chat answers in the language the user writes in | accepted | 2026-11-08 |
| [0014](0014-memory-design.md) | The pet remembers little, locally, and the user controls it | accepted | 2026-11-08 |
| [0013](0013-no-guilt-playful-character.md) | The pet never dies; the tone is playful and mildly sarcastic, with a gentle switch | accepted | alpha 1.0 planning |
| [0012](0012-spring-driven-canvas-rig.md) | Motion is a spring-driven blend of hand-drawn key poses on a canvas; idle means no redraw | accepted | 2026-11-08 |
| [0011](0011-mochi-cat-2d-gestures.md) | A flat 2D mochi cat, controlled by gestures instead of buttons | accepted | 2026-11-08 |
| [0010](0010-distribution-and-updates.md) | GitHub Releases, signed auto-update, unsigned installer for the alpha, update modes | accepted | 2026-11-08 |
| [0009](0009-opt-in-local-telemetry.md) | Telemetry is opt-in, anonymous and local; nothing is sent | accepted | alpha 1.0 planning |
| [0008](0008-providers-one-active-api-keys-only.md) | Gemini, Claude and OpenAI, one brain in use at a time, API keys only | accepted | 2026-11-08 |
| [0007](0007-keys-in-credential-store.md) | API keys live in the OS credential store and never reach the pet window | accepted | alpha 1.0 planning |
| [0006](0006-three-windows-single-state-owner.md) | Three windows; the pet window is the only owner and writer of state | accepted | 2026-11-08 |
| [0005](0005-memory-budget-and-software-rendering.md) | About 120 MB total memory; WebView2 runs with --disable-gpu | accepted | alpha 1.0 spikes |
| [0004](0004-tauri-svelte-stack.md) | Tauri 2 with SvelteKit (Svelte 5, TypeScript) | accepted | alpha 1.0 planning |
| [0003](0003-windows-only-alpha.md) | Windows 10/11 only for the alpha | accepted | alpha 1.0 planning |
| [0002](0002-audience-and-two-stages.md) | Mass market first; a naive pet first, a brained pet second | accepted | alpha 1.0 planning |
| [0001](0001-byok-no-hosted-inference.md) | Bring your own key; the app hosts no inference | accepted | alpha 1.0 planning |
