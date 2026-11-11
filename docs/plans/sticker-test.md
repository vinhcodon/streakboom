# Plan: the sticker test (Zalo first)

Status: **2026-11-11 (ADR-0051): the stickers go on the website first, as images with Copy, Share and Download buttons, under CC BY 4.0, and nothing is submitted to Zalo or any store for now; the handoff for the website session is [`../handoff/website-stickers.md`](../handoff/website-stickers.md). The run of section 5 then starts when that page goes live (the author confirms), and steps 1, 6 and 7 (Zalo) wait.** Earlier: step 0 done 2026-11-10: Vinh answered all nine questions (ADR-0049); next is step 1 (verify Zalo's rules), which needs Vinh's Zalo account.** Answers in short: set named "Peak"; sticker 6 = the sample line with `sad`; no sarcasm; animated later; no download numbers needed (measure by short link only); sticker 3 sticker-only; sticker 8 = `curious`, "hungry" dropped; stills drawn outside the app; stop below 20 installs. Source: [`../handoff/sticker-test.md`](../handoff/sticker-test.md). Expressions and consistency rules: [`../../spec/06-character-and-movement.md`](../../spec/06-character-and-movement.md) section 7. Metric: Bond Days, [`../../spec/05-north-star-metrics.md`](../../spec/05-north-star-metrics.md). **No app code changes** (an optional render tool in step 3 needs its own approval).

Goal: bring new users (acquisition) at near-zero cost, and check that they bond as well as other users. Hypotheses H14 (installs), H15 (quality of the cohort) and H16 (drawing fixes the character) in `../hypotheses/README.md` (the handoff's H1 to H3, renumbered); H16 is judged at step 4 by what had to be decided. Backlog: epic E16 (ST-1 to ST-6). Unchecked items: V-89 to V-92 in `verification-debt.md`.

## 1. Steps, in order

| # | Step | Who | Done when |
|---|---|---|---|
| 0 | **Decide** the open questions: 1 to 5 of spec/06 section 7.5, and A to D. The set cannot be named, worded or measured without them | Vinh | answers written down (an ADR, as multiple choice, per the usual rule) |
| 1 | **Verify** the four facts of section 2 on the live registration page and help pages (needs Vinh's Zalo account for items 1 to 3; Claude can read the public pages) | Vinh, Claude | each item answered with the date and the source; the route chosen (Zalo, or the community route) |
| 2 | **Character sheet:** front and side stills of the cat from the rig, the colors and the face dials, one page. **v0.2, **approved by Vinh 2026-11-10 (front and side)** with the palette and the rules is in [`assets/sticker-character-sheet.svg`](assets/sticker-character-sheet.svg)** (drawn from the numbers in `keys.ts` and `draw.ts`; sit, stretch and loaf bodies not drawn) | Vinh with AI, Claude checks against spec/06 7.3 | Vinh signs the sheet off |
| 3 | **First pass drawn 2026-11-10** (15 stickers, icon, preview, 9 banners: [`assets/stickers/set-v0/`](assets/stickers/set-v0/)); waits for Vinh's look. **Draw 12 to 20 stickers (the list of 15 with texts is in [`sticker-set-v0.md`](sticker-set-v0.md))** (the Zalo minimum is 12, see section 2; spec/06 7.2: 1, 2, 4, 5, 7, 11, 12 exact; 6 and 8 after question F). Stills come from the sheet; generated images are compared with it one by one. Optional: a small tool to render stills from `LOOKS` (code, needs approval, question C) | Vinh with AI | eight transparent PNGs that pass spec/06 7.3 |
| 4 | **Consistency review** of the whole set side by side (proportions, eyes, ears, color); drop what drifts. Write down what the drawing forced us to decide (H3) | Vinh, Claude | a short note in the engineering log |
| 5 | **Measurement ready before submitting:** a short link for Zalo and one for each other channel (the download page), a record of the date each link went live; nothing is added to the app | Vinh (the website session builds the link or page) | links tested; thresholds of section 5 written and dated |
| 6 | **Package and submit** to Zalo per the current rules read in step 1 (size, format, name, author name with "Streakboom", description, no third-party content) | Vinh | submitted; date noted |
| 7 | **Wait for review**, and fix what Zalo asks | Vinh | approved or stopped (section 5) |
| 8 | **Run 4 to 6 weeks** after approval; count by the short links; note installs from each source | Vinh | the run ends on its date |
| 9 | **Read the result** against the thresholds, decide stop, continue or widen, write an ADR and move the lessons into the hypotheses list | Vinh, Claude | decision recorded |

The extra sticker slots (9 to 12 of the handoff) wait for the result; "hungry" is dropped unless Vinh says otherwise (the charter).

## 2. Facts to verify before investing more (the milestone of steps 1 and 5)

| # | Question | If "no" |
|---|---|---|
| 1 | Does Zalo let the author see how many times the set was downloaded? | Measure by short link only (question 5); the "downloads" row of section 5 is dropped |
| 2 | May the set's description carry an outside link or the app's name? | Switch to the community route: send the set to alpha users, a fan page and groups, and measure by the short link on the download page |
| 3 | What are Zalo's revenue terms (selling, share)? | Not a blocker: the test has no revenue goal. Record the answer |
| 4 | Can PayPal be used from Vietnam for LINE Creators Market? | LINE stays out; Telegram is the second platform |
| 5 | (not in the handoff) Current URL, file sizes (per sticker and the ZIP, the icon) and the review time stated on the registration page | The numbers in the handoff are from guides: use the page's numbers |

**Result of the public pages, read 2026-11-10** (registration page `stickers.zaloapp.com/register` and `/terms`; the account-only parts are still open):
- Item 5: URL confirmed. ZIP or RAR under 20 MB; the thumbnail JPG or PNG under 1 MB. **Pixel sizes, number of stickers and review time are not on the page**; they may be in the guideline PDF `static/guide/Sticker_Guideline2.pdf` (5 pages, not readable by the tools here; Vinh opens it). The page says only "Zalo will contact you if the set meets the requirements". The form asks for a portfolio or fan page link.
- Item 1 (download counts): **not stated** anywhere public. Open until Vinh sees the author portal after approval.
- Item 2 (links or app name in the description): **no rule found** in the terms; article 3.2 only bans advertising of goods and services prohibited by law. Not a "yes" yet: the form and the review decide. Ask in the form's notes or test with the fan page link field.
- Item 3 (revenue): **the terms say the uploader waives any claim to payment** (article 2.7: bonuses, charges, royalties, fees). So no income from Zalo stickers, which suits this test (no revenue goal). Article 2.6: VNG may freely use ideas the uploader provides. Article 2.8: VNG may refuse content. Article 5.1: terms may change without notice.
- Item 4 (PayPal and LINE): not checked here (LINE is out of this round).

**Result of Zalo's guideline PDF `Sticker_Guideline2.pdf`, read 2026-11-10** (5 pages; the text is drawn as paths, so it was rendered and read with PyMuPDF installed in the scratchpad):
- **A set is 12 to 20 stickers** (not the handoff's 8 to 12), named `01` to `20`, **PNG 360 x 360, transparent background**.
- **Icon** 124 x 124 PNG and **preview** 440 x 440 PNG, both transparent.
- **Promote banner in 9 sizes:** 720x120, 480x150, 320x100, 240x75, 480x80, 320x53, 240x40, 960x320, 720x225 (content centered within 720x165).
- **Animated stickers** are 2 to 10 frames each (so the animated stage is a small job, not a big one; question 4 stays "after the results").
- **Forbidden:** insults, swearing, violence or threats, text about trademarks or copyright (so no "Streakboom" or app name written on a sticker; it may stay in the author name, which the guide does not mention). **Not allowed in design:** 3D style (flat design), backgrounds with square corners, much text to describe an expression: **at most 4 words per frame**.
- Review time and the download count are not in the guideline either.

What this changes:
1. **The core eight is too few.** The set needs at least 12. With "hungry" dropped (ADR-0049) the handoff list gives 11 (rain and night counted apart); the spare states of spec/06 section 7.2 (`gasp`, `smirk`, `think`, `curious`, `held`) can fill the rest. Question E.
2. **The sample line for sticker 6 is 8 words, over the 4-word limit.** ADR-0049 item 2 cannot stand as written. Question F.
3. Step 5 gains the banner set (9 sizes), the icon and the preview; step 3 is 12 to 20 images, not 8, so the "few days of drawing" in the handoff is larger.
4. The rig is flat 2D, so "no 3D" is met if the stills keep no gradients or bevels; check at step 2.

**Answers (2026-11-10, ADR-0049 addendum):** E = split rain and night and add one to three existing poses (`gasp`, `think`, `smirk`); F = sticker 6 says "Quá sức mèo rồi." (4 words, pose `sad`). Plan status: step 1 now has the format rules; the account-only items (download counts, links in the description, review time) remain.

Items 1 and 2 are the gate: if either is "no", change route (as the handoff says) before drawing more than the character sheet.

## 3. Measurement

| Measure | How | Note |
|---|---|---|
| Set approved | Zalo's reply | the date |
| Sticker downloads | the author portal, if item 1 is yes | recorded, no threshold |
| **Installs from stickers** | the short link used only on the sticker's channels, and the download-page click counts | a link click is not an install; the website counts no visits today (see the verification debt), so the counting method is part of step 5 |
| **Bond Days of the sticker cohort (H2)** | see below | |

**H2 and the privacy rule.** Telemetry is opt-in and counts only (spec/05 section 6); the export has the install id, the events and per-day counts and **no source**. Adding a source to the app would be new tracking and a new consent version; this plan does not. So the sticker cohort can only be labeled **by hand**: a person from the sticker route who sends their "Copy stats" is asked, outside the app, where they came from, and the note stays with the report. Consequences, said plainly: the cohort is whoever chooses to send stats; spec/05 counts only installs with seven full days since consent; spec/05 has no target for mean BD7 yet ("record a baseline first"); at the sizes expected here (tens of installs) a comparison is a look, not a test. H2 can be read as "no obvious gap" and no more. If a baseline does not exist by the time the run ends, H2 is reported as untested.

## 4. Risks
- **Style drift** in generated images: mitigated by step 2 and by comparing each image with the sheet (spec/06 7.3).
- **Expression the app does not have** (belly request, rain): the cat in the sticker does something the app cat never does; mitigated by labeling it sticker-only and by questions A and B.
- **The cat looks like a nag or a beggar** in 6, 8 and 10 (charter, section 1.6 rule 1).
- **Zalo's rules differ** from the guides: step 1 is first.
- **Counting is weak** without store numbers; accepted in question 5 if Vinh says so.
- **Cost of failure** is a few days of drawing, as the handoff says. Do not add features or app changes to rescue a failed test.

## 5. Milestones and stop rules (set before the run; the numbers are the handoff's guesses and Vinh edits them)

| Milestone | Pass | Stop or change |
|---|---|---|
| Step 1 | items 1 and 2 answered | item 2 "no": community route. Item 1 "no" with question 5 "no": stop or Telegram |
| Review (step 7) | approved in **2 to 3 weeks** of submitting | no reply in 3 weeks: ask once; no approval in **5 weeks** or two rejections: stop the Zalo route and try Telegram, or end the test |
| Installs from stickers | **20 installs** over the **4 to 6 weeks** after approval (question D, ADR-0049) | below it at the end of week 6: **stop**; do not draw more |
| Downloads | recorded only | none |
| Quality (H2) | mean BD7 equal or higher than the others, if there is a baseline and at least a handful of cohort members | lower: note it, do not stop on it alone (n is too small) |

The thresholds and their date are written in the engineering log at step 5, before the first link goes public; they are not changed after the run starts.

## 6. What could not be verified (and goes to `verification-debt.md` once Vinh approves the plan)
- That a sticker set brings any installs; nothing here is measured yet.
- Zalo's current rules and URL (the handoff's figures come from guides).
- The expression table was matched by reading `sprites.ts` and `engine.ts`, not by looking at the rendered poses.
- Items 1 to 4 of section 2.

## 7. Not touched by this work
App code, telemetry, consent wording, Settings, the backlog (a story list can be added after Vinh decides: for instance "ST-1 character sheet", "ST-2 core eight", "ST-3 submit and measure"), the hypotheses list (H1 and H2 above would become the next two entries).
