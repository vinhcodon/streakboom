// The pages of the website as functions of (language, release facts). Output is plain static HTML that GitHub Pages
// serves as it is; nothing here runs in the visitor's browser. Text comes from site/strings.mjs, facts from facts.mjs.
import { STRINGS, FEATURE_IDS, HTML_KEYS, STICKER_UI_KEYS, UI_KEYS, LANGS } from "../../site/strings.mjs";
import { SCENES } from "../../site/scenes.js";
import { AUTHOR, ORIGIN, RELEASES_URL, REPO_URL, fmtDate } from "./facts.mjs";
import { formatCount } from "./downloads.mjs";
import { inlineScript } from "./langsuggest.mjs";
import { loadPopular } from "./catalog.mjs";
import { withVersion } from "./assetversion.mjs";
import { beaconTag, countingOn, privacySections, stickerNote } from "./counting.mjs";
import { DEFAULT_TAGLINE, TAGLINE_KEYS, taglineScript } from "./taglines.mjs";
import { CC_URL, fontNames, needsReviewNote, stickerUrl } from "./stickers.mjs";

export const PATHS = {
  en: { home: "/", privacy: "/privacy/", how: "/how-it-works/", stickers: "/stickers/", story: "/story/" },
  vi: { home: "/vi/", privacy: "/vi/privacy/", how: "/vi/how-it-works/", stickers: "/vi/stickers/", story: "/vi/story/" },
  ja: { home: "/ja/", privacy: "/ja/privacy/", how: "/ja/how-it-works/", stickers: "/ja/stickers/", story: "/ja/story/" },
  changelog: "/changelog/",
  feed: "/changelog.xml",
};

/** How each language is named (the language links), and its Open Graph locale. */
export const LANG_INFO = {
  en: { short: "EN", name: "English", locale: "en_US" },
  vi: { short: "VI", name: "Tiếng Việt", locale: "vi_VN" },
  ja: { short: "JA", name: "日本語", locale: "ja_JP" },
};

/** The hreflang set of a page that exists in every language: one link per language and x-default (English). */
export function alternatesFor(kind) {
  return [...LANGS.map((l) => ({ hreflang: l, path: PATHS[l][kind] })), { hreflang: "x-default", path: PATHS.en[kind] }];
}

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Fill the placeholders {version} {date} {exe} and {n} (the downloads; only when the counter is on) of a string. */
export function fill(s, ctx, lang) {
  return s.replaceAll("{version}", ctx.version).replaceAll("{date}", fmtDate(ctx.date, lang)).replaceAll("{exe}", ctx.exe)
    .replaceAll("{n}", ctx.downloads ? formatCount(ctx.downloads.total, lang) : "");
}
/** The raw (unescaped) text of a key. */
export const raw = (lang, key, ctx) => fill(STRINGS[lang][key], ctx, lang);
/** Ready for HTML: plain-text keys are escaped, the few HTML keys are ours and used as they are. */
export const tx = (lang, key, ctx) => (HTML_KEYS.has(key) ? raw(lang, key, ctx) : esc(raw(lang, key, ctx)));

const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

/** The picture that chat apps and social sites show for a link: the site's own, unless a page brings another (the sticker pages do). */
const SHARE_IMAGE = { url: `${ORIGIN}/assets/og-image.jpg`, width: 1200, height: 630, alt: "Peak, a golden chibi cat, next to the text Streakboom", card: "summary_large_image" };

