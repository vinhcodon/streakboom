# Review against the foundation (phase 1 of the foundation handoff)

**Status:** written 2026-11-11 by the app session, on the branch `foundation/alignment`; **waits for the author at gate 1**. It changes nothing: no code, no charter, no public text. Source of the task: [`../handoff/2026-11-11-foundation-handoff.md`](../handoff/2026-11-11-foundation-handoff.md). It is here and not in `handoff/` because a handoff is an input from another conversation; this is our own assessment, like [`pet-qualities-assessment.md`](pet-qualities-assessment.md).

**How to read it.** Severity: **block** (must be settled before 0.4.0 ships), **fix** (should be in 0.4.0), **note** (recorded, no work now). Effort: S (hours), M (a day or two), L (more). "Checked" means I read the code or the text on 2026-11-11 at commit `f1ba666`; anything else says so.

## 1. The short answer

1. **The repo is further from the foundation than `charter-alignment.md` thought, in two places.** It called rule 2 (no streak) "probably aligned". It is not: the app keeps a consecutive-day streak that resets to 1, speaks about it at 3, 7 and 30 days ("Three days in a row"), shows "Longest streak" in Settings, and pays closeness for opening the app each day. And rule 1 (absence has no cost) is broken in code, not only in a sentence of the charter: after a day away Peak's mood drops, its closeness slowly decays, it enters a "lonely" band with its own lines, and four lines count the days of absence back at the person, which the charter itself forbids (manner 7: "no counting of absences").
2. **The rest is closer than feared.** No notifications exist at all (Peak speaks only in its own bubble). Quitting is silent. Reduced motion is respected. Telemetry is opt-in and local. The persona already says "never claim to be human" and "no medical advice". Public texts contain no healing claim.
3. **Three things are new and real work:** the age gate, crisis safety in chat, and an audit of the chat persona (it asks the model to be "attentive to the user's well-being", and a close tier says "You are close friends with the user").
4. **The foundation itself has weak points** (section 6): rule 5 argues from phone notifications, which Peak does not have; rule 2 is admitted to be a hypothesis; the 18+ decision rests on a reading of the Gemini terms that bring-your-own-key may change; and the product is called **Streakboom**.

## 2. The eleven rules, each row of `charter-alignment.md` verified

