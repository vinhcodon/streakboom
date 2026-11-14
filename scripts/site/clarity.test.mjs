// Microsoft Clarity (ADR-0118): the decision, the loader run against a fake page, the switch, the words and the checks. Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";
import { CLARITY_KEY, CLARITY_SRC, clarityDecision, loaderScript } from "./clarity.mjs";
import { clarityProblems, loadMeasurement, siteParagraph } from "./counting.mjs";
import { liveProblems } from "./livecheck.mjs";

const ID = "abcd1234ef";

test("the decision: Vietnam and Japan load at once, others are asked, a no or a browser signal means none, a yes loads", () => {
  assert.equal(clarityDecision("Asia/Ho_Chi_Minh", null, false, false), "load");
  assert.equal(clarityDecision("Asia/Saigon", null, false, false), "load");
  assert.equal(clarityDecision("Asia/Tokyo", null, false, false), "load");
  assert.equal(clarityDecision("Europe/Paris", null, false, false), "ask");
  assert.equal(clarityDecision("America/New_York", null, false, false), "ask");
  assert.equal(clarityDecision("", null, false, false), "ask", "an unknown zone is asked, never loaded");
  assert.equal(clarityDecision("Europe/Paris", "yes", false, false), "load");
  assert.equal(clarityDecision("Europe/Paris", "no", false, false), "none");
  assert.equal(clarityDecision("Asia/Tokyo", "no", false, false), "none", "a no is kept everywhere");
  assert.equal(clarityDecision("Asia/Tokyo", null, true, false), "none", "Do Not Track");
  assert.equal(clarityDecision("Asia/Tokyo", "yes", false, true), "none", "Global Privacy Control wins over an earlier yes");
  assert.equal(clarityDecision("Europe/Paris", null, true, false), "none", "no notice when the browser already said no");
});

/** Run the loader against a fake page; returns what it loaded and the notice it built. */
function run({ zone, stored = null, blocked = false, dnt = null, gpc = undefined }) {
  const store = new Map(stored === null ? [] : [[CLARITY_KEY, stored]]);
  const loaded = [];
  const mk = (tag) => ({ tag, attrs: {}, children: [], listeners: {}, setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { this.children.push(c); c.parentNode = this; }, addEventListener(e, f) { this.listeners[e] = f; }, set textContent(v) { this.text = v; }, get textContent() { return this.text; } });
  const body = { children: [], appendChild(el) { this.children.push(el); el.parentNode = this; }, removeChild(el) { this.children = this.children.filter((c) => c !== el); } };
  const first = { parentNode: { insertBefore(el) { loaded.push(el.src); } } };
  const ls = blocked ? { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } } : { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
  const sandbox = { navigator: { doNotTrack: dnt, globalPrivacyControl: gpc }, localStorage: ls, Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: zone }) }) }, document: { body, createElement: mk, getElementsByTagName: () => [first] } };
  sandbox.window = sandbox;
  vm.runInNewContext(loaderScript(ID, { text: "Notice", yes: "Accept", no: "No thanks" }), sandbox);
  return { loaded, notice: body.children[0], store, body };
}

test("the loader: Vietnam and Japan load Clarity at once, with no notice; the address is the one of the project", () => {
  for (const zone of ["Asia/Ho_Chi_Minh", "Asia/Tokyo"]) { const r = run({ zone }); assert.deepEqual(r.loaded, [CLARITY_SRC + ID]); assert.equal(r.notice, undefined); }
});
test("the loader: another zone is asked first and nothing loads until Accept; Accept loads and remembers; No thanks remembers and never loads", () => {
  const r = run({ zone: "Europe/Berlin" });
  assert.deepEqual(r.loaded, [], "nothing before the answer");
  assert.ok(r.notice && r.notice.attrs.role === "region");
  const [p, yes, no] = r.notice.children;
  assert.equal(p.text, "Notice"); assert.equal(yes.text, "Accept"); assert.equal(no.text, "No thanks");
  yes.listeners.click();
  assert.deepEqual(r.loaded, [CLARITY_SRC + ID]); assert.equal(r.store.get(CLARITY_KEY), "yes"); assert.equal(r.body.children.length, 0, "the notice is gone");
  const r2 = run({ zone: "Europe/Berlin" });
  r2.notice.children[2].listeners.click();
  assert.deepEqual(r2.loaded, []); assert.equal(r2.store.get(CLARITY_KEY), "no");
  // the next page with the same answers
  assert.deepEqual(run({ zone: "Europe/Berlin", stored: "yes" }).loaded, [CLARITY_SRC + ID]);
  const again = run({ zone: "Europe/Berlin", stored: "no" }); assert.deepEqual(again.loaded, []); assert.equal(again.notice, undefined);
});
test("the loader: Do Not Track and Global Privacy Control mean nothing loads and nothing is asked; blocked storage does not throw and asks every time", () => {
  for (const o of [{ dnt: "1" }, { gpc: true }]) { const r = run({ zone: "Asia/Tokyo", ...o }); assert.deepEqual(r.loaded, []); assert.equal(r.notice, undefined); const q = run({ zone: "Europe/Berlin", ...o }); assert.equal(q.notice, undefined); }
  const b = run({ zone: "Europe/Berlin", blocked: true });
  assert.ok(b.notice, "asked, since nothing can be remembered"); assert.deepEqual(b.loaded, []);
  assert.doesNotThrow(() => b.notice.children[1].listeners.click());
  assert.deepEqual(b.loaded, [CLARITY_SRC + ID]);
  assert.deepEqual(run({ zone: "Asia/Tokyo", blocked: true }).loaded, [CLARITY_SRC + ID], "Vietnam and Japan need no storage");
});

