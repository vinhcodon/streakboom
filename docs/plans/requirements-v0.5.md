# Requirements v0.5: what changed since the v0.4 draft, and what the handoffs of 2026-11-13 do to the plan

**Status:** written 2026-11-13 at the author's request. It **replaces `../handoff/requirements-draft-v0.4.md` as the working statement** (the draft stays in `handoff/` as written; its index row says what became of it). It is a reconciliation, not new product decisions: every row points to the decision, the spec or the plan where the matter lives. Where something is still open it says so.

## 1. The specs and plans that now exist (numbering settled)

| Number | Subject | Owner | Status |
|---|---|---|---|
| `spec/13-sticker-page.md` | The sticker page as a picker for Zalo and Teams (desktop copy / paste and drag-and-drop first, mobile share beside it, data model, search, indexing checks) | website session | built to v0.8 in the site; the matrix of tests is waiting for Vinh (see section 4) |
| `spec/14-adaptive-peak.md` | Peak notices and suggests; skills as body language ("Lượn đi" first); voice by a held hotkey | app session | draft, nothing approved to build |
| `spec/15-customization.md` | Colour, accessory and voice that Peak can change in itself, reached by Peak's proposal, not by Settings | app session | draft, nothing approved to build |

The handoffs asked for `spec/08-adaptive-peak.md`, `spec/08-customization.md` and `spec/09-sticker-page.md`. Those numbers are **taken** (08 perception, 09 reactions), so the specs are 14, 15 and the existing 13. The sticker spec was already written by the website session and is **not** rewritten here.

## 2. For each handoff of 2026-11-13: what exists and what was missing

| Handoff | Spec and plan that existed before this pass | What was missing | Done now |
|---|---|---|---|
| `adaptive-peak-and-skills.md` | none | everything | spec 14, `adaptive-peak-feasibility.md` (the ten items), `adaptive-peak-plan.md`, `adaptive-peak-survey.md`, ADR-0080, H17 to H22, epic E20 |
| `customization-hypothesis.md` | none | everything | spec 15 (with the answers to its section 9), `customization-plan.md`, H23 to H26, epic E21 |
| `sticker-page-hypothesis.md` v0.2 | spec 13, `sticker-page-plan.md`, ADR-0077 and 0081 to 0084, the matrix | nothing the handoff asked for; checked item by item (section 3) | none needed |
| `requirements-draft-v0.4.md` | `foundation-review.md` section 5 had mapped it | an up-to-date statement | this document |
| `north-star-bond-days.md`, `character-and-movement.md`, `sticker-test.md` | spec 05, spec 06, `sticker-test.md` plan | nothing | none needed (context only) |

## 3. The sticker handoff, point by point (nothing rewritten)

| Asked | Where it is |
|---|---|
| Desktop copy / paste and drag-and-drop the main path; mobile share beside it | spec 13 section 1 |
| Multilingual data model | spec 13 section 2 |
| Client-side search (diacritics folded, fuzzy) | spec 13 section 3; built (v0.2) |
| Permalinks and tag pages | **Decided against for now** (ADR-0083: no permalink pages and no stories); tags exist as search terms. This differs from what the handoff asked, by the author's own answer. |
| v0 = static PNG only | spec 13 and ADR-0077 |
| Zalo and Microsoft Teams first | spec 13 and the matrix (`handoff/sticker-test-matrix.md`) has rows for **both**, for paste, drag-and-drop and share, on web, desktop, Android and iOS; Messenger, Telegram and WhatsApp are second |
| Where the site lives, technology, deploy | spec 13 section 0: this repository (`site/`, `scripts/site/`), a static site made by Node scripts, GitHub Pages through `pages.yml` |
| Why streakboom.com may not be indexed | spec 13 section 7: a table of what was checked on 2026-11-13; **no cause concluded**; the answer needs the Search Console and Bing status of the URLs, which only the author can read |
| Claims about Zalo, Teams and iOS | **Unverified until the matrix is filled.** (The author said in a quick test that Zalo and Teams showed the transparent sticker correctly; that is his word, recorded in ADR-0077, and the matrix cells are still empty.) |

## 4. The v0.4 draft against today