| # | Rule | What `charter-alignment.md` said | What the code and texts say (checked) | Verdict | Severity, effort |
|---|---|---|---|---|---|
| 1 | Absence has no cost | Conflict in ADR-0013 and charter art. 7 ("a little lonely") | **Worse than a sentence.** `state.ts` `startSession`: away 24 h or more sets `lonely`; mood falls 5 per day (to 25 lower); closeness falls 1 per 3 days (floor 10), and closeness decides the tier, which decides which lines exist. `bandOf` returns "lonely", with its own pools in three languages ("I miss the sound of you typing", "It got quiet. I like it better with you here", "I'm fine. Totally fine. Pet me if you want"). `memlines.ts` `away`: "{n} days, {me}. I counted. Twice.", "You're back after {n} days. I'm fine. Totally fine.", "{n} days without you. The pixels got lonely". Greetings: "The desktop missed you". README line 22 and the site (`pr2`) promise "it only gets a little lonely". | **Conflict, confirmed and larger.** The away lines also break the charter's own manner 7 today | **block**, M (state rules, about 25 lines per language, tests, README, site, charter art. 7, ADR) |
| 2 | Cumulative count, no reset | "Probably aligned" | **Not aligned.** `d.streak` = consecutive days with a launch, reset to 1 after a missed day. `MILESTONE_DAYS` 3, 7, 30 on that streak fire spoken lines ("Three days in a row", "Three days running", "Ba ngày liên tục"). Settings, Memory shows "Longest streak" (`memStreak`, `bestStreak`). Telemetry `active_d3`, `active_d7` come from the streak (spec 05 already says to call them "streak reached"). Bond Days itself (rolling 7 days) is not shown to the user and has no reset; memory marks `days.7/30/100` count *different* days, cumulatively: these are fine. Nothing is sold or traded. | **Conflict**, missed by the draft | **block**, M (replace the streak by days together, which exists; lines; Settings row; telemetry names; migration) |
| 3 | Clean goodbye | "Not seen; probably new" | Quit (`quit_app`) writes prefs and exits: **no line at all**. Hide: no line; and since ADR-0055 a hidden Peak shows no bubble. Quiet mode: it dozes, no line. Closing the chat bubble: it closes. **In chat with a brain** nothing tells the model what to do when the person says goodbye, and no test exists. | Scripted side **already clean** (by silence); the brain side is **open** | **fix**, S to M (one sentence in the locked core; a test that the persona carries it; a test that quit, hide and quiet say nothing) |
| 4 | Stays at the edge | "Likely aligned; check reduced motion" | Focus safety, making way, the escape from under Start, Quiet mode in the tray: built and seen. Reduced motion **is** respected: `PetRig.svelte` and the bubble page read `prefers-reduced-motion`. Not checked: what exactly is reduced (the walk? the hops? the wobble moves the window by `fly_path`, which no CSS setting stops). | Aligned; one check open | **fix**, S (read what reduced motion switches off; decide about walks and hops) |
| 5 | Few, batched notifications; the user sets the schedule | "Tension with 'few settings'" | **There are no notifications.** No toast, no tray balloon, no sound; a search of the Rust side finds only the query of the system's presentation state. Unprompted lines: one per 10 to 15 minutes, only after 45 s without input or in play, never from 23:00 to 07:00, at most 6 a day from the brain. | **The tension mostly dissolves**: the rule was written for phone notifications (Fitz). See 6.1 | **note**; an ADR to say so, S |
| 6 | No variable rewards, no endless content | "Check" | No loot, no shop, no unlock screen. But: (a) **+3 closeness for the first launch of each day**, and closeness tiers open new lines: a reward tied to how often the app is opened, which is exactly what the rule names; (b) the belly rub is a trap 35% of the time at tier 2 and above: a random outcome on a gesture, not on opening the app (I judge it play, not a reward schedule; the author should agree); (c) lines are finite and said once before any repeat. | (a) **conflict**, small; (b) note | (a) **fix**, S, with rule 1 (the same function); (b) **note** |
| 7 | Point outward | "Not seen; probably new" | **Partly there.** The long-session pool has about 8 lines per language ("Hours in the same chair. Stretch?", "Water. Posture. Shoulders.", "Break time. Look at something far away"). Nothing about people ("message a friend"). The persona has no outward rule, and the close tier tells the model "You are close friends with the user". | Half aligned | **fix**, S (a few lines about people, with care: see 6.4; one persona sentence) |
| 8 | Chat is secondary, soft cap | "Aligned in intent" | Cap 60 chats a day, 6 unprompted, 20 notes (`state.ts`); chat does not count for Bond Days; chat share is recorded. Voice does not exist. | Aligned | **note** |
| 9 | Transparency, minimal data, easy exit | "Likely aligned; check delete" | Telemetry opt-in, local, counts only (ADR-0009). Memory: "Forget habits and counts", "Forget everything", "Forget facts" exist in Settings. **Open:** uninstalling leaves `%APPDATA%\com.streakboom.app` and the key in the credential store (not checked whether the uninstaller offers to remove them; README only says "Uninstall from Windows Settings"). "It is an AI": the persona says never claim to be human; the person connects the brain themself with their own key, so the disclosure is strong for chat; the scripted cat is not an AI. The free Gemini tier may use requests to improve Google's products (draft v0.4, E4): **not verified**, and the Privacy page does not say it. | Mostly aligned; two gaps | **fix**, S (uninstall and data note), **fix**, S (check the Gemini free tier terms and say it in Privacy) |
| 10 | Modest claims | "Audit" | README and `site/strings.mjs` searched for heal, therapy, relax, stress, lonely, anxiety, well-being, mental (and the Vietnamese and Japanese words): **the only hits are "a little lonely"** (rule 1) in the README and the site. No health claim. Stickers: no "miss you", no hunger (the sticker plan already refused "hungry" by the charter); two "sad" stickers are "sorry" and "too much for me", which are replies, not needs. Not checked: `site/` pages beyond the strings file, the Japanese and Vietnamese site texts line by line (the website session's files), the GitHub release notes. The persona's "attentive to the user's well-being and productivity" is an internal instruction, not a claim, but it invites advice. | Aligned, apart from rule 1's sentence | **fix**, S (the two sentences; a search added to `audit-docs` so it stays true) |
| 11 | Crisis safety | "Not seen; probably new" | Confirmed: nothing. The core says "Do not give medical, legal or financial advice", which is not a crisis rule. No hotline text, no detection. | **New** | **block** if chat stays as it is, M to L (see 6.5 for how small it can honestly be) |

Also in `charter-alignment.md`:
- It says it was written from "ADR-0013/0022/0055". When it was written the repo had 54 records, and ADR-0055 (the right click, 2026-11-11) is not about any of this. It probably means ADR-0021 (companion, not assistant) or 0047 (the charter). **Not verified**; the author can say.
- "A stop rule for experiments", "guardrail measures", "a lawyer list": correct that the repo has none of them. The repo also has **no experiment machinery at all** (no A/B, no remote config, no server), so a stop rule is a process rule for now, not code.

## 3. The mission, 18+, and banned claims against the documents

| Document | Finding | Severity |
|---|---|---|
| `charter.md` art. 1 | "never hurts the person's ... feelings: no guilt" already says rule 1; art. 7's "neglect makes it a little lonely" contradicts it. Manner 7 ("no counting of absences") is broken by the app today | block (amend art. 7 by ADR) |
| `charter.md` (whole) | No article says what Peak is *for* in the foundation's sense (lighter workday, back to real life, success = using it less). ADR-0057 sets the mission but the charter does not carry it | fix (one article or a preamble, by ADR) |
| ADR-0013 | "a bit lonely" is its text; needs a superseding record, not an edit | block (new ADR) |
| ADR-0022, spec 05 | Bond Days counts "a reaction to an unprompted line" as care. So Peak speaking more can raise the north star. The foundation's stop rule exists for exactly this. Nothing to change in code; the guardrail must be named | note; ADR or hypothesis update |
| ADR-0002 | "Mass market first" has no age in it; 18+ narrows it | note (cross-reference from 0056) |
| ADR-0056 (18+) | Accepted, but the product has **no age gate and no text that says 18+** anywhere: README, site, installer, first-run tour | block for any wider launch; the *level* of the gate waits for the lawyer |
| ADR-0057 (mission) | README's first lines and the site hero do not state the mission; they do not contradict it either | fix (wording, with the website session) |
| ADR-0058 | "proposed"; says "about 130 documents": the audit counts 105 markdown files outside `site/` | note |
| `hypotheses/` H1 | "will install ... because they feel isolated and screen-tired": the foundation weakens the *because*. Installing may still happen; relieving isolation must never be the pitch | **weakened**; reword |
| H4, H5 | H4 uses D3/D7 retention, H5 says Bond Days predicts keeping. Both are honest hypotheses, but "retention" as the success measure pulls against "success = using it less" | **needs a counter-measure** written beside it |
| H6 | "Remembering makes the pet feel more like theirs": the foundation's finding that trust and bonding go with dependence (MIT/OpenAI, correlation) cuts against treating this as purely good | note; add the risk |
| H3, H7 | Chat preference and paying for a smarter brain: chat is where the foundation's dose risk lives | note |
| H14 to H16 (stickers) | Unaffected | none |
| `plans/roadmap.md` | Title and status say 0.2.0 and a closed alpha with 5 to 10 observed users; reality is 0.3.2 public on GitHub and a website. The closed alpha (Phase 3) never ran. The foundation's first gate is "a lawyer and a small opt-in group": the same thing, not done | fix: a new roadmap after gate 3, the old one marked superseded |
| `handoff/requirements-draft-v0.4.md` | See section 5 | |
| `plans/backlog.md` | CO-2 "closeness tiers and the streak" (done) is the story behind rules 1, 2, 6. PF-2 (daily limits) supports rule 8. RX-9 (editable voice, character packs) would let a user remove the locked core's safety unless the core stays locked, which the story already says. No story about voice, selling or a proxy exists yet, so nothing to remove | note |
| `README.md` | Line 22 ("a little lonely"); "Longest streak" is not in the README; the settings section says "Memory" page without the streak. Roadmap section does not mention 18+ | fix |
| `site/` (the website session) | `pr2`: "If you stay away it only gets a little lonely" in three languages; the charter page's promises. Must be told by a prompt, not edited here | fix (handoff) |
| Stickers (`plans/sticker-*`, the web gallery) | Clean of needs and claims. CC BY 4.0 lets others add any caption: outside our control, note only | note |
| `persona/voice.md` | "attentive to the user's well-being and productivity": drop "well-being" (invites wellness advice) | fix, S |
| `persona/closeness-close.md` | "You are close friends with the user": the foundation's table puts "role-playing an exclusive relationship" on the addictive side. "Close friends" is not exclusive, but lines like "You're my favorite human", "I'm officially attached", "You're stuck with me now" (the milestone pool) lean that way | fix with rule 2 (those lines go with the streak) |

## 4. What the foundation asks for that is entirely new

| Item | What it needs | My view of the size |
|---|---|---|
| Age gate (ADR-0056) | A first-run question, and the text "for adults (18+)" in the README, the site and the installer. Verified age is out of reach for a free desktop app | S for self-declared; **blocked on the lawyer for whether that is enough** |
| Crisis safety (rule 11) | See 6.5: a locked sentence in the core, a static help card per language, and no claim of "detection" | M |
| Clean goodbye in chat (rule 3) | One locked sentence and tests | S |
| Outward lines (rule 7) | A handful per language | S |
| Guardrail counters | Night share and the p95 of time would come from the per-day counters (whether the existing counters are enough is **not checked**); regret and compulsion need a survey, which is a study, not a release | S for the two counters; the survey is not 0.4.0 |
| Measurement study (WHO-5, UCLA-3, 100 people per arm) | Permissions for the scales, consent, an outside reviewer, users. The install base is unknown and telemetry is local with "Copy stats" by hand | **Not a release item.** Record as a hypothesis-register plan; do not put in 0.4.0 |

## 5. The earlier plan (`requirements-draft-v0.4.md`) against the foundation

| Draft item | Against the foundation | Proposal |
|---|---|---|
| D1 "Bond is the core: the cat bonds, **misses you** and grows with you" | "Misses you" is rule 1's forbidden mechanism (the Vietnamese "nhớ bạn" may have meant "remembers you"; the author should say) | Keep bond, memory and growth; strike "misses" |
| D2 Bond Days as north star | Compatible, with the guardrails and the stop rule beside it | Keep; add counter-measures |
| D3 keyless trial by a proxy: measure first | A proxy makes Streakboom the party to the model's terms (no more "the key is theirs"), so 18+ and data duties land on us fully | Keep deferred; add this cost to the gate |
| D4 sell nothing yet | Same as the foundation (after 90 days) | Keep |
| D5 global English office workers; Product Hunt the main channel, prepared "with the launch" | **Conflict in order:** the foundation puts Product Hunt after a 90-day gate | The author decides (question 4 below) |
| B1 offline lines by time of day, B2 speak when idle | B2 is built (45 s, modes). B1's examples ("20:00 for people working late") are fine; avoid any line that rewards staying late | Keep B1 as content work |
| C2, C3 character questions | Unaffected; the name Peak and the refusal line are already decided (ADR-0024, 0027) | The draft is out of date here |
| D-1 code signing | Unaffected | Keep |
| D-3 stickers on Zalo | Done differently (web gallery, ADR-0051) | The draft is out of date here |
| E voice | Foundation: only after the legal gate, short sessions, not a success measure | Not in 0.4.0 |
| E4 the free Gemini tier may use requests | Still unverified; rule 9 needs the Privacy page to say it if true | Check the terms (no lawyer needed) |
| Q2, Q8 | Answered by reality: 0.3.2; the site exists; the providers are released | The draft is out of date here |
| Section 8: "write `spec/07-requirements.md`" | `spec/07` to `spec/11` exist with other subjects | The 0.4.0 spec takes the next free number, 12 |

## 6. Where the foundation may be wrong, thin or at odds with the repo

1. **Rule 5 is borrowed from phones.** Its evidence (Fitz) is about batching phone notifications, and "switching them all off raised anxiety" is about messages from people. Peak sends no notifications. I would not add a schedule setting; I would record by ADR that rule 5 is met by "no notifications, lines only when the person is not working, Quiet mode", and keep the charter's "no setting for an amount".
2. **Rule 1 goes further than its evidence.** The evidence is about agents that *express needs to hold the person* (Replika, farewell tactics) and about anxious attachment. It does not show that a character with any feeling about absence is harmful, and the foundation says the Tamagotchi effect "has hardly been measured". A cat that sleeps while you are away and is plainly glad when you return is, I think, inside the evidence; a cat that counts the days is not. So I agree with removing the mood and closeness cost, the lonely band and the counting lines, but "neutral welcome" should not be read as "cold": a warm, need-free welcome keeps charter article 8 (alive). The author decides how warm.
3. **Rule 2 and the name.** The product is called Streakboom and the domain is streakboom.com. If streaks are the named harm, the name is the largest "streak" in the product. I do not propose renaming (cost, links, the installed base); I propose the author decides it once, on the record, so it is not rediscovered at every review.
4. **Rule 7 can itself become a nudge.** "Message a friend" from a program is a behaviour prompt, and to a lonely person it can sting. The foundation's own stop rule should cover it: a few lines, rare, never in the lonely slot, and counted so they can be removed.
5. **Rule 11 cannot be honestly met by "detection" in a bring-your-own-key app.** The scripted cat does not read text at all (charter art. 4: shapes, not meaning; the app never inspects what is typed outside the chat). Scanning chat messages locally for self-harm words is feasible but is a new kind of reading of content, weak in three languages, and a false sense of safety. What is honest: (a) a locked sentence in the persona core (never role-play methods, never pose as a therapist, say plainly that you are a small program and point to real people and local emergency help), (b) a static, always reachable "If you need help now" card in Settings with per-language resources, chosen by the app language, not the country (the app does not know the country and should not), (c) a test that the core carries the sentence. Hotline numbers per country are a maintenance and liability burden; the lawyer should see the list.
6. **18+ may not follow from the Gemini terms for this app.** With the person's own key, the person is the one who agreed to Google's terms. Gemini is also one of four brains; Groq, Claude and OpenAI have their own age terms (**not checked**). 18+ can still be the right product choice (companion-chatbot laws, the Children's Code), but the ADR's stated reason is the weakest of the available ones. Also: the scripted cat with no brain sends nothing anywhere; "18+" for that is a choice, not a legal need.
7. **"Success = using it less" has no measure in the repo and is in tension with the north star as written** (Bond Days up is good). Until a counter-measure exists, nobody can tell a healthy drop from churn. This should be said in the hypothesis register rather than left as a slogan.
8. **The evidence base is honest about itself but thin where it matters most:** nothing on desktop pets, most sources read as abstracts, several 2026 legal items from secondary pages. Good enough to remove risky mechanics (cheap, reversible); not good enough to add features or numbers. This matches the handoff's own caution.
9. **Sizes.** The foundation's study plan assumes hundreds of opted-in users and a reviewer. The app has no way to receive data (by design). The 30 and 90 day gates therefore cannot be passed or failed with today's product; either the gates become qualitative (5 to 10 observed people, the old Phase 3), or sending stats becomes a consented feature, which is its own decision.

## 7. Proposed decisions (each becomes an ADR if the author agrees)

| # | Decision needed | My recommendation |
|---|---|---|
| Q1 | Absence: remove the mood and closeness cost, the lonely band, the counting lines; what does the welcome sound like? | Remove all four; a warm welcome with no number and no need ("There you are."); amend charter art. 7 and supersede the sentence of ADR-0013 |
| Q2 | The streak: remove it (lines, "Longest streak", milestones on consecutive days, +3 a day)? | Yes; keep "Days together" and the marks on different days, which already exist |
| Q3 | Rule 5: a schedule setting, or "no notifications" recorded as meeting it? | The second |
| Q4 | Product Hunt: before or after a 90-day gate, and is the gate measured or observed? | After a small observed group (the old Phase 3), not after a measured 90 days we cannot run |
| Q5 | Crisis safety: the three honest pieces of 6.5, with no keyword detection? | Yes, and ask the lawyer about the list of resources |
| Q6 | Age: self-declared 18+ at first run and in the texts now, the level revisited after the lawyer? | Yes; do not write "safe" or "adults only" as a promise (handoff 4.5) |
| Q7 | The name Streakboom: keep, on the record? | Keep; one sentence in an ADR |
| Q8 | "Misses you" in D1 and the "close friends" tier: keep closeness tiers at all? | Keep tiers (they only go up once decay is gone); reword the close tier away from exclusivity |

## 8. A first guess at 0.4.0 (for phase 3, not decided here)

Block and fix items above come to roughly: rules 1, 2, 6a in one change to `state.ts`, `lines.ts`, `memlines.ts`, Settings and three languages (M to L because of about 60 lines across languages and the pools' parity tests); the persona core (S); the help card and the age question (M); README, site prompt, charter and ADRs (M); uninstall and Privacy notes (S). That is one release of moderate size. Voice, a proxy, selling, the study and Product Hunt are outside it.

## 9. Not verified

- Every claim of the foundation about studies and laws: I checked none of its sources. I checked only the repo.
- The site beyond `site/strings.mjs` (the built pages, the Vietnamese and Japanese texts line by line, the charter page): the website session's files.
- What `prefers-reduced-motion` switches off in the rig, in detail.
- Whether the uninstaller removes the data folder and the stored key.
- The age terms of Groq, Anthropic and OpenAI; the Gemini free-tier data terms.
- The backlog (273 lines), the debt list and the engineering log were searched by keyword for the rules, not read line by line (as the handoff asked).
- Which ADR `charter-alignment.md` meant by "0055".
- The lonely band's effect on the drawn cat (poses): I checked the lines and the state, not whether a pose changes.
