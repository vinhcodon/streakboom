# Report to the author and the app session: the story page, and Peak's lines

From: the website session. Date: 2026-11-14. Answers section 10 of `website-story-behind.md`. Nothing here asks the app to change before the author decides.

## 1. What was built (on the branch `site-story`, not published)
- Pages `/story/`, `/vi/story/`, `/ja/story/` (ADR-0110). Mechanism: the existing parallel pages, the header buttons, hreflang and the language suggestion; no new system.
- The menu is How it works, Privacy, Stickers, Story (Install moved to the footer).
- The Vietnamese and English text is word for word (compared by a script with sections 7 and 8); the Japanese is an AI translation without a native reader.

## 2. Peak's lines in the app and in the article differ
Checked in `app/src/lib/ui.ts` (`capHit`, the line Peak says when it has talked enough for the day):

| | In the article | In the app |
|---|---|---|
| Vietnamese | Mình nói mình mệt rồi. Vuốt ve mình đi, mai mình kể tiếp. | Mình nói mệt rồi. Vuốt ve mình đi, mai mình kể tiếp. (one "mình" fewer) |
| English | I said I'm tired. Pet me. I'll tell you more tomorrow. | I'm all talked out. Pet me instead, we'll chat tomorrow. (a different sentence; the app has several lines) |
| Japanese | (the translation of the site) 疲れたって言ったでしょ。なでて。続きは明日ね。 | 話しすぎてへとへと。かわりになでてね、おしゃべりは明日。 (one of several) |

The article says these are lines Peak says in the app. They are close in meaning but not the same words. **The author decides:** (a) keep the article as it is and say nothing; (b) change the article to the app's words; (c) ask the app session to use the article's words as one of its lines. The website session changed neither.

## 3. What to look at for the indexing problem (observed, no cause concluded)
- Seen on the live home page: `robots.txt` has `Allow: /` and the sitemap address; the sitemap lists the pages; no `noindex` meta and no `X-Robots-Tag`; the canonical is the page's own address; the Google verification TXT record is in the DNS; Open Graph is present.
- Not seen (the author or Search Console): the status of each address in Search Console (submitted, "discovered, not indexed", "crawled, not indexed"), the URL inspection tool, whether Googlebot is served the same page through Cloudflare, internal links to the new page (menu and footer now carry it).
