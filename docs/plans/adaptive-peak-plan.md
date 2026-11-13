# Adaptive Peak: the order of work, cheapest first, to settle H18 and H19

**Status:** proposed 2026-11-13, **waiting for Vinh**. **Reordered 2026-11-13 (ADR-0087):** the author does not intend to test with people now, so S0, S3 and the readings that depend on the survey wait until he calls the alpha; S0 is written and kept ready, **nothing is sent**. Spec: [`../../spec/14-adaptive-peak.md`](../../spec/14-adaptive-peak.md). Analysis: [`adaptive-peak-feasibility.md`](adaptive-peak-feasibility.md). Decision: ADR-0080. **No app code is written until Vinh approves the step that writes it.** Steps S0 and S1 need no change to the app.

**What the two hypotheses are** (the handoff's H2 and H3; registered as H18 and H19 because the register already has H2 and H3):
- **H18:** a local table of phrases in en / vi / ja covers most real commands, so a model is needed only for the vague ones.
- **H19:** "Lượn đi" adds feeling and is not used instead of Quiet mode in a way that lowers Bond Days.

**Thresholds are Vinh's, and are set before looking at data.** Set on 2026-11-13: **H18 supported at 70 % coverage or more with 2 % false positives or fewer; refuted under 40 % coverage. H19 refuted if the users of "Lượn đi" have lower Bond Days than the others, or more than half do not call Peak back; read with the five end-of-week questions.** The thresholds of H17 and H20 to H22 are not set.

## The steps

| Step | What | Code? | Who | Cost | What it tells | Gate to go on |
|---|---|---|---|---|---|---|
| **S0** | **The phrase survey.** A short form for the people who may join the alpha and anyone willing (5 to 8 Vietnamese speakers first, then a few for English and Japanese): "how would you tell the cat to go away?", "to come back?", "to go to sleep?", "to stop for now?" (about 10 phrases each, in their own words), plus 20 ordinary short chat lines each that they would really type. No private text. | No | Vinh sends it; Claude writes the form and the sheet | one evening for the form, 10 minutes per person | The raw material for H18, and the first look at what people actually say | Enough phrases to split into two halves (suggested: at least 60 per language) |
| **S1** | **The table as data and a pure matcher, tested offline.** The phrases of half A become the table; the matcher is a pure function with a test file; the survey's half B is the held-out test and the ordinary lines are the negative set. Reported: coverage and false positives, per language, with the misses listed. | A new pure module and test only; **nothing in the app calls it** | Claude (after Vinh approves) | about a day | **H18's answer on paper**: coverage (suggested: supported at 70 % or more with 2 % or fewer false positives; refuted under 40 %); how to treat the ambiguous pairs | Vinh reads the misses and sets the verdict |
| **S2** | **The smallest "Lượn đi", for the author alone.** Tier 1 for `leave` only, typed in the chat box; goodbye line, walk to the nearest edge, hide, timed return, call back from the tray; the safety gate including `is_busy` on the return; the `leave` / `callback` counters. Behind a test switch, not in the release. | Yes; a small change in `+page.svelte` and `lib.rs` | Claude builds; **Vinh looks at the test build before it is committed** (`AGENTS.md` rule 8) | 2 to 3 days | **H19's first reading (n = 1):** does it feel good, does the author use it instead of Quiet or Hide | Vinh uses it for a few days and says |
| **S3** | **The alpha reading.** The same build to the alpha people, with the two counters (`tier 1 recognised`, `model recognised`) and the leave counters in "Copy stats", and five short questions at the end of the week. | Counters only | Vinh and the alpha people | one alpha round | **H19** (leaves a day, calls back against timer returns, Quiet starts and hides before and after, Bond Days of leavers against the others; small n, so a reading and not a proof) and **H18 live** (`tier1 / (tier1 + tier2)`) | Vinh's thresholds |
| **S4** | **The model tag and its harness.** The `skills.md` layer, the shared parser, a harness of 30 to 60 labelled messages (commands, near-commands such as "tôi sẽ lượn đi họp", ordinary lines) run against each connected brain. | Yes (`brain.rs` and the persona); harness is a script | Claude | 2 days plus keys the author already has | **H20** | Vinh reads the false positives |
| **S5** | **Later, in this order:** the suggestions and the local counters (H17, H22); then the hotkey spike (H21); then the recording and its consent ADR. Each only after S1 to S3 have answered. | Yes | | | | |

## Why this order

- S0 and S1 answer H18 **before the app changes**, with real phrases and a held-out test, and they are the same work the table needs anyway.
- S2 is the smallest thing that makes H19 observable, and uses no new art.
- S3 rides on the alpha that roadmap v2 already plans (R4); it does not delay the release line or the signing work.
- The model, the hotkey and the recording are the expensive and the riskiest parts, and none of them is needed to know whether the table and the leave are worth having.

## What can be done now, and what waits for the alpha (ADR-0087)

**Now, alone, each step approved before code:** the pure matcher and its tests (S1's module), using phrases the author writes himself and a negative set of ordinary lines; this proves the machinery but **not H18**, which needs other people's words. Then S2, "Lượn đi" for the author alone (a 20-minute return, the tray to call it back, ADR-0086), which gives H19 its n = 1 reading.

**Waits for the alpha:** S0 (the survey is written, not sent), the H18 verdict that rests on it, S3 (the alpha reading) and everything in S4 to S5 that needs people's use. Until then H18 and H19 stay `untested` apart from the author's own use.

## What is not in this plan

The phone animation, the favourite place and the transformation (spec 14 section 7.2); the wake word; native function calling (spec 14 N3 recommends against); anything sold.

## Risks

- **The survey has few people.** Coverage measured on a handful of Vietnamese speakers is a reading, not a proof; the live counters of S3 correct it.
- **False positives matter more than misses.** One wrong "leave" while someone is working costs more than ten misses; hence the whole-message rule and the negative set.
- **H19 can fail quietly.** If people use "Lượn đi" as a polite Quiet mode and Bond Days do not fall, the hypothesis is supported but the feature may still be redundant; the author reads the numbers against the simple alternative (leave it out).
- **A feeling is hard to count.** The five end-of-week questions exist because the counters cannot say whether it was enjoyed.

## Not verified

The thresholds are Vinh's choice and not based on data. The cost estimates are guesses until S1 and S2 are done.