| v0.4 item | Now |
|---|---|
| D1 Bond is the core; workplace humour is the voice | Kept. "Misses you" was struck (foundation review; ADR-0056 to 0059). |
| D2 Bond Days as the north star | Built and released (0.1.15, spec 05). A5 of the adaptive decisions: calling or sending Peak away does not count, and is counted separately. |
| D3 a keyless trial through a proxy | Still deferred; not in roadmap v2. |
| D4 sell nothing yet | Kept. |
| D5 global English office workers; Product Hunt | The order is set by roadmap v2: the **alpha first, then the lawyer, then anything public** (ADR-0071); Product Hunt only after (ADR-0059 point 4). The sticker test names Zalo (Vietnamese) **and** Teams (English offices). |
| D6 the three-question filter, D7 positioning | Kept; they are in the charter. |
| A Measurement | Done: spec 05, "Copy stats", the guardrails. The baseline across several people is still to come (the alpha). |
| B1, B2 lines and idle speech | Done: 263 lines per language; the attention modes (spec 11). |
| B3 office hours as examples | Content only; no line rewards staying late. |
| B4 the key flow | Built (spec 02); its funnel counters exist. |
| C Character and movement | Spec 06 and spec 10/11, built through 0.3.2; the open character questions were answered (ADR-0024, 0027). |
| D-1 Windows code signing | **Replaced:** SignPath Foundation (free) with releases built in CI and a hybrid key (ADR-0072); the paid options were set aside. 0.4.2 is the first release built by CI. Not signed yet. |
| D-2 Product Hunt | After the gates (above). |
| D-3 stickers on Zalo | Done differently: a web gallery (ADR-0049 to 0053), now a picker (spec 13). |
| D-4 macOS | Not started; after Windows is stable. |
| E Voice, three phases | **Replaced** by spec 14 section 9: a held hotkey first, no wake word, Gemini only at first; a new sense that needs its own ADR and the open switch. **Not before the alpha and the legal gate** (see the cross-check). |
| F Revenue: measure demand only | Kept. Skins and accessories are the first thing that could ever be sold (spec 15), and nothing is sold. |
| G Manifesto and privacy | Unchanged until a change makes it false; the voice and the learned places would change it, in the same commit as the code. |
| Q1 (Zalo or global) | Answered: Zalo **and** Teams (ADR-0077). |
| Q2, Q8 (version, site, multi-provider) | Answered by reality: 0.4.2; the site exists; four providers are released. |
| Q3, Q4 (character) | Answered (Peak; the refusal line; no "mỏ hỗn"). |
| Q5 (how many offline lines) | 263 per language. |
| Q6 (how to measure demand first) | The sticker page's counts, the alpha form, the customization question (plan C1). |
| Q7 (voice before launch?) | Not before the alpha (this document). |
| "Write `spec/07-requirements.md`" | Not written; `spec/07` is the terrain spec. This document is the statement. |

## 5. What the new decisions are

1. **Peak adapts instead of asking (ADR-0080, A1 to A6).** No taste in Settings; skills are body language; "Lượn đi" first; voice by a held key; calling or sending Peak away is not Bond Days.
2. **Customization is Peak's proposal, not a Settings page** (spec 15): colour, accessory, voice; one Peak; nothing from users; nothing sold.
3. **The sticker page is a picker for chat apps** (ADR-0077, 0081 to 0084; spec 13).
4. **The order is fixed by roadmap v2:** alpha, lawyer, public. Free signing and CI releases run beside it (ADR-0071, ADR-0072).

## 6. Cross-check: where the documents disagree with each other or with the code, and what must be measured first

