# ADR-0068: One Peak per user

- **Status:** accepted (ordered by the author on 2026-11-12: "fix it, then release a patch"); **built and released in 0.4.1 (2026-11-12)**
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the app session)

## Context
The author found that every click on the program made another Peak. The cause (checked 2026-11-12): the app had no guard against a second start, so Windows started a second process with its own pet each time. A control run with a build without the guard started three times left three processes.

## Decision
The app uses `tauri-plugin-single-instance`, registered first. A second start ends at once and does not open a window or a pet. The running Peak is made visible if it was hidden (the person who starts it again most likely cannot find it) and does nothing else: no gesture, no line, no focus taken. One Peak per Windows user.

## Alternatives considered
Showing Settings or a line on a second start (a surprise on something that was only a click); asking the person which to keep (a question for a slip); doing nothing about it (the several-pets bug).

## Consequences and when to revisit
The check (`scripts/check-single-instance.ps1`): three starts of the new build leave one process, three starts of an older build leave three. Not checked: a second start while Peak is hidden, and a start from the installer's last page or from Start with Windows at the same time as a manual start. The updater restarts Peak itself; if an update ever leaves the old process behind the new one would end at once: watch the first in-app update to 0.4.1. Revisit if people want several pets (they do not today).

## Sources
`app/src-tauri/src/lib.rs` (`run`), `scripts/check-single-instance.ps1`.
