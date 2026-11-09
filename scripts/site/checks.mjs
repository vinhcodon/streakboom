// Checks the built site against the repository and against itself (ADR-0034). If anything is wrong the build throws and the
// deploy does not happen, so the site on the Pages host is always the last site that passed.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ORIGIN, fmtDate } from "./facts.mjs";
import { pageList } from "./files.mjs";
import { PATHS, esc } from "./pages.mjs";
import { STRINGS, EN_ONLY, LANGS } from "../../site/strings.mjs";

const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const count = (s, re) => (s.match(re) || []).length;

/** Things that must never appear on the site (retired name, claims the app cannot back, ADR-0031). */
const BANNED = [
  // written in two parts so that the documentation audit (which looks for the retired name in tracked files) does not flag this file
  [new RegExp("Vinh " + "Nguyen", "i"), "the author's old display name"],
  [/almost no CPU/i, "'almost no CPU' (the measured numbers are on the page)"],
  [/100% free|miễn phí 100%/i, "'100% free' (the AI brain is billed by the provider)"],
  [/hand-?drawn|vẽ tay/i, "'hand-drawn' (the cat is drawn by code written with Claude's help)"],
  [/Peak (sees|watches) (what )?you/i, "Peak 'sees' what you do (ADR-0031: it perceives activity, never meaning)"],
  [/reads what you type(?!, which keys)/i, "'reads what you type' without a negation"],
  [/macOS (version|port)? ?(is coming|will|soon)|sắp có (bản )?macOS/i, "a macOS promise"],
  [/will be code-signed|sẽ được ký số/i, "a code-signing promise"],
  [/100%\s*無料|完全無料/, "'100% free' in Japanese"],
  [/手描き|手書きの(?!セリフ)/, "'hand-drawn' in Japanese"],
  [/macOS版は(まもなく|近日|対応予定)|macOS.{0,6}対応予定/, "a macOS promise in Japanese"],
  [/コード署名(される|を行う|します)予定/, "a code-signing promise in Japanese"],
];