function head({ lang, ctx, path, title, description, alternates, jsonld = [], noindex = false, feed = false, uiExtra = [], image = SHARE_IMAGE }) {
  const url = ORIGIN + path;
  const locale = LANG_INFO[lang].locale;
  const alt = (alternates || []).map((a) => `  <link rel="alternate" hreflang="${a.hreflang}" href="${ORIGIN}${a.path}">`).join("\n");
  const ogAlt = (alternates || []).filter((a) => a.hreflang !== "x-default" && a.hreflang !== lang)
    .map((a) => `  <meta property="og:locale:alternate" content="${LANG_INFO[a.hreflang].locale}">`).join("\n");
  const ui = Object.fromEntries([...UI_KEYS, ...uiExtra].map((k) => [k, STRINGS[lang][k] ?? STRINGS.en[k]]));
  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
${noindex ? '  <meta name="robots" content="noindex">\n' : ""}  <meta name="theme-color" content="#f5b83d">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16.png">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="canonical" href="${url}">
${feed ? `  <link rel="alternate" type="application/atom+xml" title="Streakboom changelog" href="${ORIGIN}${PATHS.feed}">\n` : ""}${alt ? alt + "\n" : ""}  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Streakboom">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="${locale}">
${ogAlt ? ogAlt + "\n" : ""}  <meta property="og:image" content="${image.url}">
  <meta property="og:image:width" content="${image.width}">
  <meta property="og:image:height" content="${image.height}">
  <meta property="og:image:alt" content="${esc(image.alt)}">
  <meta name="twitter:card" content="${image.card}">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${image.url}">
  <link rel="stylesheet" href="${withVersion("/style.css", ctx)}">
  <script>document.documentElement.classList.toggle("not-windows", !(/windows/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.userAgent) && !/phone|mobile/i.test(navigator.userAgent)));</script>
${jsonld.map((o) => `  <script type="application/ld+json">${json(o)}</script>`).join("\n")}
  <script type="application/json" id="ui-strings">${json(ui)}</script>
</head>`;
}

/** The language suggestion (ADR-0067): an inline script that builds a thin strip before the first paint, only for a visitor whose browser's
 *  first language that the site has is not the page's own. Only the pages that have a same-page translation get it. */
function langSuggest(lang, switchTo) {
  const targets = Object.fromEntries(LANGS.filter((l) => l !== lang).map((l) => [l, { href: switchTo[l], text: STRINGS[l].ls_text, close: STRINGS[l].ls_close }]));
  return `  <script id="lang-suggest">${inlineScript(lang, targets)}</script>`;
}

/** `switchTo` maps a language to the page that is the same page in that language (or its home page). */
function header({ lang, ctx, switchTo }) {
  const s = (k) => tx(lang, k, ctx);
  const home = PATHS[lang].home;
  const links = LANGS.filter((l) => l !== lang)
    .map((l) => `<a class="lang" href="${switchTo[l]}" hreflang="${l}" lang="${l}" title="${esc(LANG_INFO[l].name)}" aria-label="${LANG_INFO[l].short} (${esc(LANG_INFO[l].name)})">${LANG_INFO[l].short}</a>`).join("\n      ");
  return `<header class="nav">
    <div class="brandbox">
      <a class="brand-logo" href="${home}" aria-hidden="true" tabindex="-1"><img src="/assets/peak-logo.png" width="32" height="32" alt=""></a>
      <a class="brand-name" href="${home}">Streakboom</a>
      <span class="brand-slogan">${s("brand_slogan")}</span>
    </div>
    <span class="langs">
      ${links}
    </span>
    <nav aria-label="Main">
      <a href="${PATHS[lang].how}">${s("nav_how")}</a>
      <a href="${PATHS[lang].privacy}">${s("nav_privacy")}</a>
      <a href="${PATHS[lang].stickers}">${s("nav_stickers")}</a>
      <a href="${PATHS[lang].story}">${s("nav_story")}</a>
    </nav>
  </header>`;
}

function footer({ lang, ctx }) {
  const s = (k) => tx(lang, k, ctx);
  return `<footer class="footer">
    <p>${s("foot_a")}</p>
    <p><a href="${REPO_URL}">GitHub</a> · <a href="${PATHS[lang].home}#install">${s("nav_install")}</a> · <a href="${PATHS[lang].home}#faq">${s("nav_faq")}</a> · <a href="${PATHS.changelog}">${s("nav_changelog")}</a> · <a href="${REPO_URL}/issues">${s("foot_bug")}</a> · <a href="${PATHS.feed}">Atom</a></p>
  </footer>`;
}

function htmlDoc({ lang, ctx, switchTo, headArgs, main, script = true, suggest = true }) {
  return `<!doctype html>
<html lang="${lang}">
${head({ lang, ctx, ...headArgs })}
<body>
${suggest ? langSuggest(lang, switchTo) : ""}

  ${header({ lang, ctx, switchTo })}

  <main id="top">
