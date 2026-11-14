# ADR-0103: Peak's skills are described in text files, built in stages

- **Status:** accepted as a direction (the author chose "in stages, Lượn đi first, a second skill next" on 2026-11-14). **Stage 1 is built (branch `vanish`, Preview 0.9.3, not yet seen, V-136):** `src/lib/skills/leave.skill.json`, the interpreter `skill-run.ts`, the page host. Each stage is checked against the charter before it is coded.
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The author asked whether Peak's scenarios and skills could be designed entirely as text (prompts for scenarios, skill files for abilities). Today "Lượn đi" is spread over four places that must agree: a phrase table (`intents.ts`), a persona paragraph (`persona/skills.md`), the gates and constants (`farewell.ts`) and the walk in `+page.svelte`. A second skill would copy all four.

## Decision
1. **A skill is one text file** that holds: its name, the phrases in three languages, the one-line description given to the model, the gates (when it may not run), and a short list of **steps**.
2. **Steps use a closed list of verbs**, interpreted by the page: `say` (a line from a named pool), `pose`, `walk_to_edge`, `hide`, `wait`, `show`, `count`. A skill cannot do anything that is not a verb; a new verb is a decision (an ADR), as a new sense is (privacy contract).
3. **The files generate the rest:** the intent table, the persona text, the gates and their tests. Nothing the model writes is ever run as a step: the model may only name a skill from the closed list, as it does today with `[skill:leave]`.
4. **Stages:** (1) "Lượn đi" is rewritten as a skill file with a minimal interpreter, with behaviour unchanged (the tests of today must still pass); (2) a second skill (to sleep, or to be quiet) proves that the format carries more than one; (3) later, scenarios triggered by events or times, sharing the existing budget of unprompted moments and the attention modes. Each stage is released as a Preview and seen by the author first.
5. **Rejected:** letting the model write steps or code (unsafe and unpredictable); a general scripting language (more than the verbs need); doing all three stages at once.

## Stage 1 as built (2026-11-14)
- **The file** (`app/src/lib/skills/leave.skill.json`): `skill`, `description` (the text given to the model), `phrases`, `patterns`, `pools` (the goodbyes), `gates`, `limits` (20 minutes away, the bubble, the trot and the deadline bounds, the 5-minute retry), `steps` (say, nod, wait, walk to the edge, hide 20 minutes, count) and `after_return` (a stretch). A JSON file, not a prose format: both TypeScript and Rust read it, and `validateSkill` refuses anything outside the closed lists (keys, six verbs, five gates, pools with two lines in each language, numbers in range, a count before the hide).
- **Who reads it:** `intents.ts` (the table of "leave"), `farewell.ts` (the goodbyes, the limits, the gate), the page (the steps), and Rust (`brain::skill_files`: the name and the description for the persona layer; `persona/skills.md` is gone). The closed list `SKILLS` stays in Rust, and a test checks it against the files.
- **The interpreter** (`skill-run.ts`) runs the steps in order, stops on a failed walk or hide (nothing is hidden or counted), and stops when the skill is no longer alive. The page gives the six verbs; nothing else can be asked of it by a file.
- **Behaviour is the same as Preview 0.9.2**, with one fix found while moving it: while Peak walks to the edge, a plain idle, look or nod request is ignored, because it used to stop the walk without ending the leaving (Peak stood still and the next command was refused as "already leaving"). A walk error now leaves Peak where it stands instead of hiding it (ADR-0102).

## Consequences
- The real bottleneck stays art: a verb needs a pose that exists in the rig.
- The charter applies to every file: no health claims, no character that needs the person, no new sense. The banned-pattern tests run over all lines of all skill files.
- A spec (`spec/14` section 7.3) is written with stage 1, not before.
