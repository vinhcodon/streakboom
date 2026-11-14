// The language suggestion (ADR-0067): the pure choice, the inline script run against a fake page, and the rules the build keeps.
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";
import { LANG_KEY, inlineScript, pickSuggestion, wantedLanguage } from "./langsuggest.mjs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const A = ["en", "vi", "ja"];
test("the first language of the list that the site has decides; the page's own language and a closed one suggest nothing", () => {
  assert.equal(pickSuggestion(["vi-VN"], "en", [], A), "vi");
  assert.equal(pickSuggestion(["ja"], "en", [], A), "ja");
  assert.equal(pickSuggestion(["en-US", "vi"], "en", [], A), null, "English first: nothing on the English page");
  assert.equal(pickSuggestion(["en-US", "vi"], "vi", [], A), "en", "English first on a Vietnamese page: offer English");
  assert.equal(pickSuggestion(["fr-FR", "vi"], "en", [], A), "vi", "a language the site lacks is skipped");
  assert.equal(pickSuggestion(["fr", "de"], "en", [], A), null, "no language the site has");
  assert.equal(pickSuggestion([], "en", [], A), null);
  assert.equal(pickSuggestion(["vi"], "vi", [], A), null, "already on that page");
  assert.equal(pickSuggestion(["VI-vn"], "en", [], A), "vi", "case does not matter");
  assert.equal(pickSuggestion(["vi"], "en", ["vi"], A), null, "closed or followed before");
  assert.equal(pickSuggestion(["vi"], "ja", ["vi"], A), null);
  assert.equal(pickSuggestion(["ja"], "en", ["vi"], A), "ja", "another language was closed, not this one");
});

/** Run the page's inline script against a minimal fake page and return what it did. */
function run({ languages, pageLang = "en", stored = null, blocked = false }) {
  const targets = { vi: { href: "/vi/privacy/", text: "Xem bằng tiếng Việt?", close: "Đóng" }, ja: { href: "/ja/privacy/", text: "日本語で見ますか？", close: "閉じる" } };
  if (pageLang !== "en") targets.en = { href: "/privacy/", text: "View in English?", close: "Close" };
  const store = new Map(stored === null ? [] : [[LANG_KEY, stored]]);
  const body = { children: [], insertBefore(el, first) { this.children.unshift(el); el.parentNode = this; }, firstChild: null, removeChild(el) { this.children = this.children.filter((c) => c !== el); } };
  const make = (tag) => { const el = { tag, attrs: {}, children: [], listeners: {}, setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { this.children.push(c); c.parentNode = this; }, addEventListener(t, f) { this.listeners[t] = f; } }; return el; };
  const ls = blocked ? { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } } : { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
  const root = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  const sandbox = { navigator: { languages, language: languages[0] }, localStorage: ls, document: { body, createElement: make, documentElement: root } };
  vm.runInNewContext(inlineScript(pageLang, targets), sandbox);
  return { strip: body.children[0], store, body, root };
}

test("the script builds the strip for a Vietnamese browser on an English page, and nothing for an English browser", () => {
  const r = run({ languages: ["vi-VN", "en"] });
  assert.ok(r.strip, "a strip");
  assert.equal(r.strip.attrs.lang, "vi");
  const [a, b] = r.strip.children;
  assert.equal(a.textContent, "Xem bằng tiếng Việt?");
  assert.equal(a.href, "/vi/privacy/");
  assert.equal(b.attrs["aria-label"], "Đóng");
  assert.equal(run({ languages: ["en-US"] }).strip, undefined);
  assert.equal(run({ languages: [] }).strip, undefined);
});

