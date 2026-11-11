# ADR-0063: The research is a link, not a page; the charter stays on GitHub

- **Status:** accepted (answered by the author on 2026-11-12); **built on 2026-11-12**
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
The 0.4.0 prompt asked where the research (`docs/foundation/`) should live on the site, how it is labelled, and whether the charter should carry the mission line. Most of the research was read as abstracts, and the foundation says an advertising word can count as evidence of intended purpose (ADR-0057): a page that looks like a claim is a risk, and a number quoted from an abstract would be a fact nobody checked.

## Decision
1. **The research is a link on the privacy page** (and a line in `llms-full.txt`), to `docs/foundation` on GitHub: "The research behind the design, on GitHub (in English): evidence the design was checked against, not claims about Peak" (three languages). There is no research page, no figure from it on the site, and nothing in the menu. The build checks the link and that no page about research exists.
2. **The charter stays on GitHub** (English, as now). The mission line is in the hero lead, the meta description, the structured data and `llms.txt`, so a charter page on the site would be a second copy in three languages to keep in step with `docs/charter.md`, with no native reader for two of them.

## Alternatives considered
A `/research/` page in English, outside the menu, listing sources and what each was used for (more findable, but one more page to keep exact and easy to read as a health advertisement); a section on the How it works page (already over its length budget); a `/charter/` page in three languages with the mission and the seven articles (a stronger source for assistants, with a build check against `docs/charter.md`); only the mission line added to the link text.

## Consequences and when to revisit
Search engines and assistants reach the research only through GitHub. Revisit when a lawyer has read the foundation, or when assistants (the re-ask on 2026-12-01) keep missing what Peak is for.

## Sources
ADR-0057, ADR-0058, `docs/foundation/README.md`, `docs/handoff/website-release-prompt.md` (section 2).
