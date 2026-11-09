// Tests that the build's checks really catch what they are meant to catch. Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";
import { parseChangelog } from "./facts.mjs";

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

test("the changelog parser reads the format CHANGELOG.md promises", () => {
  const e = parseChangelog("# Changelog\r\n\r\n## 1.0.0 (2026-01-02), hi\r\n- a\r\n  wrapped\r\n- b\r\n## 0.9.0\r\n- c\r\n## notes\r\n- ignored\r\n");
  assert.deepEqual(e.map((x) => [x.version, x.date, x.title, x.items]), [["1.0.0", "2026-01-02", "hi", ["a wrapped", "b"]], ["0.9.0", "", "", ["c"]]]);
  assert.equal(parseChangelog("").length, 0);
});
