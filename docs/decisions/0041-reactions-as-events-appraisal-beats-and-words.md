# ADR-0041: Reactions are events with an appraisal, shown by a small library of beats and filled with words from slots; the persona is layered and shown read-only

- **Status:** accepted (decisions R1 to R4, 2026-11-10); nothing built yet (epic E12 of the backlog)
- **Date:** 2026-11-10
- **Decided by:** Vinh (author), with Claude

## Context
The first fall (PC-7) appeared and spoke but did not feel like a startle: one generic `gasp` face, the line in the same instant, a hold chosen in code. The author saw that reactions written one rule at a time would become thousands of overlapping rules, and suggested a skills-like approach (small pieces loaded when they apply). Reactions reach the screen by three separate paths (line pools, poses chosen in the page, mood tags from the model), and the persona prompt is a fixed function in `brain.rs` that the user cannot see.

## Decision
Spec 09 is the design. The four open questions were answered:
1. **R1: five axes.** An event carries an appraisal of five numbers (surprise, valence, arousal, about_user, control); the six feelings of ADR-0016 become named points in that space.
2. **R2: bundled first.** Events, beats and persona parts ship inside the app. Loading them from a folder the user controls (character packs) gets its own decision later.
3. **R3: the model may write the remark that follows a reflex**, from a reaction card, given only the event name and the appraisal (no sizes, positions, titles or counts), inside the existing caps (6 unprompted lines a day) and behind a switch in Settings, Brain. The reflex never depends on it.
4. **R4: the persona page is read-only first.** "What Peak is told" shows the assembled prompt for the current settings; editing the voice (with presets and a locked core) is a separate later story.

Also recorded: the body always acts first from local data (the model is too slow for a reflex); a reaction has a shape in time (freeze, jolt, words, look, act) written once per feeling as a beat; the rules that hold for every reaction (anticipation first, words 100 to 300 ms after the jolt, at most 1.5 s, one at a time with priority, a budget) are written once.

## Alternatives considered
A rule per event (rejected: the author's concern, and the first fall); the six named feelings only (rejected: they cannot tell a startle from a pleasant surprise); the model choosing every reaction (rejected: latency and cost, and Peak must work without a brain); user-loadable beats from the start (rejected for now: it makes the format a public contract before it has been used); an editable voice at once (rejected for now: a bad edit could break the mood-tag format or the safety rules).

## Consequences
- PC-7's reflex moves to the `startle` beat (RX-1); the placeholder stays uncommitted until then.
- ADR-0016 is amended: the model's mood tag sets the appraisal instead of selecting a separate reaction.
- Existing reactions move into beats when each is next touched; both ways work side by side until then. **Audit (2026-11-10, spec/09 section 7):** only the five reflexes that speak (poke, head scratch, belly rub, belly trap, naming) break the rule "words follow the body"; they get a small helper first (RX-3a). Chat-answer moods are an *expression* (words at once, pose alongside) and ambient behaviour is outside the reflex rules. The notice beat, the lane hop and making way already follow the rules.
- Not verified: that five axes are enough, that a selected beat feels as good as a hand-made one, that the remark is worth its cost, how the Japanese exclamations read (V-70).

## Sources
spec/09-reactions.md; docs/engineering-log.md (PC-7 first try and spec 09)