${main}
  </main>

  ${footer({ lang, ctx })}
${script ? `\n  <script type="module" src="${withVersion(script === true ? "/app.js" : script, ctx)}"></script>\n` : ""}${beaconTag(ctx) ? `  ${beaconTag(ctx)}\n` : ""}</body>
</html>
`;
}

/** One release as a card; `level` is the heading level (3 on the home page, 2 on the changelog page). */
/** The first sentence of a line (a short form for the home page; the changelog page has the whole line). */
const firstSentence = (text) => (text.match(/^.*?[.!?。]\**(?=\s|$)/s) || [text])[0];
/** Release notes are written in Markdown: only **bold** is used, and it is shown as bold. */
const notes = (text) => esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

export function entryHtml(e, lang, level, maxItems = Infinity, short = false) {
  const when = e.date ? `<time datetime="${esc(e.date)}">${esc(fmtDate(e.date, lang))}</time>` : "";
  const sub = [when, e.title ? esc(e.title) : ""].filter(Boolean).join(" · ");
  return `<li${level === 2 ? ` id="v${esc(e.version)}"` : ""}><h${level}>Streakboom ${esc(e.version)}</h${level}><div class="meta">${sub}</div><ul>${e.items.slice(0, maxItems).map((i) => `<li>${notes(short ? firstSentence(i) : i)}</li>`).join("")}</ul></li>`;
}

/** The questions of the home page and of the How it works page (numbers of the q/a keys); together they are all of them. */
export const HOME_FAQ = [1, 10, 2, 8, 4];
export const HOW_FAQ = [5, 6, 7, 9, 11, 12];

/** Question and answer pairs: those with the given numbers, or all of them in order. */
export function faqPairs(lang, ctx, ids = null) {
  const list = ids || [...HOME_FAQ, ...HOW_FAQ].sort((a, b) => a - b);
  return list.map((i) => ({ q: raw(lang, "q" + i, ctx), a: raw(lang, "a" + i, ctx) }));
}

const faqHtml = (pairs) => pairs.map((p) => `      <details><summary><h3>${esc(p.q)}</h3></summary><p>${esc(p.a)}</p></details>`).join("\n");

const faqNode = (lang, ctx, path, ids) => ({
  "@type": "FAQPage",
  "@id": `${ORIGIN}${path}#faq`,
  inLanguage: lang,
  mainEntity: faqPairs(lang, ctx, ids).map((p) => ({ "@type": "Question", name: p.q, acceptedAnswer: { "@type": "Answer", text: p.a } })),
});

/** The charter of Peak on GitHub: the proof behind the promises (docs/charter.md; the build checks that the file exists). */
/** The code signing policy of the repository (ADR-0076): the site links to it and says, honestly, that nothing is signed yet. */
export const CODE_SIGNING_URL = `${REPO_URL}/blob/main/CODE_SIGNING.md`;
export const CHARTER_URL = `${REPO_URL}/blob/main/docs/charter.md`;
/** The research behind the design (ADR-0057, ADR-0062): a link to the folder on GitHub, no page and no figures on the site. */
export const RESEARCH_URL = `${REPO_URL}/tree/main/docs/foundation`;
/** The four promises of the home page and the privacy page (keys pr1 to pr4); the build checks each against the README. */
export const PROMISES = ["pr1", "pr5", "pr2", "pr3", "pr4"]; // the order of the charter and the README; pr5 was added in 0.3.2

/** The titles of the feature cards without their leading emoji: the `featureList` of the structured data. */
export function featureTitles(lang, ctx) {
  return FEATURE_IDS.map((i) => raw(lang, `f${i}_h`, ctx).replace(/^[^\p{L}\p{N}]+/u, "").trim());
}

