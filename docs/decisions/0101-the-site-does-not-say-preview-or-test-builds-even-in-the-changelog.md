# ADR-0101: The site does not say Preview or the test builds, even in the changelog it mirrors

- **Status:** accepted (Vinh chose "Ẩn các dòng đó trên site" on 2026-11-14); **built**
- **Date:** 2026-11-14
- **Decided by:** Vinh (author)

## Context
ADR-0089 and ADR-0095 (the app session) say a Preview is a pre-release, never a download, and that the small link "Test builds..." in Settings is not announced. The app session's release prompt for 0.8.0 repeats it for the site. The site mirrors `CHANGELOG.md` verbatim on `/changelog/`, in `changelog.xml` and in `llms-full.txt`, and the entries 0.6.0 and 0.8.0 say, in the app's own words, that a few new things are shared early as test builds, name Preview, and mention the link. So the site announced what it was asked not to.

## Decision
1. **The site leaves out any line of the changelog that names a Preview or the test builds** (`publicEntries` in `scripts/site/facts.mjs`, the words `/\b(preview|test builds?)\b/i`); an entry left with no line is left out. `CHANGELOG.md` itself is the app session's and is not touched.
2. **The build refuses the words**: in the text of any page and in `changelog.xml`, `llms.txt` and `llms-full.txt` (scripts and addresses that contain the word are not page text).
3. Effect today: the line "Updates show one version at a time" of 0.8.0 and the two lines of 0.6.0 about the two kinds of builds are not shown; 0.6.0 is shown with its remaining line ("Not yet tried: updating a Stable copy from 0.4.2...").

## Consequences
- The site's changelog is no longer a verbatim copy; a reader who wants the full notes has the repository's file. The app session is told (`website-measurement-note.md` is not the place: this is reported in the answer to its prompt and in W-68).
- If the app session later wants a Preview mentioned on the site, it is a new decision and this rule is lifted by an ADR.
- **Not verified:** how the shortened 0.6.0 entry reads to a visitor; that no other word for the same thing (for example "pre-release", "early build") appears: only the two names are checked.
