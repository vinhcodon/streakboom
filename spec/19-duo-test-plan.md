# 19. The duo test: a hard-working dog beside Peak, tried with stickers first

**Status:** a plan, written 2026-11-15 from the handoff [`docs/handoff/duo-characters-hypothesis.md`](../docs/handoff/duo-characters-hypothesis.md). **Nothing is built, nothing is added to the app, and no dog is drawn yet.** It is a hypothesis (H33) and a test of it; the decision to put a dog in the app is not taken and is not asked for here. The sticker work belongs to the sticker session and the page to the website session; this spec says what to ask of them.
**Numbering and sources (the handoff had them wrong).** The spec is 19 because 10 is the terrain model; the sticker page is [`spec/13`](13-sticker-page.md) (not 09); the specs are in `spec/`, not `docs/spec/`; the constraint "one Peak" is ADR-0068 (a guard against a second start of the program), not a line of the README; the customization spec is [`spec/15`](15-customization.md). The licences are those of ADR-0126 (MIT, stickers CC BY 4.0; no trademark policy).

## 1. The idea in one paragraph
A second character opposite Peak: a dog that works hard, is clever and has a job of its own, while Peak the cat is the unhurried one. **Neither works for the person.** The jokes tease the situation or the animals, never the person; the dog's work is small, useless and sometimes ruined (sorting chestnuts by size, stamping a paper nobody reads); the dog must never become a mirror that makes the person feel lazy. The humour is competence put in the wrong place: the cat does useless things perfectly, the dog does useless things earnestly.

## 2. What is tested, and what is not
| Question | Tested here? |
|---|---|
| Do people copy and share a sticker of the dog, alone and with Peak, as much as a new sticker of Peak alone? | **Yes** (the counters of ADR-0092) |
| Does the dog draw attention away from Peak (fewer copies of Peak's stickers)? | **Yes**, as a stop condition |
| Does the dog make Peak more loved (the question 2 of the handoff's filter)? | **No**: copies do not measure attachment; only direct feedback hints at it |
| Is the dog lovable with the AI off (question 3)? | By the stickers' look only |
| A dog in the app (a second window, make way for two, Bond Days, load) | **No**, see the charter impact in [`docs/plans/duo-charter-impact.md`](../docs/plans/duo-charter-impact.md) |

## 3. The stickers (8, in the page's three languages)
Voice rules: as the existing stickers (spec 13, `docs/plans/sticker-set-v1-direction.md`); **no arm strokes: paws on the body, on props or on the face** (the standing rule of the sticker drawings); no health claims; the dog is not Doge, Cheems or Kabosu and carries no meme text. The dog's name is **Paws** (chosen by the author on 2026-11-15; the search and its weak points are in [`docs/plans/duo-paws-svg-check.md`](../docs/plans/duo-paws-svg-check.md), the candidates in [`docs/plans/duo-name-candidates.md`](../docs/plans/duo-name-candidates.md)); a registry check is still open (V-161).

| ID | Kind | Scene (a first idea, for the sticker session to draw and the author to judge) |
|---|---|---|
| D1 | the dog alone | sorts chestnuts by size in a perfect row; one is slightly too big |
| D2 | the dog alone | stamps a paper nobody will read, with great care |
| D3 | the dog alone | carries one pebble to a pile, puts it down, looks proud |
| P1 | the pair | the cat asleep; the dog asks leave with a bow and carries a string of beads, laid dead straight, across the cat's back; the cat opens one eye |
| P2 | the pair | the dog holds out a tiny paper marked MEETING; the cat looks at the ceiling |
| S1 | a four-panel story | P1 as four panels (the cat sleeps; the dog bows; the beads cross; one eye opens, sleeps again) |
| C1, C2 | control: Peak alone, new | two new stickers of Peak in the same format, made in the same week, so that the novelty of a new sticker is not taken for the effect of the dog |

The captions are short and written in Vietnamese, English and Japanese as the others (Japanese by Claude, as before, no native reader). The pages' tags and the search aliases follow spec 13 (section 2 and 3).

## 4. How it is measured (the existing counters, no new sense)
- The sticker pages already count **copies and shares per sticker per day, anonymously** (ADR-0092: a Cloudflare Worker, the address is in `scripts/site/catalog/counting.json`; no identifier, no cookie). The duo test adds **no counter**: it reads the counts of the eight new slugs and of Peak's older stickers.
- **Not checked by me:** that the Worker answers and that the counts are being kept (this needs a call to the author's endpoint and the author's access to the totals). Before the test starts, the author looks at the counts of a few old stickers (V-159).
- **Placement:** the eight new stickers stand in the same place of the page and in the same row, in an order that is changed every day (or a fixed order that is swapped at day 7), because the first place in a row is copied more. `popular.json` (Peak's picks) is not changed during the test.
- **Time:** 14 days; if the old stickers show fewer than about 20 copies a day in total, the traffic is too small and the test runs 28 days.
- **Direct feedback** (the handoff: "who is that dog?"): the author notes any such remark; ask five to eight people, in person or in a chat, which sticker they would send and why. This is small and is not a measurement.

## 5. The decision rule (the author may change the numbers)
Read on day 14 (or 28):
- **Go on to think about the dog in the app** only if the pair stickers (P1, P2, S1) are copied **at least as often as the controls (C1, C2)** and the single dog stickers at least **half as often**, **and** the copies of Peak's old stickers have not fallen by more than **20%** against the 14 days before. Even then the dog would be an option that is off by default, and an ADR with the charter check would come first.
- **Stop** if the old Peak stickers fall by more than 20%, or if the dog stickers take most of the copies of the new ones (the dog pulls attention from Peak), or if feedback says the dog makes people feel watched or lazy.
- **No signal** (too few copies in total, under about 100 across the eight stickers): do not conclude; keep the stickers up, or end the test without a decision.
The thresholds are suggestions of the handoff made concrete; they are not data.

## 6. What the test asks of other sessions
- **The sticker session:** draw the dog (a reference sheet first, looked at by the author at 256 px and at 32 px, on a light and a dark ground) and the eight stickers; the render check of the Gemini SVG was done on 2026-11-15 (`docs/plans/duo-paws-svg-check.md`): **its `xmlns` is wrong**, the near-black body **disappears on a dark ground** and at 32 px reads as a small white bottle, the front paws look like empty rings, and the silhouette reads closer to a penguin or hamster than a dog; the reference sheet has to solve these first (V-160).
- **The website session:** a handoff note from the app session (`docs/handoff/website-duo-test.md`) lists the slugs and the order rule; it changes nothing now.
- **Licence:** the dog stickers are CC BY 4.0 like all the others (ADR-0126). The name Paws is not protected by any policy: another person may use it.

## 7. Contradictions found with the other documents
- The handoff's rule that the dog is "opposite" Peak ("brainless, silly, all play") is not the cat of the charter: Peak is quiet by default and lively only when invited (article 2). The duo texts must not describe Peak as a hyperactive character.
- Bond Days is with Peak (`docs/plans/bond-days.md`); nothing in the test touches it.
- Counting sticker copies per sticker is allowed (ADR-0092) and the privacy text was changed first (spec 13 section 6); the duo test adds no counter, so no contradiction was found there.

## 8. Not in this spec
The dog in the app, its rig, its lines, a chat for it, a name, a second window, the make-way logic for two pets, a change of the charter. Each would need an ADR and the author's order, and the sticker test has to succeed first.
