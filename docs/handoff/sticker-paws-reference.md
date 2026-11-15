# Note to the sticker session: the reference drawing of Paws, the dog (a request)

**From:** the app session, 2026-11-15, by the author's order (ADR-0127). **Status:** a request; nothing is drawn yet. Read first: [`spec/19-duo-test-plan.md`](../../spec/19-duo-test-plan.md), [`docs/plans/duo-paws-svg-check.md`](../plans/duo-paws-svg-check.md), [`docs/handoff/duo-characters-hypothesis.md`](duo-characters-hypothesis.md).

## What is asked
One **reference sheet of Paws**, a hard-working dog, the partner of Peak (the cat) in a sticker test. **No other sticker yet**: the author looks at the sheet first (at 256 px and at 32 px, on a light ground and on a dark ground), and only after he approves are the eight stickers of spec 19 section 3 ordered.

## What the render check found in the reference SVG (the Gemini one, pasted by the author)
- The near-black body (#2B2D31) and ears **vanish on a dark ground**; at 32 px it reads as a small white bottle. A sticker is used on dark chats too: it needs a **light rim line around the body, a lighter dark tone, or a background shape**.
- The silhouette reads like a penguin or a hamster: **bigger ears**, a muzzle, a clearer tail; **back legs and a neck**.
- The front paws are two outlined circles that look like rings: **real paws** (toes, or a different fill from the chest).
- The `xmlns` is `http://w3.org`: it must be `http://www.w3.org/2000/svg` (a `.svg` file in an `<img>` is broken otherwise).

## Rules
- The same rules as the other stickers: **no arm strokes** (paws on the body, on props or on the face), no health claims, the voice teases the situation or the animals and never the person; the dog's work is small, useless and sometimes ruined; the dog is not a mirror that makes the person feel lazy.
- Not Doge, Cheems or Kabosu, and no meme text. The name Paws need not be printed on the stickers.
- Peak stays the cat of the charter: quiet, not "all play".
- The licence is CC BY 4.0 like all the stickers (ADR-0126).
- A Border Collie, black and white, is the idea; the author may change it.

## What comes after the author's look
The eight stickers (three of Paws alone, two of the pair, one four-panel story, two new stickers of Peak as a control) in Vietnamese, English and Japanese, with tags and aliases as spec 13 says. The counting Worker is checked by the author first (V-159).
