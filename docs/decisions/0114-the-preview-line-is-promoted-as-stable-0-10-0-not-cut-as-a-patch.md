# ADR-0114: The 0.9 line is promoted as Stable 0.10.0, not cut as a patch 0.8.2

- **Status:** accepted (the author chose it on 2026-11-14 from three options); built, Stable 0.10.0 and Preview 0.11.0 published the same day. Applies ADR-0093 (spec 16).
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The author ordered "Thăng Stable 0.8.2" to bring two fixes of "Lượn đi" (a dismissal in a chat is not an order; a leaving is not cancelled by the typing-lane reflex) to Stable. But Preview 0.9.8 is no longer a fix-only line as 0.9.2 was when 0.8.1 was cut from it: it also has "step aside" (the double right click, ADR-0109, ADR-0111), the time in words (ADR-0105), "go to your place" as a command (ADR-0108), the skill files (ADR-0103), the table of named actions and the update log. Spec 16 says a Fix adds no behaviour and moves the Stable patch; a line with new behaviour is promoted and the middle number moves.

## Options put to the author
1. **Stable 0.10.0 from 0.9.8** (the whole line).
2. Stable 0.8.2 from the commit of Preview 0.9.5 (the two fixes, but also three other new behaviours; an exception to spec 16 would need its own ADR).
3. Stable 0.8.2 with only the two fixes, cherry-picked onto v0.8.1 (cleanest, but the fixes depend on the skill files and the dismissal code, so more code is pulled in and it must be tried as a new build).

## Decision
**Option 1.** The 0.9 line is promoted as **Stable 0.10.0** (an even middle number), cut from the last Preview, 0.9.8, with only the version files and the release documents changed. The next Preview line, **0.11.0**, is published the same day (spec 16): the same program, nothing new to see. `channel_of` already reads 0.10.0 as Stable (10 is even).

## Consequences
- Stable gets "step aside", the conversation rule, the time in words and the update log together with the two fixes. Several things in that line have been seen by the author only in part (V-133, V-135 to V-138, V-143); they are listed in the verification debt and in the "Not yet tried" line of the changelog.
- The in-app update of a Stable copy from 0.8.1 to 0.10.0, and of a Preview copy to the higher Stable, has not been tried (V-144).
- A Stable copy that sees 0.10.0 compares versions as numbers (0.10.0 is higher than 0.9.8 and 0.8.1); the release scripts have a test for it.
