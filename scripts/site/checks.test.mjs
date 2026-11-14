// Tests that the build's checks really catch what they are meant to catch. Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";
import { ROOT, parseChangelog } from "./facts.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FEATURE_IDS, STRINGS } from "../../site/strings.mjs";
import { HOW_FAQ } from "./pages.mjs";

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
  p.html = p.html.replaceAll("263個", "182個");
}, /does not say 263個/));
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
  for (const [path, words] of [["/", 920], ["/vi/", 1080]]) { // was 2,862 and 3,198 words before ADR-0048; English 800 to 920 and Vietnamese 950 to 1,080 for the Code signing policy (ADR-0076); Vietnamese 900 to 950 in 0.4.0 (ADR-0062: the mission lead, the adults line, the longer first sentence of the newest update)
    const h = page(c, path).html;
    assert.equal((h.match(/<article class="card">/g) || []).length, 4, `${path}: four feature lines`);
    assert.equal((h.match(/<details>/g) || []).length, 5, `${path}: five questions`);
    assert.equal((h.match(/<li><h3>Streakboom /g) || []).length, 1, `${path}: the newest update only`);
    for (const id of ["glance", "not", "privacy"]) assert.ok(!h.includes(`<section id="${id}"`), `${path}: no ${id} block`);
    const main = h.slice(h.indexOf("<main"), h.indexOf("</main>")).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ");
    assert.ok(main.split(/\s+/).filter(Boolean).length < words, `${path}: under ${words} words`);
  }
});
test("the How it works page carries every feature, the gestures and its questions", () => {
  const c = clone();
  for (const path of ["/how-it-works/", "/vi/how-it-works/", "/ja/how-it-works/"]) {
    const h = page(c, path).html;
    assert.equal((h.match(/<h3>/g) || []).length, FEATURE_IDS.length + HOW_FAQ.length, `${path}: every feature and its questions`);
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

// ADR-0054: the site follows 0.3.2
test("the fifth promise is on the home page, the top of the privacy page and in llms-full.txt, in every language", () => {
  const c = clone();
  for (const [path, word] of [["/", "keeps still and quiet"], ["/privacy/", "keeps still and quiet"], ["/vi/", "đứng yên và im lặng"], ["/vi/privacy/", "đứng yên và im lặng"], ["/ja/", "じっとして静かにしています。自分から"], ["/ja/privacy/", "じっとして静かにしています。自分から"]]) {
    assert.ok(page(c, path).html.includes(word), `${path} has the promise`);
  }
  assert.match(page(c, "/").html, /Five things you can count on/);
  assert.match(c.files["llms-full.txt"], /## What Peak promises[\s\S]*keeps still and quiet[\s\S]*## What Streakboom is not/);
  // the promise is second, in the order of the charter
  const items = [...page(c, "/").html.matchAll(/<section id="promises"[\s\S]*?<ul class="checks">([\s\S]*?)<\/ul>/g)][0][1].match(/<li>/g);
  assert.equal(items.length, 5);
});
test("climbing is a feature card, and the structured data lists every card", () => {
  const c = clone();
  const how = page(c, "/how-it-works/").html;
  assert.match(how, /<h3>🧗 Climbs on your windows<\/h3>/);
  const ld = JSON.parse(page(c, "/").html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1].replace(/\u003c/g, "<"));
  const app = ld["@graph"].find((n) => n["@type"] === "SoftwareApplication");
  assert.equal(app.featureList.length, FEATURE_IDS.length);
  assert.ok(app.featureList.includes("Climbs on your windows"));
});
test("the question about getting in the way is on the How it works page and in the structured data", () => {
  const c = clone();
  assert.match(page(c, "/how-it-works/").html, /Does Peak get in the way when I work\?/);
  assert.match(page(c, "/vi/how-it-works/").html, /Peak có làm phiền khi tôi làm việc không\?/);
  assert.match(page(c, "/ja/how-it-works/").html, /作業のじゃまになりませんか？/);
  assert.match(c.files["llms-full.txt"], /Does Peak get in the way when I work\?/);
});
test("the settings 0.3.2 retired cannot come back", () => {
  fails((c) => { const p = page(c, "/"); p.html = p.html.replace("</main>", "<p>Peak is quiet during quiet hours.</p></main>"); }, /quiet hours/);
  fails((c) => { const p = page(c, "/vi/how-it-works/"); p.html = p.html.replace("</main>", "<p>Trong giờ yên tĩnh Peak im lặng.</p></main>"); }, /quiet hours/);
  fails((c) => { const p = page(c, "/ja/"); p.html = p.html.replace("</main>", "<p>静かな時間帯は静かです。</p></main>"); }, /quiet hours/);
  fails((c) => { c.files["llms-full.txt"] = c.files["llms-full.txt"].replace("## Install", "Set the chattiness in Settings.\n\n## Install"); }, /chattiness/);
  // the night rule is on the site
  assert.match(page(clone(), "/how-it-works/").html, /at night \(23:00 to 07:00 by the clock\)/);
});
test("the privacy text says the window picture, the covered check and the short remark, and never that Peak sees the screen", () => {
  const c = clone();
  for (const [path, words] of [["/privacy/", ["coarse picture of where windows are", "on by default", "covered or not", "five numbers"]], ["/vi/privacy/", ["bức tranh thô về vị trí các cửa sổ", "bật sẵn", "bị che hay không", "năm con số"]], ["/ja/privacy/", ["ウィンドウがどこにあるかの大まかな図", "初期設定でオン", "覆われているかどうか", "5つの数値"]], ["/how-it-works/", ["coarse picture of where windows are", "under its feet"]]]) {
    for (const w of words) assert.ok(page(c, path).html.includes(w), `${path}: ${w}`);
  }
  assert.doesNotMatch(page(c, "/privacy/").html, /Peak sees/i);
});
test("a string that nothing uses stops the build", () => {
  for (const l of ["en", "vi", "ja"]) STRINGS[l].orphan_probe = "x";
  try {
    assert.throws(() => check(clone()), /"orphan_probe" is not used by any page or script/);
  } finally {
    for (const l of ["en", "vi", "ja"]) delete STRINGS[l].orphan_probe;
  }
  assert.doesNotThrow(() => check(clone()));
});

// ADR-0062: the site follows 0.4.0 (the alignment release)
test("a lonely Peak, a streak, the pet's own menu and health claims cannot come back", () => {
  const add = (html) => (c) => { const p = page(c, "/"); p.html = p.html.replace("</main>", html + "</main>"); };
  fails(add("<p>If you stay away it only gets a little lonely.</p>"), /lonely/);
  fails(add("<p>Peak keeps a streak of days.</p>"), /streak/);
  fails(add("<p>Right-click it, or the tray icon, for Settings.</p>"), /right-click menu/);
  fails(add("<p>A healing companion.</p>"), /health claim word/);
  fails(add("<p>Peak reduces anxiety.</p>"), /reduce anxiety/);
  fails(add("<p>It replaces your friends.</p>"), /replace friends/);
  fails(add("<p>Peak detects a crisis.</p>"), /detects a crisis/);
  fails(add("<p>Safe for everyone.</p>"), /safe for everyone/i);
  fails((c) => { const p = page(c, "/vi/"); p.html = p.html.replace("</main>", "<p>Chữa lành tâm hồn.</p></main>"); }, /health claim word/);
  fails((c) => { const p = page(c, "/ja/"); p.html = p.html.replace("</main>", "<p>さみしくなるだけです。</p></main>"); }, /lonely/);
  // the release notes keep what was true when they were written (they say "no streak", "no lonely state")
  assert.doesNotThrow(() => check(clone()));
});
test("the absence promise says it costs nothing, and the page says Made for adults (18+) under the download", () => {
  const c = clone();
  for (const [path, word] of [["/", "Your absence costs nothing"], ["/privacy/", "Your absence costs nothing"], ["/vi/", "Bạn vắng mặt cũng không mất gì"], ["/ja/", "離れていても何も失いません"]]) {
    assert.ok(page(c, path).html.includes(word), `${path}: ${word}`);
  }
  for (const [path, word] of [["/", "Made for adults (18+)"], ["/vi/", "Dành cho người lớn (18+)"], ["/ja/", "大人（18歳以上）向け"]]) {
    assert.ok(page(c, path).html.includes(word), `${path}: ${word}`);
  }
  assert.match(page(c, "/how-it-works/").html, /Who is Streakboom for\?/);
  assert.match(c.files["llms-full.txt"], /made for adults \(18\+\)/i);
});
test("the right click pushes, the left click pokes, and the tray icon holds the menu", () => {
  const how = page(clone(), "/how-it-works/").html;
  assert.match(how, /<th>Left-click once<\/th>/);
  assert.match(how, /<th>Right-click it<\/th><td>A push away from the pointer/);
  assert.match(how, /<th>The tray icon<\/th><td>A click shows or hides Peak/);
});
test("the research is a link to GitHub on the privacy pages, labelled as evidence, with no page of its own", () => {
  const c = clone();
  for (const path of ["/privacy/", "/vi/privacy/", "/ja/privacy/"]) assert.ok(page(c, path).html.includes("/tree/main/docs/foundation"), path);
  assert.match(page(c, "/privacy/").html, /not claims about Peak/);
  assert.match(c.files["llms-full.txt"], /evidence, not claims about Peak/);
  assert.ok(!c.pages.some((p) => /research/.test(p.path)), "no research page");
  fails((c2) => { const p = page(c2, "/vi/privacy/"); p.html = p.html.replaceAll("/tree/main/docs/foundation", "/x"); }, /no link to the research/);
});
test("the demo Peak shows a fright on a right click and says what the app does", () => {
  const js = readFileSync(join(ROOT, "site", "peak.js"), "utf8");
  assert.ok(js.includes('addEventListener("contextmenu"'));
  for (const l of ["en", "vi", "ja"]) assert.ok(STRINGS[l].cap_push, l);
});

// ADR-0065: the download button downloads the installer
test("the download buttons are the installer file of this version, in every language, with a line after the click", () => {
  const c = clone();
  const url = `https://github.com/vinhcodon/streakboom/releases/download/v${c.ctx.version}/${c.ctx.exe}`;
  for (const path of ["/", "/vi/", "/ja/"]) {
    const h = page(c, path).html;
    assert.ok(h.includes(`id="download-btn" class="btn primary" href="${url}"`), `${path}: the button`);
    assert.ok(h.includes(`id="direct-dl" href="${url}"`), `${path}: the other-computers link`);
    assert.ok(h.includes('id="dl-toast"'), `${path}: the line after the click`);
    assert.ok(h.includes('href="https://github.com/vinhcodon/streakboom/releases/latest"'), `${path}: the release page stays one link away`);
  }
  assert.ok(c.files["llms.txt"].includes(url));
  fails((c2) => { const p = page(c2, "/"); p.html = p.html.replace(`id="download-btn" class="btn primary" href="${url}"`, 'id="download-btn" class="btn primary" href="https://github.com/vinhcodon/streakboom/releases/latest"'); }, /#download-btn is not the installer link/);
});

// ADR-0069: the site follows 0.4.1
test("Auto reads the whole list of the system's languages, never the IP; the tray menu and the single Peak are said", () => {
  fails((c) => { const p = page(c, "/how-it-works/"); p.html = p.html.replace("</main>", '<p>"Auto" picks it on a Japanese Windows.</p></main>'); }, /Auto picks it on a Japanese Windows/);
  const c = clone();
  assert.match(page(c, "/how-it-works/").html, /never from your IP address or location/);
  assert.match(page(c, "/how-it-works/").html, /Starting Streakboom again never opens a second Peak/);
  assert.match(page(c, "/vi/how-it-works/").html, /không sinh thêm Peak thứ hai/);
  assert.match(page(c, "/ja/how-it-works/").html, /2匹目のPeakは出ず/);
});

// ADR-0076: the Code signing policy
test("the Code signing policy is on every home page, says nothing is signed, and the attribution waits for approval", () => {
  const c = clone();
  for (const path of ["/", "/vi/", "/ja/"]) {
    const h = page(c, path).html;
    assert.match(h, /<section id="code-signing"[\s\S]*<h2>Code signing policy<\/h2>/, path);
    assert.ok(h.includes("blob/main/CODE_SIGNING.md"), path + ": link to the policy");
    assert.ok(h.includes('href="#code-signing"'), path + ": the download area points to it");
  }
  assert.match(page(c, "/").html, /not code-signed yet/);
  assert.match(page(c, "/").html, /Vinh Codon \(@vinhcodon on GitHub\) is the author, reviewer and approver/);
  assert.ok(c.files["llms.txt"].includes("CODE_SIGNING.md"));
  fails((c2) => { const p = page(c2, "/"); p.html = p.html.replace("</main>", "<p>Free code signing provided by SignPath.io, certificate by SignPath Foundation</p></main>"); }, /attribution line before the project is approved/);
  fails((c2) => { const p = page(c2, "/vi/"); p.html = p.html.replace('<section id="code-signing"', '<section id="x"'); }, /Code signing policy section is missing/);
  fails((c2) => { const p = page(c2, "/ja/"); p.html = p.html.replace("<h2>Code signing policy</h2>", "<h2>署名ポリシー</h2>"); }, /exact term/);
  fails((c2) => { const p = page(c2, "/"); p.html = p.html.replace("Windows SmartScreen warns", "The installer is verified and Windows SmartScreen warns"); }, /claims more than is true/);
});

test("the story of Peak (ADR-0110): three pages, five voices each, the dialogue as a blockquote with its labels, the menu has four items with Story last, Install is in the footer", () => {
  const c = clone();
  for (const [path, title, labels] of [["/story/", "The story behind Peak", ["Him:", "Me:"]], ["/vi/story/", "Câu chuyện đằng sau Peak", ["Anh ấy:", "Tôi:"]], ["/ja/story/", "Peak誕生の物語", ["彼：", "わたし："]]]) {
    const h = page(c, path).html;
    assert.ok(h.includes(`<h1>${title}</h1>`), path + ": title");
    assert.equal((h.match(/<section class="voice /g) || []).length, 5, path + ": five voices");
    assert.equal((h.match(/class="voice voice-peak"/g) || []).length, 2, path + ": Peak speaks twice");
    assert.match(h, /<blockquote>/, path + ": the dialogue");
    for (const l of labels) assert.ok(h.includes(`<strong>${l}</strong>`), path + ": label " + l);
    assert.equal((h.match(/<nav aria-label="Main">[\s\S]*?<\/nav>/)[0].match(/<a /g) || []).length, 4, path + ": four menu items");
    assert.match(h, /<nav aria-label="Main">[\s\S]*href="\/(vi\/|ja\/)?story\/"[^>]*>[^<]*<\/a>\s*<\/nav>/, path + ": Story is the last item");
    assert.ok(!/<nav aria-label="Main">[\s\S]*#install[\s\S]*<\/nav>/.test(h), path + ": Install is not in the menu");
    assert.ok(/<footer[\s\S]*#install[\s\S]*<\/footer>/.test(h), path + ": Install is in the footer");
    assert.ok(!h.includes("/app.js"), path + ": no page script of the site");
  }
  assert.ok(c.files["sitemap.xml"].includes("/story/") && c.files["sitemap.xml"].includes("/vi/story/") && c.files["sitemap.xml"].includes("/ja/story/"));
  assert.ok(c.files["llms.txt"].includes("/story/"));
});
