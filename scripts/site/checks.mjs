// Checks the built site against the repository and against itself (ADR-0034). If anything is wrong the build throws and the
// deploy does not happen, so the site on the Pages host is always the last site that passed.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { ORIGIN, RELEASES_URL, ROOT, fmtDate } from "./facts.mjs";
import { catalogProblems, loadOverrides, loadPopular, loadVocabulary, normalize, popularProblems, proposalMarkdown } from "./catalog.mjs";
import { STICKER_DIR } from "./stickers.mjs";
import { formatCount } from "./downloads.mjs";
import { CC_URL, fontNames, needsReviewNote, stickerUrl } from "./stickers.mjs";
import { pageList } from "./files.mjs";
import { CHARTER_URL, CODE_SIGNING_URL, RESEARCH_URL, HOME_FAQ, HOW_FAQ, PROMISES, PATHS, esc } from "./pages.mjs";
import { STRINGS, EN_ONLY, FEATURE_IDS, HTML_KEYS, LANGS, UI_KEYS } from "../../site/strings.mjs";
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
  [/(?<!never )reads what you type(?!, which keys)/i, "'reads what you type' without a negation"],
  [/macOS (version|port)? ?(is coming|will|soon)|sắp có (bản )?macOS/i, "a macOS promise"],
  [/\b(zalo|telegram|line)\s+stickers?\b|stickers?\s+(of|for|của|cho)\s+(zalo|telegram)|(zalo|telegram)\s*のステッカー/i, "a Zalo or Telegram sticker claim (the set is in no store; it is sent as pictures)"],
  [/will be code-signed|sẽ được ký số/i, "a code-signing promise"],
  [/100%\s*無料|完全無料/, "'100% free' in Japanese"],
  [/手描き|手書きの(?!セリフ)/, "'hand-drawn' in Japanese"],
  [/macOS版は(まもなく|近日|対応予定)|macOS.{0,6}対応予定/, "a macOS promise in Japanese"],
  [/コード署名(される|を行う|します)予定/, "a code-signing promise in Japanese"],
];

