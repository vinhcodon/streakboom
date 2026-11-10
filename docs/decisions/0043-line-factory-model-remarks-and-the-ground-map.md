# ADR-0043: A line factory run by the author, a model's remark after a reflex, and a ground map kept in memory; no top-up of lines by the connected brain yet

- **Status:** accepted (decisions, 2026-11-10); built in the order of the backlog (LN-4, RX-7, PC-6)
- **Date:** 2026-11-10
- **Decided by:** Vinh (author), with Claude

## Context
After 0.3.1 the author was asked four questions that the backlog had been waiting on: more scripted lines (LN-4), lines written by the user's own brain (LN-7), a short remark written by the brain after a reflex (RX-7, direction already decided as R3 in ADR-0041), and the coarse ground map that spec/08 section 9 item 3 left open (PC-6).

## Decision
1. **LN-4, the line factory: yes, with the author's Gemini key.** A script in `scripts/` that the **author runs** (never the app, never in a build): it reads the Gemini key from the Windows Credential Manager at the moment it runs (the key is never put in the chat, a file or the repository), asks for about 30 candidate lines for a trigger from the character bible, the tone rules and the lines already there, filters out near-duplicates, lines that are too long and patterns the character must never use, and writes the survivors to a review file. **Nothing reaches the app until the author picks the lines.** Vietnamese is read by the author; Japanese and English lines made this way are marked "not yet read by a native speaker" in the debt list.
2. **LN-7, top-up of lines by the connected brain: no, not yet.** Machine-written lines that nobody reviewed would reach users and spend their key. Revisit after LN-4 shows how good machine-drafted lines are.
3. **RX-7, the remark after a reflex: build it now.** As decided in ADR-0041 (R3): after a reflex (first the fall) a connected brain may write one short sentence from a **reaction card**, given only the event name and the five appraisal numbers, never sizes, positions, titles, counts or window information; inside the existing caps (6 unprompted lines a day, ADR-0027); behind a switch in Settings, Brain; the reflex never waits for it; with no brain, or with the switch off, nothing is said beyond the scripted cry.
4. **PC-6, the ground map: allowed, in memory only, behind a switch.** A coarse grid (16 x 9) of the same classification as the ground sense (desktop, taskbar, window, window in front), taken **only when Peak is about to move**, kept in memory, never written to a file or sent anywhere, with a switch in Settings, Privacy. This reveals the layout of the user's windows to the app itself (not to anyone else). It replaces the window-list plan of spec/07 section 4: no titles, no process names, no window list. The first use is to know where a ledge is; the behaviours that use it (perching, napping on a window) are separate stories (TE-10c, TE-10d).

## Alternatives considered
A top-up of lines at run time by the user's brain (declined for now, see 2); drafting lines with no model (declined: the pools could not grow); the remark without a switch (declined: it spends the user's key); a ground map written to disk or refreshed continuously (declined: it is a picture of the user's windows and costs processor time); no ground map (declined by the author: it opens perches).

## Consequences
- The README privacy wording and the website prompt must say, when PC-6 ships, that Peak may take a coarse picture of where windows are, in memory, when it is about to move, if the switch is on; the website session is told at that release (ADR-0033).
- Spec 08 section 9 item 3 is answered; spec 07 section 4 is updated to say the window-list plan is replaced.
- Not verified: the quality of machine-drafted lines, how Gemini follows the character bible, whether a remark after a reflex adds anything, how the ground map behaves with several monitors and scales (V-2).

## Sources
spec/08-perception.md (section 9); spec/09-reactions.md (sections 5 and 11); docs/decisions/0027, 0031, 0041
