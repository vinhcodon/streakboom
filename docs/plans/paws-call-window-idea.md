# Idea: Paws appears only in a round window, as on a call (for brainstorming with Codex)

Raised by Vinh on 2026-11-24; written down by Claude (Anthropic) at his request, to be reviewed with Codex on a GitHub issue. **Nothing is decided and nothing is built.** Vinh chose to try it as a small prototype first (option A below) and to start only when he says so. Statements are marked **Observed**, **Inferred** or **Opinion**.

## The idea (Vinh's words, summarised)

Only Peak lives on the screen with its movements (walking, being stroked, scenes). Paws, when it is out, shows through a round window somewhere sensible on the screen, like a person on a video call. Paws does not walk or get stroked; it takes part by talking, and later perhaps by voice.

## Why it is attractive (opinion)

- **Cost.** Paws is where most of the remaining work is: new art (DU-11 step 2, walk cycle, stand, sleep), being dragged, walking in and out, the shared scenes (ball, cushion), climbing (DU-11 step 3). Its voice is what Vinh likes most about it.
- **One owner of the screen.** Peak stays the only pet in the corner of a working screen; Paws is a guest who visits. The screen is calmer.
- **Weight.** A small portrait window is lighter than a second walking pet with its own hit test.
- **The mention already fits.** `@Paws` calling it out (ADR-0157, ADR-0158) maps directly onto "opening the window".

## Where it touches the charter and what exists (inferred)

1. **Article 6, "it works without AI".** If Paws exists only through talk, a person with no key sees a round frame that does nothing. The portrait must stay alive without a brain: the eyes that follow (built in DU-11 step 1), the ears, a wag inside the frame, and a bag of canned lines.
2. **Articles 2 and 7, "the attention is theirs" and "never pretends to be a person".** A "video call" suggests a ringing phone and a real person calling. Paws must never ring or open by itself; it appears only when the person calls it (a mention, `/call`, a double click). The frame should look like a window of the pet, not a call screen with an answer button.
3. **Article 4, privacy.** Camera imagery makes people think the camera is on: no camera icon, no "live" badge. Voice later means a microphone, a new sense, which is a decision of its own (AGENTS rule 4).
4. **What would change.** The shared scenes need Paws's body and would go (ADR-0139 to 0144 scenes, step 3). DU-11 shrinks to the face (eyes and expressions in the frame); ADR-0154 step 2 (new walking art) may be dropped. The chat box, mentions, the shared talk room, Paws's voice (v6) and the pronouns (ADR-0156) stay as they are.

## Options Vinh was given

- **A. A small prototype first, then decide** (chosen): a round frame with Paws's face (the front picture with the moving eyes), opened by `@Paws` or a double click on Peak, placed beside the chat box; used for a few days beside the current build; then an ADR.
- B. Decide now and plan the removal of the scenes and of DU-11 step 2.
- C. Keep Paws as it is, walking.

## Questions for the review with Codex

- Where should the frame sit: beside the chat box, beside Peak, or at the edge Paws would have walked in from? What happens when the box is hidden?
- What does Paws do when it is out and nobody talks (an idle face, or the frame closes after a while)? Does it close by itself, and how is that not a "hang up" that feels like a rejection?
- Does Peak react to the frame (look at it, sit beside it), so that the two still feel like a pair?
- How is the frame dismissed: `/in paws`, a close button, Esc, the tray?
- How do we measure whether it is better: Vinh's days with both builds, a short note per day, the number of times Paws is called?
- What becomes of the ball and cushion scenes: dropped, or Peak plays alone?

## Not verified

Nothing here has been built or tried. The cost estimates are opinions from the current backlog, not measurements.