export function homeJsonLd(lang, ctx) {
  const path = PATHS[lang].home;
  const first = ctx.entries[ctx.entries.length - 1];
  return [{
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${ORIGIN}/#app`,
        name: "Streakboom",
        description: raw(lang, "description", ctx),
        url: ORIGIN + path,
        applicationCategory: "EntertainmentApplication",
        operatingSystem: "Windows 10, Windows 11",
        softwareVersion: ctx.version,
        datePublished: first.date,
        dateModified: ctx.date,
        downloadUrl: ctx.installerUrl,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        isAccessibleForFree: true,
        license: `${REPO_URL}/blob/main/LICENSE`,
        inLanguage: LANGS,
        image: `${ORIGIN}/assets/og-image.jpg`,
        screenshot: `${ORIGIN}/assets/og-image.jpg`,
        featureList: featureTitles(lang, ctx),
        softwareRequirements: raw(lang, "requirements", ctx),
        releaseNotes: `${ORIGIN}${PATHS.changelog}`,
        sameAs: [REPO_URL],
        author: { "@id": `${ORIGIN}/#author` },
      },
      { "@type": "Person", "@id": `${ORIGIN}/#author`, name: AUTHOR.name, sameAs: [AUTHOR.github] },
      { "@type": "WebSite", "@id": `${ORIGIN}/#site`, url: `${ORIGIN}/`, name: "Streakboom", inLanguage: LANGS, publisher: { "@id": `${ORIGIN}/#author` } },
      faqNode(lang, ctx, path, HOME_FAQ),
    ],
  }];
}

export function howJsonLd(lang, ctx) {
  return [{ "@context": "https://schema.org", "@graph": [faqNode(lang, ctx, PATHS[lang].how, HOW_FAQ)] }];
}

