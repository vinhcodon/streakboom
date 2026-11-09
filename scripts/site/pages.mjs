// The pages of the website as functions of (language, release facts). Output is plain static HTML that GitHub Pages
// serves as it is; nothing here runs in the visitor's browser. Text comes from site/strings.mjs, facts from facts.mjs.
import { STRINGS, HTML_KEYS, UI_KEYS, LANGS } from "../../site/strings.mjs";
import { SCENES } from "../../site/scenes.js";
import { AUTHOR, ORIGIN, RELEASES_URL, REPO_URL, fmtDate } from "./facts.mjs";

export const PATHS = {
  en: { home: "/", privacy: "/privacy/" },
  vi: { home: "/vi/", privacy: "/vi/privacy/" },
  ja: { home: "/ja/", privacy: "/ja/privacy/" },
  changelog: "/changelog/",
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

/** Fill the placeholders {version} {date} {exe} of a string. */
export function fill(s, ctx, lang) {
  return s.replaceAll("{version}", ctx.version).replaceAll("{date}", fmtDate(ctx.date, lang)).replaceAll("{exe}", ctx.exe);
}
/** The raw (unescaped) text of a key. */
export const raw = (lang, key, ctx) => fill(STRINGS[lang][key], ctx, lang);
/** Ready for HTML: plain-text keys are escaped, the few HTML keys are ours and used as they are. */
export const tx = (lang, key, ctx) => (HTML_KEYS.has(key) ? raw(lang, key, ctx) : esc(raw(lang, key, ctx)));

const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

function head({ lang, ctx, path, title, description, alternates, jsonld = [], noindex = false }) {
  const url = ORIGIN + path;
  const locale = LANG_INFO[lang].locale;
  const alt = (alternates || []).map((a) => `  <link rel="alternate" hreflang="${a.hreflang}" href="${ORIGIN}${a.path}">`).join("\n");
  const ogAlt = (alternates || []).filter((a) => a.hreflang !== "x-default" && a.hreflang !== lang)
    .map((a) => `  <meta property="og:locale:alternate" content="${LANG_INFO[a.hreflang].locale}">`).join("\n");
  const ui = Object.fromEntries(UI_KEYS.map((k) => [k, STRINGS[lang][k] ?? STRINGS.en[k]]));
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
${alt ? alt + "\n" : ""}  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Streakboom">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="${locale}">
${ogAlt ? ogAlt + "\n" : ""}  <meta property="og:image" content="${ORIGIN}/assets/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Peak, a golden chibi cat, next to the text Streakboom">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${ORIGIN}/assets/og-image.jpg">
  <link rel="stylesheet" href="/style.css">
  <script>document.documentElement.classList.toggle("not-windows", !(/windows/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.userAgent) && !/phone|mobile/i.test(navigator.userAgent)));</script>
${jsonld.map((o) => `  <script type="application/ld+json">${json(o)}</script>`).join("\n")}
  <script type="application/json" id="ui-strings">${json(ui)}</script>
</head>`;
}

/** `switchTo` maps a language to the page that is the same page in that language (or its home page). */
function header({ lang, ctx, switchTo }) {
  const s = (k) => tx(lang, k, ctx);
  const home = PATHS[lang].home;
  const links = LANGS.filter((l) => l !== lang)
    .map((l) => `<a class="lang" href="${switchTo[l]}" hreflang="${l}" lang="${l}" title="${esc(LANG_INFO[l].name)}" aria-label="${LANG_INFO[l].short} (${esc(LANG_INFO[l].name)})">${LANG_INFO[l].short}</a>`).join("\n      ");
  return `<header class="nav">
    <a class="brand" href="${home}"><img src="/assets/peak-logo.png" width="32" height="32" alt="">Streakboom</a>
    <span class="langs">
      ${links}
    </span>
    <nav aria-label="Main">
      <a href="${home}#features">${s("nav_features")}</a>
      <a href="${home}#install">${s("nav_install")}</a>
      <a href="${PATHS[lang].privacy}">${s("nav_privacy")}</a>
      <a href="${home}#faq">${s("nav_faq")}</a>
      <a href="${PATHS.changelog}">${s("nav_changelog")}</a>
      <a class="nav-extra" href="${REPO_URL}">GitHub</a>
    </nav>
  </header>`;
}

function footer({ lang, ctx }) {
  const s = (k) => tx(lang, k, ctx);
  return `<footer class="footer">
    <p>${s("foot_a")}</p>
    <p><a href="${REPO_URL}">Source</a> · <a href="${REPO_URL}/issues">${s("foot_bug")}</a> · <a href="${PATHS[lang].privacy}">${s("nav_privacy")}</a> · <a href="${PATHS.changelog}">${s("nav_changelog")}</a></p>
  </footer>`;
}

function htmlDoc({ lang, ctx, switchTo, headArgs, main, script = true }) {
  return `<!doctype html>
<html lang="${lang}">
${head({ lang, ctx, ...headArgs })}
<body>

  ${header({ lang, ctx, switchTo })}

  <main id="top">
${main}
  </main>

  ${footer({ lang, ctx })}
${script ? '\n  <script type="module" src="/app.js"></script>\n' : ""}</body>
</html>
`;
}

/** One release as a card; `level` is the heading level (3 on the home page, 2 on the changelog page). */
export function entryHtml(e, lang, level) {
  const when = e.date ? `<time datetime="${esc(e.date)}">${esc(fmtDate(e.date, lang))}</time>` : "";
  const sub = [when, e.title ? esc(e.title) : ""].filter(Boolean).join(" · ");
  return `<li><h${level}>Streakboom ${esc(e.version)}</h${level}><div class="meta">${sub}</div><ul>${e.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></li>`;
}

export function faqPairs(lang, ctx) {
  const out = [];
  for (let i = 1; STRINGS[lang]["q" + i]; i++) out.push({ q: raw(lang, "q" + i, ctx), a: raw(lang, "a" + i, ctx) });
  return out;
}

/** The titles of the nine feature cards without their leading emoji: the `featureList` of the structured data. */
export function featureTitles(lang, ctx) {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => raw(lang, `f${i}_h`, ctx).replace(/^[^\p{L}\p{N}]+/u, "").trim());
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
        downloadUrl: RELEASES_URL,
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
      {
        "@type": "FAQPage",
        "@id": `${ORIGIN}${path}#faq`,
        inLanguage: lang,
        mainEntity: faqPairs(lang, ctx).map((p) => ({ "@type": "Question", name: p.q, acceptedAnswer: { "@type": "Answer", text: p.a } })),
      },
    ],
  }];
}

