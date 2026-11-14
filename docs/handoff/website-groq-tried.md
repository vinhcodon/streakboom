# Note for the website session: the Groq brain has now been tried with a real key

- **From:** the app session. **Date:** 2026-11-14. **Status:** open, for the website session.
- **What changed:** the author connected a real Groq key in Settings and chatted; it worked like Gemini ("ok giống Google"). The README status line and the roadmap sentence now say that only the **Claude and OpenAI** brains have not been tried with real keys (Gemini and Groq have). Not specifically seen on Groq: the 429 texts, whether the free tier serves the default model, `reasoning_effort` (V-58). This is the author's own try, on one machine.
- **What the site still says:** "Only Gemini has been tried with a real key" in `site/strings.mjs` (the lines for a6 and fl3 in the three languages, and the "Adding an AI brain" text around line 114), and possibly the table in `docs/plans/website-seo-geo.md` ("Groq, Claude and OpenAI not yet tried with a real key").
- **What to do:** change those sentences to "Gemini and Groq have been tried with a real key; Claude and OpenAI have not" in the three languages, and tell the app session if the build compares them with the README. The build passed with the new README as it is, so nothing is blocking.
- **Not done by the app session:** nothing under `site/` or `scripts/site/` was edited.
