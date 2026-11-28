# ADR-0143: The person no longer names the pet: Peak is Peak and Paws is Paws

- **Status:** (amended by ADR-0168, 2026-11-28: with the experiment off, naming stays as on main) accepted on 2026-11-22. It is built on the branch `exp/duo-prototype` only (nothing ships from there, ADR-0139); it changes ADR-0014 and `spec/03`, `spec/04` when it is merged.
- **Date:** 2026-11-22
- **Decided by:** Vinh (author)

## Decision
1. **The person cannot give the pet another name.** The field "Pet's name" is removed from Settings > Memory, the pet no longer asks to be named, and nothing in the program (command words, lines, the notes sent to the model) answers to a name the person gave.
2. **The characters are fixed:** Peak the cat and Paws the dog. The author's reason: a cat the person has renamed is told apart from "the Peak" of the product, the website and the stickers, and the pet itself was seen telling the two apart.
3. **Data is kept.** `memory.json` keeps the field `petName` (Stable and Preview share the file and a field is never removed, see `app/src/lib/channel-data.test.ts`); it is read and written back as it was and has no effect. A person who had named the pet sees the pet answer as Peak from then on.
4. **What the pet calls the person is not touched by this ADR** (the field `callMe` stays): where it should live is a separate question, answered in its own ADR.

## Why
One name for one character is what the product, the stickers and the second pet rest on. A renamed Peak makes "which one is the real one" a question, and it cannot be told apart from Paws by name in a talk where both are on the screen.

## Rejected
- **Keep the field but hide it:** the pet would still ask, and old names would go on being used.
- **Let the person rename Paws only:** no; the two are alike in this.

## Consequences
- **Code (on the branch):** `shouldAsk("name")` is false; `setName` ignores `petName`; `knownFor` no longer says "your own name is ..."; the lines with `{pet}` say Peak; the command words are matched against the word "peak" only; the Settings row and its string are gone. Tests in `memory.test.ts` say so.
- **Not done yet:** `spec/03`, `spec/04`, ADR-0014, the README and the website still describe a pet the person can name; they change when the branch is merged. The first-run tour was not read for a mention of naming. Recorded in `docs/plans/verification-debt.md` (V-184).
