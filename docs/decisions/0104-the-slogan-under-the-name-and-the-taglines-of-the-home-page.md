# ADR-0104: The slogan under the name, and the taglines of the home page

- **Status:** accepted (Vinh chose, 2026-11-14: the tagline above the title, a short English slogan in the header, a random pick at each load with nothing stored, and 12 lines: his 7 with "mệt" changed to "bận" and 5 proposed); **built**
- **Date:** 2026-11-14
- **Decided by:** Vinh (author) for the words and the choices; Claude (the website session) for the layout

## Decision
1. **The slogan is fixed, under the name "Streakboom", next to the logo, on every page:** Vietnamese "Ở bên bạn, không làm thay bạn.", English "Beside you, not instead of you." (short enough for a phone header; the long "It won't do your job. It'll sit there while you do." is one of the taglines), Japanese "そばにいる。代わりにはやらない。" (written by an AI, no native reader). It sits **outside** the link, so the link is still named "Streakboom"; the logo is a second link hidden from assistive technology. On a narrow phone the slogan wraps rather than being cut.
2. **Twelve taglines rotate on the home page** (a small line with a paw above the title), in each language, written by the author except five proposed ("Bạn đi vắng, nó ngủ...", "Làm việc thì nó tránh ra...", "Không nhắc việc...", "Miễn phí, mã nguồn mở...", "Nó sẽ không sửa code giúp bạn..."); "quá mệt" became "quá bận" (a word that leans toward health is avoided, charter: no health claim). The English and Japanese versions are written by an AI and have no native reader.
3. **How it rotates:** one tagline is in the HTML (the default, "A pet for people with no time for a pet", the one that also says what Peak is: what a crawler, a reader without script and the first paint see); a tiny inline script right after it replaces it with one picked **at random** from the list at each load. **No timer, no animation, no transition, nothing stored, nothing sent** (charter articles 2 and 3: the cat does not perform on a page the person is reading). The place has a fixed height of two lines, so nothing moves.
4. **The title of the home page is shorter** ("Streakboom: meet Peak", "Streakboom: gặp Peak", "Streakboom：ネコのPeakと出会おう") and the line under it says what Peak is ("Một chú mèo nhỏ sống trên màn hình của bạn."). The `<title>` and the description for search engines are unchanged.
5. **The build checks it:** twelve lines in each language, none twice, none longer than the limit, every line passes the same word lists as the rest of the site (no streak, no lonely, no health claim); the slogan is on every page; the script has no timer, storage, request or cookie, and its list is the list of the strings; the default is in the HTML.

## Consequences
- A crawler sees one tagline (the default) while a visitor may see another; the taglines are decoration, not facts, and the default is the one that describes the product.
- Repeating the same tagline twice in a row can happen (the author chose a plain random pick over a bag that remembers; a bag would need a key in the browser and a sentence on the privacy page).
- **Not verified:** how it reads on a real phone (the slogan on one line at 375 px in Vietnamese, wrapping in the others was seen in the built-in browser only); the English and Japanese words have no native reader; the effect on search (the H1 is shorter).