export function homePage(lang, ctx) {
  const s = (k) => tx(lang, k, ctx);
  const S = STRINGS[lang];
  const path = PATHS[lang].home;
  const features = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((i) => `        <article class="card"><h3>${s(`f${i}_h`)}</h3><p>${s(`f${i}_p`)}</p></article>`).join("\n");
  const gestures = [1, 2, 3, 4, 5, 7, 6]
    .map((i) => `          <tr><th>${s(`g${i}_a`)}</th><td>${s(`g${i}_b`)}</td></tr>`).join("\n");
  const glance = S.glance.map((t) => `        <li>${esc(fill(t, ctx, lang))}</li>`).join("\n");
  const notItems = S.not_items.map((t) => `        <li>${esc(fill(t, ctx, lang))}</li>`).join("\n");
  const privacy = ["p1", "p2", "p3", "p7"].map((k) => `        <li>${s(k)}</li>`).join("\n");
  const faq = faqPairs(lang, ctx)
    .map((p) => `      <details><summary><h3>${esc(p.q)}</h3></summary><p>${esc(p.a)}</p></details>`).join("\n");
  // the scene chips are in the HTML (the script only binds them): no shift when it starts, labels readable without it
  const chips = SCENES.map((sc, i) => `          <button class="chip" type="button" data-scene="${i}" aria-pressed="${i === 0}">${s("pose_" + sc.id)}</button>`).join("\n");
  const recent = ctx.entries.slice(0, 3).map((e) => "        " + entryHtml(e, lang, 3)).join("\n");

  const main = `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-text">
        <h1>${s("hero_title")}</h1>
        <p class="lead">${s("hero_lead")}</p>
        <div class="cta">
          <a id="download-btn" class="btn primary" href="${RELEASES_URL}">
            <span>${s("download")}</span>
            <small>v${esc(ctx.version)} · ${esc(fmtDate(ctx.date, lang))}</small>
          </a>
          <!-- shown instead of the download button on phones and non-Windows computers (see app.js) -->
          <button id="share-btn" class="btn primary only-other" type="button">${s("share_btn")}</button>
          <a class="btn ghost" href="#features">${s("see_more")}</a>
        </div>
        <p id="other-os" class="note other-os only-other">
          <span>${s("other_os")}</span>
          <a id="direct-dl" href="${RELEASES_URL}">${s("direct_dl")}</a>
        </p>
        <p class="note win-note">${s("alpha_note")}</p>
        <p class="note">${s("lang_note")}</p>
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

    <!-- AT A GLANCE: the facts in plain sentences, in the HTML (no script needed) -->
    <section id="glance" class="section">
      <h2>${s("glance_title")}</h2>
      <ul class="facts">
${glance}
      </ul>
    </section>

    <!-- FEATURES -->
    <section id="features" class="section alt">
      <h2>${s("feat_title")}</h2>
      <p class="sub">${s("feat_sub")}</p>
      <div class="grid">
${features}
      </div>
    </section>

    <!-- HOW TO USE -->
    <section class="section">
      <h2>${s("use_title")}</h2>
      <table class="gestures">
        <tbody>
${gestures}
        </tbody>
      </table>
    </section>

    <!-- INSTALL -->
    <section id="install" class="section alt">
      <h2>${s("inst_title")}</h2>
      <ol class="steps">
        <li>${s("s1")}</li>
        <li>${s("s2")}</li>
        <li>${s("s3")}</li>
      </ol>
      <p class="sub">${s("inst_note")}</p>
    </section>

    <!-- PRIVACY (a summary; the full text is its own page) -->
    <section id="privacy" class="section">
      <h2>${s("priv_title")}</h2>
      <ul class="checks">
${privacy}
      </ul>
      <p><a href="${PATHS[lang].privacy}">${s("priv_more")}</a></p>
    </section>

    <!-- WHAT IT IS NOT -->
    <section id="not" class="section alt">
      <h2>${s("not_title")}</h2>
      <ul class="checks">
${notItems}
      </ul>
    </section>

    <!-- FAQ: each question is a heading-like summary, the answer starts with the direct answer -->
    <section id="faq" class="section">
      <h2>${s("faq_title")}</h2>
${faq}
    </section>

    <!-- LATEST UPDATES, from CHANGELOG.md at build time -->
    <section id="updates" class="section alt">
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

export function privacyPage(lang, ctx) {
  const s = (k) => tx(lang, k, ctx);
  const S = STRINGS[lang];
  const path = PATHS[lang].privacy;
  const sections = S.pv_sections
    .map((sec) => `      <section>\n        <h2>${esc(sec.h)}</h2>\n${sec.p.map((p) => `        <p>${esc(p)}</p>`).join("\n")}\n      </section>`).join("\n");
  const main = `
    <article class="section prose">
      <h1>${s("pv_title")}</h1>
      <p class="lead">${s("pv_lead")}</p>
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
      <p class="links"><a href="${REPO_URL}/releases.atom">${s("rss")}</a> · <a href="${PATHS.en.home}">${s("pv_back")}</a></p>
    </article>
`;
  return htmlDoc({
    lang, ctx, switchTo: { vi: PATHS.vi.home, ja: PATHS.ja.home },
    headArgs: { path: PATHS.changelog, title: raw(lang, "cl_page_title", ctx), description: raw(lang, "cl_desc", ctx) },
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
    lang, ctx, switchTo: { vi: PATHS.vi.home, ja: PATHS.ja.home },
    headArgs: { path: "/404.html", title: `${raw(lang, "nf_title", ctx)} | Streakboom`, description: raw(lang, "nf_text", ctx), noindex: true },
    main, script: false,
  });
}
