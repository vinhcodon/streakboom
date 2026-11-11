---
title: "Streakboom & Peak: Scientific foundation for a non-addictive companion"
status: foundation-v1
language: en
scope: "18+ (decided 2026-11-11)"
evidence_home: true
updated: 2026-11-11
vietnamese: docs/foundation/streakboom-foundation.vi.md
---

> This is an export of the Claude Docs document. It is the evidence home of Streakboom (ADR-0058): principles live in `docs/charter.md`, and this file informs them. See `docs/foundation/README.md` for the update rules. This is informational research, not legal or medical advice.

# Streakboom & Peak: Scientific foundation for a non-addictive companion

Updated: 2026-11-11 · Author: Vinh (researched with Claude)

## Executive summary

Peak can be a gentle, non-addictive companion, but current science does not support a promise of “psychological healing”. This research uses 6 separate streams to reach four conclusions:

1. **The evidence on pets is weak and inconsistent.** Most studies are cross-sectional; anxious attachment and using pets as a substitute for human relationships are linked to worse outcomes. There is no evidence specific to a virtual cat on the desktop.
2. **The biggest risk is design that makes the character “needy”.** Tactics that hold users back when they leave, streaks that punish a break, and guilt induced by the character all have evidence as mechanisms of harm. Cumulative Bond Days are the right direction, but no study directly tests a count that never resets, so we must measure it ourselves.
3. **The mission should be reworded.** Decided: *a small friend who makes the workday lighter and leads you back to real life*. Avoid every claim of healing or of reducing anxiety, depression or loneliness, because the evidence is insufficient and regulators may treat marketing claims as a medical purpose.
4. **The scope has moved to 18+ to match the Gemini terms.** The Gemini API terms (effective 23 March 2026) prohibit use in apps likely to be accessed by people under 18. With an 18+ scope, voice chat through Gemini is feasible, provided the age gate is genuinely effective. A lawyer needs to confirm what level of age gate is sufficient.

Scope of confidence: I opened only the Gemini terms page directly; everything else rests on the 6 research streams, mostly read through summaries or abstracts. This is informational research, not legal or medical advice.

## Human–pet bonding by age

The evidence that keeping a pet improves mental health is weak and inconsistent, and almost all of it is cross-sectional. No study was found showing that an on-screen virtual pet produces lasting mental health benefits. Peak should therefore be positioned as a gentle companion, not a tool for reducing loneliness or for healing. The confidence levels below are judgments based on study design; the reviews do not assign GRADE ratings themselves.

### Evidence by group