export function homePage(lang, ctx) {
  const s = (k) => tx(lang, k, ctx);
  const path = PATHS[lang].home;
  // short on purpose (ADR-0048): the promises, four feature lines, the install, five answers and the newest update;
  // the detail is on the How it works page and the privacy page
  const teasers = [1, 2, 3, 9]
    .map((i) => `        <article class="card"><h3>${s(`f${i}_h`)}</h3><p>${s(`fl${i}`)}</p></article>`).join("\n");
  const promises = PROMISES.map((k) => `        <li>${s(k)}</li>`).join("\n");
  const faq = faqHtml(faqPairs(lang, ctx, HOME_FAQ));
  // the scene chips are in the HTML (the script only binds them): no shift when it starts, labels readable without it
  const chips = SCENES.map((sc, i) => `          <button class="chip" type="button" data-scene="${i}" aria-pressed="${i === 0}">${s("pose_" + sc.id)}</button>`).join("\n");
  const recent = ctx.entries.slice(0, 1).map((e) => "        " + entryHtml(e, lang, 3, 1, true)).join("\n");

  const main = `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-text">
        <h1>${s("hero_title")}</h1>
        <p class="kicker"><span id="tagline">${s(DEFAULT_TAGLINE)}</span></p>
        <script id="tagline-script">${taglineScript(TAGLINE_KEYS.map((k) => raw(lang, k, ctx)))}</script>
        <p class="lead">${s("hero_lead")}</p>
        <div class="cta">
          <a id="download-btn" class="btn primary" href="${ctx.installerUrl}">
            <span>${s("download")}</span>
            <small>v${esc(ctx.version)} · ${esc(fmtDate(ctx.date, lang))}</small>
          </a>
          <!-- shown instead of the download button on phones and non-Windows computers (see app.js) -->
          <button id="share-btn" class="btn primary only-other" type="button">${s("share_btn")}</button>
          <a class="btn ghost" href="#features">${s("see_more")}</a>
        </div>
        <p id="other-os" class="note other-os only-other">
          <span>${s("other_os")}</span>
          <a id="direct-dl" href="${ctx.installerUrl}">${s("direct_dl")}</a>
        </p>
        <p class="note win-note">${s("alpha_note")} <a href="${RELEASES_URL}">${s("dl_all")}</a> · <a href="#code-signing">${s("cs_title")}</a></p>
        <p class="note">${s("lang_note")}</p>
        <p id="dl-toast" class="toast" role="status" aria-live="polite"></p>
      </div>

      <div class="hero-art">
        <canvas id="peak" width="360" height="360" role="img" aria-label="${s("peak_alt")}"></canvas>
        <p id="peak-caption" class="peak-caption">${s("cap_idle")}</p>
        <p id="peak-status" class="visually-hidden" role="status"></p>
        <div id="poses" class="chips" role="group" aria-label="${s("poses_label")}">
${chips}
          <button id="tour-toggle" class="chip tour-toggle" type="button" data-pending>${s("tour_pause")}</button>
        </div>
        <p class="demo-hint">${s("demo_hint")}</p>
      </div>
    </section>

    <!-- THE PROMISES (the charter, distilled; the proof is the charter on GitHub) -->
    <section id="promises" class="section">
      <h2>${s("promise_title")}</h2>
      <p class="sub">${s("promise_sub")}</p>
      <ul class="checks">
${promises}
      </ul>
      <p class="links"><a href="${PATHS[lang].privacy}">${s("priv_more")}</a> · <a href="${CHARTER_URL}">${s("charter_link")}</a></p>
    </section>

    <!-- FEATURES: four lines; every feature is on the How it works page -->
    <section id="features" class="section alt">
      <h2>${s("feat_title")}</h2>
      <p class="sub">${s("feat_sub")}</p>
      <div class="grid quad">
${teasers}
      </div>
      <p class="links"><a href="${PATHS[lang].how}">${s("nav_how")}</a></p>
    </section>

    <!-- INSTALL -->
    <section id="install" class="section">
      <h2>${s("inst_title")}</h2>
      <ol class="steps">
        <li>${s("s1")}</li>
        <li>${s("s2")}</li>
        <li>${s("s3")}</li>
      </ol>
      <p class="sub">${s("inst_note")}</p>${ctx.downloads ? `
      <p class="sub downloads">${s("dl_count")}</p>` : ""}
    </section>

    <!-- CODE SIGNING POLICY (ADR-0076): the exact term, the team, the privacy sentence; nothing is signed yet, so it says so -->
    <section id="code-signing" class="section">
      <h2>${s("cs_title")}</h2>
      <p>${s("cs_p1")}</p>
      <p>${s("cs_team")}</p>
      <p>${s("cs_privacy")}</p>
      <p class="links"><a href="${PATHS[lang].privacy}">${s("priv_more")}</a> · <a href="${CODE_SIGNING_URL}">${s("cs_full")}</a></p>
    </section>

    <!-- FAQ: five answers of one or two sentences; the rest is on the How it works page -->
    <section id="faq" class="section alt">
      <h2>${s("faq_title")}</h2>
${faq}
      <p class="links"><a href="${PATHS[lang].how}#faq">${s("hw_faq_title")}</a></p>
    </section>

    <!-- THE NEWEST UPDATE, from CHANGELOG.md at build time -->
    <section id="updates" class="section">
      <h2>${s("upd_title")}</h2>
      <p class="sub">${s("upd_sub")}</p>
      <ol class="releases">
${recent}
      </ol>
      <p class="links"><a href="${PATHS.changelog}">${s("full_changelog")}</a> · <a href="${REPO_URL}/releases.atom">${s("rss")}</a></p>
    </section>
`;
  return htmlDoc({
    lang, ctx, switchTo: Object.fromEntries(LANGS.map((l) => [l, PATHS[l].home])),
    headArgs: {
      path, title: raw(lang, "title", ctx), description: raw(lang, "description", ctx),
      alternates: alternatesFor("home"),
      jsonld: homeJsonLd(lang, ctx),
    },
    main,
  });
}

