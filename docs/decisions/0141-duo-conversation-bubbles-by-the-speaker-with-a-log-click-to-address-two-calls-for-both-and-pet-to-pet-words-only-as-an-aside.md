# ADR-0141: Duo conversation: a bubble by the speaker and a log, click to address, two calls for "both", pet to pet in words only as an aside

- **Status:** accepted on 2026-11-22 for the prototype and as the direction for the spec; nothing ships (see ADR-0139). The author chose each point from the options of `docs/plans/duo-conversation-design.md`.
- **Date:** 2026-11-22
- **Decided by:** Vinh (author)
- **Amended by:** ADR-0142 (2026-11-22): the person types in one floating chat box, not beside a pet; the chips of point 2 became the recipient avatars at the top of that box. The bubbles of point 1 and points 3 to 5 stand.

## Decision
1. **Display (option D):** every line is a short bubble beside its speaker, one at a time through a queue; the listener turns its head to the speaker before the line appears. The same turns are kept in a room log shown as a panel when the person clicks a pet to talk. Under reduced motion the panel is the main text surface.
2. **Input (option I4):** a click on a pet opens the box addressed to it (a name and a colour show who hears); chips `Peak`, `Paws`, `Both` change the recipient (with one pet out the chips are hidden); a name written in the text overrides; the local commands (ADR-0139) are caught before any model call. This needs the hit test of the second window.
3. **"Both":** one model call per speaking pet, one after the other; the second sees the first's line and may answer with a pass (a nod). Each call counts in the chat quota.
4. **Pet to pet in words:** only as an aside right after a turn of the person to both, one line, never a chain. Scenes stay wordless; no unprompted talk between the pets.
5. **The layers** are those of section 5 of the design (safety, character, capabilities, situation, protocol, utterance, presentation, input). The model decides words; the code decides permission, timing, place and attention. A pet's capability to talk is a profile file read by the gates and rendered as one short prompt layer.

## Why
Attribution by place makes the talk read as two animals, the log carries a three-way history, and the code keeps the attention cost of two speakers no higher than one (the budget is shared). Two calls keep the voices apart (H-02) and let the keys differ.

## Rejected
- **One call writing a script for both**: the voices blend and a separate key for Paws cannot be used.
- **A thread panel only**: handles three parties but reads as a messenger, not a pet.
- **Pets talking to each other unprompted**: the largest cost to the person's attention (charter article 2).

## Consequences
- **Not built, not verified:** everything above beyond the prototype of step 5. The first steps are `conversation.ts` (room log, turn order, pass rule) with a fake model and clock, then a bubble for each pet, then the hit test of the Paws window.
- The privacy text must say that the second pet may be shown what the first said, and that "both" makes two calls. Recorded in `docs/plans/verification-debt.md` (V-182).
