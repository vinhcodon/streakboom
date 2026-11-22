# ADR-0139: Peak and Paws may share the screen; who appears follows the last state, with no setting

- **Status:** accepted on 2026-11-22 for the prototype (job C of `docs/handoff/duo-prototype-and-cross-review.md`) and as the direction for the spec. Nothing ships: the work is on `exp/duo-prototype`, Preview only, behind a developer flag that is off by default. The product decision to ship a second pet is still the author's and is not made here.
- **Date:** 2026-11-22
- **Decided by:** Vinh (author)
- **Amended by:** ADR-0142 (2026-11-22): the tray single click now shows or hides the chat box and the **double click** is the click described below (everyone in, or the pet tucked last out); ADR-0143: the pet is no longer named by the person., answering four multiple-choice questions; the appearance rule is his own wording

## Decision
1. **Paws may be on the screen at the same time as Peak, but only when the two are playing with each other.** Charter article 2 is protected: no bubble in a duo scene, no scene aimed at the person, one scene of at most two pets, a touch from the person cancels the scene cleanly, and the scenes spend the existing attention budget (`attention.ts`, `reactions.ts`), never a second one. Supersedes the "not while Peak is active" proposal of `docs/plans/duo-charter-impact.md`.
2. **No picker and no setting.** D-02 of spec v0.2 ("the person chooses Peak, Paws or both") is dropped. This agrees with ADR-0080 A1 and the charter ("few settings"). Who is on the screen follows one rule, from the last state:
   - **At start, the pets that were on the screen when the app closed are on the screen again.**
   - **If none was on the screen, a click on the tray icon brings out the pet that was tucked away last.** It walks out from the place where it went in.
   - **The other pet comes out only when the person asks the pet on the screen to call it.** Nothing else brings it out: no schedule, no event, and the pets never call each other on their own.
   - **A pet that comes out always comes out from the place where it last went in** (the entrance is remembered per pet).
3. **"Butler" (quản gia) is a role Paws gives itself between the two pets** (it tidies the shared ball, it finds something to prop). It is never aimed at the person: no care, no reminder, no worry about the person.
4. **For the prototype, the two pets are shown as two windows**, one pet moves at a time, the second window exists only while it is on the screen. The spike (`docs/plans/duo-render-spike.md`) measured +43 MB and a second WebView process for a second window; that cost is the price of this choice and is to be measured again in the prototype. A screen-sized window is refused (it makes Windows report the person as busy).

## Why
The author wants the two to feel like they live together, and wants the person's control to stay as small as a tray click and a call, with no screen of options. A rule from the last state keeps the pets where the person left them, which is the least surprising.

## Rejected
- **A picker in Settings** (D-02): a taste choice in Settings (ADR-0080 A1, charter).
- **Never two at once**: leaves the central question, whether the two seem to live together, untestable.
- **Paws calling Peak (or the reverse) by itself**: an event the person did not ask for; closer to a nudge.

## Consequences
- The state is stored per pet and add-only in `pet.json` (Stable and Preview share the file, ADR-0090): who was on the screen, who was tucked away last, the entrance of each. A Stable build ignores the fields and shows Peak alone.
- Open points that the rule does not settle are in `docs/plans/duo-appearance-and-scenes.md`; the author decides them before the prototype is built.
- **Not verified:** all of it; nothing is built. Each point is in `docs/plans/verification-debt.md` (V-179).
