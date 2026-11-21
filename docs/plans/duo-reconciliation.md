# Duo: reconciling the documents (job B of `docs/handoff/duo-prototype-and-cross-review.md`)

**Status:** written 2026-11-21 by the app session. **Only lists and proposes; nothing public is changed** (README, the website, Settings texts, ADRs stay as they are; the website session and the author decide). Every claim below was checked by opening the file or running the code named; what could not be checked is said so. Repository state: `main` at `bdefa61` (2026-11-21).

## 1. The size of the screen picture grid: the real number and the documents that are wrong
**The code** (`app/src-tauri/src/picture.rs`): `GRID_W = 192`, `GRID_H_MAX = 216`, `grid_dims(w, h)` = 192 wide and `round(192 * h / w)` tall, cut to 1 to 216. Its tests: 1920 by 1080 gives 192 by 108, 2560 by 1440 gives 192 by 108, 1920 by 1040 gives 192 by 104, a work area 1000 by 100000 gives the cap 216. **So the width is always 192; the height follows the screen: 108 on 16:9, 120 on 16:10 (1920 by 1200), 144 on 4:3, 54 on a 32:9 screen, up to 216 on a tall (portrait) work area. The most cells are 192 by 216 = 41,472, twice the 20,736 of "192 by 108".** `GRID_H_MAX` is the leftover of the doubled grid (216 = 2 by 108) that ADR-0121 refused: the width went back to 192, the cap did not.

| Where | What it says | Verdict |
|---|---|---|
| `picture.rs` header | "At most `GRID_W` by `GRID_H_MAX` cells" (names, no number) | right |
| `docs/decisions/0128` point 2 | the text of the Settings checkbox: "at most 192 by 108 squares" | **wrong as a maximum** (right for 16:9) |
| `app/src/lib/ui.ts` lines 354, 613, 872 | the same sentence in English, Vietnamese and Japanese, **shown to the person in Settings** | **wrong as a maximum**: the text the person agrees to |
| `CHANGELOG-preview.md` 0.11.10 | "at most 192 by 108 squares" | wrong as a maximum (already published as a Preview note) |
| `docs/privacy.md` line 17 | "at most 192 by 108 cells (too small to read a letter from)" | wrong as a maximum |
| `docs/plans/backlog.md` PS-1, `docs/plans/screen-picture-plan.md` sections 1 and 2, `app/src/lib/picture-privacy.test.ts` line 1 | "at most 192 x 108" | wrong as a maximum |
| `docs/decisions/0121` | title "grid is doubled to 384 by 216"; its status line says it was **refused by its own check** and the grid stays 192 by 108 | the title misleads (an ADR is not rewritten); the status line is right about 192 and silent about the cap of 216 |
| `docs/decisions/0119` | "at most 192 by 108" in stage 1 | wrong as a maximum, a record of its day |