/** "How it works": what it does, how to play, six plain sections and the rest of the questions; written from the README and the app's records. */
export function howPage(lang, ctx) {
  const s = (k) => tx(lang, k, ctx);
  const path = PATHS[lang].how;
  const features = FEATURE_IDS
    .map((i) => `        <h3>${s(`f${i}_h`)}</h3>\n        <p>${s(`f${i}_p`)}</p>`).join("\n");
  const gestures = [1, 2, 3, 8, 4, 5, 7, 6]
    .map((i) => `          <tr><th>${s(`g${i}_a`)}</th><td>${s(`g${i}_b`)}</td></tr>`).join("\n");
  const sections = STRINGS[lang].hw_sections
    .map((sec) => `      <section>
        <h2>${esc(sec.h)}</h2>
${sec.p.map((p) => `        <p>${esc(p)}</p>`).join("\n")}
      </section>`).join("\n");
  const main = `
    <article class="section prose">
      <h1>${s("hw_title")}</h1>
      <p class="lead">${s("hw_lead")}</p>
      <section id="features">
        <h2>${s("hw_feat_title")}</h2>
${features}
      </section>
      <section id="gestures">
        <h2>${s("use_title")}</h2>
        <table class="gestures">
          <tbody>
${gestures}
          </tbody>
        </table>
      </section>
${sections}
      <section id="faq">
        <h2>${s("hw_faq_title")}</h2>
${faqHtml(faqPairs(lang, ctx, HOW_FAQ))}
      </section>
      <p><a href="${PATHS[lang].privacy}">${s("priv_more")}</a> · <a href="${PATHS[lang].home}">${s("pv_back")}</a></p>
    </article>
`;
  return htmlDoc({
    lang, ctx, switchTo: Object.fromEntries(LANGS.map((l) => [l, PATHS[l].how])),
    headArgs: { path, title: raw(lang, "hw_page_title", ctx), description: raw(lang, "hw_desc", ctx), alternates: alternatesFor("how"), jsonld: howJsonLd(lang, ctx) },
    main, script: false,
  });
}

/** The story of Peak (ADR-0110): the author's text word for word, two voices (the author's plain, Peak's in a soft block), no script. */
export function storyPage(lang, ctx) {
  const t = (k) => esc(raw(lang, k, ctx));
  const blocks = STRINGS[lang].sb_blocks.map((b) => {
    const peak = b.who === "Peak";
    const parts = b.parts.map((p) => typeof p === "string" ? `        <p>${esc(p)}</p>`
      : `        <blockquote><p>${p.q.map(([who, say]) => `<strong>${esc(who)}</strong> ${esc(say)}`).join("<br>\n")}</p></blockquote>`).join("\n");
    return `      <section class="voice ${peak ? "voice-peak" : "voice-author"}">
        <h2 class="voice-name">${peak ? '<img src="/assets/peak-logo.png" width="22" height="22" alt="">' : ""}${esc(b.who)}</h2>
${parts}
      </section>`;
  }).join("\n");
  const main = `
    <article class="section prose story">
      <h1>${t("sb_title")}</h1>
      <p class="story-scene"><em>${t("sb_scene")}</em></p>
${blocks}
      <p><a href="${PATHS[lang].home}">${tx(lang, "pv_back", ctx)}</a></p>
    </article>
`;
  return htmlDoc({
    lang, ctx, switchTo: Object.fromEntries(LANGS.map((l) => [l, PATHS[l].story])),
    headArgs: { path: PATHS[lang].story, title: raw(lang, "sb_page_title", ctx), description: raw(lang, "sb_desc", ctx), alternates: alternatesFor("story") },
    main, script: false,
  });
}

/** Structured data of a sticker page: an ImageGallery of ImageObjects with the licence and the creator (ADR-0051). */
export function stickersJsonLd(lang, ctx) {
  const set = ctx.stickers;
  const path = PATHS[lang].stickers;
  const creator = { "@type": "Organization", name: set.creator, url: ORIGIN };
  return [{
    "@context": "https://schema.org",
    "@graph": [{
      "@type": "ImageGallery",
      "@id": `${ORIGIN}${path}#gallery`,
      name: raw(lang, "st_title", ctx),
      description: raw(lang, "st_desc", ctx),
      url: ORIGIN + path,
      inLanguage: lang,
      license: CC_URL,
      creator,
      creditText: `Peak stickers by ${set.creator}, ${set.license}`,
      isPartOf: { "@id": `${ORIGIN}/#site` },
      hasPart: set.stickers.map((st) => ({
        "@type": "ImageObject",
        contentUrl: ORIGIN + stickerUrl(lang, st.id),
        name: st.title[lang],
        description: st.alt[lang],
        encodingFormat: "image/png",
        width: 360,
        height: 360,
        license: CC_URL,
        creator,
        creditText: `Peak stickers by ${set.creator}, ${set.license}`,
        acquireLicensePage: ORIGIN + path,
      })),
    }],
  }];
}