test("the strip shows ONCE: the language is remembered as soon as it is shown; closing or following changes nothing more; broken storage does not throw", () => {
  const r = run({ languages: ["ja"] });
  assert.ok(r.strip, "shown");
  assert.deepEqual(JSON.parse(r.store.get(LANG_KEY)), ["ja"], "remembered at once, without a click");
  const [a, b] = r.strip.children;
  b.listeners.click();
  assert.equal(r.body.children.length, 0, "closing removes the strip");
  assert.deepEqual(JSON.parse(r.store.get(LANG_KEY)), ["ja"]);
  a.listeners.click();
  assert.deepEqual(JSON.parse(r.store.get(LANG_KEY)), ["ja"], "following adds nothing twice");
  // the next page, or the next visit, with the same storage: nothing
  assert.equal(run({ languages: ["ja"], stored: r.store.get(LANG_KEY) }).strip, undefined);
  assert.equal(run({ languages: ["ja"], stored: '["ja"]' }).strip, undefined);
  assert.ok(run({ languages: ["ja"], stored: "not json" }).strip, "a damaged list is ignored");
  assert.ok(run({ languages: ["ja"], blocked: true }).strip, "blocked storage: the strip still shows");
  assert.doesNotThrow(() => run({ languages: ["ja"], blocked: true }).strip.children[1].listeners.click());
  // another language is still offered once
  const two = run({ languages: ["vi", "ja"], stored: '["vi"]' });
  assert.equal(two.strip, undefined, "the first language of the list decides, and it was shown");
  // a page in Vietnamese offers English to an English browser
  assert.equal(run({ languages: ["en"], pageLang: "vi" }).strip.attrs.lang, "en");
});

test("the button of the language the browser asks for is marked on the page, even after the strip was shown, and not when the page is in that language", () => {
  assert.equal(wantedLanguage(["vi-VN"], "en", A), "vi");
  assert.equal(wantedLanguage(["en-US", "vi"], "vi", A), "en");
  assert.equal(wantedLanguage(["en-US", "vi"], "en", A), null, "the page is in that language");
  assert.equal(wantedLanguage(["fr", "de"], "en", A), null);
  assert.equal(wantedLanguage([], "en", A), null);
  assert.equal(run({ languages: ["vi"] }).root.attrs["data-want"], "vi");
  assert.equal(run({ languages: ["vi"], stored: '["vi"]' }).root.attrs["data-want"], "vi", "still marked after it was shown (the strip is not)");
  assert.equal(run({ languages: ["en-US"] }).root.attrs["data-want"], undefined);
  assert.equal(run({ languages: ["vi"], pageLang: "vi" }).root.attrs["data-want"], undefined);
});

test("the build keeps the rules of the suggestion", () => {
  const b = build({ out: join(mkdtempSync(join(tmpdir(), "ls-")), "_site") });
  const go = (mutate) => { const c = { ctx: b.ctx, pages: b.pages.map((p) => ({ ...p })), files: { ...b.files }, out: b.out }; mutate(c); return () => check(c); };
  const page = (c, path) => c.pages.find((p) => p.path === path);
  assert.doesNotThrow(go(() => {}));
  assert.throws(go((c) => { const p = page(c, "/privacy/"); p.html = p.html.replace('<script id="lang-suggest">', "<script>"); }), /suggestion script is missing/);
  assert.throws(go((c) => { const p = page(c, "/"); p.html = p.html.replace("</body>", '<div class="lang-strip">x</div></body>'); }), /in the static HTML/);
  assert.throws(go((c) => { const p = page(c, "/vi/"); p.html = p.html.replace("navigator.languages&&", "fetch('/x');navigator.languages&&"); }), /mentions fetch/);
  assert.throws(go((c) => { const p = page(c, "/ja/"); p.html = p.html.replace("var l=pick(", "location.replace('/vi/');var l=pick("); }), /mentions location\.replace/);
  assert.throws(go((c) => { const p = page(c, "/how-it-works/"); p.html = p.html.replace('"href":"/vi/how-it-works/"', '"href":"/vi/"'); }), /does not lead to the same page/);
  assert.throws(go((c) => { const p = page(c, "/changelog/"); p.html = p.html.replace("</head>", '<script id="lang-suggest"></script></head>'); }), /English-only page must not offer/);
  // no suggestion on the English-only pages in the real build
  assert.ok(!page({ pages: b.pages }, "/changelog/").html.includes("lang-suggest"));
  assert.ok(!page({ pages: b.pages }, "/404.html").html.includes("lang-suggest"));
});
