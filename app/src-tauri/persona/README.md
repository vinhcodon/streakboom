# The persona prompt, in layers

What Peak is told when a brain is connected (spec/09 section 6, RX-5). `persona()` in `src/brain.rs` joins these files, in this order, with one space between them. The files are compiled into the app; nothing here is read from the user's disk.

| Layer | File | When | Locked |
|---|---|---|---|
| voice | `voice.md` | always | no (a future story lets the user choose a voice; the length limit moves to the core then) |
| language | `language.md` | always, `{language}` filled in | yes (a chat the user started follows the language they write in instead) |
| core | `core.md` | always | **yes**: stay in character, never claim to be human, never ask for or repeat secrets, no medical, legal or financial advice |
| voice (Japanese) | `voice-ja.md` | always (it applies only if the reply is Japanese, ADR-0038) | no |
| tone | `gentle.md` | the Gentle setting is on | no |
| mood | `mood.md` | always | **yes**: the leading mood tag the app needs to act the feeling out (ADR-0016) |
| closeness | `closeness-shy.md` or `closeness-close.md` | tiers 0 and 1, or 3 and 4 | no |
| skills | `skills.md` | **only in a chat the user started, on a Preview build** (S4, spec 14): the closed list of skills the model may name in a tag, now `[skill:leave]`; added after everything else by `persona_with_skills`, never part of `persona()` | no |

A **reaction card** (`cards/<event>.md`, RX-7) is added after the persona when Peak asks its brain for a short remark after a reflex; it holds only how the remark should sound, and the request carries only the event name and five appraisal numbers. After these, a chat the user started adds what the user told Peak earlier (`persona_with`), which Settings already shows under "What the pet remembers".

A test fixes the exact words (a fingerprint over every language, tier and tone), so changing a file is a decision, not an accident: change the fingerprint in the test with it.