/** Wording that was true once and is not any more: it may stay in old release notes (the changelog) but not in what the site says now. */
const OUTDATED = [
  [/the left mouse button|nút trái chuột|マウスの左ボタン/, "'the left mouse button' (since 0.3.0 the app reads the primary button, the one you click with)"],
  [/(are|is) in English and Vietnamese\b(?! and)|are in English and Vietnamese only|bằng tiếng Anh và tiếng Việt\.|英語とベトナム語です/, "'English and Vietnamese only' (the app has spoken Japanese since 0.3.0)"],
  [/quiet hours|chattiness|giờ yên tĩnh|mức nói nhiều|静かな時間帯|おしゃべり度/i, "'quiet hours' or 'chattiness' (0.3.2 removed both settings: Peak decides, and it is quiet at night)"],
  [/(Gemini, Claude (or|and) OpenAI)|(Gemini、Claude、OpenAI)|(Gemini, Claude hoặc OpenAI)|(three (AI )?brains)/i, "three brains (Groq is the fourth since 0.3.0)"],
  // 0.4.0 (ADR-0056, ADR-0057, ADR-0059): Peak is not a character who needs you, and nothing here is a health claim
  [/\blonel(y|iness)\b|cô đơn|さみし|寂し|さびし/i, "'lonely' (0.4.0: your absence costs nothing; there is no lonely state; no claim about loneliness)"],
  [/\bstreaks?\b|chuỗi ngày|連続/i, "a streak (0.4.0 removed streaks and the counting of days)"],
  [/right-click it, or the tray|chuột phải vào nó, hoặc|右クリック、またはトレイ|right-click me/i, "the pet's own right-click menu (0.4.0: a right click pushes Peak; the menu is in the tray icon)"],
  [/\bheal(s|ed|ing)?\b|\btherap(y|ies|eutic)\b|clinically proven|chữa lành|trị liệu|癒し|セラピー|治療/i, "a health claim word (healing, therapy, clinically proven; ADR-0057)"],
  [/(reduces?|relieves?|treats?|cures?) (your )?(anxiety|depression|ADHD|loneliness|stress)|giảm (lo âu|trầm cảm|ADHD|cô đơn)|(不安|うつ|孤独)を(減らし|和らげ|癒し)/i, "a claim to reduce anxiety, depression, ADHD or loneliness (ADR-0057)"],
  [/replaces? (your )?(friends|a therapist|professionals?)|thay (thế )?(bạn bè|chuyên gia)/i, "a claim to replace friends or professionals (ADR-0057)"],
  [/detects? (a )?(crisis|crises)|phát hiện (cơn )?khủng hoảng|危機を(検出|検知)/i, "a claim that Peak detects a crisis (it does not read your messages for that: it is a rule for how it answers; spec 12)"],
  [/safe for everyone|adults only|an toàn cho mọi người|成人限定/i, "'safe for everyone' or 'adults only' as a promise (the wording is 'Made for adults (18+)'; a lawyer has not seen it)"],
  [/picks it on a Japanese Windows|tự chọn tiếng Nhật trên Windows tiếng Nhật|日本語のWindowsでは日本語になります/i, "'Auto picks it on a Japanese Windows' (0.4.1: Auto reads the whole list of the system's languages, and never the IP address or location; ADR-0066)"],
  // ADR-0076: the SignPath attribution line only after the project is approved (the author says when); until then nothing is "signed"
  [/Free code signing provided by SignPath/i, "the SignPath attribution line before the project is approved (ADR-0076: the author tells the website session when it is active)"],
  [/first official release|bản phát hành chính thức đầu tiên|正式リリース第1弾/i, "'first official release (0.2)' (the app is at a later version; the notice states the current one)"],
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
    for (const [path, ids] of [[PATHS[lang].home, HOME_FAQ], [PATHS[lang].how, HOW_FAQ]]) {
      const p = byPath.get(path);
      const visible = [...p.html.matchAll(/<summary><h3>(.*?)<\/h3><\/summary><p>(.*?)<\/p>/gs)].map((m) => [unesc(m[1]), unesc(m[2])]);
      const ld = [...p.html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<")));
      const faq = ld.flatMap((d) => d["@graph"] || []).find((n) => n["@type"] === "FAQPage");
      if (!faq) { bad(`${p.path}: no FAQPage JSON-LD`); continue; }
      const fromLd = faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]);
      if (JSON.stringify(fromLd) !== JSON.stringify(visible)) bad(`${p.path}: the FAQ in JSON-LD differs from the visible FAQ`);
      if (visible.length !== ids.length) bad(`${p.path}: ${visible.length} FAQ entries found, expected ${ids.length}`);
      // a short answer is easier to quote (ADR-0048): at most about 70 words, or 200 characters in Japanese
      for (const [q, a] of visible) {
        const size = lang === "ja" ? a.length : a.split(/\s+/).length;
        if (size > (lang === "ja" ? 220 : 75)) bad(`${p.path}: the answer to "${q}" is ${size} ${lang === "ja" ? "characters" : "words"} (keep FAQ answers short)`);
      }
    }
  }

  // 2b. what the structured data states about the app is on the visible page (ADR-0040 N4), and the llms files state the same facts
  for (const lang of LANGS) {
    const p = byPath.get(PATHS[lang].home);
    const ld = [...p.html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<")));
    const app = ld.flatMap((d) => d["@graph"] || []).find((n) => n["@type"] === "SoftwareApplication");
    if (!app) continue;
    const visibleText = unesc(p.html.replace(/<script[\s\S]*?<\/script>/g, "") + byPath.get(PATHS[lang].how).html.replace(/<script[\s\S]*?<\/script>/g, ""));
    if (!Array.isArray(app.featureList) || app.featureList.length !== FEATURE_IDS.length) bad(`${p.path}: featureList does not have the ${FEATURE_IDS.length} feature titles`);
    else for (const f of app.featureList) if (!visibleText.includes(f)) bad(`${p.path}: featureList entry "${f}" is not on the page`);
    if (!app.softwareRequirements || !/WebView2/.test(app.softwareRequirements) || !/WebView2/.test(unesc(p.html)) || !/64/.test(unesc(p.html))) bad(`${p.path}: softwareRequirements is missing or not backed by the visible text`);
    if (app.releaseNotes !== ORIGIN + "/changelog/" || !p.html.includes('href="/changelog/"')) bad(`${p.path}: releaseNotes does not point at the linked changelog`);
    if (app.screenshot !== app.image) bad(`${p.path}: screenshot is not the share image`);
  }
  // 2c. the numbers and the privacy wording that the README states are on the pages in every language (ADR-0042)
  const readme = readFileSync(join(ROOT, "README.md"), "utf8");
  const lines = readme.match(/(\d+) hand-written lines per language/);
  if (!lines) bad("README.md no longer says how many hand-written lines there are per language: the site cannot be checked against it");
  const SAYS_LINES = { en: (n) => `${n} hand-written lines`, vi: (n) => `${n} câu viết tay`, ja: (n) => `${n}個` };
  const GROUND = { en: "under its feet", vi: "dưới chân nó", ja: "足元" };
  const hasGround = /just under its feet/.test(readme);
  for (const lang of LANGS) {
    for (const path of [PATHS[lang].how]) {
      const html = unesc(byPath.get(path).html);
      if (lines && !html.includes(SAYS_LINES[lang](lines[1]))) bad(`${path}: does not say ${SAYS_LINES[lang](lines[1])} (the README says ${lines[1]} lines per language)`);
    }
    if (hasGround) {
      for (const path of [PATHS[lang].home, PATHS[lang].privacy, PATHS[lang].how]) {
        if (!unesc(byPath.get(path).html).includes(GROUND[lang])) bad(`${path}: the README says Peak asks what is under its feet, this page does not (privacy wording)`);
      }
    }
  }
  // the other numbers of the README: memory and processor use
  const num = (re) => { const m = readme.match(re); if (!m) bad(`README.md no longer matches ${re}: the site cannot be checked against it`); return m; };
  const mem = num(/[Aa]bout (\d+) to (\d+) MB of memory/);
  const still = num(/about (\d+) to (\d+)% of one core while it stands still/);
  const median = num(/median of about (\d+) to (\d+)% in normal use/);
  const RANGE = { en: (a, b) => `${a} to ${b}`, vi: (a, b) => `${a} đến ${b}`, ja: (a, b) => `${a}〜${b}` };
  const UNIT = { en: [" MB", "%"], vi: [" MB", "%"], ja: ["MB", "%"] };
  for (const lang of LANGS) {
    const html = unesc(byPath.get(PATHS[lang].how).html);
    for (const [m, unit, what] of [[mem, UNIT[lang][0], "memory"], [still, UNIT[lang][1], "processor use standing"], [median, UNIT[lang][1], "processor use median"]]) {
      if (!m) continue;
      const want = RANGE[lang](m[1], m[2]) + unit;
      if (!html.includes(want)) bad(`${PATHS[lang].how}: does not say ${want} (${what}, as in the README)`);
    }
  }

  // the promises: each is on the home page and the privacy page in every language, and each is backed by a sentence of the README
  const BACKING = {
    pr1: [/never reads what you type/i, "README.md: 'never reads what you type'"],
    pr2: [/absence costs nothing/i, "README.md: 'Your absence costs nothing'"],
    pr3: [/alive without any AI/i, "README.md: 'alive without any AI'"],
    pr4: [/companion, not an assistant/i, "README.md: 'a companion, not an assistant'"],
    pr5: [/stays still and quiet/i, "README.md: 'stays still and quiet'"],
  };
  for (const k of PROMISES) {
    const [re, what] = BACKING[k] || [];
    if (!re) bad(`promise ${k} has no backing sentence listed in the checks`);
    else if (!re.test(readme)) bad(`promise ${k} is not backed by the README any more (${what}): change the promise or the README`);
  }
  if (!existsSync(join(ROOT, "docs", "charter.md"))) bad("docs/charter.md does not exist: the promises link to it");
  for (const lang of LANGS) {
    for (const path of [PATHS[lang].home, PATHS[lang].privacy]) {
      const html = byPath.get(path).html;
      for (const k of PROMISES) {
        const text = HTML_KEYS.has(k) ? STRINGS[lang][k] : esc(STRINGS[lang][k]);
        if (!html.includes(text)) bad(`${path}: the promise ${k} is not on the page`);
      }
      if (!html.includes(`href="${CHARTER_URL}"`)) bad(`${path}: there is no link to the charter`);
      if (path === PATHS[lang].privacy && !html.includes(`href="${RESEARCH_URL}"`)) bad(`${path}: there is no link to the research (ADR-0062: a link, not a page)`);
    }
  }

  // the download buttons are the installer itself, not the release page (ADR-0065); the release page is one small link away
  for (const lang of LANGS) {
    const html = byPath.get(PATHS[lang].home).html;
    const want = ctx.installerUrl;
    if (want !== `https://github.com/vinhcodon/streakboom/releases/download/v${ctx.version}/${ctx.exe}`) bad(`the installer link ${want} does not name this version's file`);
    for (const id of ["download-btn", "direct-dl"]) if (!html.includes(`id="${id}" ${id === "download-btn" ? 'class="btn primary" ' : ""}href="${want}"`)) bad(`${PATHS[lang].home}: #${id} is not the installer link`);
    if (!html.includes('id="dl-toast"')) bad(`${PATHS[lang].home}: the line that follows a click on a download is missing`);
    if (!html.includes(`href="${RELEASES_URL}"`)) bad(`${PATHS[lang].home}: there is no link to the release page (notes and other versions)`);
  }
  if (!files["llms.txt"].includes(ctx.installerUrl)) bad("llms.txt does not give the direct installer link");

  // the Code signing policy (ADR-0076): on the home page of every language, with the exact term, the team, the privacy sentence and the link
  // to CODE_SIGNING.md; it says that nothing is signed yet and claims nothing more
  for (const lang of LANGS) {
    const h = byPath.get(PATHS[lang].home).html;
    const m = h.match(/<section id="code-signing"[\s\S]*?<\/section>/);
    if (!m) { bad(PATHS[lang].home + ": the Code signing policy section is missing"); continue; }
    const sec = m[0];
    if (!sec.includes("<h2>Code signing policy</h2>")) bad(PATHS[lang].home + ': the heading of the section must be the exact term "Code signing policy"');
    if (!sec.includes('href="' + CODE_SIGNING_URL + '"')) bad(PATHS[lang].home + ": the section does not link to CODE_SIGNING.md");
    if (!sec.includes('href="' + PATHS[lang].privacy + '"')) bad(PATHS[lang].home + ": the section does not link to the privacy page");
    if (!sec.includes("SignPath.io") || !sec.includes("Vinh Codon") || !sec.includes("@vinhcodon")) bad(PATHS[lang].home + ": the section lacks SignPath.io, the author's name or the GitHub name");
    const text = sec.replace(/<[^>]+>/g, " ");
    if (/\b(verified|trusted|secure installer|safe)\b|đã được ký|署名済み|signed by/i.test(text)) bad(PATHS[lang].home + ": the Code signing policy claims more than is true (nothing is signed yet)");
    if (!h.includes('href="#code-signing"')) bad(PATHS[lang].home + ": the download area does not point to the Code signing policy");
  }
  if (!files["llms.txt"].includes(CODE_SIGNING_URL)) bad("llms.txt does not link to the Code signing policy");

  // the search index of the sticker pages (plan v0.2): by meaning, so per script and not per page language: a Latin file (English and
  // Vietnamese) and a Japanese file, every sticker in each, every word normalised by the very function the page uses, small enough to read at once
  for (const kind of ["latin", "ja"]) {
    const name = "assets/stickers/search-" + kind + ".json";
    const raw = files[name];
    if (!raw) { bad(name + " was not built"); continue; }
    let idx;
    try { idx = JSON.parse(raw); } catch { bad(name + " is not valid JSON"); continue; }
    if (idx.v !== 2 || !Array.isArray(idx.items) || idx.items.length !== ctx.stickers.stickers.length) bad(name + ": the index does not list every sticker of the set");
    if (gzipSync(raw).length > 150 * 1024) bad(name + " is over 150 KB gzipped (spec 13: split the index)");
    const lang = kind === "ja" ? "ja" : "en";
    for (const it of idx.items || []) {
      for (const k of ["t", "x", "s", "g"]) {
        if (!Array.isArray(it[k]) || !it[k].length) bad(name + ": sticker " + it.id + " has no " + k);
        for (const w of it[k] || []) if (w !== normalize(lang, w)) bad(name + ": sticker " + it.id + " has a word that is not normalised: " + w);
      }
    }
  }
  for (const lang of LANGS) {
    const html = byPath.get(PATHS[lang].stickers).html;
    if (!html.includes('id="sticker-q"') || !html.includes('id="sticker-search" class="sticker-search" hidden')) bad(PATHS[lang].stickers + ": the search box is missing or not reserved");
    if (!html.includes('<label class="visually-hidden" for="sticker-q">')) bad(PATHS[lang].stickers + ": the search box has no label");
  }

  // every sticker button carries its English address (slug), which the saved and recent lists store (plan v0.3)
  for (const lang of LANGS) {
    const html = byPath.get(PATHS[lang].stickers).html;
    for (const c of ctx.catalog.stickers) if (!html.includes('data-id="' + c.id + '" data-slug="' + c.slug + '"')) bad(PATHS[lang].stickers + ": the button of sticker " + c.id + " has no data-slug " + c.slug);
    for (const id of ["sticker-recent", "sticker-recent-list", "sticker-mine-foot", "sticker-recent-clear"]) if (!html.includes('id="' + id + '"')) bad(PATHS[lang].stickers + ": #" + id + " is missing");
  }

  // the language suggestion (ADR-0067): an inline script on the pages that have a same-page translation, none on the English-only
  // pages; no strip in the static HTML; it reads only the browser's languages and the local storage; it never redirects or asks a server
  {
    const withTranslation = ["home", "how", "privacy", "stickers"];
    for (const lang of LANGS) {
      for (const kind of withTranslation) {
        const p = byPath.get(PATHS[lang][kind]);
        const m = p.html.match(/<script id="lang-suggest">([\s\S]*?)<\/script>/);
        if (!m) { bad(p.path + ": the language suggestion script is missing"); continue; }
        const code = m[1];
        if (!code.includes("navigator.languages")) bad(p.path + ": the suggestion does not read navigator.languages");
        for (const word of ["fetch", "XMLHttpRequest", "sendBeacon", "document.cookie", "location.replace", "location.assign", "location.href", "window.location", "sessionStorage", "indexedDB", "geolocation"]) {
          if (code.includes(word)) bad(p.path + ": the suggestion script mentions " + word + " (no redirect, no request, no cookie, no location: ADR-0067)");
        }
        if ((code.match(/localStorage/g) || []).length !== 2) bad(p.path + ": the suggestion script uses local storage for more than the list of languages");
        if (/class="lang-strip"/.test(p.html.replace(/<script[\s\S]*?<\/script>/g, ""))) bad(p.path + ": the suggestion strip is in the static HTML (crawlers must not see it)");
        // each suggestion is a link to the same page in that language: the very link of the header's switcher
        for (const l of LANGS.filter((x) => x !== lang)) {
          const link = p.html.match(new RegExp('<a class="lang" href="([^"]+)" hreflang="' + l + '"'));
          if (!link || !code.includes('"href":' + JSON.stringify(link[1]))) bad(p.path + ": the suggestion for " + l + " does not lead to the same page as the switcher");
        }
      }
    }
    for (const path of [PATHS.changelog, "/404.html"]) {
      if (byPath.get(path) && byPath.get(path).html.includes('id="lang-suggest"')) bad(path + ": an English-only page must not offer a language suggestion");
    }
  }

  // the download counter (ADR-0052): off in local builds; when on, the number on every home page is the ledger's total, in the
  // language's own grouping, the ledger is published, and the sentence says downloads (never installs or people)
  if (ctx.downloads) {
    const d = ctx.downloads;
    const sum = Object.values(d.perTag || {}).reduce((a, b) => a + b, 0);
    if (!Number.isInteger(d.total) || d.total !== sum) bad(`downloads: the total ${d.total} is not the sum of the ledger (${sum})`);
    if (!Array.isArray(d.history) || !d.history.length || d.history.at(-1).total !== d.total || d.history.at(-1).date !== d.updated) bad("downloads: the last entry of the daily history is not today's total");
    if (!files["downloads.json"] || JSON.stringify(JSON.parse(files["downloads.json"])) !== JSON.stringify(d)) bad("downloads.json is missing or is not the ledger the pages show");
    for (const lang of LANGS) {
      const html = byPath.get(PATHS[lang].home).html;
      const m = html.match(/<p class="sub downloads">([^<]*)<\/p>/);
      if (!m) { bad(`${PATHS[lang].home}: the download counter is on but the page does not show it`); continue; }
      if (!m[1].includes(formatCount(d.total, lang))) bad(`${PATHS[lang].home}: the download line does not show ${formatCount(d.total, lang)}`);
      if (/\binstalls?\b|\busers?\b|\bpeople who\b|người dùng|lượt cài|インストール数|ユーザー数/i.test(m[1].replace(/not people|không phải số người|人数ではなく/g, ""))) bad(`${PATHS[lang].home}: the download line talks about installs or users; it counts downloads`);
    }
  } else {
    for (const p of pages) if (p.html.includes('class="sub downloads"')) bad(`${p.path}: a download line without a ledger`);
    if (files["downloads.json"]) bad("downloads.json without a ledger");
  }

  // the menu stays short (ADR-0053): four links in the header, the rest in the footer
  for (const p of pages) {
    const nav = (p.html.match(/<nav aria-label="Main">([\s\S]*?)<\/nav>/) || [])[1];
    if (nav === undefined) { if (p.path !== "/404.html") bad(`${p.path}: no main menu`); continue; }
    const n = (nav.match(/<a /g) || []).length;
    if (n > 4) bad(`${p.path}: the menu has ${n} links (at most four; the rest belongs in the footer)`);
  }

  // the sticker pages (ADR-0051, ADR-0053): the set comes from the manifest; the picture is the button; nothing is recorded or downloaded
  if (!ctx.stickers) bad("the sticker set was not loaded");
  else {
    const set = ctx.stickers;
    for (const lang of LANGS) {
      const p = byPath.get(PATHS[lang].stickers);
      if (!p) { bad(`no sticker page for ${lang}`); continue; }
      const html = p.html;
      const grid = html.slice(html.indexOf('<ul class="sticker-grid">')); // the editorial row above repeats some buttons (plan v0.8)
      const buttons = [...grid.matchAll(/<button class="sticker"[^>]*data-id="([^"]*)"[^>]*aria-label="([^"]*)"><img src="([^"]*)" width="(\d+)" height="(\d+)" alt="([^"]*)"/g)];
      if (buttons.length !== set.stickers.length) bad(`${p.path}: ${buttons.length} sticker buttons, the manifest has ${set.stickers.length}`);
      set.stickers.forEach((st, i) => {
        const b = buttons[i];
        if (!b) return;
        if (b[1] !== st.id) bad(`${p.path}: sticker ${i + 1} is ${b[1]}, the manifest order says ${st.id}`);
        if (b[3] !== stickerUrl(lang, st.id)) bad(`${p.path}: sticker ${st.id} shows ${b[3]}, not the image of its language`);
        if (b[4] !== "360" || b[5] !== "360") bad(`${p.path}: sticker ${st.id} has no width and height of 360`);
        if (unesc(b[6]) !== st.alt[lang]) bad(`${p.path}: the alt text of sticker ${st.id} is not the manifest's`);
        if (!unesc(b[2]).includes(st.title[lang])) bad(`${p.path}: the label of the button ${st.id} does not carry its title`);
        if (!html.includes(`<span class="sticker-title">${esc(st.title[lang])}</span>`)) bad(`${p.path}: the title of sticker ${st.id} is not text on the page`);
      });
      // the licence, the creator and the fonts are on the page and in the structured data
      if (!html.includes(`<a href="${CC_URL}">CC BY 4.0</a>`)) bad(`${p.path}: no link to the CC BY 4.0 licence`);
      if (!unesc(html).includes(fontNames(set, lang).split(" · ")[0])) bad(`${p.path}: the font credit is missing`);
      if (needsReviewNote(set, lang) !== html.includes(STRINGS[lang].st_ai_note)) bad(`${p.path}: the note that the words were written by an AI must show exactly while the manifest says reviewed is not true`);
      const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<")));
      const gallery = ld.flatMap((d) => d["@graph"] || []).find((n) => n["@type"] === "ImageGallery");
      if (!gallery) bad(`${p.path}: no ImageGallery structured data`);
      else {
        if (gallery.hasPart.length !== set.stickers.length) bad(`${p.path}: the ImageGallery lists ${gallery.hasPart.length} images, the page has ${set.stickers.length}`);
        for (const o of gallery.hasPart) {
          if (o.license !== CC_URL || !o.creator || o.creator.name !== set.creator) bad(`${p.path}: an ImageObject without the licence or the creator`);
          if (!existsSync(join(out, o.contentUrl.replace(ORIGIN, "")))) bad(`${p.path}: the image ${o.contentUrl} was not built`);
        }
      }
      // what the author does not want: a Download button per sticker, a ZIP, a copy icon of two squares
      if (/<a\b[^>]*\sdownload(=|\s|>)|\.zip["' ]|\bzip\b/i.test(html.replace(/<script[\s\S]*?<\/script>/g, ""))) bad(`${p.path}: a download or a ZIP of the stickers (the author does not want them)`);
      // no third-party script or tracker
      for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]*)"/g)) if (!m[1].startsWith("/")) bad(`${p.path}: a script from outside the site: ${m[1]}`);
    }
    // the page script records nothing and stores nothing
    const js = existsSync(join(out, "stickers.js")) ? readFileSync(join(out, "stickers.js"), "utf8") : "";
    if (!js) bad("stickers.js was not built");
    for (const word of ["cookie", "sessionStorage", "sendBeacon", "XMLHttpRequest", "analytics", "indexedDB"]) if (js.includes(word)) bad(`stickers.js mentions ${word}: the page may keep only the recent list in localStorage (ADR-0060)`);
    // the one thing kept: a short list of sticker numbers in this browser (ADR-0060), under one key, with a way to clear it
    if ((js.match(/localStorage/g) || []).length !== 3 || !js.includes("streakboom-stickers-mine") || !js.includes("streakboom-sticker-recent")) bad("stickers.js: local storage is only for the recent stickers (one key, by slug: read, write, remove; the older keys are only dropped)");
    if (!js.includes("COPY_PX = 360") || !js.includes("COPY_SIDE")) bad("stickers.js: the copied picture is no longer the full 360 px, or the test parameter is gone (ADR-0075)");
    // the pictures stay real images that the system menu can act on (a long press, a right click)
    const css = readFileSync(join(out, "style.css"), "utf8");
    for (const m of css.matchAll(/([^{}]*\.sticker[^{}]*)\{([^}]*)\}/g)) {
      if (/touch-callout:\s*none|user-select:\s*none|pointer-events:\s*none/.test(m[2]) && !/\.paw/.test(m[1]) && !/\.sticker-status/.test(m[1])) bad(`style.css: the rule "${m[1].trim()}" blocks the system menu on a sticker (touch-callout, user-select or pointer-events none)`);
    }
    // the sitemap lists every picture of each sticker page, and the pages share their own preview picture
    for (const lang of LANGS) {
      const block = (files["sitemap.xml"].split("<url>").find((u) => u.includes(`<loc>${ORIGIN}${PATHS[lang].stickers}</loc>`)) || "");
      const listed = [...block.matchAll(/<image:loc>([^<]*)<\/image:loc>/g)].map((m) => m[1]);
      const want = set.stickers.map((st) => ORIGIN + stickerUrl(lang, st.id));
      if (JSON.stringify(listed) !== JSON.stringify(want)) bad(`sitemap.xml: the pictures of ${PATHS[lang].stickers} are ${listed.length}, the manifest has ${want.length} (or they differ)`);
      const html = byPath.get(PATHS[lang].stickers).html;
      if (!html.includes(`<meta property="og:image" content="${ORIGIN}/assets/sticker-preview.png">`)) bad(`${PATHS[lang].stickers}: the share picture is not the sticker preview`);
      if (!existsSync(join(out, "assets", "sticker-preview.png"))) bad("the sticker preview picture was not built");
    }
    // the crawler files know about the set
    if (!files["llms.txt"].includes("/stickers/")) bad("llms.txt does not mention the sticker page");
    if (!files["llms-full.txt"].includes(`${set.stickers.length} free stickers`)) bad("llms-full.txt does not state the number of stickers");
  }

  // the Atom feed of the changelog: it lists every version of CHANGELOG.md, newest first, and is linked from the changelog page
  const feed = files["changelog.xml"] || "";
  const feedEntries = [...feed.matchAll(/<entry>[\s\S]*?<title>Streakboom ([^<:]+)/g)].map((m) => m[1]);
  if (!feed.startsWith("<?xml") || !feed.includes("<feed")) bad("changelog.xml is not an Atom feed");
  if (JSON.stringify(feedEntries) !== JSON.stringify(ctx.entries.map((e) => e.version))) bad(`changelog.xml lists ${feedEntries.join(", ")} but CHANGELOG.md has ${ctx.entries.map((e) => e.version).join(", ")}`);
  if (!byPath.get(PATHS.changelog).html.includes(`href="${PATHS.feed}"`)) bad("the changelog page does not link to changelog.xml");
  if (!files["llms.txt"].includes(PATHS.feed)) bad("llms.txt does not mention the changelog feed");

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
      [esc(ctx.entries[0].items[0].replaceAll("**", "").slice(0, 20)), "the first line of the newest changelog entry"],
      [`<html lang="${lang}"`, "the page language"],
    ];
    for (const [text, what] of need) if (!h.includes(text)) bad(`${p.path}: ${what} is not in the static HTML (${text})`);
    const body = h.slice(h.indexOf("<main"));
    for (const phrase of ["Loading", "<version>", "&lt;version&gt;"]) if (body.includes(phrase)) bad(`${p.path}: placeholder text '${phrase}' left in the page`);
  }

  // 6c. the editorial row of the sticker pages (plan v0.8): a list of addresses of stickers of the set, shown in this order on every language
  if (ctx.catalog) {
    for (const p of popularProblems(loadPopular(), ctx.catalog)) bad("sticker pages: " + p);
    const slugOrder = loadPopular().slugs;
    for (const lang of LANGS) {
      const html = byPath.get(PATHS[lang].stickers).html;
      const m = html.match(/<div id="sticker-popular"[\s\S]*?<\/ul>/);
      if (!m) { bad(PATHS[lang].stickers + ": the row of picks is missing"); continue; }
      const shown = [...m[0].matchAll(/data-slug="([^"]*)"/g)].map((x) => x[1]);
      if (JSON.stringify(shown) !== JSON.stringify(slugOrder)) bad(PATHS[lang].stickers + ": the row of picks is not the list of popular.json, in its order");
    }
  }

  // 6b. the sticker tags (ADR-0077): given by the rules; a sticker with none, an unknown tag, a missing synonym, or a proposal page
  // that is out of date stops the build
  if (ctx.catalog) {
    for (const p of catalogProblems(ctx.stickers, ctx.catalog)) bad("sticker tags: " + p);
    if (ctx.stickers.dir === STICKER_DIR) {
      const file = join(ROOT, "docs", "plans", "sticker-tags-proposed.md");
      const want = proposalMarkdown(ctx.stickers, ctx.catalog);
      const have = existsSync(file) ? readFileSync(file, "utf8").replace(/\r\n/g, "\n") : "";
      if (have !== want) bad("docs/plans/sticker-tags-proposed.md is out of date: run node scripts/site/tags-report.mjs and commit it");
    }
  }

  // 7. words and claims that must not appear (pages and files)
  const everything = [["catalog/tags.json", JSON.stringify(loadVocabulary())], ["catalog/overrides.json", JSON.stringify(loadOverrides())], ...pages.map((p) => [p.path, p.html.replace(/<script type="application\/ld\+json">.*?<\/script>/gs, "")]), ...Object.entries(files).map(([f, t]) => [f, t])];
  for (const [where, text] of everything) {
    for (const [re, why] of BANNED) if (re.test(text)) bad(`${where}: ${why}`);
    if (where === "/changelog/" || where === "changelog.xml") continue; // the release notes keep what was true when they were written
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
      const ph = (x) => (JSON.stringify(x).match(/\{(version|date|exe|n)\}/g) || []).sort().join();
      if (ph(a) !== ph(b)) bad(`strings: ${k} has different placeholders in English and ${lang}`);
    }
  }

  // 8a. no string without a user: a hidden copy of a text (for example of the privacy text) is how a site drifts from the app
  {
    const sources = [...readdirSync(join(ROOT, "scripts", "site")).filter((f) => f.endsWith(".mjs") && f !== "checks.mjs" && !f.endsWith(".test.mjs")).map((f) => join(ROOT, "scripts", "site", f)),
      join(ROOT, "scripts", "build-site.mjs"), ...readdirSync(join(ROOT, "site")).filter((f) => f.endsWith(".js")).map((f) => join(ROOT, "site", f))];
    const code = sources.map((f) => readFileSync(f, "utf8")).join("\n");
    const DYNAMIC = [/^f\d+_[hp]$/, /^fl\d+$/, /^g\d+_[ab]$/, /^[qa]\d+$/, /^pose_/, /^cap_/, /^hw_/, /^pv_/, /^cl_/, /^nf_/];
    for (const k of Object.keys(STRINGS.en)) {
      if (DYNAMIC.some((re) => re.test(k))) continue;
      if (!code.includes(`"${k}"`) && !code.includes(`.${k}`) && !code.includes(`\`${k}\``) && !code.includes(`'${k}'`) && !UI_KEYS.includes(k)) bad(`strings: "${k}" is not used by any page or script (delete it, or it will go stale)`);
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