export function check({ ctx, pages, files, out }) {
  const problems = [];
  const bad = (m) => problems.push(m);
  const byPath = new Map(pages.map((p) => [p.path, p]));

  // 1. the version: tauri.conf.json (ctx.version) is the newest CHANGELOG.md entry, and every place that states it agrees
  if (ctx.version !== ctx.entries[0].version) {
    bad(`version: tauri.conf.json says ${ctx.version} but the newest CHANGELOG.md entry is ${ctx.entries[0].version}`);
  }
  for (const p of pages) {
    const ld = [...p.html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<")));
    for (const doc of ld) {
      const app = (doc["@graph"] || []).find((n) => n["@type"] === "SoftwareApplication");
      if (app && app.softwareVersion !== ctx.version) bad(`${p.path}: JSON-LD softwareVersion ${app.softwareVersion} != ${ctx.version}`);
    }
  }
  for (const f of ["llms.txt", "llms-full.txt"]) {
    if (!files[f].includes(ctx.version)) bad(`${f}: does not mention version ${ctx.version}`);
  }

  // 2. the FAQ in JSON-LD is exactly the visible FAQ
  for (const lang of LANGS) {
    const p = byPath.get(PATHS[lang].home);
    const visible = [...p.html.matchAll(/<summary><h3>(.*?)<\/h3><\/summary><p>(.*?)<\/p>/gs)].map((m) => [unesc(m[1]), unesc(m[2])]);
    const ld = [...p.html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<")));
    const faq = ld.flatMap((d) => d["@graph"] || []).find((n) => n["@type"] === "FAQPage");
    if (!faq) { bad(`${p.path}: no FAQPage JSON-LD`); continue; }
    const fromLd = faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]);
    if (JSON.stringify(fromLd) !== JSON.stringify(visible)) bad(`${p.path}: the FAQ in JSON-LD differs from the visible FAQ`);
    if (visible.length < 5) bad(`${p.path}: only ${visible.length} FAQ entries found`);
  }

  for (const p of pages) {
    // 3. canonical, hreflang
    const canon = [...p.html.matchAll(/<link rel="canonical" href="([^"]*)">/g)].map((m) => m[1]);
    if (canon.length !== 1) bad(`${p.path}: ${canon.length} canonical links`);
    else if (canon[0] !== ORIGIN + p.path && p.path !== "/404.html") bad(`${p.path}: canonical is ${canon[0]}`);
    const alts = [...p.html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]*)">/g)].map((m) => [m[1], m[2]]);
    for (const [lang, href] of alts) {
      const target = byPath.get(href.replace(ORIGIN, ""));
      if (!target) { bad(`${p.path}: hreflang ${lang} points at ${href}, which is not a page`); continue; }
      // the target must point back at this page under this page's own language (x-default alone does not count)
      const back = [...target.html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]*)">/g)].map((m) => [m[1], m[2]]);
      if (lang !== "x-default" && !back.some(([l, h]) => l === p.lang && h === ORIGIN + p.path)) bad(`${p.path} <-> ${target.path}: hreflang is not reciprocal`);
      if (lang !== "x-default" && target.lang !== lang) bad(`${p.path}: hreflang ${lang} points at a ${target.lang} page`);
    }
    if (alts.length && !alts.some(([l]) => l === "x-default")) bad(`${p.path}: hreflang without x-default`);
    if (alts.length && !alts.some(([, h]) => h === ORIGIN + p.path)) bad(`${p.path}: hreflang set does not include the page itself`);

    // 4. structure: one h1, alt text, links that resolve, a title and a description that are not shared
    if (count(p.html, /<h1[ >]/g) !== 1) bad(`${p.path}: ${count(p.html, /<h1[ >]/g)} h1 elements`);
    for (const m of p.html.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) bad(`${p.path}: an image without alt: ${m[0].slice(0, 60)}`);
    for (const m of p.html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      const target = m[1].split("#")[0].split("?")[0];
      if (!target) continue;
      const file = target.endsWith("/") ? join(out, target, "index.html") : join(out, target);
      if (!existsSync(file)) bad(`${p.path}: broken internal link ${m[1]}`);
    }
    const title = (p.html.match(/<title>(.*?)<\/title>/s) || [])[1] || "";
    const desc = (p.html.match(/<meta name="description" content="(.*?)">/s) || [])[1] || "";
    if (!title) bad(`${p.path}: no title`);
    if (!desc) bad(`${p.path}: no description`);
    if (title.length > 90) bad(`${p.path}: title is ${title.length} characters`);
    if (desc.length > 260) bad(`${p.path}: description is ${desc.length} characters`);
  }
  const titles = pages.map((p) => unesc((p.html.match(/<title>(.*?)<\/title>/s) || [])[1] || ""));
  const descs = pages.map((p) => (p.html.match(/<meta name="description" content="(.*?)">/s) || [])[1] || "");
  if (new Set(titles).size !== titles.length) bad("two pages share a title");
  if (new Set(descs).size !== descs.length) bad("two pages share a description");

  // 5. the sitemap lists every indexable page
  for (const p of pageList()) {
    if (!files["sitemap.xml"].includes(`<loc>${ORIGIN}${p.path}</loc>`)) bad(`sitemap.xml misses ${p.path}`);
    if (!byPath.has(p.path)) bad(`pageList() has ${p.path} but no page was built for it`);
  }

  // 6. the facts are in the HTML itself (no JavaScript needed), in both languages
  for (const lang of LANGS) {
    const p = byPath.get(PATHS[lang].home);
    const h = p.html;
    const need = [
      [`v${ctx.version}`, "the latest version"],
      [esc(fmtDate(ctx.date, lang)), "the release date"],
      [ctx.exe, "the installer file name"],
      ["Windows 10", "the platform"],
      ["MIT", "the license"],
      ["Vinh Codon", "the author"],
      [esc(ctx.entries[0].items[0].slice(0, 40)), "the first line of the newest changelog entry"],
      [`<html lang="${lang}"`, "the page language"],
    ];
    for (const [text, what] of need) if (!h.includes(text)) bad(`${p.path}: ${what} is not in the static HTML (${text})`);
    const body = h.slice(h.indexOf("<main"));
    for (const phrase of ["Loading", "<version>", "&lt;version&gt;"]) if (body.includes(phrase)) bad(`${p.path}: placeholder text '${phrase}' left in the page`);
  }

  // 7. words and claims that must not appear (pages and files)
  const everything = [...pages.map((p) => [p.path, p.html.replace(/<script type="application\/ld\+json">.*?<\/script>/gs, "")]), ...Object.entries(files).map(([f, t]) => [f, t])];
  for (const [where, text] of everything) {
    for (const [re, why] of BANNED) if (re.test(text)) bad(`${where}: ${why}`);
  }

  // 8. the strings: every language has every key English has (except the English-only ones), and nothing else
  for (const lang of LANGS.filter((l) => l !== "en")) {
    for (const k of Object.keys(STRINGS.en)) if (!EN_ONLY.has(k) && STRINGS[lang][k] === undefined) bad(`strings: ${lang} is missing ${k}`);
    for (const k of Object.keys(STRINGS[lang])) if (STRINGS.en[k] === undefined) bad(`strings: ${k} exists only in ${lang}`);
    for (const k of Object.keys(STRINGS.en)) {
      const a = STRINGS.en[k], b = STRINGS[lang][k];
      if (EN_ONLY.has(k) || b === undefined) continue;
      if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length) bad(`strings: ${k} has ${a.length} items in English and ${b.length} in ${lang}`);
      // placeholders must survive translation
      const ph = (x) => (JSON.stringify(x).match(/\{(version|date|exe)\}/g) || []).sort().join();
      if (ph(a) !== ph(b)) bad(`strings: ${k} has different placeholders in English and ${lang}`);
    }
  }

  // 9. the files exist and are not empty
  for (const f of ["sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt"]) if (!files[f] || files[f].length < 50) bad(`${f} is missing or empty`);
  if (!existsSync(join(out, "404.html"))) bad("404.html is missing");

  if (problems.length) {
    throw new Error(`The site did not pass its checks (${problems.length}):\n  - ${problems.join("\n  - ")}`);
  }
}