/** The sticker page: the picture itself is the button (tap to copy; site/stickers.js); the pictures are real <img> elements, so a
 *  long press or a right click still shows the system menu, and with scripts off they are still there. */
export function stickersPage(lang, ctx) {
  const s = (k) => tx(lang, k, ctx);
  const set = ctx.stickers;
  const path = PATHS[lang].stickers;
  const slugs = new Map(ctx.catalog.stickers.map((c) => [c.id, c.slug]));
  const buttonHtml = (st, lazy) => {
    const title = st.title[lang];
    const label = raw(lang, "st_aria", ctx).replace("{title}", title);
    return `<button class="sticker" type="button" data-id="${esc(st.id)}" data-slug="${esc(slugs.get(st.id))}" data-title="${esc(title)}" aria-label="${esc(label)}"><img src="${stickerUrl(lang, st.id)}" width="360" height="360" alt="${esc(st.alt[lang])}"${lazy ? ' loading="lazy"' : ""}><span class="paw" aria-hidden="true"></span></button>`;
  };
  const items = set.stickers.map((st, i) => `        <li class="sticker-item">${buttonHtml(st, i >= 12)}<span class="sticker-title">${esc(st.title[lang])}</span></li>`).join("\n");
  // the editorial row (plan v0.8): Vinh's picks, in the static HTML (no script needed), the same buttons as the grid
  const bySlug = new Map(set.stickers.map((st) => [slugs.get(st.id), st]));
  const popular = loadPopular().slugs.map((slug) => bySlug.get(slug)).filter(Boolean)
    .map((st) => `          <li class="sticker-item">${buttonHtml(st, false)}</li>`).join("\n");
  const fonts = esc(raw(lang, "st_fonts", ctx).replace("{fonts}", fontNames(set, lang)));
  const aiNote = needsReviewNote(set, lang) ? `\n      <p class="note">${s("st_ai_note")}</p>` : "";
  const main = `
    <section class="section stickers-page"${countingOn(ctx) ? ` data-count="${esc(ctx.counting.endpoint)}"` : ""}>
      <h1>${s("st_title")}</h1>
      <p class="lead">${s("st_lead")}</p>
      <p id="sticker-hint" class="hint" hidden>${s("st_hint")}</p>
      <div id="sticker-search" class="sticker-search" hidden>
        <label class="visually-hidden" for="sticker-q">${s("st_search_label")}</label>
        <input id="sticker-q" type="search" placeholder="${s("st_search_ph")}" autocomplete="off" spellcheck="false" enterkeyhint="search">
        <p id="sticker-search-status" class="sticker-search-status" role="status" aria-live="polite"></p>
      </div>
      <noscript><p class="note">${s("st_nojs")}</p></noscript>
      <div id="sticker-recent" class="sticker-recent" data-set="${esc(set.version)}" hidden>
        <h2>${s("st_recent")}</h2>
        <ul id="sticker-recent-list" class="sticker-grid recent-grid"></ul>
      </div>
      <p id="sticker-mine-foot" class="sticker-mine-foot" hidden>${s("st_mine_note")} <button id="sticker-recent-clear" class="linklike" type="button">${s("st_recent_clear")}</button></p>
      <div id="sticker-popular" class="sticker-recent sticker-popular">
        <h2>${s("st_popular")}</h2>
        <ul class="sticker-grid recent-grid popular-grid">
${popular}
        </ul>
      </div>
      <h2 id="sticker-all" class="sticker-all">${s("st_all")} (${set.stickers.length})</h2>
      <ul class="sticker-grid">
${items}
      </ul>
      <p id="sticker-status" class="sticker-status" role="status" aria-live="polite"></p>
    </section>

    <section class="section alt">
      <h2>${s("st_how_title")}</h2>
      <ol class="steps">
        <li>${s("st_how1")}</li>
        <li>${s("st_how2")}</li>
      </ol>
      <p class="licence">${s("st_license")}</p>
      <p class="note">${fonts}</p>${aiNote}
      <p class="note">${esc(stickerNote(lang, ctx))}</p>
    </section>

    <section class="section">
      <p>${s("st_cta")}</p>
      <p class="cta"><a class="btn primary" href="${ctx.installerUrl}">${s("download")}</a> <a class="btn ghost" href="${PATHS[lang].home}">${s("see_more")}</a></p>
    </section>
`;
  return htmlDoc({
    lang, ctx, switchTo: Object.fromEntries(LANGS.map((l) => [l, PATHS[l].stickers])),
    headArgs: {
      path, title: raw(lang, "st_page_title", ctx), description: raw(lang, "st_desc", ctx),
      alternates: alternatesFor("stickers"), jsonld: stickersJsonLd(lang, ctx), uiExtra: STICKER_UI_KEYS,
      image: { url: `${ORIGIN}/assets/sticker-preview.png`, width: 440, height: 440, alt: raw(lang, "st_preview_alt", ctx), card: "summary" },
    },
    main, script: "/stickers.js",
  });
}

