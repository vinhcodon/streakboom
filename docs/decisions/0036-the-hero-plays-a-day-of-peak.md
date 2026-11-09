# ADR-0036: The website's Peak plays "a day of Peak" by itself, with captions, and then settles

- **Status:** accepted (built 2026-11-09)
- **Date:** 2026-11-09
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
The interactive Peak on the home page showed a row of buttons (one per pose) and did nothing until a visitor pressed one: still and a little dull, and the poses had no explanation. A carousel that never stops would go against what Peak is: polite, still while you work, and frugal with the processor (the app's focus-safety, ADR-0029; the CPU work of 0.2.3 and 0.2.4).

## Decision
The author chose the recommended option in all three questions.
- **The tour:** the hero plays ten scenes by itself, in order, each 4 to 5 seconds, each with a one-line caption in the page's language: standing and looking around, wandering, making way, happy, belly rub, three feelings of an answer (surprise, curiosity, sympathy), dozing off, waking with a stretch. The buttons under the cat are these scenes, in this order; the one being played is highlighted. Scenes and timings are in `site/scenes.js`, the sequencer is `site/tour.js` (pure logic with injectable timers, tested in `scripts/site/tour.test.mjs`), the connection to the rig is `site/peak.js`.
- **Polite:** it stops while the pointer is over the cat and its buttons (and for 2.5 s after), while a button has keyboard focus, while the page is hidden or the cat is scrolled out of view, and while the visitor has pressed **Pause**. When the visitor takes control (a click on the cat or a button) it stays still; after 10 seconds without interaction it plays one more round. With "reduce motion" set in the system there is no tour at all: only the buttons.
- **Frugal and calm:** after **two rounds** the cat settles into standing still and blinking now and then (as the app does); **Play** starts it again. The rig already redraws only when something moves.
- **Captions describe, neutrally, things the app really does**; they do not put new lines in Peak's mouth. Each is tied to a source: standing and looking around (`pickNext`, README "lives on top of your screen"); wandering ("wanders on its own, always stays on screen", README); making way (CHANGELOG 0.2.4 and 0.2.5, README "Out of your way"); happy (a click makes Peak happy in `+page.svelte`; scratching, README); belly rub (README); surprise, curiosity and sympathy (`moodPose` in `sprites.ts`: the mood a brain tags its answer with; README "each answer comes with a feeling the pet acts out"; the captions say "with an AI brain"); dozing and sleeping (README: Quiet mode, quiet hours; `pickNext`); waking with a stretch (CHANGELOG 0.2.4).
- **A fix on the way:** a click on the cat used to show the "surprised" pose; in the app a click makes Peak happy. The site now does the same.
- **Checks:** the build fails if a scene lacks its caption or chip label in any language, if a caption is too long for its fixed-height box (110 characters, 60 in Japanese), or if the first caption is not in the static HTML. The caption box has a fixed height so nothing moves when it changes.

## Alternatives considered
A fake pointer that performs the gestures on the cat (more explicit, more work, more ways to drift from the app); leaving the buttons as they were; playing forever (tiring, costs battery, against Peak's calm); one round only (a visitor who arrives late misses it); captions in Peak's own voice (new lines for three languages that the app does not have).

## Consequences
- The three feelings need an AI brain in the app; the captions say so, and the "not tried" status of the Claude and OpenAI brains is on the page already.
- Every new scene or caption needs three languages and a source in the app.
- Not verified: the "reduce motion" path in a real system setting (the code path is exercised only by reading it and by the unit tests of the sequencer), a screen reader, a phone, the processor and battery use of the tour over a long visit, and the Vietnamese and Japanese captions by native readers.

## Sources
`site/scenes.js`, `site/tour.js`, `site/peak.js`, `app/src/routes/+page.svelte` (the click handler, `pickNext`), `app/src/lib/sprites.ts` (`moodPose`), README, CHANGELOG 0.2.4 and 0.2.5, ADR-0029, ADR-0034.
