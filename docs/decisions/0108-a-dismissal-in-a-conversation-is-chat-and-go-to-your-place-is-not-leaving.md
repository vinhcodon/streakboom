# ADR-0108: A dismissal in the middle of a conversation is chat; "go to your place" is not leaving

- **Status:** accepted (the author chose each point on 2026-11-14); built on branch `vanish`, shipped in Preview 0.9.4, **not yet seen** (V-137). Refines ADR-0097 and ADR-0098 (when "Lượn đi" acts).
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The author reported two misreadings of "Lượn đi":
1. In the middle of a light back-and-forth, "lượn đi" or "cút đi" is a joke, a reply in the game, not an order. Peak left anyway.
2. "Về chỗ đi" (go back to your place, which in Vietnamese means the usual seat) was read as "lượn đi": it is not in the table, so it went to the chat model, whose description of the skill (go away, leave me alone) made it tag `[skill:leave]`.

## Decision
1. **A conversation is going on** when the person's last chat message was sent less than **2 minutes** ago (`inConversation`, `dismissal.ts`). The page knows the time; nothing is stored.
2. **Without a conversation** a dismissal from the table is an order, as before (and the model's tag likewise).
3. **In a conversation** a dismissal from the table is **not** acted on: the words go to the chat like any message and Peak answers in character (its persona already forbids a needy line, charter article 5). The model is not offered the skill in such a turn (`skills: false`), so it cannot write a goodbye that Peak then does not follow.
4. **Said again and again** is an order: **3 dismissals within 3 minutes** in a conversation (`decideDismissal`, `INSIST_COUNT`, `INSIST_WINDOW_MS`): Peak says its goodbye and leaves, and the count starts again. The count is in memory only, never saved, never shown.
5. **Only the table counts** as a dismissal in a conversation. A wording outside the table, in a conversation, is plain chat and does not add up; the table was widened (cút đi, cút, biến, cút đi chỗ khác, get out, buzz off) and can be widened again.
6. **"Về chỗ đi" is its own command, `seat`** (`seat.skill.json`: về chỗ đi, về chỗ ngồi đi, go to your spot, 席に戻って and others). In this first version Peak **nods and stays**: it has no usual place yet (favourite places, spec 06, are not built). Going to a remembered place is a later skill with its own ADR (a new verb, coarse screen zones). The model is **not** told about `seat`: it is a command of the table only.
7. The description of `leave` given to the model now says that going back to your place is not leaving, and five labelled cases of that kind were added to the harness (they must **not** be tagged).

## Consequences
- A person who really wants Peak gone in the middle of a chat says it three times or waits two minutes; this is a deliberate cost, chosen by the author.
- The harness (H20) now has 54 cases; it was never run by the author, so the model's behaviour on these is unmeasured (V-137).
- `seat` is the first skill without a tag, a pool or a `hide`: it checks that the file format carries a skill that is only a pose.
