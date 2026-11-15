# The duo (a hard-working dog beside Peak): what it would touch in the charter and in the documents

**Status:** an analysis written 2026-11-15 for the handoff `docs/handoff/duo-characters-hypothesis.md`; **nothing is changed and nothing is proposed for the app.** It says where "one Peak" is really written, and what a second pet in the app would have to change. The sticker test (spec 19) touches none of this.

## 1. Where "one Peak" is actually written
| Place | What it says | Would need a change for a second pet? |
|---|---|---|
| [ADR-0068](../decisions/0068-one-peak-per-user.md) | `tauri-plugin-single-instance`: a second start of the program ends at once; one Peak per Windows user. It is a guard against a duplicated process, not a rule about characters. | Not by itself (a dog would live in the same process), but its title and its text say "one Peak per user": a new ADR would have to say that the dog is not a second Peak |
| [Spec 15](../../spec/15-customization.md) | "One Peak, three layers of surface" (colour, accessory, voice) | Yes, to say what a second character is |
| The README | **Not** found: it does not say "one Peak at a time" (the handoff said it did). It says the app is a pet with Peak as its character | A sentence, if the dog came |
| The charter | Does not say "one"; article 2 calls Peak "a guest in the corner of a working screen" | See section 2 |

## 2. The articles of the charter, one by one
| Article | A second pet | Risk and what would answer it |
|---|---|---|
| 1 Trust first (no guilt) | The dog that works hard beside a person who works may read as a reproach | The dog's work must be small, useless and sometimes ruined; it must never show the person's work or hours; no "you should rest" or "work harder" (the handoff already rejects the Real-life Nudge) |
| 2 The attention is theirs | Two guests in the corner double the footprint and the chances of making the person look up | The dog off by default, quiet by default, and never active while Peak is active |
| 3 Gentle before sharp | Moves of the dog (rushing, fetching) are brisk by nature | The same slow rules as Peak (spec 06, spec 11) |
| 4 Shapes, not meaning | No change; the dog would sense nothing of its own | Share Peak's senses only; no new sense |
| 5 A companion, not an assistant | The dog "works": it must not do anything useful for the person | Written into the idea: neither character works for the person |
| 6 Works without AI | The handoff: the dog has hand-written lines only | Keeps the chat caps and the keys unchanged (the 60 chats and 6 proactive a day are Peak's) |
| 7 Never dies, never lies | No change | No absence counting, no "I missed you" |
| 8 Alive within all the above | The pair is the surprise | Only inside 1 to 7 |

## 3. What a second pet would touch in the app (nothing of this is proposed now)
- **A second window** (about 35 MB of web view, as the bubble window shows in `lib.rs`), against the alpha budget (120 MB in all, `docs/hypotheses/README.md` A1); the CPU budget is already not met on one pet.
- **The rules of the manners with two:** yield first (to the person, and between the two), one thing at a time then rest, never the same trick twice; the make-way and step-aside rules, the clear-place rule (ADR-0123) and the perch would all need to know about the other pet.
- **The pet's memory and Bond Days** are with Peak; the dog would have to have none, or its own, which the charter's "no character that needs the person" limits.
- **Settings** gain a place for it (spec 15 dropped choosing in Settings; the dog would be something Peak or the person asks for in words, or an option off by default).
- **A change of ADR-0068's wording**, of spec 15, of the README sentence, and an ADR with this charter check.

## 4. The reading
The documents do not forbid a second character; they make it a decision with a cost, mainly in the attention it takes (article 2) and in the guilt it might suggest (article 1). That is why the idea is tried with stickers first (spec 19), where none of this is at stake.
