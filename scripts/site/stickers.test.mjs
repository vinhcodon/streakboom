// Tests of the sticker pages and the short menu (ADR-0051, ADR-0053). Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";
import { STICKER_DIR, fontNames, loadStickers, needsReviewNote, stickerUrl } from "./stickers.mjs";

const tmp = () => mkdtempSync(join(tmpdir(), "sb-st-"));
const real = loadStickers();
const out = join(tmp(), "_site");
const r = build({ out });
const clone = () => ({ ctx: { ...r.ctx }, pages: r.pages.map((p) => ({ ...p })), files: { ...r.files }, out: r.out });
const page = (c, path) => c.pages.find((p) => p.path === path);
const fails = (mutate, expected) => {
  const c = clone();
  mutate(c);
  assert.throws(() => check(c), (e) => expected.test(e.message), `expected the checks to fail with ${expected}`);
};
const copySet = () => {
  const dir = join(tmp(), "set-v1");
  cpSync(STICKER_DIR, dir, { recursive: true });
  return dir;
};

test("the real set loads, and the count and the order come from the manifest", () => {
  assert.ok(real.stickers.length > 0);
  for (const lang of ["en", "vi", "ja"]) {
    const html = page(clone(), { en: "/stickers/", vi: "/vi/stickers/", ja: "/ja/stickers/" }[lang]).html;
    const ids = [...html.matchAll(/<button class="sticker"[^>]*data-id="([^"]*)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, real.stickers.map((s) => s.id), `${lang}: the manifest's order`);
    assert.equal((html.match(/<img src="\/assets\/stickers\//g) || []).length, real.stickers.length);
  }
});

test("each page uses the images of its own language, with the manifest's alt and a real title as text", () => {
  const c = clone();
  const en = page(c, "/stickers/").html;
  const ja = page(c, "/ja/stickers/").html;
  assert.ok(en.includes(`src="${stickerUrl("en", real.stickers[0].id)}"`) && !en.includes("/assets/stickers/ja/"));
  assert.ok(ja.includes(`src="${stickerUrl("ja", real.stickers[0].id)}"`) && !ja.includes("/assets/stickers/en/"));
  assert.ok(en.includes(`<span class="sticker-title">${real.stickers[0].title.en}</span>`));
  assert.ok(ja.includes(real.stickers[0].alt.ja.slice(0, 12)));
});

test("the picture is a real <img> inside a real <button>, labelled, with width and height", () => {
  const html = page(clone(), "/stickers/").html;
  assert.match(html, /<button class="sticker" type="button" data-id="01" data-title="[^"]+" aria-label="Copy sticker [^"]+"><img src="\/assets\/stickers\/en\/01\.png" width="360" height="360" alt="[^"]+"><span class="paw" aria-hidden="true"><\/span><\/button>/);
  assert.match(html, /loading="lazy"/); // below the first row
  assert.match(page(clone(), "/vi/stickers/").html, /aria-label="Chép sticker /);
});

test("the AI note shows on the pages whose words nobody has read, and goes when the manifest says reviewed", () => {
  const c = clone();
  assert.equal(needsReviewNote(real, "vi"), page(c, "/vi/stickers/").html.includes("do AI viết"));
  for (const [lang, path] of [["en", "/stickers/"], ["ja", "/ja/stickers/"]]) {
    assert.equal(needsReviewNote(real, lang), page(c, path).html.includes('class="note">' + (lang === "en" ? "The words on these stickers were written by an AI" : "このステッカーの文字はAIが書いた")));
  }
  // a set where every flag is true: no note, and the checks still pass
  const dir = copySet();
  const m = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  for (const st of m.stickers) st.reviewed = { vi: true, en: true, ja: true };
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(m));
  const reviewed = build({ out: join(tmp(), "_site"), stickerDir: dir });
  for (const p of reviewed.pages.filter((p) => p.path.includes("stickers"))) assert.ok(!p.html.includes('class="note">The words on these') && !p.html.includes("do AI viết"), p.path);
});

test("the structured data: an ImageGallery of ImageObjects with the licence and the creator", () => {
  const html = page(clone(), "/stickers/").html;
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1].replace(/\\u003c/g, "<"));
  const gallery = ld["@graph"].find((n) => n["@type"] === "ImageGallery");
  assert.equal(gallery.license, "https://creativecommons.org/licenses/by/4.0/");
  assert.equal(gallery.creator.name, "Streakboom");
  assert.equal(gallery.hasPart.length, real.stickers.length);
  assert.ok(gallery.hasPart.every((o) => o["@type"] === "ImageObject" && o.license === gallery.license && o.contentUrl.startsWith("https://streakboom.com/assets/stickers/en/")));
});