### Contradictions and conflicts of order
1. **Voice against the roadmap.** Roadmap v2 puts voice outside the alpha ("waiting for the alpha's answer or a legal gate") and the foundation (ADR-0059) allows it only after the legal gate; spec 14's plan puts it last, which agrees, but the adaptive handoff lists it as R5 with an order "Vinh decides". **Decision needed:** state it in the roadmap that the hotkey and voice come after the alpha and the lawyer. *Recommended default: yes.*
2. **The alpha against the adaptive test build.** The alpha is planned on the unsigned **0.4.2** installer. Reading H19 (step S3) needs a build with "Lượn đi" and its counters. **Decision needed:** does the alpha get a test build with the skill, or does S3 wait for a second round? *Recommended: the alpha stays on 0.4.2; S0 and S1 run beside it; S2 is for the author alone; a later build with the skill is the second round.*
3. **One budget of unprompted moments.** Peak's unprompted slot (10 to 15 minutes, `free` or `play` only) is already used by lines, the name question, the start-with-Windows question, milestones, the update offer and up to 6 brain remarks a day. The adaptive suggestions (spec 14), the skin question (spec 15) and any later offer all want it. **They must share one weekly limit**, or Peak breaks charter article 2. Not yet written as a rule in one place; spec 14 section 8 holds the first version.
4. **Permalinks and tag pages.** The sticker handoff asks for them; ADR-0083 (the author's answer) says no for now. Not a contradiction but a record: the handoff is out of date here.
5. **A dial of dryness against "few settings".** The customization handoff's R4 is a dial; the charter forbids a setting for an amount of behaviour. Resolved by making it internal (spec 15); `gentle` stays because it is a value Peak cannot infer.
6. **Learned places and behaviour against the declined shoo (ADR-0047).** Resolved: a pattern may only be the reason for a **question**.
7. **Voice against the privacy contract.** A new sense, shown in the open, its own ADR, the README, `privacy.md` and the site changed together. Not resolved until the ADR exists.
8. **The handoffs describe the code of an older tree.** The adaptive handoff says the rig has front and side views only and the multi-provider work is uncommitted; the customization handoff says the same of the repository on GitHub. Today: one drawing mirrored, 23 poses, four providers released since 0.3.0. The order of the specs follows the code as it is.
9. **ADR and spec numbers collide between sessions.** Happened three times (0060, 0067, 0079). The rule in `AGENTS.md` (list the folder and `origin/main`) was followed late once. A cheap fix would be a lock file or a reserved range; not decided.

### What must be measured before going further
| Before | Measure | Where |
|---|---|---|
| Believing H18 | The phrase survey, the offline matcher, coverage and false positives | `adaptive-peak-plan.md` S0, S1 |
| Believing H19 | Leave counters against Quiet starts and Bond Days, with five questions | S2, S3 |
| Any walk to the edge | CPU on the author's machine with the engineering log's recipe (the baseline V-106 is still not measured; it needs 15 minutes with the author away) | V-106 |
| Any hotkey or voice | A spike for repeat and release, the microphone prompt and the system indicator, the audio format | spec 14 sections 6 and 9; V-121 |
| Any skin | The colour question in the alpha form; the default proved unchanged by a pixel comparison | `customization-plan.md` C1, C2 |
| Any accessory | CPU A/B and a look in the rarer poses | C5 |
| Claiming anything about Zalo, Teams, iOS | The matrix filled by hand with screenshots | `handoff/sticker-test-matrix.md` |
| Saying why the site is not indexed | The URL status in Search Console and Bing | spec 13 section 7 |
| Any numeric gate of the foundation | The foundation review itself says its 30 and 90 day gates cannot be passed with 5 to 10 people: read them as qualitative | `foundation-review.md` section 6, point 9 |
| `is_busy` for movement | It is not wired to walking and hopping (`busy: false`); wire it before any skill that moves the window | spec 14 AP-08 |

## 7. The order of work

1. **Now, no code:** send the phrase survey (S0, with the colour question 8); fill the sticker matrix by hand; read the Search Console status of the site.
2. **With the alpha (R4) on 0.4.2:** collect the answers; Vinh sets nothing further (the H18 and H19 thresholds are already set).
3. **After the answers, with Vinh's go:** S1 (the offline table), C2 (the palette proof), then S2 (the smallest "Lượn đi", for the author alone).
4. **Second alpha round, if H18 and H19 hold:** the skill build, the leave counters, then the model tag (H20) and the colour question in the app (C4).
5. **After the alpha and the lawyer:** the learned places and suggestions, the hotkey spike, voice with its ADR, accessories and the dryness dial.
6. **In parallel, as before:** the second CI release (CI-3), then the SignPath application (AP-1); the second CI release needs a change worth releasing.

## Not verified

This document compares documents; it ran nothing. The status of the sticker matrix, the Search Console data and the legal gate are as of 2026-11-13 and only the author can update them.