**Proposed wording** (English; the Vietnamese and Japanese follow it): "…a grey picture of the screen 192 squares wide (at most 216 tall; 108 on an ordinary widescreen), too small to read a letter from…". **And a second finding that matters more than the number:** the claim "too small to read a letter from" depends on the **size of a cell in screen pixels**, not on the number of cells. ADR-0121 measured it on a 1920-pixel screen: 192 cells across (10 px each) cannot be read, 384 across (5 px each) can. On a **narrower screen the cells are smaller** (1366 px wide: about 7 px; 1280 px wide: about 6.7 px), so the guarantee **was measured only at 10 px a cell and is not shown at 7 px**. Proposal: a check on a 1366 by 768 picture (or the real screen of a laptop) before the Settings switch goes to a Stable, and the cell size, not the cell count, as the bound (for example a minimum of 10 physical px per cell, which makes the grid narrower on small screens). Open until checked (a new row in `verification-debt.md`, M or V number given by the author's session).

## 2. The privacy promise: every absolute sentence, and the exact wording
**What is true** (code, `docs/privacy.md`, ADR-0119, ADR-0128, the tests of PS-9): Peak **never reads what you type, a window's title or the name of a program, or what is written on the screen**. By default **it does not look at the screen at all**. **Only if the person turns on the optional screen picture** (off by default, a Preview build only until a Stable carries it) does it take a tiny grey picture of the screen (192 squares wide, see section 1) in memory about every ten seconds while awake, look only at which squares are empty and where the brightness changes, and drop it at once; the pixels of the screen are the input of that grey picture, but it is too small to read a letter from (at 10 px a cell), it is never saved, logged or sent (tests in `picture.rs` and `picture-privacy.test.ts`), Peak's own windows are left out, and nothing is drawn on the screen. **So "it never looks at the pixels of the screen" is false for a build with the switch on; "it never reads what is on the screen" is true in the sense of the content and needs the words around it to be true.**

| Where (file:line) | The sentence | Today (Stable 0.10.0 on the website) | When a Stable carries the switch |
|---|---|---|---|
| `README.md:54` | "It never reads what you type or what is on your screen. It senses only activity … and the shape of the screen …" | accurate | **needs the exception**: "unless you turn on the optional screen picture" |
| `site/strings.mjs` EN `a8` (line 84), `not_items` (89), `pv_sections` "What Peak notices, and what it never reads" (116), `pr1` (146), and the Vietnamese (78, 83 and the privacy section) and Japanese ones | "It never reads what you type, your screen, window titles or app names" and the like | accurate | **needs the exception**, and the privacy page needs the new list item |
| `AGENTS.md:24` | "no key logging, no screen or window-title reading" | accurate for the contract of the code that ships | needs "no reading of what is on the screen; the screen picture is a sense the person switches on" |
| `CONTRIBUTING.md:25` | "No screen or window-title or app-name reading" | same | same |
| `docs/charter.md:15`, `spec/11:69` (article 4) | "senses activity and the layout of the screen, never what is written on it, unless the person switched a sense on in the open" | **accurate already**: it is the exception, and the screen picture is that sense (ADR-0128) | none; this is the model sentence |
| `spec/06:87`, `spec/06:142` | "no screen-content reading" | accurate (the picture is not content), but a reader may take it for "no screen input" | a pointer to ADR-0119 |
| `CODE_SIGNING.md:51` | "It never reads window titles, application names or what is on the screen." | accurate today | needs the exception; it is the page a signing programme reads |
| `docs/privacy.md` (the list) | the experiment paragraph at line 17 is accurate except the size (section 1) | right in substance | add the Settings switch as a normal item, not "an experiment in test builds" |
| `app/src/lib/ui.ts` (Settings text, 3 languages) | the switch text is accurate except the size (section 1) | right in substance | fix the size |

**Proposed sentence for the places above** (English): "Peak never reads what you type, the titles of your windows or what is written on your screen. By default it does not look at your screen at all. If you turn on the optional screen picture (Settings, Privacy), it takes a tiny grey picture in memory, 192 squares wide, too small to read a letter from, looks only at which squares are empty, and drops it. Nothing is saved or sent." Vietnamese: "Peak không bao giờ đọc bạn gõ gì, tiêu đề cửa sổ hay chữ viết trên màn hình. Mặc định nó không nhìn màn hình của bạn. Nếu bạn bật tùy chọn ảnh màn hình (Cài đặt, Riêng tư), nó chụp một bức ảnh xám rất nhỏ trong bộ nhớ, rộng 192 ô, nhỏ đến mức không đọc nổi một chữ cái, chỉ xem ô nào đang trống rồi bỏ ngay. Không có gì được lưu hay gửi đi." **Deciders: the website session (the strings) and the author (README, AGENTS, CONTRIBUTING, CODE_SIGNING); the Stable that carries the switch is the moment, not before** (today's sentences are true for 0.10.0).

## 3. The references of section 14 of `peak-paws-living-spec-v0.2.md`
Checked by opening each file (2026-11-21):
| Reference | Result |
|---|---|
| Snapshot `f8e75bccca92f8fd12a3b580a30f45b54570b777` | exists in the history (the merge of 2026-11-15) |
| `docs/PROJECT.md`, `docs/charter.md`, `docs/foundation/streakboom-foundation.vi.md`, `docs/handoff/duo-characters-hypothesis.md`, `spec/19-duo-test-plan.md`, `docs/plans/duo-charter-impact.md`, `docs/plans/loop-engineering.md`, `docs/hypotheses/README.md` | all exist |
| ADR 0080, 0115, 0128, 0131, 0132 (and 0068, 0127, 0129, 0005, 0119, 0121) | all exist with those numbers and the described subject |
| `app/src/lib/{attention,events,beats,reactions,selector,memory,bond,state,perception}.ts` and `choose.ts`, `skill-run.ts`, `picture.rs`, `+page.svelte` | all exist |
| "attention.ts: Free after 45 s idle; Play 120 s after an interaction, ends after 20 s of work elsewhere" | **correct**: `FREE_AFTER_MS = 45_000`, `PLAY_FOR_MS = 120_000`, `WORK_BREAKS_PLAY_MS = 20_000` |
| "reactions.ts has a quota of reactions" | correct: a cool-down per event and a budget of a minute (lines 1 to 36) |
| "bond.ts: Bond Days = the days with care in the last 7 days, not a lifetime counter" | **correct**: `bondDays` counts the last 7 days, today included |
| "memory.ts: a name, habits, facts, important days, the seat" | correct: `petName`, `callMe`, `learn`, `marks`, `keptDays`, `seat` |
| "`+page.svelte` about 157 KB" | **correct at the snapshot** (157,010 bytes); today 162,769 bytes |
| "ADR-0080 once ruled out reminders; ADR-0115 built the kept days in Preview" | correct (A2 "no timers or reminders"; remind is in the Preview line, not in Stable) |
| "ADR-0132: one repository, one app, a platform layer; no code moved; macOS not tried" | **outdated since the snapshot**: stage 2 (the platform layer, Win32 code moved unchanged) and part of stage 3 (scripts) are built and on `main`; macOS is still not tried |
| "ADR-0128 says 192 by 108 at most; the code says `GRID_W` 192 and `GRID_H_MAX` 216" | **correct, and it is the finding of section 1** |
| "Spec 19 updated: four stickers go up as normal stickers; the control test does not run" | correct (ADR-0129) |
| "AGENTS: Stable and Preview share data; add fields with defaults only" | correct |
| "The foundation is a limited self-published reference" | **cannot be checked** (the external research it cites was not opened) |
| The website says v0.10.0 of 14 November 2026 | correct (`CHANGELOG.md`); the site has not changed that fact since |

## 4. Other mismatches found while reading the two handoffs
1. **D-02 (the person chooses Peak, Paws or both) against ADR-0080 A1 and the charter.** ADR-0080 A1: "no choices of taste (colour, accessory, voice, seat) are added to Settings. Peak notices and suggests." `spec/15` marks "the person chooses in Settings" as **dropped**; the charter's "Few settings" allows a setting only for a consent, a credential or necessity, or a value Peak cannot infer. Which pet appears is a choice of taste: **it conflicts unless a new ADR makes it an exception** (the handoff already says: no picker in the prototype, a developer flag instead).
2. **F-08 of the spec (choose one pet to answer in the chat) against the handoff's own constraint "no AI chat for Paws".** Not compatible as written; one of them has to give way, or the chat stays Peak's.
3. **The 0.4.1 notes in `docs/PROJECT.md` say "one Peak at a time"** while ADR-0068 is a guard against a second *start* of the program; the README says neither. The words in PROJECT.md invite the misreading that `duo-charter-impact.md` corrected.
4. **The "quản gia" (butler) role of Paws is new.** The word appears nowhere in the tracked material of the repository (ADR-0127, ADR-0131, the sticker captions, the specs); it comes from spec v0.2 (section 6, the character bible, and 14.4) and is question 3 of the handoff. It is a *self-appointed* role between the two pets according to both, never aimed at the person; to be decided by the author (question 3 of the handoff).
5. **The number of the SB2 hypotheses and the H-IDs of the spec** do not clash with H1 to H33 of the repository (the spec says so itself); when imported, the repository's next free H number applies.
6. **Spec v0.2 F-06's quotas** (one active scene per 5 minutes, two per hour) are new numbers; the repository's own attention and reaction budgets are different mechanisms (the spec says so in 14.2); no clash, but no baseline yet either.

## 5. Not checked
The external research of the foundation; the live website beyond the strings file; the Vietnamese and Japanese privacy strings beyond the lines named; whether any other session has a README or site change in progress that touches these sentences.