test("the pages are in the sitemap, linked by hreflang, in llms.txt and llms-full.txt", () => {
  const c = clone();
  for (const path of ["/stickers/", "/vi/stickers/", "/ja/stickers/"]) {
    assert.match(c.files["sitemap.xml"], new RegExp(`<loc>https://streakboom\\.com${path}</loc>`));
    assert.match(page(c, path).html, /hreflang="ja" href="https:\/\/streakboom\.com\/ja\/stickers\/"/);
  }
  assert.match(c.files["llms.txt"], /\/stickers\//);
  assert.match(c.files["llms-full.txt"], new RegExp(`${real.stickers.length} free stickers`));
  assert.doesNotMatch(c.files["llms-full.txt"], /Zalo sticker|Telegram sticker/i);
});

test("the header menu has four links and the rest is in the footer", () => {
  const c = clone();
  for (const p of c.pages.filter((p) => p.path !== "/404.html")) {
    const nav = p.html.match(/<nav aria-label="Main">([\s\S]*?)<\/nav>/)[1];
    assert.equal((nav.match(/<a /g) || []).length, 4, p.path);
  }
  const foot = page(c, "/").html.match(/<footer[\s\S]*?<\/footer>/)[0];
  for (const word of ["GitHub", "FAQ", "Changelog", "Report a bug", "Atom"]) assert.ok(foot.includes(word), `the footer has ${word}`);
});

test("a manifest with a missing image, a missing text or another licence stops the build", () => {
  const dir = copySet();
  const m = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const write = (x) => writeFileSync(join(dir, "manifest.json"), JSON.stringify(x));
  const mutated = (fn) => { const x = structuredClone(m); fn(x); write(x); return () => loadStickers(dir); };
  assert.throws(mutated((x) => { x.stickers[0].id = "99"; }), /99\/?\.png|99\.png does not exist/);
  assert.throws(mutated((x) => { delete x.stickers[1].alt.ja; }), /no alt in ja/);
  assert.throws(mutated((x) => { x.license = "CC0"; }), /the licence is "CC0"/);
  assert.throws(mutated((x) => { x.credits = x.credits.filter((c) => !c.langs.includes("ja")); }), /no font credit for ja/);
  assert.throws(mutated((x) => { x.stickers.push(structuredClone(x.stickers[0])); }), /listed twice/);
  assert.throws(mutated((x) => { delete x.stickers[0].reviewed.en; }), /no reviewed flag for en/);
  write(m);
  assert.doesNotThrow(() => loadStickers(dir));
  assert.match(fontNames(real, "ja"), /M PLUS/);
});

test("a sticker page that breaks what the author asked for", () => {
  fails((c) => { const p = page(c, "/stickers/"); p.html = p.html.replace(/<li class="sticker-item">.*?<\/li>\n?/s, ""); }, /sticker buttons, the manifest has/);
  fails((c) => { const p = page(c, "/ja/stickers/"); p.html = p.html.replaceAll("/assets/stickers/ja/", "/assets/stickers/vi/"); }, /not the image of its language/);
  fails((c) => { const p = page(c, "/stickers/"); p.html = p.html.replace(/<a href="https:\/\/creativecommons\.org\/licenses\/by\/4\.0\/">CC BY 4\.0<\/a>/, "CC BY 4.0"); }, /no link to the CC BY 4\.0 licence/);
  fails((c) => { const p = page(c, "/stickers/"); p.html = p.html.replace('<button class="sticker"', '<a download href="/assets/stickers/en/01.png">Download</a><button class="sticker"'); }, /a download or a ZIP/);
  fails((c) => { const p = page(c, "/vi/stickers/"); p.html = p.html.replace("</main>", '<p><a href="/assets/all.zip">Tải cả bộ</a></p></main>'); }, /a download or a ZIP/);
  fails((c) => { const p = page(c, "/stickers/"); p.html = p.html.replace("</body>", '<script src="https://stats.example.com/a.js"></script></body>'); }, /a script from outside the site/);
  fails((c) => { const p = page(c, "/stickers/"); p.html = p.html.replace("</main>", "<p>Peak sticker pack for Zalo: Zalo stickers!</p></main>"); }, /Zalo or Telegram sticker claim/);
  fails((c) => { const p = page(c, "/stickers/"); p.html = p.html.replace(/<script type="application\/ld\+json">.*?<\/script>/s, ""); }, /no ImageGallery/);
  fails((c) => { const p = page(c, "/ja/stickers/"); p.html = p.html.replace(/<p class="note">このステッカーの文字は[^<]*<\/p>/, ""); }, /note that the words were written by an AI/);
  fails((c) => { const p = page(c, "/"); p.html = p.html.replace("</nav>", '<a href="/x/">more</a></nav>'); }, /the menu has 5 links/);
  fails((c) => { c.files["llms.txt"] = c.files["llms.txt"].replaceAll("/stickers/", "/s/"); }, /llms\.txt does not mention the sticker page/);
});

test("the page script records nothing, and no rule blocks the system menu on a picture", () => {
  const dir = join(tmp(), "_site");
  const b = build({ out: dir });
  const run = () => check({ ctx: b.ctx, pages: b.pages, files: b.files, out: b.out });
  assert.doesNotThrow(run);
  const js = join(dir, "stickers.js");
  const css = join(dir, "style.css");
  const js0 = readFileSync(js, "utf8");
  const css0 = readFileSync(css, "utf8");
  try {
    writeFileSync(js, js0 + "\nlocalStorage.setItem('x', 1);\n");
    assert.throws(run, /localStorage is only for the recent-stickers list/);
    writeFileSync(js, js0 + "\nsessionStorage.setItem('x', 1);\n");
    assert.throws(run, /stickers\.js mentions sessionStorage/);
    writeFileSync(js, js0.replace("COPY_PX = 128", "COPY_PX = 360"));
    assert.throws(run, /no longer 128 px/);
    writeFileSync(js, js0);
    writeFileSync(css, css0 + "\n.sticker img { -webkit-touch-callout: none; }\n");
    assert.throws(run, /blocks the system menu on a sticker/);
    writeFileSync(css, css0 + "\n.sticker img { pointer-events: none; }\n");
    assert.throws(run, /blocks the system menu on a sticker/);
    writeFileSync(css, css0 + "\n.sticker img { user-select: none; }\n");
    assert.throws(run, /blocks the system menu on a sticker/);
  } finally {
    writeFileSync(js, js0);
    writeFileSync(css, css0);
  }
  assert.doesNotThrow(run);
});

test("the sitemap lists every picture of each sticker page, and the sticker pages share their own preview picture", () => {
  const c = clone();
  for (const lang of ["en", "vi", "ja"]) {
    const path = { en: "/stickers/", vi: "/vi/stickers/", ja: "/ja/stickers/" }[lang];
    const block = c.files["sitemap.xml"].split("<url>").find((u) => u.includes(`<loc>https://streakboom.com${path}</loc>`));
    const listed = [...block.matchAll(/<image:loc>([^<]*)<\/image:loc>/g)].map((m) => m[1]);
    assert.deepEqual(listed, real.stickers.map((s) => `https://streakboom.com${stickerUrl(lang, s.id)}`));
    const html = page(c, path).html;
    assert.match(html, /<meta property="og:image" content="https:\/\/streakboom\.com\/assets\/sticker-preview\.png">/);
    assert.match(html, /<meta name="twitter:card" content="summary">/);
  }
  assert.match(c.files["sitemap.xml"], /xmlns:image=/);
  assert.match(page(c, "/").html, /og:image" content="https:\/\/streakboom\.com\/assets\/og-image\.jpg"/); // the other pages keep the site's picture
  assert.match(page(c, "/").html, /twitter:card" content="summary_large_image"/);
});
test("a sitemap that forgets a sticker picture", () => fails((c) => {
  c.files["sitemap.xml"] = c.files["sitemap.xml"].replace(/<image:image><image:loc>[^<]*\/assets\/stickers\/vi\/[^<]*<\/image:loc><\/image:image>\n/, "");
}, /the pictures of \/vi\/stickers\//));