export function privacyPage(lang, ctx) {
  const s = (k) => tx(lang, k, ctx);
  const S = STRINGS[lang];
  const path = PATHS[lang].privacy;
  const sections = privacySections(lang, ctx)
    .map((sec) => `      <section>\n        <h2>${esc(sec.h)}</h2>\n${sec.p.map((p) => `        <p>${esc(p)}</p>`).join("\n")}\n      </section>`).join("\n");
  const main = `
    <article class="section prose">
      <h1>${s("pv_title")}</h1>
      <p class="lead">${s("pv_lead")}</p>
      <section>
        <h2>${s("promise_title")}</h2>
        <ul class="checks">
${PROMISES.map((k) => `          <li>${s(k)}</li>`).join("\n")}
        </ul>
        <p><a href="${CHARTER_URL}">${s("charter_link")}</a></p>
        <p><a href="${RESEARCH_URL}">${s("research_link")}</a></p>
      </section>
${sections}
      <p><a href="${PATHS[lang].home}">${s("pv_back")}</a></p>
    </article>
`;
  return htmlDoc({
    lang, ctx, switchTo: Object.fromEntries(LANGS.map((l) => [l, PATHS[l].privacy])),
    headArgs: {
      path, title: raw(lang, "pv_page_title", ctx), description: raw(lang, "pv_desc", ctx),
      alternates: alternatesFor("privacy"),
    },
    main, script: false,
  });
}

export function changelogPage(ctx) {
  const lang = "en";
  const s = (k) => tx(lang, k, ctx);
  const all = ctx.entries.map((e) => "      " + entryHtml(e, lang, 2)).join("\n");
  const main = `
    <article class="section prose">
      <h1>${s("cl_title")}</h1>
      <p class="lead">${s("cl_intro")}</p>
      <ol class="releases">
${all}
      </ol>
      <p class="links"><a href="${PATHS.feed}">${s("cl_feed")}</a> · <a href="${REPO_URL}/releases.atom">${s("rss")}</a> · <a href="${PATHS.en.home}">${s("pv_back")}</a></p>
    </article>
`;
  return htmlDoc({
    lang, ctx, switchTo: { vi: PATHS.vi.home, ja: PATHS.ja.home }, suggest: false,
    headArgs: { path: PATHS.changelog, title: raw(lang, "cl_page_title", ctx), description: raw(lang, "cl_desc", ctx), feed: true },
    main, script: false,
  });
}

export function notFoundPage(ctx) {
  const lang = "en";
  const s = (k) => tx(lang, k, ctx);
  const main = `
    <article class="section prose">
      <h1>${s("nf_title")}</h1>
      <p class="lead">${s("nf_text")}</p>
      <p><a href="${PATHS.en.home}">Streakboom</a> · <a href="${PATHS.changelog}">${s("nav_changelog")}</a></p>
    </article>
`;
  return htmlDoc({
    lang, ctx, switchTo: { vi: PATHS.vi.home, ja: PATHS.ja.home }, suggest: false,
    headArgs: { path: "/404.html", title: `${raw(lang, "nf_title", ctx)} | Streakboom`, description: raw(lang, "nf_text", ctx), noindex: true },
    main, script: false,
  });
}
