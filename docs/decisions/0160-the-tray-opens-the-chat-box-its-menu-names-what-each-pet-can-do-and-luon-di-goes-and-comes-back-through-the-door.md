# ADR-0160: The tray opens the chat box, its menu names what each pet can do now, and Lượn đi goes and comes back through the door

- **Status:** accepted on 2026-11-24 for the prototype (the branch `exp/duo-prototype`, nothing ships, ADR-0139). The author found that a left click on the tray hiding Peak, Lượn đi and some items of the tray menu no longer fit the rule of ADR-0159 (nothing vanishes on the spot); the recommended option of three questions was chosen. Amends ADR-0142 (the tray) and ADR-0159 (it kept the double click).
- **Date:** 2026-11-24
- **Decided by:** Vinh (author)

## Decision
1. **A click on the tray opens the chat box** (or hides it with the fade, as before); it never hides a pet. **The double click is removed** (sending the pets in or out is `/in`, `/call`, `@name` and the menu).
2. **The tray menu** names what can be done now: Open the chat · Call Peak out / Send Peak in · Call Paws out / Send Paws in (the item follows who is out, as the `/` list does) · Quiet mode · Settings… · Quit. "Show / Hide" is removed. The two Preview items (terrain overlay, screen picture) stay.
3. **Lượn đi stays** (a cat that wanders off and comes back by itself fits the character) **and goes through the door both ways**: it walks out to the side, and when it comes back it walks in from that side (as ADR-0158). It is "send Peak in" with a timer.
4. **Issue 14 on main** (the tray cannot hide Peak after Lượn đi) is still fixed on main for the people using Stable now; the new tray of this ADR is for the prototype only until the duo is decided.

## Why
The tray is the one place every user can find; it should open the conversation, not make a character blink out. A menu that says "Show / Hide" means two different things on two branches; one that names the act cannot be misread.

## Consequences
- `duo.rs` (tray click, no double, a menu that follows presence), `lib.rs` (the menu, `pet_return` in the duo walks in), the page of Peak (nothing: it already walks to the edge when it leaves). V-207 for what is not yet seen.