const withClarity = (projectId) => {
  const dir = mkdtempSync(join(tmpdir(), "sb-cl-"));
  const m = { ...loadMeasurement(), clarity: { projectId } };
  writeFileSync(join(dir, "measurement.json"), JSON.stringify(m));
  process.env.STREAKBOOM_MEASUREMENT_FILE = join(dir, "measurement.json");
  try { return build({ out: join(dir, "_site") }); } finally { delete process.env.STREAKBOOM_MEASUREMENT_FILE; }
};
const tryRun = (b, mutate) => { const c = { ctx: { ...b.ctx }, pages: b.pages.map((p) => ({ ...p })), files: { ...b.files }, out: b.out }; mutate(c); return () => check(c); };

test("the switch: the repository's file has Clarity off; ids are checked", () => {
  assert.deepEqual(clarityProblems(loadMeasurement()), [], "the repository's own file is valid");
  assert.deepEqual(clarityProblems({ clarity: { projectId: "" } }), []);
  assert.deepEqual(clarityProblems({ clarity: { projectId: ID } }), []);
  assert.deepEqual(clarityProblems({}), []);
  for (const bad of ["ABCD1234EF", "abc", "abcd1234ef0000000", "ab cd", "<script>", "abcd-1234"]) assert.ok(clarityProblems({ clarity: { projectId: bad } }).length, bad);
  assert.ok(clarityProblems({ clarity: "abcd1234ef" }).length);
});

test("Clarity off: no loader, no notice, no word of it on any page; Clarity on: one loader per page, the privacy words and the sticker note say so, the search box is masked", () => {
  const off = withClarity("");
  for (const p of off.pages) assert.ok(!/clarity/i.test(p.html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/data-clarity-mask="True"/g, "")), p.path + ": nothing of Clarity when it is off");
  const on = withClarity(ID);
  for (const p of on.pages) {
    assert.equal((p.html.match(/<script id="clarity-loader">/g) || []).length, 1, p.path);
    assert.ok(p.html.includes(CLARITY_SRC) && p.html.includes(ID), p.path);
  }
  for (const [lang, path, word] of [["en", "/privacy/", "Microsoft Clarity records"], ["vi", "/vi/privacy/", "Microsoft Clarity ghi lại"], ["ja", "/ja/privacy/", "Microsoft Clarityは"]]) {
    assert.ok(on.pages.find((p) => p.path === path).html.includes(word), path);
    assert.ok(siteParagraph(lang, on.ctx).includes("_clck"), lang + ": names its cookies");
    assert.ok(!siteParagraph(lang, on.ctx).includes(lang === "en" ? "This website sets no cookies." : "\u0000"), lang + ": no longer says it sets no cookies at all");
  }
  assert.match(on.pages.find((p) => p.path === "/stickers/").html, /data-clarity-mask="True"/);
  assert.match(on.pages.find((p) => p.path === "/stickers/").html, /Microsoft Clarity runs/);
  // the loader of a page has the notice in that page's language
  assert.ok(on.pages.find((p) => p.path === "/vi/").html.includes("Đồng ý"));
  assert.ok(on.pages.find((p) => p.path === "/ja/").html.includes("同意する"));
  assert.doesNotThrow(() => check({ ctx: { ...on.ctx }, pages: on.pages, files: on.files, out: on.out }));
  assert.ok(!on.pages.some((p) => /class="consent-strip"/.test(p.html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, ""))), "the notice is not in the static HTML");
});

test("the checks refuse: a loader with another id or another address, a second loader, a missing loader, a loader while off, the words of Clarity while off", () => {
  const on = withClarity(ID), off = withClarity("");
  const home = (c) => c.pages.find((p) => p.path === "/");
  assert.throws(tryRun(on, (c) => { home(c).html = home(c).html.replace(ID, "zzzz9999zz"); }), /another project id/);
  assert.throws(tryRun(on, (c) => { home(c).html = home(c).html.replace(CLARITY_SRC, "https://evil.example/tag/"); }), /address other than/);
  assert.throws(tryRun(on, (c) => { home(c).html = home(c).html.replace("</body>", '<script id="clarity-loader">1</script></body>'); }), /2 loaders/);
  assert.throws(tryRun(on, (c) => { home(c).html = home(c).html.replace(/<script id="clarity-loader">[\s\S]*?<\/script>/, ""); }), /0 loaders/);
  assert.throws(tryRun(on, (c) => { home(c).html = home(c).html.replace("localStorage.getItem", "document.cookie;localStorage.getItem"); }), /mentions document\.cookie/);
  assert.throws(tryRun(off, (c) => { home(c).html = home(c).html.replace("</body>", '<script id="clarity-loader">1</script></body>'); }), /Clarity is off/);
  assert.throws(tryRun(off, (c) => { c.pages.find((p) => p.path === "/privacy/").html += "<p>Microsoft Clarity</p>"; }), /names Microsoft Clarity while it is off/);
});

test("the live check: the loader is on the page exactly when the switch says so", () => {
  const ctx = { measurement: { webAnalytics: "off", clarity: { projectId: ID } } };
  const hdr = { get: () => null };
  assert.ok(liveProblems("/", "<html><body></body></html>", hdr, ctx).some((p) => /loader is not on the page/.test(p)));
  assert.deepEqual(liveProblems("/", '<html><body><script id="clarity-loader">x</script></body></html>', hdr, ctx), []);
  const offCtx = { measurement: { webAnalytics: "off", clarity: { projectId: "" } } };
  assert.ok(liveProblems("/", '<html><script id="clarity-loader">x</script></html>', hdr, offCtx).some((p) => /says it is off/.test(p)));
  assert.ok(liveProblems("/", '<html><script>var s="https://www.clarity.ms/tag/x"</script></html>', hdr, offCtx).some((p) => /says it is off/.test(p)));
});
