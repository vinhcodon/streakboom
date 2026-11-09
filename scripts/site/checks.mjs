// Checks the built site against the repository and against itself (ADR-0034). If anything is wrong the build throws and the
// deploy does not happen, so the site on the Pages host is always the last site that passed.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { ORIGIN, fmtDate } from "./facts.mjs";
import { pageList } from "./files.mjs";
import { PATHS, esc } from "./pages.mjs";
import { STRINGS, EN_ONLY, LANGS, UI_KEYS } from "../../site/strings.mjs";
import { SCENES } from "../../site/scenes.js";

/** The size budget (ADR-0040 N5): what the browser must download to show a page stays small. Limits are in bytes. */
export const BUDGET = { scriptsGzip: 30 * 1024, homeHtml: 60 * 1024 };

/** All .js files under a directory (the scripts a page loads: the page script, the rig and the tour). */
function jsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? jsFiles(join(dir, e.name)) : e.name.endsWith(".js") ? [join(dir, e.name)] : []));
}

/** Problems with the size budget: the scripts together (gzipped) and the largest home page (as sent, not gzipped). */
export function sizeProblems({ pages, out }, limits = BUDGET) {
  const problems = [];
  const scripts = jsFiles(out).reduce((n, file) => n + gzipSync(readFileSync(file)).length, 0);
  if (scripts > limits.scriptsGzip) problems.push(`size: the scripts are ${(scripts / 1024).toFixed(1)} KB gzipped, over the budget of ${(limits.scriptsGzip / 1024).toFixed(0)} KB`);
  for (const p of pages) {
    if (!LANGS.some((l) => PATHS[l].home === p.path)) continue;
    const bytes = Buffer.byteLength(p.html);
    if (bytes > limits.homeHtml) problems.push(`size: ${p.path} is ${(bytes / 1024).toFixed(1)} KB of HTML, over the budget of ${(limits.homeHtml / 1024).toFixed(0)} KB`);
  }
  return problems;
}

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

/** Wording that was true once and is not any more: it may stay in old release notes (the changelog) but not in what the site says now. */
const OUTDATED = [
  [/the left mouse button|nút trái chuột|マウスの左ボタン/, "'the left mouse button' (since 0.3.0 the app reads the primary button, the one you click with)"],
  [/(are|is) in English and Vietnamese(?! and)|are in English and Vietnamese only|bằng tiếng Anh và tiếng Việt\.|英語とベトナム語です/, "'English and Vietnamese only' (the app has spoken Japanese since 0.3.0)"],
  [/(Gemini, Claude (or|and) OpenAI)|(Gemini、Claude、OpenAI)|(Gemini, Claude hoặc OpenAI)|(three (AI )?brains)/i, "three brains (Groq is the fourth since 0.3.0)"],
];

/** What the site says about the app now: the pages and files without the release notes they quote. */
function currentFacts(text) {
  return text
    .replace(/<section id="updates"[\s\S]*?<\/section>/, "")
    .replace(/\n## Newest changes[\s\S]*$/, "");
}

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

  // 2b. what the structured data states about the app is on the visible page (ADR-0040 N4), and the llms files state the same facts
  for (const lang of LANGS) {
    const p = byPath.get(PATHS[lang].home);
    const ld = [...p.html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<")));
    const app = ld.flatMap((d) => d["@graph"] || []).find((n) => n["@type"] === "SoftwareApplication");
    if (!app) continue;
    const visibleText = unesc(p.html.replace(/<script[\s\S]*?<\/script>/g, ""));
    if (!Array.isArray(app.featureList) || app.featureList.length !== 9) bad(`${p.path}: featureList does not have the nine feature titles`);
    else for (const f of app.featureList) if (!visibleText.includes(f)) bad(`${p.path}: featureList entry "${f}" is not on the page`);
    if (!app.softwareRequirements || !/WebView2/.test(app.softwareRequirements) || !/WebView2/.test(visibleText) || !/64/.test(visibleText)) bad(`${p.path}: softwareRequirements is missing or not backed by the visible text`);
    if (app.releaseNotes !== ORIGIN + "/changelog/" || !p.html.includes('href="/changelog/"')) bad(`${p.path}: releaseNotes does not point at the linked changelog`);
    if (app.screenshot !== app.image) bad(`${p.path}: screenshot is not the share image`);
  }
  for (const f of ["llms.txt", "llms-full.txt"]) {
    for (const word of ["Japanese", "Gemini, Groq, Claude, OpenAI", "Free tiers with limits: Gemini and Groq"]) {
      if (!files[f].includes(word)) bad(`${f}: does not state "${word}"`);
    }
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
    if (where === "/changelog/") continue; // the release notes keep what was true when they were written
    const now = currentFacts(text);
    for (const [re, why] of OUTDATED) if (re.test(now)) bad(`${where}: ${why}`);
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

  // 8b. the hero tour: every scene has its chip label and caption in every language; captions fit the fixed-height box
  for (const lang of LANGS) {
    for (const k of UI_KEYS) if (typeof STRINGS[lang][k] !== "string" || !STRINGS[lang][k]) bad(`strings: ${lang} has no text for the page-script key ${k}`);
    for (const sc of SCENES) {
      const cap = STRINGS[lang]["cap_" + sc.id] || "";
      const limit = lang === "ja" ? 60 : 110;
      if (cap.length > limit) bad(`strings: caption cap_${sc.id} in ${lang} is ${cap.length} characters (the caption box fits ${limit})`);
    }
    const home = byPath.get(PATHS[lang].home);
    if (home && !home.html.includes(`id="peak-caption"`)) bad(`${home.path}: the caption element of the hero is missing`);
    // the scene chips are static HTML (no layout shift when the script starts; labels readable without it)
    SCENES.forEach((sc, i) => {
      if (home && !home.html.includes(`data-scene="${i}"`)) bad(`${home.path}: the chip of scene ${sc.id} is not in the static HTML`);
      if (home && !home.html.includes(`>${STRINGS[lang]["pose_" + sc.id]}</button>`)) bad(`${home.path}: the label of the chip ${sc.id} is not in the static HTML`);
    });
    // a language link's accessible name must start with its visible text (WCAG 2.5.3, Lighthouse "label-content-name-mismatch")
    for (const m of (home ? home.html : "").matchAll(/<a class="lang"[^>]*aria-label="([^"]*)"[^>]*>([^<]*)<\/a>/g)) {
      if (!m[1].startsWith(m[2])) bad(`${home.path}: the language link "${m[2]}" has the accessible name "${m[1]}", which does not start with its visible text`);
    }
    if (home && !home.html.includes(STRINGS[lang].cap_idle)) bad(`${home.path}: the first caption is not in the static HTML`);
  }

  // 9. the files exist and are not empty
  for (const f of ["sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt"]) if (!files[f] || files[f].length < 50) bad(`${f} is missing or empty`);
  if (!existsSync(join(out, "404.html"))) bad("404.html is missing");

  problems.push(...sizeProblems({ pages, out }));
  if (problems.length) {
    throw new Error(`The site did not pass its checks (${problems.length}):\n  - ${problems.join("\n  - ")}`);
  }
}
