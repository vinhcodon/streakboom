# ADR-0164: Paws lives only in the chat: there is no switch, an invitation opens the group box, and solo stays as Peak is today

- **Status:** (amended by ADR-0165, 2026-11-27: old paths deleted only after the trial; the daily limit, the fade hold and discovery decided) accepted on 2026-11-27 as the direction of the duo experiment. **Nothing is built from this record yet.** It stays an experiment behind `STREAKBOOM_DUO`; it does not authorise a merge into `main`, a release or new art.
- **Date:** 2026-11-27
- **Decided by:** Vinh (author), recorded by Claude (the app session): four multiple-choice questions, then "Duyệt" to the written direction.
- **Amends:** ADR-0139 (who appears), 0145 and 0152 (the double click), 0154 (Paws's body and new art), 0157 (a mention calls a pet out), 0158 (presence), 0159 (walking, the tray and the shortcut), 0160 (the tray), 0161 (point 4, Paws's portrait). The parts of those records that this one does not name stand.

## Context
The author first asked for a solo and a duo mode switched from the tray. Since then issues #15 to #17 had moved the design: two embodied pets were distracting, a round portrait added little once its nod ended, and the trial of #17 keeps Paws only inside the chat as a visible member of the group, with no window of its own (technically accepted by Codex on `claude/issue-17-paws-in-chat@3d1c4d8`; the author's verdict after use is not recorded). With Paws having no body, the only difference left between the two modes is whether a group chat exists, and an invitation can say that.

## Decision
1. **No switch and no mode setting.** Normally Peak is alone and behaves as it does today: its chat is the bubble above its head. **Inviting Paws is what opens the group chat box.**
2. **Paws lives only in the chat.** It has no window on the desktop. The walking Paws, the round portrait of #15 and the three wordless scenes (tidy the ball, shift away, roll) leave the product direction. Their code is removed from the working branch and stays in git history. Peak is the only embodied pet.
3. **How to invite:** `@paws` or "gọi Paws" typed in Peak's own chat input. The words that come with the invitation are sent into the group.
4. **A visit ends** when the person hides the box, when the box has faded away completely, or at a restart (as #17). Losing focus alone, or a fade that is interrupted, does not end it. `/pin` keeps the box, so it keeps the visit. After a visit Peak's chat is the bubble again.
5. **The tray in solo:** a click hides or shows Peak, as Stable does. While the group box is open a click hides the box first (which ends the visit).
6. **While a visit is open** Peak's bubble stays quiet and its words go to the box (ADR-0161 point 3).
7. **Double click on Peak:** in solo it opens the bubble's chat input; during a visit it opens the box as before.
8. **The box shortcut** (Ctrl+Alt+P): in solo it opens Peak's chat input; during a visit it opens the box.
9. **A reply still pending when a visit ends is dropped** and never appears in a later visit.
10. **Quiet:** inviting still works and says nothing.
11. **Peak hidden or asleep** is not shown or woken because Paws was invited (as #17).
12. **History:** the lines of the group chat are kept while the app runs, so a new invitation shows them; a restart clears them. What Peak remembers about the person is shared, as today. In solo Peak does not speak of Paws.

## Open, to be decided later
- **The daily limit.** The duo build allows twice the normal number (ADR-0152). Leaning: only messages inside a visit get the higher number; solo stays as now. Not decided.
- **A key for Paws alone:** the pets keep the shared key; no Settings control is added.
- **How a new person learns that Paws exists:** perhaps one line in the introduction, discussed when a release is near.
- The input name "gọi Paws" and its English and Japanese forms follow the typed commands that exist; their exact words are fixed when built.

## Why
It keeps the corner of the screen to one animal (charter article 2), adds no setting (charter, few settings; ADR-0139 stands on that point), puts the multi-party box only where there are several parties, and leaves a person who never invites Paws with exactly today's Peak.

## Rejected
- **A tray switch between solo and duo**, with the box as the chat of the duo mode: steadier surfaces, but a second concept on top of the invitation.
- **Keeping the walking Paws, the portrait and the scenes behind flags:** three paths to feed and test.
- **A click on the tray that opens the chat input in solo:** Stable's people would have to learn a new click, and Peak could not be hidden from it.
- **A history that starts empty at each visit:** loses the thread when Paws is invited again a few minutes later.

## Consequences
- **Costs to the person:** the chat surface changes in the middle of a conversation when Paws is invited and when the visit ends; a new person may not discover Paws.
- **Work (the duo session, from `claude/issue-17-paws-in-chat` as the base):** the chat member becomes the only way; the walk, portrait and scene paths are removed; the bubble chat comes back in solo; the tray, double click and shortcut change; the pet-state fields in `pet.json` are read and never renamed or deleted (add only, ADR-0090). Motion and look: the author tries a test build before anything is committed (rule 8). Specs, the backlog and the texts follow in the same commits.
- **Open work:** the memory and processor numbers of #3, #9 and #10 include the Paws window and must be measured again before the budget decision; #11 to #13 must be checked on the new build; the scene part of #6 closes, its voice part stays. DU-11 steps 2 and 3 (new art, climbing) are no longer wanted.
- **Not verified (V-210):** nothing of this record is built; the memory of the in-chat variant was never measured; whether the scenes are already off in the #17 build was not checked.
