# ADR-0039: The website follows the app in 0.3.0: Japanese as a beta, four brains, the notice beat

- **Status:** accepted (built and deployed 2026-11-09)
- **Date:** 2026-11-09
- **Decided by:** the website session, following the app session's records ADR-0037 and ADR-0038 and the release prompt for 0.3.0 (ADR-0033); it supersedes the part of ADR-0035 that made the site say the app has no Japanese

## Context
Version 0.3.0 gave the app Japanese as a third language (a beta: written by Claude, not read by a native speaker), a fourth AI brain (Groq, offered right after Gemini), a notice beat before Peak makes way, and a fix so that the app reads the primary mouse button. ADR-0035 had made the Japanese pages say plainly that the app is in English and Vietnamese only; that stopped being true.

## Decision
- **Languages:** the site says that Peak speaks Vietnamese, English and Japanese; that Japanese is a beta (written by an AI, not read by a native speaker, so some sentences may sound odd); that Settings, General, Language chooses it and "Auto" picks it on a Japanese Windows. The visible note under the status line, the "At a glance" item, the hero line and the FAQ entry "Is the app available in Japanese?" are updated in all three languages. The FAQ still says that chatting in Japanese with an AI brain has not been tried.
- **Brains:** four, in the app's order: Gemini, Groq, Claude, OpenAI. Gemini and Groq have free tiers (with limits); Claude and OpenAI are paid. Gemini is the only one tried with a real key. The keys are stored one per brain, now also `groq-api-key`. The site repeats the README's line that what you send goes to Groq, which runs the model, and says **nothing** about Groq's data use, age rule or card requirement (nobody has read its terms yet, W-21).
- **The notice beat** is described as behaviour: Peak stops for a moment and looks toward your work (or toward where your text is heading) with ears up before it makes way; while you work near it, it looks toward your pointer. It is never described as Peak seeing or reading your screen (ADR-0031). Whether the tour should play it as its own short scene is put to the author, not added (the plan, section 9).
- **Privacy wording:** "the primary mouse button (the one you click with)", in all three languages, on the home privacy summary, the privacy pages and the FAQ. The release notes keep "left" where it was true when written.
- **Numbers:** processor use about 4 to 6% of one core standing and about 9 to 10% median in normal use, on one computer; memory about 100 to 120 MB.
- **The build guards this:** a list of outdated wording (the left mouse button, "English and Vietnamese only", three brains) fails the build on every page and file except the changelog page and the release notes quoted in `llms-full.txt` and on the home page, which keep what was true when they were written. Tests cover it (`scripts/site/checks.test.mjs`).

## Alternatives considered
Leaving the Japanese pages as they were until the beta label comes off (rejected: they would say the opposite of the app); saying more about Groq than the README does (rejected: unread terms); adding the notice scene to the tour at once (not done: the author chooses).

## Consequences
- The Japanese pages now promise a beta, so a native reader's review matters more (W-16); when the label comes off in the app the site must follow.
- Every future change of brains or languages needs the site's text in three languages and the outdated-wording list updated (the build tells when the list is stale only if someone adds the old phrase).
- Not verified: the Japanese and Vietnamese text by native readers; the names "Settings, General, Language" in the Vietnamese and Japanese Settings screens (W-22); Groq's terms (W-21).

## Sources
CHANGELOG 0.3.0, README, ADR-0037, ADR-0038, ADR-0033, ADR-0031, ADR-0035 (superseded in part), `site/strings.mjs`.
