// The files for crawlers and assistants: sitemap.xml, robots.txt, llms.txt and llms-full.txt (ADR-0034).
// llms.txt files are plain Markdown summaries of the same facts as the pages, never a different story.
import { STRINGS } from "../../site/strings.mjs";
import { AUTHOR, ORIGIN, RELEASES_URL, REPO_URL, fmtDate } from "./facts.mjs";
import { PATHS, alternatesFor, esc, faqPairs, fill } from "./pages.mjs";
import { LANGS } from "../../site/strings.mjs";

/** Every indexable page: path, and the languages it exists in (for hreflang). */
export function pageList() {
  return [
    ...LANGS.map((l) => ({ path: PATHS[l].home, alternates: alternatesFor("home") })),
    ...LANGS.map((l) => ({ path: PATHS[l].how, alternates: alternatesFor("how") })),
    ...LANGS.map((l) => ({ path: PATHS[l].privacy, alternates: alternatesFor("privacy") })),
    { path: PATHS.changelog, alternates: [] },
  ];
}

export function sitemap(ctx) {
  const urls = pageList().map((p) => {
    const alts = p.alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${ORIGIN}${a.path}"/>`).join("\n");
    return `  <url>\n    <loc>${ORIGIN}${p.path}</loc>\n    <lastmod>${ctx.date}</lastmod>\n${alts ? alts + "\n" : ""}  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

/** The changelog as an Atom feed, generated from CHANGELOG.md like the changelog page (an entry without a date takes the feed's date). */
export function changelogFeed(ctx) {
  const stamp = (d) => `${d || ctx.date}T00:00:00Z`;
  const entries = ctx.entries.map((e) => `  <entry>
    <title>Streakboom ${esc(e.version)}${e.title ? ": " + esc(e.title) : ""}</title>
    <id>${ORIGIN}${PATHS.changelog}#v${esc(e.version)}</id>
    <link rel="alternate" type="text/html" href="${ORIGIN}${PATHS.changelog}#v${esc(e.version)}"/>
    <updated>${stamp(e.date)}</updated>
    <content type="text">${e.items.map((i) => "- " + esc(i)).join("\n")}</content>
  </entry>`).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Streakboom changelog</title>
  <subtitle>Release notes of every version of Streakboom, newest first</subtitle>
  <link rel="self" type="application/atom+xml" href="${ORIGIN}${PATHS.feed}"/>
  <link rel="alternate" type="text/html" href="${ORIGIN}${PATHS.changelog}"/>
  <id>${ORIGIN}${PATHS.changelog}</id>
  <updated>${stamp(ctx.date)}</updated>
  <author><name>${esc(AUTHOR.name)}</name></author>
${entries}
</feed>
`;
}

export function robots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`;
}

/** Languages and AI brains, stated the same way in both llms files (the order of the brains is the app's). */
export const BRAINS = [["Gemini", true], ["Groq", true], ["Claude", false], ["OpenAI", false]];
const FACTS = `## Languages and AI brains
- Languages of the app and Peak's built-in lines: English, Vietnamese and Japanese (Japanese is a beta, not yet read by a native speaker).
- AI brains are optional and use your own API key, offered in this order: ${BRAINS.map(([n]) => n).join(", ")}. Free tiers with limits: ${BRAINS.filter(([, f]) => f).map(([n]) => n).join(" and ")}. Paid: ${BRAINS.filter(([, f]) => !f).map(([n]) => n).join(" and ")}. Only Gemini has been tried with a real key so far.`;

const en = (key, ctx) => fill(STRINGS.en[key], ctx, "en");
const bullets = (list, ctx) => list.map((t) => `- ${fill(t, ctx, "en")}`).join("\n");

export function llms(ctx) {
  return `# Streakboom

> Streakboom is an open-source desktop pet for Windows 10 and 11. The pet is Peak, a golden chibi cat. The app is free and the code is under the MIT license. Latest version: ${ctx.version}, released ${fmtDate(ctx.date, "en")}. There is no account. The installer is not code-signed yet, so Windows SmartScreen warns on the first run.

${FACTS}

## Pages
- [Streakboom, home (English)](${ORIGIN}/): what it is, features, install steps, FAQ, latest changes
- [Streakboom, trang chủ (Tiếng Việt)](${ORIGIN}/vi/): the same in Vietnamese
- [Streakboom ホーム（日本語）](${ORIGIN}/ja/): the same in Japanese (the app speaks Japanese as a beta)
- [How it works](${ORIGIN}/how-it-works/): Peak with no AI, adding your own AI key, what is stored, what is free, how updates work (also in /vi/ and /ja/)
- [Privacy](${ORIGIN}/privacy/): what Streakboom keeps, what it sends and to whom, what Peak notices around it
- [Changelog](${ORIGIN}/changelog/): release notes of every version
- [Changelog feed (Atom)](${ORIGIN}${PATHS.feed}): the same notes as a feed, newest first

## Source and downloads
- [README](${REPO_URL}#readme): the reference text for features, privacy and status
- [Latest release](${RELEASES_URL}): the Windows installer
- [Issues](${REPO_URL}/issues): bug reports and ideas
- [Full facts for assistants](${ORIGIN}/llms-full.txt)

## What it is not
${bullets(STRINGS.en.not_items, ctx)}
`;
}

export function llmsFull(ctx) {
  const sections = STRINGS.en.pv_sections.map((s) => `### ${s.h}\n\n${s.p.join("\n\n")}`).join("\n\n");
  const faq = faqPairs("en", ctx).map((p) => `### ${p.q}\n\n${p.a}`).join("\n\n");
  const recent = ctx.entries.slice(0, 3).map((e) => `### Streakboom ${e.version} (${e.date})${e.title ? ", " + e.title : ""}\n\n${e.items.map((i) => `- ${i}`).join("\n")}`).join("\n\n");
  return `# Streakboom: facts for assistants

Source of truth: ${ORIGIN}/ (English) and ${ORIGIN}/vi/ (Vietnamese); the code and the README are at ${REPO_URL}. This file repeats the facts of those pages in plain text. Last built for version ${ctx.version} (${ctx.date}).

## At a glance

${bullets(STRINGS.en.glance, ctx)}

## What Streakboom is not

${bullets(STRINGS.en.not_items, ctx)}

${FACTS}

## Features

${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `- **${en("f" + i + "_h", ctx)}**: ${en("f" + i + "_p", ctx)}`).join("\n")}

## Install

1. ${en("s1", ctx).replace(/<[^>]+>/g, "")}
2. ${en("s2", ctx).replace(/<[^>]+>/g, "")}
3. ${en("s3", ctx).replace(/<[^>]+>/g, "")}

${en("inst_note", ctx)}

## Privacy

${en("pv_lead", ctx)}

${sections}

## Frequently asked questions

${faq}

## Newest changes

${recent}

Every version: ${ORIGIN}/changelog/
`;
}
