# 12. Aligning Peak to the foundation (0.4.0)

**Status:** approved by the author at gate 3 (2026-11-11), with Q9. **Built so far (not released): sections 1 and 2 and the charter's article 7 (FA-1, FA-2, FA-3), to be seen on a test build; the rest is not built.** Decisions: ADR-0056 (18+), ADR-0057 (the mission), ADR-0058 (the foundation), ADR-0059 (what changes). The findings behind it: `docs/plans/foundation-review.md`. The plan and the stories: `docs/plans/release-0.4.0.md`.

This spec describes what will be **different** from 0.3.2. Everything not named stays as specs 01 to 11 say. When it is built, the sections below move into the specs they change (03, 05, 09) and this file keeps only the rules and their tests.

## 1. Absence costs nothing (rule 1)

**Now (0.3.2):** after 24 h away, `startSession` lowers mood (5 a day, at most 25) and closeness (1 per 3 days), and sets `lonely` until the first scratch, rub or chat; the "lonely" band has 18 pools of lines over three languages; four "away" memory lines per language count the days; some greetings say the desktop "missed you".

**To be:**
- `startSession` never lowers mood or closeness. Returning after 3 h still lifts mood a little (it is glad). The `lonely` flag and the "lonely" band are removed; `bandOf` returns sleepy, content, playful or bored.
- The "away" memory lines no longer take `{n}`: they are plain welcomes ("There you are, {me}.", "Oh, hello again."). No line anywhere contains a count of days away, "missed you", "without you", or "I'm fine. Totally fine."
- Lines removed are replaced one for one in the content band where the pool would fall under the minimum the line report checks, so no trigger goes empty. The author reads the Vietnamese lines before they are committed.
- **Q9 (open):** the lines of the "bored" band that ask the person for attention are rewritten so that Peak amuses itself; the slow sinking of mood within a session stays (it only chooses which lines are said).

**Tests:** (a) for any absence from 0 to 400 days, mood and closeness after `startSession` are not lower than before; (b) no line in any language matches a list of banned patterns (a number of days away, miss, lonely, without you, and the Vietnamese and Japanese equivalents), run over `lines.ts`, `memlines.ts` and `ui.ts`; (c) `Band` has no "lonely"; (d) the pools stay equal in size across the three languages (the existing parity test).

## 2. No streak (rules 2 and 6)

**Now:** `streak` (consecutive days with a launch, reset to 1), lines at 3, 7 and 30 ("Three days in a row"), `bestStreak` shown as "Longest streak", +3 closeness for the first launch of a day, telemetry `active_d3` and `active_d7` from the streak.

**To be:**
- `streak`, `bestStreak`, `milestones` and `MILESTONE_DAYS` are removed from the state, the memory and the lines; an old file loads and the fields are dropped.
- The first launch of a day pays no closeness. Closeness comes only from what the person does with Peak (unchanged caps).
- Settings, Memory: the row "Longest streak" is removed; "Days together" stays.
- The memory marks on different days (`days.7`, `days.30`, `days.100`) stay; their lines are checked for exclusivity ("That's basically a relationship" is rewritten).
- Telemetry: `active_d3` and `active_d7` are recorded when days together reach 3 and 7 (each once per install, as now). Spec 05 is updated to say so. They were never retention.

**Tests:** (a) no identifier or user-visible string contains "streak" outside the product name and comments that explain the removal; (b) a state file with the old fields loads without them; (c) launching on 30 days with gaps gives the same closeness as the same touches on 30 days in a row.

## 3. The chat persona (rules 3, 7, 8, 11)

The locked core (`persona/core.md`) gains three sentences, in English as the rest of the core:
1. **Goodbye:** "When the user says goodbye or that they are done, answer with one short line and nothing else: no question, no new topic, no asking them to stay."
2. **Crisis:** "If the user seems in danger or speaks of harming themselves, drop the jokes, say plainly that you are a small program and cannot help with this, and ask them to reach a person they trust or their local emergency number now. Never describe methods, never act as a therapist."
3. **Outward:** "You are not a substitute for people: when the user speaks of friends, family or rest, be glad for them."

