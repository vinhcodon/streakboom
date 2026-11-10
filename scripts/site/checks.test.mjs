// Tests that the build's checks really catch what they are meant to catch. Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";
import { parseChangelog } from "./facts.mjs";
import { STRINGS } from "../../site/strings.mjs";

const PATHS_HOME = { en: "/", vi: "/vi/", ja: "/ja/" };
const r = build();
const clone = () => ({ ctx: { ...r.ctx }, pages: r.pages.map((p) => ({ ...p })), files: { ...r.files }, out: r.out });
const page = (c, path) => c.pages.find((p) => p.path === path);
const fails = (mutate, expected) => {
  const c = clone();
  mutate(c);
  assert.throws(() => check(c), (e) => expected.test(e.message), `expected the checks to fail with ${expected}`);
};

test("the real site passes", () => {
  assert.doesNotThrow(() => check(clone()));
});

test("a version that differs from tauri.conf.json", () => fails((c) => { c.ctx.version = "9.9.9"; }, /version/));
test("a JSON-LD version that is out of date", () => fails((c) => {
  const p = page(c, "/");
  p.html = p.html.replace(`"softwareVersion":"${r.ctx.version}"`, `"softwareVersion":"0.0.1"`);
}, /softwareVersion/));
test("an FAQ in JSON-LD that differs from the visible one", () => fails((c) => {
  const p = page(c, "/vi/");
  p.html = p.html.replace(/"acceptedAnswer":\{"@type":"Answer","text":"/, '"acceptedAnswer":{"@type":"Answer","text":"CHANGED ');
}, /FAQ/));
test("an hreflang that is not reciprocal", () => fails((c) => {
  const p = page(c, "/vi/privacy/");
  p.html = p.html.replace(/<link rel="alternate" hreflang="en" href="[^"]*">\n?/, "");
}, /hreflang/));
test("a missing canonical link", () => fails((c) => {
  const p = page(c, "/privacy/");
  p.html = p.html.replace(/<link rel="canonical"[^>]*>/, "");
}, /canonical/));
test("two h1 elements", () => fails((c) => {
  const p = page(c, "/changelog/");
  p.html = p.html.replace("</main>", "<h1>Another</h1></main>");
}, /h1/));
test("an image without alt text", () => fails((c) => {
  const p = page(c, "/");
  p.html = p.html.replace("</main>", '<img src="/assets/favicon-32.png"></main>');
}, /without alt/));
test("a broken internal link", () => fails((c) => {
  const p = page(c, "/");
  p.html = p.html.replace("</main>", '<a href="/no-such-page/">x</a></main>');
}, /broken internal link/));
test("a fact that is not in the static HTML", () => fails((c) => {
  const p = page(c, "/");
  p.html = p.html.replaceAll(`v${r.ctx.version}`, "v?");
}, /latest version/));
test("a retired name", () => fails((c) => {
  const p = page(c, "/");
  p.html = p.html.replace("</main>", "<p>Made by Vinh " + "Nguyen</p></main>");
}, /old display name/));
test("an unbacked claim about CPU", () => fails((c) => {
  const p = page(c, "/");
  p.html = p.html.replace("</main>", "<p>almost no CPU</p></main>");
}, /almost no CPU/));
test("a macOS promise", () => fails((c) => {
  c.files["llms.txt"] += "\nA macOS version is coming soon.\n";
}, /macOS promise/));
test("a sitemap that misses a page", () => fails((c) => {
  c.files["sitemap.xml"] = c.files["sitemap.xml"].replace(`<loc>https://streakboom.com/privacy/</loc>`, "");
}, /sitemap/));
test("an llms.txt that names another version", () => fails((c) => {
  c.files["llms.txt"] = c.files["llms.txt"].replaceAll(r.ctx.version, "0.0.0");
}, /llms\.txt/));

test("the Japanese pages are built", () => {
  const c = clone();
  for (const path of ["/ja/", "/ja/privacy/"]) {
    const p = page(c, path);
    assert.ok(p, `${path} exists`);
    assert.equal(p.lang, "ja");
    assert.match(p.html, /<html lang="ja"/);
    assert.match(p.html, /hreflang="ja"/);
  }
  const [y, m, d] = r.ctx.date.split("-").map(Number);
  assert.match(page(c, "/ja/").html, new RegExp(`${y}年${m}月${d}日`));
  assert.match(c.files["sitemap.xml"], /<loc>https:\/\/streakboom\.com\/ja\/<\/loc>/);
});
test("a Japanese page whose hreflang back-link is missing", () => fails((c) => {
  const p = page(c, "/ja/privacy/");
  p.html = p.html.replace(/<link rel="alternate" hreflang="en" href="[^"]*">\n?/, "");
}, /hreflang/));
test("a Japanese unbacked claim", () => fails((c) => {
  const p = page(c, "/ja/");
  p.html = p.html.replace("</main>", "<p>macOS版は近日公開予定です</p></main>");
}, /macOS promise in Japanese/));
test("a translation that loses a placeholder", () => {
  const saved = STRINGS.ja.glance[2];
  STRINGS.ja.glance[2] = "最新バージョン。";
  try {
    assert.throws(() => check(clone()), /placeholders/);
  } finally {
    STRINGS.ja.glance[2] = saved;
  }
});
test("a translation with a different number of list items", () => {
  const saved = STRINGS.ja.not_items;
  STRINGS.ja.not_items = saved.slice(0, 3);
  try {
    assert.throws(() => check(clone()), /not_items has 5 items/);
  } finally {
    STRINGS.ja.not_items = saved;
  }
});

test("outdated wording on a page (the left mouse button)", () => fails((c) => {
  const p = page(c, "/");
  p.html = p.html.replace("</main>", "<p>whether the left mouse button is pressed</p></main>");
}, /primary button/));
test("outdated wording in Japanese (the app is not in Japanese)", () => fails((c) => {
  const p = page(c, "/ja/");
  p.html = p.html.replace("</main>", "<p>アプリの画面とPeakのセリフは英語とベトナム語です。</p></main>");
}, /English and Vietnamese only/));
test("three brains in llms.txt", () => fails((c) => {
  c.files["llms.txt"] += "\nAn optional AI brain (Gemini, Claude or OpenAI).\n";
}, /Groq is the fourth/));
test("old wording may stay in the release notes of the changelog page", () => {
  const c = clone();
  const p = page(c, "/changelog/");
  p.html = p.html.replace("</main>", "<p>where you last clicked with the left mouse button</p></main>");
  assert.doesNotThrow(() => check(c));
});

test("a scene chip that is missing from the static HTML", () => fails((c) => {
  const p = page(c, "/");
  p.html = p.html.replace(/<button class="chip"[^>]*data-scene="3"[^>]*>[^<]*<\/button>\n?/, "");
}, /chip of scene/));
test("a language link whose accessible name does not start with its visible text", () => fails((c) => {
  const p = page(c, "/ja/");
  p.html = p.html.replace(/aria-label="EN \(English\)"/, 'aria-label="English"');
}, /accessible name/));

test("the How it works pages exist in three languages, are in the sitemap and link to each other", () => {
  const c = clone();
  for (const [path, lang] of [["/how-it-works/", "en"], ["/vi/how-it-works/", "vi"], ["/ja/how-it-works/", "ja"]]) {
    const p = page(c, path);
    assert.ok(p, `${path} exists`);
    assert.equal(p.lang, lang);
    assert.match(p.html, /hreflang="ja" href="https:\/\/streakboom\.com\/ja\/how-it-works\/"/);
    assert.match(c.files["sitemap.xml"], new RegExp(`<loc>https://streakboom\\.com${path}</loc>`));
    assert.match(page(c, PATHS_HOME[lang]).html, new RegExp(`href="${path}"`), "the home page links to it");
  }
  assert.match(c.files["llms.txt"], /how-it-works/);
});
test("a How it works page whose hreflang back-link is missing", () => fails((c) => {
  const p = page(c, "/vi/how-it-works/");
  p.html = p.html.replace(/<link rel="alternate" hreflang="en" href="[^"]*">\n?/, "");
}, /hreflang/));
test("an unbacked claim on the How it works page", () => fails((c) => {
  const p = page(c, "/how-it-works/");
  p.html = p.html.replace("</main>", "<p>A macOS version is coming soon.</p></main>");
}, /macOS promise/));

test("a feature in the structured data that is not on the page", () => fails((c) => {
  const p = page(c, "/");
  p.html = p.html.replace(/"featureList":\["([^"]*)"/, '"featureList":["A feature nobody wrote"');
}, /featureList entry/));
test("requirements in the structured data that the page does not back", () => fails((c) => {
  const p = page(c, "/ja/");
  p.html = p.html.replaceAll("WebView2", "WV2");
}, /softwareRequirements/));
test("an llms.txt that forgets the languages and brains", () => fails((c) => {
  c.files["llms.txt"] = c.files["llms.txt"].replace(/## Languages and AI brains[\s\S]*?\n\n/, "");
}, /llms\.txt: does not state/));

test("the changelog parser reads the format CHANGELOG.md promises", () => {
  const e = parseChangelog("# Changelog\r\n\r\n## 1.0.0 (2026-01-02), hi\r\n- a\r\n  wrapped\r\n- b\r\n## 0.9.0\r\n- c\r\n## notes\r\n- ignored\r\n");
  assert.deepEqual(e.map((x) => [x.version, x.date, x.title, x.items]), [["1.0.0", "2026-01-02", "hi", ["a wrapped", "b"]], ["0.9.0", "", "", ["c"]]]);
  assert.equal(parseChangelog("").length, 0);
});

test("the size budget passes on the real site and fails when exceeded", async () => {
  const { sizeProblems, BUDGET } = await import("./checks.mjs");
  assert.deepEqual(sizeProblems({ pages: r.pages, out: r.out }), []);
  const tiny = sizeProblems({ pages: r.pages, out: r.out }, { scriptsGzip: 1000, homeHtml: 1000 });
  assert.ok(tiny.some((m) => /scripts are/.test(m)), "scripts over budget");
  assert.equal(tiny.filter((m) => /of HTML/.test(m)).length, 3, "each home page over budget");
  assert.ok(BUDGET.scriptsGzip === 30 * 1024 && BUDGET.homeHtml === 60 * 1024);
});

test("a number of hand-written lines that differs from the README", () => fails((c) => {
  const p = page(c, "/ja/how-it-works/");
  p.html = p.html.replaceAll("267個", "182個");
}, /does not say 267個/));
test("a privacy page that lacks the sense under Peak's feet (README says it has it)", () => fails((c) => {
  const p = page(c, "/vi/privacy/");
  p.html = p.html.replaceAll("dưới chân nó", "ở đâu đó");
}, /under its feet/));
test("the new sense is on the privacy pages in three languages", () => {
  const c = clone();
  for (const [path, word] of [["/privacy/", "just under its feet"], ["/vi/privacy/", "dưới chân nó"], ["/ja/privacy/", "足元"]]) {
    assert.ok(page(c, path).html.includes(word), `${path} mentions it`);
  }
});

test("the changelog feed lists every version and is linked", () => {
  const c = clone();
  const feed = c.files["changelog.xml"];
  assert.match(feed, /^<\?xml/);
  for (const e of c.ctx.entries) assert.ok(feed.includes(`<title>Streakboom ${e.version}`), `entry ${e.version}`);
  assert.match(page(c, "/changelog/").html, /type="application\/atom\+xml"/);
  assert.match(c.files["llms.txt"], /changelog\.xml/);
});
test("a changelog feed that misses a version", () => fails((c) => {
  c.files["changelog.xml"] = c.files["changelog.xml"].replace(/<entry>(?:(?!<entry>)[\s\S])*?<\/entry>\n?/, "");
}, /changelog\.xml lists/));
test("a processor number on the How it works page that differs from the README", () => fails((c) => {
  const p = page(c, "/vi/how-it-works/");
  p.html = p.html.replace("9 đến 11%", "9 đến 10%");
}, /does not say 9 đến 11%/));
test("a memory number on the Japanese How it works page that differs from the README", () => fails((c) => {
  const p = page(c, "/ja/how-it-works/");
  p.html = p.html.replaceAll("100〜120MB", "90〜110MB");
}, /does not say 100〜120MB/));

// ADR-0048: the short home page, the promises, the split FAQ
test("the home page is short: four feature lines, five questions, one update, no long blocks", () => {
  const c = clone();
  for (const [path, words] of [["/", 800], ["/vi/", 900]]) { // was 2,862 and 3,198 words before ADR-0048
    const h = page(c, path).html;
    assert.equal((h.match(/<article class="card">/g) || []).length, 4, `${path}: four feature lines`);
    assert.equal((h.match(/<details>/g) || []).length, 5, `${path}: five questions`);
    assert.equal((h.match(/<li><h3>Streakboom /g) || []).length, 1, `${path}: the newest update only`);
    for (const id of ["glance", "not", "privacy"]) assert.ok(!h.includes(`<section id="${id}"`), `${path}: no ${id} block`);
    const main = h.slice(h.indexOf("<main"), h.indexOf("</main>")).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ");
    assert.ok(main.split(/\s+/).filter(Boolean).length < words, `${path}: under ${words} words`);
  }
});
test("the How it works page carries all nine features, the gestures and the other five questions", () => {
  const c = clone();
  for (const path of ["/how-it-works/", "/vi/how-it-works/", "/ja/how-it-works/"]) {
    const h = page(c, path).html;
    assert.equal((h.match(/<h3>/g) || []).length, 9 + 5, `${path}: nine features and five questions`);
    assert.ok(h.includes('<table class="gestures">'), `${path}: the gestures`);
    assert.ok(h.includes('"@type":"FAQPage"'), `${path}: its own FAQPage`);
  }
});
test("a promise that is missing from the home page", () => fails((c) => {
  const p = page(c, "/ja/");
  p.html = p.html.replace("入力した内容も、画面に映っているものも、決して読みません。", "入力した内容は読みません。");
}, /the promise pr1 is not on the page/));
test("a promise that is missing from the top of the privacy page", () => fails((c) => {
  const p = page(c, "/privacy/");
  p.html = p.html.replace("It works without AI, and if you add a brain the key is yours.", "It works.");
}, /the promise pr3 is not on the page/));
test("a home page without the link to the charter", () => fails((c) => {
  const p = page(c, "/vi/");
  p.html = p.html.replace(/<a href="https:\/\/github\.com\/[^"]*\/docs\/charter\.md">/, '<a href="#">');
}, /there is no link to the charter/));
test("a FAQ answer that is not short", () => fails((c) => {
  const p = page(c, "/");
  const long = "word ".repeat(120);
  const html = p.html.replace(/(<summary><h3>Is it really free\?<\/h3><\/summary><p>)/, `$1${long}`);
  p.html = html;
  // the JSON-LD must still say the same, so it fails on length first and on the mismatch too
}, /keep FAQ answers short/));
