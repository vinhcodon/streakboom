# ADR-0031: Peak perceives shapes and activity, never meaning; it may sense the ground under it; it notices before it acts

- **Status:** accepted (decisions; partly built: the button reading and the click anchor in 0.2.5, the sleeping cat that wakes in 0.2.4; the notice beat (PC-2) is built after 0.2.5 and not released yet; the ground sense is not)
- **Date:** 2026-11-09
- **Decided by:** Vinh (author), with Claude

## Context
Vinh suggested that, besides the signals around Peak (spec/06, spec/07), Peak needs a theory of seeing the space around and **below** it: when it can see, it knows how to react. Spec/08 (a brainstorm draft) proposes senses (whiskers, ears, paws, eyes, a clock), a percept to belief to reaction model with confidence, and lists ten gaps found against the existing specs. A probe on the author's machine showed that the caret is not reported by Chromium and Electron apps, that a ground classification at points costs about 4 ms for 144 points, and that the author's whole screen is one maximized app window.

## Decision
1. **The sensory contract:** Peak perceives **shapes and activity, never meaning**: that something is there, its size, whether it moved, whether the user is active near it. It never reads what a window shows, what is typed, which keys are pressed or what an app is called. This is the rule for every present and future sense; the README and the website say it once for all.
2. **Paws (below):** Peak **may sense what it stands over**: the kind of thing at a few points under and around the cat (bare desktop, the taskbar, an app window, the foreground window), classification only, nothing kept or sent. When the ground under it disappears it notices (a gasp) and falls (the T5 decision of spec/07).
3. **Not decided here:** the coarse **ground map** (a 16 x 9 grid) and window perches. It reveals the layout of the user's windows and has its own decision when the window layer (L3) is built; on a fully maximized screen it adds almost nothing.
4. **The notice beat:** before it makes way the cat visibly notices (looks toward the pointer or the predicted caret and perks its ears for about 0.4 s), and while the user types near it the cat looks toward that attention, not only toward a pointer that is over it. The author reviews it on a test build before the commit, as for every new motion.
5. **A sleeping cat is not blind:** if the user types right by a sleeping cat for several seconds it wakes with its usual stretch and then makes way (it ignores a distant pointer). This corrects a gap of FS-4.

## Alternatives considered
No shared contract (rejected: the rule was spread over three ADRs); reading the caret through UI Automation (rejected in ADR-0029); a ground map from the start (deferred); reacting without a visible lead-in (rejected: the author's complaints about jolts and see-through cats were all about reactions that lacked one); leaving the sleeping cat asleep (rejected).

## Consequences
- Spec/08 section 9 is answered for items 1, 2, 4 and 5; item 3 stays open. Backlog E10: PC-2, PC-4 and PC-5 are ready (the author looks at test builds first); PC-6 waits for the L3 decision; PC-1 (the belief module) can follow.
- The privacy text (README, website) gains one paragraph covering the contract, the attention field, the click anchor and the ground type when they ship (TE-9).
- Not verified: everything except the probe measurements of 2026-11-09.