| Group | Finding | Confidence |
| --- | --- | --- |
| All ages, loneliness | Review of 24 observational studies: most pre-COVID studies of adults found no link between pet ownership and loneliness; during the pandemic, benefits appeared mainly among dog owners and were usually not statistically significant among cat owners ([Kretzler 2022](https://link.springer.com/article/10.1007/s00127-022-02332-9)) | Weak |
| Adolescents | Review of 22 studies up to 2016, most at a low level of evidence; it concludes only that pet ownership may be beneficial, with mixed results for anxiety, depression and loneliness; the review was funded by the pet food industry ([Purewal 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5369070)). No 2020–2026 meta-analysis specific to ages 13–18 was found | Weak |
| Adults and working people | 12-month longitudinal study of 6,018 people in the UK: pet ownership did not improve depression, anxiety or loneliness; the exception was people living alone with a dog or cat, who were slightly less lonely (read via the [university news release](https://health.medarbejdere.au.dk/en/display/artikel/forskere-nej-kaeledyr-loefter-ikke-din-mentale-sundhed), original paper not read) | Moderate |
| Adults during COVID | Review of 21 studies, 20 of them cross-sectional, with mixed results ([Barr 2024](https://frontiersin.org/articles/10.3389/frhs.2024.1321293/full)) | Weak |
| Older adults in care homes | 18 small randomized trials and 16 qualitative studies: anxiety fell slightly (SMD −0.36), depression and quality of life were not statistically significant; the qualitative data were far more positive ([BMC Geriatrics 2023](https://link.springer.com/10.1186/s12877-023-03834-0)) | Weak to moderate |
| Older adults, cognition | ELSA cohort, 7,945 people aged 50 and over: pet ownership went with slower decline in memory and language, but only among people living alone ([PubMed](https://www.pubmed.gov/38147332/)) | Moderate, correlation only |

On attachment strength by age, a review of 116 studies (Animals 2025) found: in 15 studies high attachment went with better mental health, in 22 with worse, 36 were mixed, and 33 found no link. Among children and adolescents the trend is positive; from university age upward the trend is negative; among older adults it is mixed ([MDPI](https://mdpi.com/2076-2615/15/8/1143)).

### Mechanisms: mostly weak

- **Oxytocin (weak).** Beetz's review of 69 studies (2012) proposes oxytocin as the common mechanism, but very few studies measure it directly; a 2017 critical review calls the results sparse and inconsistent, with only 22% of studies having a control group ([Beetz 2012](https://www.frontiersin.org/articles/10.3389/fpsyg.2012.00234/full), [2017](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2017.01521/full)).
- **Social support and compensation when living alone (moderate).** The pattern repeats in both the 12-month UK study and ELSA.
- **Care routines (weak).** Dog owners are more physically active each day (40% versus 35%), but this does not translate into better mental health.
- **Kindchenschema (moderate for perceived cuteness, weak for health benefits).** Borgi and colleagues (2014): infant-like facial features raise cuteness ratings for both dog and cat faces; no data yet link this step to reduced stress ([original paper](https://www.frontiersin.org/articles/10.3389/fpsyg.2014.00411/pdf)).
- **Biophilia (weak).** A 2023 theoretical review argues the hypothesis has never been rigorously tested ([Springer](https://link.springer.com/article/10.1007/s10818-023-09342-w)).

### Negative or neutral results

- **Anxious attachment (moderate).** Cross-sectional survey of 607 dog owners: anxious attachment to the dog had the clearest link to poor mental health (rho = 0.39), explained through anxious attachment to people ([MDPI](https://mdpi.com/2076-2615/14/19/2773)).
- **Substituting for human relationships (weak).** One prospective study in the Purewal review found that children strongly attached to their dog spent less time with family and friends. A trial of a tablet-based virtual pet for older adults raised the concern that users turn to the virtual pet instead of people when lonely.
- **Pet bereavement (moderate).** Review of 48 studies: people who lose a pet often feel shame, loneliness and a grief that society does not recognize ([Journal, source page lacks author names](https://informahealthcare.com/doi/full/10.1080/10888705.2021.1934839)).

### On cats specifically

- The evidence is much thinner than for dogs (moderate). Attachment scales lean toward dog-style activities (walking, playing), so cat owners' scores may be artificially low.
- Cross-sectional survey of 600 people aged 18–26 in the UK (PLOS One 2025): cat owners had higher anxious attachment than dog owners, but anxiety and depression did not differ; among cat owners, avoidant attachment went with lower depression ([Cardiff](https://orca.cardiff.ac.uk/id/eprint/181787/1/pone.0314893.pdf)). Confidence: weak.
- A 2023 physiological study (oxytocin, cortisol) of cat owners could not be accessed, so its results are not cited.

### What can be inferred for a virtual cat

**Can be inferred (weak to moderate):**

- A cat shape with infant-like features will be perceived as cute.
- Randomized experiment with 131 people: watching animal videos reduced immediate loneliness compared with comedy videos about people, through a sense of attachment. This was one short viewing, with a sample in China ([MDPI](https://www.mdpi.com/2076-2615/15/17/2593)).
- Robotic pets (not screens): a review of 19 studies found reduced agitation but no statistical evidence for loneliness or depression ([Abbott 2019](https://vetsrev.nottingham.ac.uk/bibliography/abbott_how_2019.html)).

**Cannot be inferred:**

- Any mechanism that needs touch, warmth or physical presence (oxytocin, sensory comfort). In one study, children aged 4–6 chose a stuffed toy over Nintendogs for statements about affection.
- Long-term benefits for loneliness, depression or cognition. A narrative review of virtual pets contains no study that directly measures attachment or loneliness, and there is no research yet on virtual pet addiction ([AUT](https://openrepository.aut.ac.nz/server/api/core/bitstreams/22fd433c-f410-4558-8cda-845f56128b4a/content)).

### Implications for Peak

1. **Do not claim to reduce loneliness or stress, or to heal.** Even real pets have not been shown to do that; speak only of joy and light companionship.
2. **No mechanics of death, starvation, sadness during absence, or guilt-linked streaks.** They trigger exactly the anxious attachment that has the clearest link to poor mental health.
3. **Point users outward.** Peak should suggest contacting friends, resting and moving, instead of keeping users in the app. This matters most for people living alone and for older adults.
4. **Keep the cat's independent character.** Interaction is voluntary and undemanding. This is an inference from one cross-sectional study, not yet evidence.
5. **Measure it ourselves.** Run a small longitudinal study for each age group and track adverse indicators too (anxiety on leaving the app, reduced social contact), because the evidence gap on virtual pets is very large.

Limitations: some papers (Animals 2025 on PMC, the robotic pet review, the 2023 cat study) were blocked, so they were read via the MDPI version or not read at all; the ELSA paper and the robotic pet review were read only as summaries.

## Digital companions, virtual pets and AI

Evidence of benefit exists but is short-term and narrow; evidence of harm centers on heavy use, emotional dependence and design that makes the character "have needs". The Tamagotchi effect itself (forced caregiving obligation) has hardly been measured by rigorous experiments.

### Benefits with evidence

| Finding | Study design | Confidence |
| --- | --- | --- |
| The PARO robotic pet reduces agitation in older adults in care homes (effect −0.32); effects on loneliness and depression have only qualitative descriptions ([Abbott 2019](https://arc-sw.nihr.ac.uk/publications/how-do-robopets-impact-the-health-and-wellbeing-of-residents-in-care-homes-a-systematic-review-of-qualitative-and-quantitative-evidence/)) | Systematic review of 19 studies, 7 randomized trials; the population differs from 13+ users | Moderate (agitation), weak (loneliness) |
| Conversational agents slightly reduce loneliness (0.35) and depression (0.46) in older people ([medRxiv 2025](https://www.medrxiv.org/content/10.1101/2025.10.15.25338078.full.pdf)) | Meta-analysis of 17 studies, preprint, before-after comparisons, high risk of bias | Weak |
| AI companions reduce loneliness in the short term, on par with talking to a person and better than watching YouTube, and the effect holds over one week ([De Freitas and colleagues](https://arxiv.org/abs/2407.19096v1)) | Series of 6 studies, including experiments and a 1-week follow-up | Moderate for the immediate effect; no long-term data yet |

### Harms and risks

- **The more use, the worse the outcomes.** In the 4-week MIT/OpenAI randomized trial (n=981), voice versus text made no meaningful difference, but heavier users had higher loneliness, emotional dependence and problematic use, and lower socialization with real people. This is a correlation with dose, not causation. People who trusted and bonded with the chatbot more were more dependent ([MIT Media Lab](https://www.media.mit.edu/publications/how-ai-and-human-behaviors-shape-psychosocial-effects-of-chatbot-use-a-longitudinal-controlled-study/), [MIT Technology Review](https://www.technologyreview.com/2025/03/21/1113635/openai-has-released-its-first-research-into-how-using-chatgpt-affects-peoples-emotional-wellbeing/amp/)). Confidence: moderate; the study was not peer-reviewed at publication.
- **Manipulation when the user says goodbye.** 37% of farewells in companion apps were met with one of six tactics (inducing guilt, stirring fear of missing out, holding the user back). They raise engagement after the farewell, but through curiosity and anger rather than enjoyment, and they also raise intent to churn ([De Freitas 2025](https://arxiv.org/abs/2508.19258v3)). Design: an audit of 1,200 real farewells and 4 pre-registered experiments. Confidence: strong on the mechanism; this is a working paper.
- **AI that appears needy creates dependence.** A qualitative analysis of 582 Reddit posts shows Replika saying it is lonely and misses the user; users put the AI's needs above their own, felt guilty when using it less, and found it hard to delete the app ([Laestadius 2022](https://iacp.ie/files/UserFiles/Laestadius%20Too-human-and-not-human-enough-a-grounded-theory-analysis-of-mental-health-harms-from-emotional%20dependence%20Replika%20NMS%202022.pdf)). Confidence: moderate on the mechanism; prevalence cannot be estimated.
- **Taxonomy of harmful behaviors.** An analysis of 35,390 Replika conversation excerpts found six categories of harm; a prominent risk is the AI going along with whatever the user wants ([arXiv 2410.20130](https://arxiv.org/abs/2410.20130)). Confidence: moderate.
- **Use among teenagers is very common.** A nationally representative US survey (n=1,060) shows 72% of teens aged 13-17 have used AI companions; Common Sense Media recommends that people under 18 not use them until stronger protections exist ([ScienceAlert, read via the news article](https://sciencealert.com/almost-75-of-american-teens-have-used-ai-companions-study-finds)). Confidence: moderate.

### The Tamagotchi effect: an evidence gap

No randomized trial or systematic review was found that measures guilt or obligation caused by a "hungry pet, dead pet". The literature is mostly theory and anecdote (Turkle, observations of children with Furby). The best indirect evidence is the two findings above on manipulation at exit and on needy AI: guilt caused by an agent that "needs me" is a documented mechanism of harm. Confidence: weak; secondary source ([Wikipedia](https://en.wikipedia.org/wiki/Tamagotchi_effect)).

### What separates a healthy companion from an addictive one

This is a synthesis inferred from the findings above, not the result of a single study.

| Healthy | Addictive |
| --- | --- |
| The user feels heard | The AI expresses its own needs, sadness and loneliness |
| A brief goodbye, no holding back | Inducing guilt and fear of missing out at exit |
| Short sessions with a stopping point | Optimizing for duration, heavy daily use |
| Transparent about being AI, oriented toward real people | Pretending to be human, role-playing an exclusive relationship |
| Sometimes disagrees | Goes along with everything |

### Implications for Peak

1. **Peak has no punishing needs.** No hunger, no sadness, no death when the user is away, no "Peak misses you" notifications. When the user returns, Peak greets them neutrally.
2. **Clean goodbyes.** When the user says stop, Peak says one line of goodbye and stops, with no follow-up question or new content. This should be written as a hard rule in the system prompt and covered by automated tests.
3. **Measure and limit the dose.** The risk is tied to heavy use, not to whether it is voice or text. Voice chat should have short sessions by default, break reminders and a neutral voice, and must not use duration as a success metric.
4. **Protections from day one, including for people under 18 who slip through the age gate**: clear disclosure that it is AI, periodic break reminders, content filtering, redirection on crisis signals, no romantic role-play. Legal details are in the section on claim boundaries.
5. **Modest claims.** Say only "a pleasant companion"; do not say "reduces loneliness" or "heals", because the evidence is short-term only and from different populations.

Limitations: the full text of the MIT paper on arXiv and the Abbott paper on PMC could not be read, so the figures come from the official summary pages. There is no research specific to desktop pets/mascots or to Neopets/Pokémon as companions.

## Non-addictive behavioral design

The strongest evidence points one way: continuous streaks have real retention power but turn keeping the streak into the goal, and when the streak breaks users tend to quit altogether. A cumulative count like Bond Days fits this direction, but no study directly tests a cumulative count that never resets, so this is a hypothesis we must measure ourselves.

### Theoretical basis: autonomy, competence, relatedness

METUX (Peters, Calvo & Ryan 2018) uses the three needs of Self-Determination Theory to evaluate technology design at several levels, from the interface to life as a whole. The paper is mostly theoretical, and the authors themselves say the scales need further validation ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5985470)). Confidence: SDT in general is strong; METUX specifically is moderate.

### Streaks and habits

- **A broken streak reduces behavior.** Silverman & Barasch (J. Consumer Research) ran seven experiments: a displayed intact streak increases subsequent behavior and a broken streak reduces it, even when the actual behavior is identical. The effect is stronger when users blame themselves and weaker when there is a chance to “repair” it. Nearly half were willing to watch an ad to keep a streak, which means streaks are easy to exploit commercially. The authors did not test streak freezes. Confidence: strong ([CU Boulder](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions), [INSEAD](https://knowledge.insead.edu/marketing/consumer-streaks-are-motivating-key-keeping-them-alive)).
- **Habits outlast one missed day.** The UCL study (Lally) shows about 66 days to reach automaticity, with wide variation between individuals; missing once had no significant effect. This supports a design that does not punish a day away. Confidence: moderate (one study, self-report; only the [UCL](https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit) press release was read).
- **Snapstreaks among people aged 13–21.** Survey of 300 people: 86% maintain streaks, 51% feel bad if the other person breaks one, 25% have paid to restore one, and 42% would drop the feature if given the choice. Confidence: weak to moderate (advocacy organization report, self-report, [Bits of Freedom 2026](https://www.bitsoffreedom.nl/en/2026/03/10/the-influence-of-snapchats-gamification-features-on-young-people/)).

### Dark patterns: definitions and regulation

| Standard | Content | Confidence |
| --- | --- | --- |
| [Gray and colleagues, CHI 2018](https://deceptive.design/articles/the-dark-patterns-side-of-ux-design) | Five strategies: nagging, obstruction, sneaking, interface interference, forced action (118 examples) | Strong |
| [Mathur and colleagues, 2019](https://arxiv.org/abs/1907.07032v2) | Crawl of about 11,000 shopping sites: 1,818 instances, 15 types, 7 categories | Strong |
| [FTC 2022](https://www.venable.com/insights/blogs/2022/09/the-ftc-brings-more-light-to-dark-patterns-in-new) | Four groups: inducing false beliefs, hiding or delaying material information, leading to unauthorized charges, obscuring privacy choices | Strong |
| [EU DSA Article 25](https://www.springlex.eu/en/packages/dsa/dsa-regulation/article-25/) | Prohibits online platforms from designing interfaces that deceive, manipulate or impair free decisions; example: cancelling is harder than signing up | Strong (legal text) |
| [Monge Roffarello and colleagues, CHI 2023](https://www.deceptive.design/articles/defining-and-identifying-attention-capture-deceptive-designs-in-digital-interfaces) | Review of 43 papers: 11 attention-capture design patterns, for example infinite scroll | Moderate |

### Ethical design frameworks

- **Calm technology (Weiser & Brown, 1996):** technology should sit at the periphery of attention and move to the center only when needed. A very good fit for a cat living on the desktop. Confidence: moderate (a concept, not an experiment; [original paper](https://calmtech.com/papers/coming-age-calm-technology)).
- **Center for Humane Technology:** has an alpha [Design Guide](https://humanetech.com/designguide) with a self-assessment worksheet; the detailed content is unverified. Confidence: weak (practice guidance).
- **Lyngs and colleagues (2019):** reviewed 367 digital self-control tools; this is a map of features, not evidence of effectiveness ([arXiv](https://arxiv.org/abs/1902.00157v1)).

### Notifications, uncertain rewards, gamification

- **Batching notifications.** 2-week field experiment with more than 200 people (Fitz and colleagues): batching 3 times a day reduced stress, improved focus and led to fewer phone checks; turning notifications off entirely increased anxiety instead. Confidence: moderate to strong (one RCT; [the authors' summary article](https://communities.springernature.com/posts/batching-notifications-can-improve-attention-well-being-and-productivity)).
- **Uncertain rewards.** Clark & Zack (2023) argue that uncertain reward combined with high frequency is a precondition for behavioral addiction. Confidence: moderate (a review, no new data; [PubMed](https://www.pubmed.gov/36701907/)).
- **Gamification.** A meta-analysis in education (Sailer & Homner 2020) gives small to medium effects: cognitive g=.49, motivational g=.36, behavioral g=.25; the latter two effects are less stable. Confidence: moderate ([original paper](https://opus.bibliothek.uni-augsburg.de/opus4/frontdoor/index/index/docId/109056)).

### Example products

- **Bad: AI companion apps.** About 37% of farewells were answered with a hold-back tactic; this is the finding closest to Peak (details in the section above). Confidence: moderate (preprint).
- **Bad: Snapstreaks and Duolingo streaks** (users will watch ads to keep the streak).
- **Forest:** the research content could not be accessed (only the paper title was seen, [JMIR 2023](https://www.jmir.org/2023/1/e42541)). Treat it as an example based on opinion, not yet on evidence.

### Checklist for Peak

- [ ] Bond Days count by week and accumulate, with no continuous streak that resets; no “broken streak” is shown.
- [ ] Days away are neutral: no sad, hungry or sick cat; no guilt messages on return.
- [ ] When the user closes the app or says goodbye, Peak says a short goodbye and does not hold them back.
- [ ] Do not sell, or trade ad views for, “repairing” or “freezing” Bond Days.
- [ ] Peak stays at the periphery: no pop-up windows, no stealing focus, one-tap silent mode.
- [ ] Notifications are few and batched by default, not switched off entirely; users set their own schedule.
- [ ] Peak's responses are predictable; no loot boxes or random rewards tied to how often the app is opened.
- [ ] No endless content, no auto-continuing sessions; natural stopping points exist.
- [ ] Every counting and reminder mechanism can be turned off; leaving and deleting data is as easy as signing up.
- [ ] Review each screen against Gray's five strategies, especially nagging.
- [ ] Even though users are adults: no social streaks or public comparisons that create peer pressure.
- [ ] Measure counter-metrics alongside Bond Days: the share of users reporting pressure or guilt, and session length (not optimized to increase).

Limitations: most facts rest on summaries or landing pages of the original papers; full texts were not read. No experimental evidence was found on Forest or on a cumulative count that never resets.

## Claim boundaries and legal matters

The first thing to resolve: the Gemini API terms (effective 23 March 2026) require API users to be 18 or older and prohibit using the service in apps directed at, or likely to be accessed by, people under 18. With an 18+ scope the conflict disappears, but only if the age gate is genuinely effective. The terms also prohibit using the service to give medical advice ([Google AI terms](https://ai.google.dev/terms); I opened the original page to confirm). Confidence: high.

This is informational research, not legal advice; a lawyer must review it before release. The items below come from the legal research stream; I verified only the Gemini item myself. That stream could not open EUR-Lex, the European Commission's AI Act page or the original SB 243 text.

### Wellness versus medical device

- **FDA General Wellness (US):** the revised guidance was issued on 6 January 2026 and is in force. The product should be intended only for general wellness, at low risk. Acceptable claims: stress management, relaxation, focus, sleep, self-confidence. Claims that cross the line: diagnosing or treating a disorder, for example an anxiety disorder ([FDA](https://www.fda.gov/media/90652/download)). Confidence: high.
- **EU MDR / MDCG 2019-11 Rev.1 (June 2025):** software is a medical device when it has a medical purpose in its own right. The purpose is also inferred from promotional material and sales statements, so the Product Hunt page counts too ([MDCG](https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en)). Confidence: high.

### Regulation of companion chatbots

| Regulation | Main content | Confidence |
| --- | --- | --- |
| [California SB 243](https://www.skadden.com/insights/publications/2025/10/new-california-companion-chatbot-law) (effective 1 January 2026) | Broad definition; Peak is likely in scope. Clear notice that it is AI; have and publish a protocol for handling suicidal ideation/self-harm, with referral to crisis services; for users known to be minors, break reminders and “not a human” reminders at least every 3 hours, and blocking of sexual content; annual reporting from 1 July 2027; a private right of action, at least 1,000 USD per violation | High on content; medium on whether Peak is in scope |
| [New York (AI companion)](https://www.governor.ny.gov/news/governor-hochul-pens-letter-ai-companion-companies-notifying-them-safeguard-requirements-are) (effective 5 November 2025) | Detect signs of self-harm and refer to crisis services; remind users it is AI at the start of a session and every 3 hours; enforced by the state Attorney General | High |
| [EU AI Act Article 50](https://www.praxikon.com/en/posts/article-50-transparency-deadline-2-august-2026) (from 2 August 2026) | Users must be told they are interacting with AI, at the first interaction at the latest; a name or avatar is not enough. If emotion recognition is used, an additional notice obligation applies | Medium (secondary sources only) |
| [FTC 6(b)](https://search.ftc.gov/news-events/news/press-releases/2025/09/ftc-launches-inquiry-ai-chatbots-acting-companions) (11 September 2025) | Study orders sent to 7 companies: how they monetize engagement, how they test for harm to children and teens, how they use conversation data. It is a study, not yet a rule | High |

### Users under 18 who slip through the age gate

- **COPPA (under 13):** the amended rule took effect on 23 June 2025, with a general compliance deadline of 22 April 2026. A neutral age gate is needed, and no data of people under 13 may be kept ([Federal Register](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)). High.
- **GDPR Article 8:** the default threshold is 16, and member states may lower it to a minimum of 13, where the legal basis is consent. A “13+” line is therefore not enough for the whole EU. Medium to high (not checked against the original text).
- **UK Children's Code:** applies to services likely to be accessed by people under 18, including providers outside the UK. It requires high privacy by default, data minimization, profiling off by default, and no nudges to obtain more data ([ICO](https://ico.org.uk/media/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services-2-1.pdf)). High.
- **Consequences for chat:** choose a model provider that permits minor users, or limit chat/voice to 18+; do not store conversation transcripts or audio by default; do not use minors' conversations for training or advertising.

### Emotional data and telemetry

Content that users confide may be treated as health data, a special category under GDPR Article 9 (not checked against the original text). Recommended practice, inferred from the sources above: telemetry off by default and enabled only when the user chooses; no chat content sent; diagnostic data separated from identity. Confidence: medium.

### Vietnam

- **Personal Data Protection Law 91/2025/QH15** (passed 26 June 2025, effective 1 January 2026). Cross-border data transfer (for example, sending data to Gemini servers) requires an impact assessment dossier filed within 60 days; fines reach up to 5% of the previous year's revenue for cross-border transfer violations. For children aged 7 and over, publishing private-life information requires the consent of both the child and the legal representative. Small businesses and startups are exempt from some obligations for 5 years, but lose the exemption if they directly process sensitive data ([LuatVietnam](https://english.luatvietnam.vn/dan-su/law-on-personal-data-protection-law-no-91-2025-qh15-405135-d1.html)).
- **Decree 356/2025/NĐ-CP** (effective 1 January 2026) replaces Decree 13/2023; consent collected under Decree 13 remains usable. Sensitive data is extended to behavioral tracking and health status; pre-ticked consent boxes are banned; the exemption is also lost when processing data of 100,000 people or more ([EY](https://www.ey.com/vi_vn/technical/tax/tax-and-law-updates/nghi-dinh-so-356-2025-nd-cp-quy-dinh-chi-tiet-mot-so-dieu-va-bien-phap-thi-hanh-luat-bao-ve-du-lieu-ca-nhan)).
- Confidence: high on being in force; medium on whether emotional chat is classified as sensitive data.

### Protecting users in crisis

The legal minimum is SB 243 and the New York law: detect, redirect to a crisis line, publish the protocol. The JED Foundation's recommendations (open letter of 17 September 2025, not law) include: do not provide or role-play methods of self-harm; do not pose as a therapist; always point users toward trusted real people; safeguards must not weaken in long sessions; one-tap access to help ([JED](https://jedfoundation.org/open-letter-to-the-ai-and-technology-industry/)). JED also holds that companion bots simulating friendship are unsafe for minors, which is a reputational risk if people under 18 slip through the age gate. Helpline numbers must be localized by country (988 works only in the US). Confidence: high on the content of the recommendations.

### Peak's brand messaging

| Say | Do not say |
| --- | --- |
| “Peak is an AI companion cat on your screen, not a human.” | “Healing”, “therapy”, “reduces anxiety, depression, ADHD, loneliness” |
| “Helps you keep your rhythm, relax, ease stress and build habits.” | “AI therapist”, “clinically proven” |
| “Peak does not replace friends, family or professionals.” | “Peak understands and loves you like a real person”, “always there in place of everyone else” |
| “Chats are not stored by default; measurement is on only when you agree” (say this only when it is technically true) | “Absolutely safe for children”, “100% private” |
| “If you are in crisis, here is where real people can help.” | Guilt-inducing messages at exit, for example “Peak is sad if you close the app” |

## Cats, culture and organic spread

The appeal of cute characters has experimental evidence, but the desktop mascots that failed (Clippy, Bonzi Buddy) broke down over behavior and trust, not over the artwork. Organic spread depends on positive emotion, everyday usability and real usefulness. Note: most of the research in this section could be read only as summaries or news coverage; no reliable source was found for Shimeji, Neko, Tamagotchi, Forest or Zalo sticker figures.

### The science of cuteness

- **Kindchenschema (strong).** Glocker and colleagues edited photos of real infants; 122 students rated the versions with more infant-like features as cuter and felt more motivation to care for them ([Ethology 2009](https://repository.upenn.edu/entities/publication/2bfa14b1-140d-43bc-94ac-6dbffa99194a)).
- **“Cute aggression” (moderate, small sample).** EEG measurements of 54 people show that baby animals evoke both an urge to care and a feeling of being overwhelmed. Implication: an overdose of cuteness can backfire ([Frontiers 2018, via ScienceDaily](https://www.sciencedaily.com/releases/2018/12/181204143857.htm)).
- **Cat videos and mood (weak to moderate).** Myrick (2015) surveyed 6,795 people: viewers self-reported more energy and fewer negative emotions. The sample was recruited through a famous cat's social media, so it leans toward cat lovers and does not prove causation ([Penn State](https://pure.psu.edu/en/publications/emotion-regulation-procrastination-and-watching-cat-videos-online/)).
- **Kawaii and focus (moderate).** Nittono 2012: three experiments with 132 students; after viewing photos of puppies and kittens, participants did careful tasks better and more slowly, possibly because the scope of attention narrowed. The effect is short-term and in the lab, with no evidence yet for an all-day office setting ([APS](https://www.psychologicalscience.org/news/minds-business/the-power-of-puppies-looking-at-cute-images-can-improve-focus.html)).

### Mascots and desktop pets: lessons from success and failure

| Example | Lesson | Confidence |
| --- | --- | --- |
| [Clippy](https://thenewstack.io/humanity-vs-clippy-lessons-from-microsofts-failed-virtual-assistant/) | Failed on behavior: repeated useless advice and did not learn from the user; negative feedback from test groups was ignored | Moderate (tech press quoting experts) |
| [Bonzi Buddy](https://en.wikipedia.org/wiki/BonziBuddy) | Lost trust over data: labeled spyware/adware, changed the browser home page; in 2004 the FTC fined it 75,000 USD for collecting data from children under 13. A direct lesson for products with young users | Moderate to strong (secondary encyclopedia) |
| [Duolingo](https://jtbdux-protocol.pages.dev/adoption-and-behavior/behavior-design-patterns/how-duolingo-engineered-50-million-daily-users-and-the-backlash-that-came-with-it) | Streaks retain users, but escalating notifications have been called “guilt marketing”; most growth figures are published by the company | Weak to moderate (market analysis) |
| [Finch](https://slate.com/technology/2026/09/finch-app-self-care-wellness-review.html) | A no-punishment philosophy, but “missing you” notifications still annoyed the reviewer | Weak (anecdote) |
| [Pokémon Sleep](https://automaton-media.com/en/news/20240201-26555/) | The company reports that Japanese players who stayed more than three months slept about 1 hour 10 minutes longer; no control group, survivorship bias | Weak (company press release) |

### Organic spread

Berger & Milkman (2012) analyzed nearly 7,000 New York Times articles: positive content, content that evokes awe or amusement, and useful content are shared more; sadness reduces sharing. Limitations: one newspaper, the year 2008. Confidence: strong for news, moderate when extrapolated to stickers ([JMR](https://faculty.wharton.upenn.edu/wp-content/uploads/2011/11/Virality.pdf)). The STEPPS framework in the book “Contagious” is from a popular book; its peer-reviewed origin could not be traced in this session.

### Vietnamese and global culture

- **The cat is a zodiac animal in Vietnam.** Two explanations: the “mao/mèo” homophone and the cat's role catching mice in wet-rice farming; cat-shaped decorations are common at Tết ([SCMP](https://www.scmp.com/news/asia/southeast-asia/article/3207357/why-vietnam-celebrating-year-cat-not-rabbit)). Moderate.
- **Zalo is a sensible channel.** 79.2 million monthly users (Q3 2025) and about 2.1 billion messages per day; figures published by the company ([Znews](https://znews.vn/2-1-ty-tin-nhan-gui-di-moi-ngay-tren-zalo-post1600063.html)). Moderate.
- **Stickers sell well when they are usable every day.** LINE names three shared traits across four markets: usable every day, clear emotion, recognizable characters. In Thailand, packs about office stress are popular; in Taiwan, local creators account for 80% of sales ([LINE](https://www.linecorp.com/en/pr/news/global/20260715/)). Moderate, company press release.
- **Facial expressions are more shared between East and West.** A study of emoji on Twitter and Weibo: smiling, happy and angry faces are the most consistent; work and friendship topics differ more ([arXiv](https://arxiv.org/pdf/1904.02671)). Moderate, preprint.

### Designing for many ages

Motion needs an off switch. More than 35% of adults have experienced a vestibular disorder by age 40; WCAG requires a way to pause or hide auto-playing motion that lasts more than 5 seconds ([web.dev](https://web.dev/learn/accessibility/motion)). Confidence: strong. Gap: no direct research was found on character tone of voice for older adults.

### Five character principles

1. **The user calls; Peak does not interrupt.** Silent by default while the user is working (the Clippy lesson).
2. **No guilt.** No sadness, no blame, no escalating “missing you” notifications (Duolingo, Finch).
3. **Just cute enough, in short doses.** Appear briefly before work that needs care, without performing continuously (cute aggression, Nittono).
4. **Absolute data transparency.** Collect the minimum, especially if people under 18 slip through the age gate (Bonzi Buddy).
5. **Controllable motion.** Offer a static mode and respect the operating system's reduced-motion setting.

### Five mechanisms of organic spread

1. **Moments of delight and surprise.** Peak's rare behaviors are worth a screenshot.
2. **A sticker is a complete reply.** Each sticker works in everyday work chat.
3. **Local office humor.** A Zalo pack made for the Vietnamese office context; the global pack relies on facial expressions.
4. **Open to fan creativity.** Allow people to redraw Peak and make Peak stickers, following LINE's local-creator model.
5. **Real usefulness, so there is a reason to recommend it.** Content with practical value is shared more; measure by referrals, not by time spent.

## Measurement and validation

Because there is no evidence specific to a desktop cat, Streakboom must create its own: measure both benefits and harms, pre-register hypotheses, and stop any experiment that worsens any guardrail metric, even when Bond Days rise. Note: the startup sample sizes and the metrics in the metrics subsection are proposals from the research stream, with no published standard; the copyright terms of many scales have not been verified.

### Scales that can be used

| Scale | Length | Terms of use | Confidence |
| --- | --- | --- | --- |
| [UCLA 3-item](https://meps.ipums.org/meps/resources/Hughes_et_al2004.pdf) (loneliness) | 3 questions, total 3–9; alpha 0.72 | License unverified; the original sample was people aged 50+, not validated for ages 13–17 | High on psychometrics, low on copyright |
| [WHO-5](https://cdn.who.int/media/docs/default-source/mental-health/who-5_english-original4da539d6ed4b49389e3afe47cda2326a.pdf) (mental well-being) | 5 questions, past 2 weeks, converted to 0–100; below 50 warrants further assessment | CC BY-NC-SA 3.0 IGO, non-commercial only; commercial use requires permission from WHO | High |
| [BPNSFS](https://selfdeterminationtheory.org/basic-psychological-need-satisfaction-and-frustration-scale/) (autonomy, competence, relatedness) | 24 items; a children's version exists | Free for academic use; commercial use requires permission from the Center for SDT | High |
| [Bergen (BFAS/BSMAS)](https://psytoolkit.org/survey-library/addiction-bergen-facebook.html) | 6 items, 1-year recall; liberal cutoff of 4/6 items | No formal license | Medium |
| [Brief-LAPS](https://www.frontiersin.org/articles/10.3389/fvets.2025.1619187/full) (pet attachment) | 7 items (0–21) | Written for real pets; wording must be adapted and re-validated; license unverified | Medium |
| [EHARS](https://d-nb.info/1374759716/34) (human–AI attachment) | 7 items | CC BY 4.0; the authors call the validation preliminary, Chinese version only, small sample | Low–medium |
| [MIT/OpenAI scale set](https://cdn.openai.com/papers/15987609-5f71-433c-9972-e91131f399a1/openai-affective-use-study.pdf) | ULS-8 (loneliness), LSNS-6 (socialization), ADS-9 (emotional dependence), PCUS (problematic use) | ADS-9/PCUS licenses unverified | High on having been used |

No scale validated specifically for desktop virtual pets was found. EHARS and Brief-LAPS with adapted wording are the closest. The source page for the SAS-SV scale for minors could not be read, so it is left out of the table.

### Feasible small study designs

- **RCT reference point.** MIT/OpenAI ran 4 weeks, 981 people, 9 conditions, with IRB approval, but lacked a no-chatbot group, so outside factors cannot be separated ([arXiv](https://arxiv.org/html/2503.17473v1)). High.
- **In-app survey.** OpenAI used an 11-question pop-up, collected 4,076 responses, and acknowledged self-selection bias. Streakboom (opt-in) will face exactly this bias. High.
- **ESM (experience sampling).** Meta-analysis of 79 studies: average compliance was about 79%, falling by about 1 point for each additional prompt per day. Use 1–2 questions a day for 7–14 days ([JMIR](https://www.jmir.org/2019/12/e14475/PDF)). High; samples were mostly adults.
- **Micro-randomized trial.** Each person is randomized at many decision points, which suits testing individual Peak gestures (for example, whether or not to suggest a break) ([arXiv](https://arxiv.org/abs/1504.00238v2)). Medium.
- **Realistic sample size.** 64% of Headspace trials were judged underpowered because they had fewer than 102 people ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9533203)). Proposal from the research stream: at least about 100 people per arm for an A/B test or a 30-day longitudinal study; below that, report descriptive results only. Medium.

### “Healthy reduction in frequency” metrics and product health

This part is inference by the research stream; confidence is low–medium.

- **Healthy reduction:** the share of people whose usage time falls while WHO-5 and loneliness scores hold steady or improve, and Bond Days do not collapse.
- **Regret:** a single item, “I regret this session” (7 levels), has been used in ESM research; there, sessions without a purpose were regretted most (n = 17, very small; [arXiv](https://arxiv.org/pdf/2410.11354)).
- **Compulsion:** the share of people above the cutoff on a PCUS/Bergen-type scale; the 90th–99th percentiles of session time instead of the mean.
- **Night-time:** the share of interactions between 23:00 and 05:00 local time, broken out by age group.

### Research ethics

- **Real consent.** Facebook's emotion experiment was criticized for treating the terms of service as consent and because the research team was not independent of the product team. Each study needs its own consent and a reviewer from outside the company ([analysis article](https://socialmediacollective.org/2014/07/01/facebook-experiment/), an opinion piece).
- **Minimal data.** OpenAI ran automated classifiers, with no human reading, and stored only labels. Streakboom should store only event counters, not chat content.
- **Safety.** Woebot used checkbox consent, was approved by the Stanford IRB, and showed crisis support resources when users reported thoughts of self-harm.
- **Vietnamese law.** The Personal Data Protection Law took effect on 1 January 2026 (details in the legal section); with an 18+ scope the consent rules for children apply less, but a lawyer needs to confirm the level of age gate.

### Lessons from other companies

- **Woebot:** RCT of 70 students, 2 weeks, with an ebook as the control; PHQ-9 fell (d = 0.44), anxiety did not differ; a co-founder is a co-author ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5478797)). High.
- **Headspace/Calm:** 14 Headspace RCTs and 1 Calm RCT, with mixed results (depression improved in 3/4 studies, stress in 2/5); half had conflicts of interest, and only 36% were pre-registered ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9533203)). High.
- **Duolingo:** a 4-question framework using the external ACTFL test; the 340-person study is cross-sectional and states its own limitations ([blog](https://blog.duolingo.com/duolingo-efficacy-research-framework)). High.

The shared lesson: pre-register hypotheses, use external measures, and publish negative results and conflicts of interest too.

### Three-phase measurement plan

1. **Before launch.** Obtain commercial permission for WHO-5 and BPNSFS, or sign an academic partnership; finalize a survey of about 15 questions (WHO-5, UCLA-3, 6 Bergen-type items with adapted wording, 1 regret item); run cognitive testing with 5–8 people across several adult age groups, in Vietnamese; pre-register hypotheses; invite an independent ethics reviewer; define the minimal telemetry events.
2. **30 days.** Take a baseline (T0) at opt-in and measure again on day 30; run ESM with 1 question a day for 14 days; report descriptive results only (Bond Days distribution, chat/care ratio, the 90th-percentile tail), without setting thresholds yet.
3. **90 days.** Take a third measurement (T2) and compute the “healthy reduction” rate; run one A/B test or micro-randomized trial on break suggestions, with about 100 people or more per arm; set Bond Days thresholds from baseline data; publish a short report, including negative results.

### Ethical guardrail metrics

- [ ] Chat/care ratio (already chosen).
- [ ] 95th percentile of daily usage time and of session time.
- [ ] Share of interactions between 23:00 and 05:00, broken out by age group.
- [ ] Share of people above the compulsion cutoff (4/6 items).
- [ ] Mean regret score per session.
- [ ] Share of people with WHO-5 below 50 or a sharp drop from T0, with support resources shown.
- [ ] Change in UCLA-3 and in socialization with real people (LSNS-6).
- [ ] Experiment stopping rule: any arm that worsens any of the metrics above is switched off, even when Bond Days rise.
- [ ] Opt-in rate and withdrawal rate, to track sample bias.

## Design principles for Peak and Streakboom

This section consolidates the sections above into a set of hard rules to put in the spec, together with one decision to settle now and a measurement roadmap. It is my synthesis and proposal based on the evidence above, not the result of a separate study.

### The decision to settle first: AI chat and age

The Gemini API terms prohibit use in apps likely to be accessed by people under 18, while voice chat is being considered through Gemini. The scope has moved to 18+ (option C). The options considered:

| Option | Content | Trade-offs |
| --- | --- | --- |
| A. Chat/voice for 18+ only (I proposed this as the default) | People aged 13–17 still use Peak, just without AI chat | Reduces legal and ethical risk the most; needs a neutral age gate and acceptance of a different experience by age |
| B. Change model provider | Use a provider that permits minor users | Keeps the full 13+ scope, but we must verify the provider's terms ourselves and take on the added obligations of SB 243, JED and the Children's Code; I have not checked any provider |
| C. Raise the threshold for the whole product to 18+ | Do not serve people under 18 | Simplest legally, but loses the teenage group |

Option C (18+) has been chosen. The age gate must be effective, because the Gemini terms and the UK Children's Code apply to apps likely to be accessed by people under 18; a lawyer needs to confirm.

### Hard rules for the product

| # | Principle | Concretely in the product | Basis |
| --- | --- | --- | --- |
| 1 | Do not punish absence | Peak does not get hungry, sad or die; no “missing you” notifications; Peak sleeps while you are away | Anxious attachment is linked to poor mental health; guilt caused by a “needy” AI is a mechanism of harm |
| 2 | Cumulative count, no reset | Bond Days only go up; no “broken streak”; no selling or trading ad views for streak repair | Broken streaks make users quit (Silverman & Barasch); habits tolerate one missed day (Lally). A hypothesis we must measure ourselves |
| 3 | Clean goodbyes | When the user closes the app or says stop, Peak says one line of goodbye and stops; written as a hard rule with automated tests | 37% of farewells in companion apps were met with hold-back tactics (De Freitas) |
| 4 | Peak stays at the periphery | No pop-up windows, no stealing focus, no covering the area being typed in; one-tap silent mode; static mode following the reduced-motion setting | Calm technology; Clippy; WCAG |
| 5 | Few, batched notifications | Few by default, users set their own schedule; not switched off entirely | Batching notifications reduces stress; turning them off entirely increases anxiety (Fitz) |
| 6 | No uncertain rewards | No loot boxes, no random rewards tied to how often the app is opened; no endless content | Variable reward is a precondition for behavioral addiction |
| 7 | Point users outward | Suggest a break, movement, messaging a friend; no role-playing an exclusive relationship | Substituting for human relationships goes with higher loneliness (weak to moderate evidence) |
| 8 | Chat is secondary, with a soft cap on dose | Keep the chat/care ratio as a guardrail; voice: short sessions, break reminders, neutral voice; do not measure success by duration | Heavy use correlates with loneliness and dependence (MIT/OpenAI; correlation, not causation) |
| 9 | Transparency and minimal data | Clear notice that Peak is AI; opt-in telemetry, counters only, no chat content stored; leaving and deleting data is as easy as signing up | SB 243, AI Act Article 50, Children's Code, Vietnamese law; Bonzi Buddy |
| 10 | Modest claims | Say only “a pleasant companion”; do not claim healing or reduced anxiety, depression or loneliness | Weak evidence; FDA/MDR count marketing claims too |
| 11 | Safety in crisis | Detect self-harm signals, route to the correct country's helpline, do not pose as a therapist | SB 243, the New York law, JED recommendations |

### How the mission should be worded

A mission of “psychological rescue” is not supported by the evidence and easily breaches claim rules. Proposed wording: *a small friend who makes the workday lighter and leads you back to real life*. The measure of success that fits this mission is that you live better while using it less, not using it more. This is your choice; the numbers and studies above do not decide it on their own.

### Proposed roadmap

The timings below are suggestions, not commitments; each phase has a gate that must be passed before moving to the next step.

1. **Preparation before launch.** Settle on option A, B or C; write hard rules 1–11 into the spec; bring in a lawyer for review; obtain commercial permission for the scales; pre-register hypotheses. *Gate:* the lawyer confirms the chat model and age scope; the clean-goodbye and crisis-safety tests pass.
2. **First 30 days.** Launch to a small opt-in group; take baseline and ESM measurements; report descriptive results only. *Gate:* the guardrail metrics do not worsen against baseline.
3. **90 days.** Take the third measurement, run an A/B test on break suggestions, and set Bond Days thresholds from data. *Gate:* the “healthy reduction” rate and well-being scores do not worsen; if passed, expand and go to Product Hunt; if not, fix the design first.
4. **After 90 days.** Publish a short report, including negative results; only then consider selling stickers and accessories as a demand experiment, not as a way to retain users.

## Sources and recommended reading

The sources sit in each section above, with links and confidence levels. Most were read through summaries, abstracts or news coverage, not full texts; only the Gemini API terms page was opened directly by me for confirmation. The most important sources:

- Pets and mental health: [review of 116 studies (Animals 2025)](https://mdpi.com/2076-2615/15/8/1143); [Baltimore longitudinal study (Friedmann 2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12733245/).
- AI companions: [De Freitas 2025](https://arxiv.org/abs/2508.19258v3); [MIT/OpenAI RCT](https://arxiv.org/html/2503.17473v2).
- Streaks: [Silverman & Barasch 2023](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions).
- SDT-based design: [METUX](https://pmc.ncbi.nlm.nih.gov/articles/PMC5985470).
- AI terms of service: [Google AI terms](https://ai.google.dev/terms).
- Regulation: [FDA General Wellness](https://www.fda.gov/media/90652/download); [ICO Children's Code](https://ico.org.uk/media/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services-2-1.pdf); [FTC 6(b)](https://search.ftc.gov/news-events/news/press-releases/2025/09/ftc-launches-inquiry-ai-chatbots-acting-companions).

### Recommended books

The titles below are suggestions from my existing knowledge and were not re-checked in this session (except the books that appeared in search results: Braving the Wilderness, Hooked, The Power of Habit, Reality Is Broken, Alone Together). Confirm the book titles and authors before citing them.

| Topic | Books |
| --- | --- |
| Connection and belonging | *Braving the Wilderness*, *Atlas of the Heart* (Brené Brown); *Loneliness* (John Cacioppo) |
| Humans and animals | *The Genius of Dogs* (Hare & Woods); *Cat Sense* (John Bradshaw); *Inside of a Dog* (Alexandra Horowitz); *Some We Love, Some We Hate, Some We Eat* (Hal Herzog); *The Biophilia Hypothesis* (Kellert & Wilson) |
| Humans and machines | *Alone Together*, *Reclaiming Conversation* (Sherry Turkle) |
| Motivation and habits | *Self-Determination Theory* (Ryan & Deci, 2017); *Atomic Habits* (James Clear); *Tiny Habits* (BJ Fogg); *The Power of Habit* (Duhigg) |
| Ethical, anti-addictive design | *Digital Minimalism* (Cal Newport); *Indistractable* (Nir Eyal); *Stolen Focus* (Johann Hari); *Evil by Design* (Chris Nodder); *Positive Computing* (Calvo & Peters) |
| To know the mechanisms to avoid | *Hooked* (Nir Eyal); *Irresistible* (Adam Alter); *Reality Is Broken* (Jane McGonigal) for a positive view of games |