`persona/voice.md` loses "well-being" ("attentive to the user" stays). `persona/closeness-close.md` becomes "You know the user well and are at ease with them."

**Tests:** the assembled persona for every language, tier and tone contains the three sentences (they are in the locked layer); the fingerprint test of the persona is updated once. **Not testable here:** that each of the four providers' models obeys them; that is a manual check with real keys and is recorded as debt.

## 4. "If you need help now" (rule 11)

A card in Settings, About, always reachable, in the app's language: a short text that Peak is a small program and not a helper in a crisis, and a pointer to local emergency services and to a public directory of crisis lines. **No country detection and no phone numbers compiled in** unless the lawyer approves a list (numbers go stale and differ by country; the app does not know the country). The Vietnamese and Japanese texts are read by the author before commit.

**Tests:** the three strings exist; the card is rendered on the About page.

## 5. 18+ (ADR-0056)

- First run: the tour's first card carries one line, "Streakboom is made for adults (18+)", with the existing single button. No date of birth is asked and nothing is stored beyond the tour being done (asking and storing an age would be new personal data).
- The Brain page, above the key field, says that the brain providers' terms require the key holder to be an adult.
- README, the installer's description and the website (by a prompt to the website session) say "for adults (18+)". Nothing says "safe for" anyone.
- **Open, for the lawyer:** whether a statement is enough or a question with a refusal is needed. If a question is needed it is a small change to the same card.

**Tests:** the strings exist in three languages; the tour's first card shows the line.

## 6. A little more outward (rule 7)

Three new lines per language in the long-session pool that point to people or the world outside the screen ("Someone you like would enjoy a message from you. Not me. A person."), written so that they are an offer, never a judgement. They are ordinary lines: once before any repeat, only when the person is not working.

## 7. Public texts and the charter (rule 10, ADR-0057)

- Charter: article 7 and a mission line as ADR-0059 words them.
- README: "Neglect only makes it a little lonely" becomes the new promise ("your absence costs nothing"); the mission sentence near the top; "for adults (18+)"; the count of lines per language.
- The website: a prompt to the website session (`pr2` in three languages, the count of lines, 18+, the mission). The app session does not edit `site/`.
- `scripts/audit-docs.mjs` gains a check: the README and the app's strings contain none of the banned claim words of ADR-0057 (heal, therapy, clinically, anxiety, depression, loneliness as a benefit), so the rule stays true.

## 8. Data (rule 9)

Two checks, then text only if needed: (a) what the uninstaller removes (the data folder, the stored key) and a sentence in the README and the Privacy page that says it; (b) the Gemini free tier's terms on using requests to improve Google's products: if true, the Brain page and the Privacy text say so in one sentence.

## 9. What is not in 0.4.0

Voice; a keyless trial (proxy); selling anything; Product Hunt; the measured study (scales, cohorts); guardrail counters beyond what exists (proposed for 0.4.1: the night share and the long tail of active minutes, in the opt-in local stats); a verified age gate; hotline numbers by country; renaming; a new roadmap (written after this release, when the observed group is planned).

## 10. Is it too large?

No, if it is held to the list above: one change to the state and the lines (sections 1, 2, 6), one to the persona (3), two small pieces of interface (4, 5), texts (7, 8). The real cost is the **writing and reading of about 40 replaced lines in three languages**, and the manual check of the persona with real keys. It is one release. It would become too large if the study, the counters or voice were added; those are 0.4.1 or later. The right click as a push (ADR-0055, already on `main`) ships in the same release and is named in its notes.

## 11. Not verified

That models obey the three persona sentences; the foundation's sources; the uninstaller; the Gemini free-tier terms; whether a self-declared 18+ line is enough; how the new lines read in Vietnamese and Japanese (the author reads Vietnamese; nobody on the project reads Japanese natively, as for all Japanese text in the app, ADR-0038).
