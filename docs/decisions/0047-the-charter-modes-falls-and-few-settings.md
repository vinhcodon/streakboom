# ADR-0047: A charter ranks Peak's principles; three attention modes; a fall only by the person's push or a lost seat; few settings

- **Status:** accepted (decisions answered by the author on 2026-11-10); the charter is written, nothing of the behaviour is built yet
- **Date:** 2026-11-10
- **Decided by:** Vinh (author), with Claude

## Context
The author asked for knocks and slips to be rare and strong, for slow, easy actions to come first, and for Peak to avoid distracting someone who is working beside it, and asked how it could tell work from play, and whether it needs a manifesto. The rules existed in about ten places (ADR-0013, 0021, 0029, 0031, 0045, spec 06 section 1.6, the privacy text) and new features began to pull against each other. Spec 11 holds the reasoning and an audit of the state today.

## Decision
1. **A short, ranked charter** (`docs/charter.md`, eight articles with a test each, "few settings", and eight manners as unwritten law). The order is the point: when two ideas conflict, the higher article wins. It changes only by a new ADR. The three-question filter of spec 06 section 1.6 becomes articles 2, 5 and 6; the README says what Peak promises (articles 1 to 4).
2. **Three attention modes, and "when unsure, assume Work".** Work (the person is active and not with Peak), Free (idle for a while), Play (the person touched Peak; it ends after about 2 minutes, or 20 seconds of work elsewhere with the pointer far). Play begins only by a deliberate act, so a false Play (Peak lively beside someone working) is what is avoided; a false Work costs one click.
3. **A tempo ladder** (still, unhurried, brisk, sudden). Spontaneous behaviour comes from the first two tiers; a sudden action needs an external cause.
4. **Peak falls only when the person pushes or drops it, or when its seat goes.** It never slips by itself, in any mode. At an edge it stops, peeks, sits, or climbs down. A push gets a teeter first (a recovery most of the time), then a fall; after a fall it is wary for a while and a push gets a recovery.
5. **Few settings, and none for an amount of behaviour.** A setting exists for a consent, a credential or necessity, or a value Peak cannot infer. The "liveliness" dial proposed in spec 11 is **declined**; Peak adjusts itself by the modes and by the **shoo** (the person moving it away or putting it to sleep makes it quieter for the rest of the day, in memory only).

## Alternatives considered
No charter, or the list only in spec 06 (declined: it would not say which rule wins). Two modes only (declined: Free is where climbing and perching belong). Rare self-caused slips in Play (declined). A liveliness dial in Settings (declined, see 5).

## Consequences and when to revisit
The settings that are amounts, Chattiness and Quiet hours, are to be retired in favour of the modes and the shoo, with a migration that reads the saved value once; that is a later story (CH-6) and waits for the author's go-ahead. The audit lists seven faults today, the main ones being a Free threshold of 5 seconds (a pause in typing) for walks, perches and lines, no edge check on a ledge, and a cry and a bubble on a lost seat in any mode. Revisit the numbers (2 minutes, 20 seconds, 4 recoveries in 5) on a test build the author looks at.

## Sources
`spec/11-restraint-play-and-the-charter.md`, `docs/charter.md`, the author's message of 2026-11-10 and four answers.
