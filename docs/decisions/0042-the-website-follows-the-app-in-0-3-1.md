# ADR-0042: The website follows the app in 0.3.1: the sense under Peak's feet, 267 lines, the fall

- **Status:** accepted (built and committed 2026-11-10; not yet deployed: the author said not to push until told)
- **Date:** 2026-11-10
- **Decided by:** the website session, following the release prompt for 0.3.1 (ADR-0033), the README and ADR-0041 of the app session

## Context
Version 0.3.1 added a new sense to the app: it asks the system what kind of thing is just under Peak's feet (the bare desktop, the taskbar or some window) and keeps, in memory only while Peak stands there, an opaque number for "the same window as a moment ago", so Peak notices when the window it stands on is closed, minimized or dragged away (it then freezes, jolts, cries out and falls). It also changed behaviour (no hopping by itself when you are not typing; answers that change in stages when you repeat a poke; every line said once before any repeats), went from 182 to 267 hand-written lines per language, and added Settings, Brain, What Peak is told.

The review of the site found that every place that said what Peak notices (the home page item, the privacy page, the FAQ answer, the How it works page) listed three things and said "only", which with the new sense would have been an incomplete privacy statement in all three languages. The hero notice still said "First official release (0.2)", and the numbers (182 lines, a median of 9 to 10%) were the old ones.

## Decision
- **Privacy wording:** the README's description is added to all four places in English, Vietnamese and Japanese (what it asks, the opaque number kept only while it stands there, the class name looked at only to tell the desktop and the taskbar from other windows and dropped at once, nothing written or sent). The text never says Peak "sees" the screen.
- **Behaviour as behaviour:** the "out of your way" card says it no longer hops away by itself when you are not typing and describes the fall (and that another window merely brought in front changes nothing); the "alive without AI" card and the How it works page describe the stages and the once-each lines; the How it works page says what What Peak is told shows.
- **Numbers:** 267 lines and a median of 9 to 11% (the README's numbers).
- **The hero notice** says "An early release ({version})" so it cannot go stale.
- **The build is made to catch the next drift:** it reads the README, requires every home page and How it works page to state its number of hand-written lines in the language's own words, and requires the privacy page, the home page and the How it works page of each language to carry the "under its feet" wording while the README has it; "first official release" is on the outdated-wording list. Three new tests.
- **The hero tour is not changed.** The page cannot show a window going away; whether to add a scene is a proposal for the author (plan section 13).

- **Chosen by the author on 2026-11-10 from the proposals of plan section 13:** (1) no new tour scene for the fall (the page has no window to lose, a startled pose with a caption would mislead; the card describes it in words); (2) the build checks the memory and processor numbers against the README too, in all three languages; (3) the site generates an Atom feed of the changelog, `/changelog.xml`, from `CHANGELOG.md` (GitHub keeps only the two newest releases, so its `releases.atom` loses the older ones). The feed is linked from the changelog page, listed in `llms.txt`, and checked by the build: it must list every version of `CHANGELOG.md`, newest first. It is not in the sitemap (the sitemap lists pages).

## Alternatives considered
Adding the new sense only to the privacy page (rejected: the other three places claim "only" and would contradict it); leaving the 182 and the 0.2 wording for the author's next release pass (rejected: they are false now); generating the numbers from the README instead of checking them (the text is a sentence in three languages, so a check is simpler and fails loudly).

## Consequences
- More privacy text to keep true in three languages. The new Vietnamese and Japanese wording is mine and has no native reader.
- Not verified: the feed was parsed as XML by PowerShell and checked by the build, but no feed validator or reader was run on it; the state on the Pages host (nothing is pushed), other browsers, a phone, a Japanese or Vietnamese reader, the Rust code beyond a read of `ground.rs`: it matches the wording (the class name is looked at only to tell the desktop and the taskbar and is dropped; the opaque number is the window handle, kept only to compare). It also compares a window's process id with Peak's own, only to know that the window is Peak's; the README and the site do not mention that and nothing is kept.

## Sources
`README.md` (Privacy, features), `CHANGELOG.md` 0.3.1, ADR-0041, ADR-0033, ADR-0039, `docs/handoff/website-release-prompt.md`.
