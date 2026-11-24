# ADR-0161: Peak moves at one unhurried pace and yields to the chat box; the bubble speaks only when the box is hidden; Paws's portrait sits at the box's top-left

- **Status:** accepted on 2026-11-24 for the prototype (the branch `exp/duo-prototype` and the portrait variant of issue 15; nothing ships, ADR-0139). The author raised four points after trying the build; each was chosen from options.
- **Date:** 2026-11-24
- **Decided by:** Vinh (author)

## Decision
1. **One unhurried pace.** Every walk Peak makes on purpose (Lượn đi, through its door, back to its seat, stepping aside, to a wall) uses one pace, **60 logical px per second** (about 1.7 times its stroll of 36), with no time cap. The door walk was at least 230 with a 4 s cap; the others were 110. Falls, hops and gravity are unchanged. Peak's character is unhurried.
2. **Peak yields to the chat box.** When the box appears over Peak, Peak lifts its ears for a moment and walks at that pace to the nearer side of the box until it is clear — **also when it is asleep** (it wakes to step aside). Charter manners: yield first, look before moving.
3. **The bubble above a pet speaks only when the box is hidden.** While the box shows (engaged or as the faded log), a pet's line goes to the box alone, so the eye is not pulled to the pet for a duplicate. The bubble stays for what a pet says when no box is showing.
4. **Paws's round portrait (issue 15)** sits **left of the box, level with its top**, like the picture of someone taking part, clear of the field and of Peak's floor. Still "beside the chat" (issue 15, revision r1, AC1).

## Consequences
- `duo.rs` (the door walk's pace, the portrait's place, the box tells Peak's page where it is), Peak's page (the pace of purposeful walks, the yield, the bubble rule), the leave skill's pace (`leave.skill.json`). Motion: the author looks at a build first (rule 8). V-208 for what is not yet seen.
