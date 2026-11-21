# Duo: who appears, and the scenarios the rule still lacks

2026-11-22. Source: ADR-0139 (the author's rule), `docs/handoff/duo-prototype-and-cross-review.md`. A design note for the prototype on `exp/duo-prototype`; nothing here is built or shipped.

## The rule (ADR-0139)
Last state decides. Start: the pets that were out come out. None out: the tray click brings out the one tucked away last, from where it went in. The other pet: only when the person asks the pet on the screen to call it, and it also comes out from where it went in. No setting.

## Scenarios the rule needs (each has an expected result; a test with a fake clock where it is logic)
| # | Situation | Expected |
|---|---|---|
| 1 | First start, or an update from a build with no Paws state | Peak alone, as today; no Paws until called |
| 2 | Closed with both out | Both out at start, at their last places |
| 3 | Closed with one out | That one only |
| 4 | Closed with none out | Nothing out; the tray click brings out the last tucked one |
| 5 | Both out, the person shoves one away (tuck) | The other stays; the tucked one returns only when called |
| 6 | Both out, a duo scene is running, one is shoved away | The scene is cancelled at once; the one left stands still, no reaction aimed at the person |
| 7 | None out, tray click | The last tucked one walks out from its entrance; the other stays away |
| 8 | One out, the person calls the other | It walks out from its own entrance; no bubble; the call is not a scene yet |
| 9 | The remembered entrance is gone (monitor unplugged, resolution changed, taskbar moved) | The nearest valid edge of a present monitor; never off the screen |
| 10 | Closed without a clean exit (crash, kill, shutdown) | The last saved state; state is saved on each change, not on exit |
| 11 | Start at login | The same rule; no entrance walk if the screen is busy (fullscreen, game) |
| 12 | Screen busy when the person calls or clicks the tray | The call is honoured but the entrance is quiet (no scene, no sound) |
| 13 | Reduced motion | Appear without travel |
| 14 | Stable opens the same data | Peak alone. A Stable build rewrites `pet.json` and drops fields it does not know (`channel-data.test.ts`), so the duo state is in its own file, `duo.json`, which Stable never touches |
| 15 | Person touches a pet during a scene | Both stop and the scene is cancelled; the old callbacks cannot bring a hidden pet back (scene token) |
| 16 | Two monitors | The entrance is per monitor; a pet comes out on the monitor it went in on if present |
| 17 | Paws out, Peak's right-click menu, chat | Chat belongs to Peak only (no AI chat for Paws); the menu of Paws has the call of Peak and nothing else new |
| 18 | The person calls a pet that is mid-entrance | Ignored; one entrance at a time |
| 19 | Both out, a third request (tray click) | As today for Peak alone: tuck the last used pet? (open, see question 1) |

## Answers of the author (2026-11-22)
1. **Tray click = send everyone away**: every pet on the screen walks in. To send one pet away, the person tells it in the chat. (Scenario 19 is settled: with two out, the tray click tucks both.)
2. **Calling the other pet is done in the chat**, for example "gọi Paws ra đi". No menu item, no gesture.
3. **Discovery in the shipped product: not decided**; the prototype uses a developer flag.

## Settled afterwards (2026-11-22, multiple choice)
- **A short command layer that needs no AI and no key**: the chat box understands a few fixed phrases (call Paws out, Paws go in, in VI/EN/JA) and runs them on the device; nothing is sent anywhere, and it reads only what the person types in the box (no new sense). AI chat stays for people with a key.
- **The bubble belongs to the pet that answers.** The person picks by name; with no name, the pet that was last spoken to answers. Both answer only when the person says "both", one after the other with a short bubble each, never together.
- Still open: whether Paws may answer with the AI chat at all (the handoff says no AI chat for Paws); for the prototype Paws answers only the command phrases, with canned lines and no AI.
