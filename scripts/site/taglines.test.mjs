// Tests of the slogan under the name and of the taglines of the home page (ADR-0104). Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { STRINGS, LANGS } from "../../site/strings.mjs";
import { DEFAULT_TAGLINE, FORBIDDEN_IN_SCRIPT, TAGLINE_KEYS, taglineScript } from "./taglines.mjs";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";

const out = join(mkdtempSync(join(tmpdir(), "sb-tg-")), "_site");
const b = build({ out });
const run = (mutate) => { const c = { ctx: { ...b.ctx }, pages: b.pages.map((p) => ({ ...p })), files: { ...b.files }, out: b.out }; mutate(c); return () => check(c); };
const home = (c, path = "/") => c.pages.find((p) => p.path === path);

test("twelve taglines in each language, none twice, and the default is one of them", () => {
  assert.equal(TAGLINE_KEYS.length, 12);
  assert.ok(TAGLINE_KEYS.includes(DEFAULT_TAGLINE));
  for (const lang of LANGS) {
    const list = TAGLINE_KEYS.map((k) => STRINGS[lang][k]);
    assert.ok(list.every((t) => typeof t === "string" && t.length > 8), lang);
    assert.equal(new Set(list).size, 12, lang);
  }
});

test("the slogan is under the name on every page, outside the link, and the home page has the default in the HTML and the list in a script", () => {
  for (const p of b.pages.filter((x) => !/changelog|404/.test(x.path))) {
    const lang = p.lang;
    assert.match(p.html, /<span class="brand-slogan">/, p.path);
    assert.ok(p.html.includes(STRINGS[lang].brand_slogan.replace(/'/g, "&#39;")) || p.html.includes(STRINGS[lang].brand_slogan), p.path);
    assert.match(p.html, /<a class="brand-name" href="[^"]*">Streakboom<\/a>/, `${p.path}: the name of the link stays Streakboom`);
  }
  for (const [lang, path] of [["en", "/"], ["vi", "/vi/"], ["ja", "/ja/"]]) {
    const html = home(b, path).html;
    assert.ok(html.includes(`<span id="tagline">`), path);
    const m = html.match(/<script id="tagline-script">([\s\S]*?)<\/script>/);
    assert.ok(m, path);
    for (const w of FORBIDDEN_IN_SCRIPT) assert.ok(!m[1].includes(w), `${path} mentions ${w}`);
    assert.equal(m[1], taglineScript(TAGLINE_KEYS.map((k) => STRINGS[lang][k])), path);
  }
});

test("the script picks one of the list and touches nothing else", () => {
  const list = ["one", "two", "three"];
  const code = taglineScript(list);
  const el = { textContent: "default" };
  const picked = new Set();
  for (let i = 0; i < 200; i++) { el.textContent = "default"; new Function("document", code)({ getElementById: (id) => (id === "tagline" ? el : null) }); picked.add(el.textContent); }
  assert.deepEqual([...picked].sort(), ["one", "three", "two"]);
  // a page without the element does nothing and does not fail
  assert.doesNotThrow(() => new Function("document", code)({ getElementById: () => null }));
  // a tagline cannot close the script
  assert.ok(!taglineScript(["</script><b>"]).includes("</script>"));
});

test("the checks refuse a missing slogan, a script with a timer or storage, a list that is not the strings, and a default that is not the default", () => {
  assert.doesNotThrow(run(() => {}));
  assert.throws(run((c) => { const p = home(c, "/stickers/"); p.html = p.html.replace(/<span class="brand-slogan">[^<]*<\/span>/, ""); }), /the slogan under the name is missing/);
  assert.throws(run((c) => { const p = home(c); p.html = p.html.replace("(function(){var T=", "(function(){setInterval(function(){},9);var T="); }), /mentions setInterval/);
  assert.throws(run((c) => { const p = home(c); p.html = p.html.replace("(function(){var T=", "(function(){localStorage.setItem(1,2);var T="); }), /mentions localStorage/);
  assert.throws(run((c) => { const p = home(c); p.html = p.html.replace(/var T=\["[^"]*"/, 'var T=["changed"'); }), /the list in the script is not the list of the strings/);
  assert.throws(run((c) => { const p = home(c); p.html = p.html.replace(/<span id="tagline">[^<]*<\/span>/, '<span id="tagline">another</span>'); }), /the tagline in the HTML is not the default/);
});
