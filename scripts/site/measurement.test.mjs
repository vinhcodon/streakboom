// Tests of the visit count of Cloudflare Web Analytics and of what the pages say about it (ADR-0096). Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";
import { BEACON_SRC, loadMeasurement, measurementProblems, siteParagraph, webAnalyticsOn } from "./counting.mjs";

const TOKEN = "0123456789abcdef0123456789abcdef";
const withSwitch = (m, c) => {
  const dir = mkdtempSync(join(tmpdir(), "sb-wa-"));
  writeFileSync(join(dir, "measurement.json"), JSON.stringify(m));
  writeFileSync(join(dir, "counting.json"), JSON.stringify(c ?? { endpoint: "" }));
  process.env.STREAKBOOM_MEASUREMENT_FILE = join(dir, "measurement.json");
  process.env.STREAKBOOM_COUNTING_FILE = join(dir, "counting.json");
  try { return build({ out: join(dir, "_site") }); } finally { delete process.env.STREAKBOOM_MEASUREMENT_FILE; delete process.env.STREAKBOOM_COUNTING_FILE; }
};
const tryRun = (b, mutate) => { const c = { ctx: { ...b.ctx }, pages: b.pages.map((p) => ({ ...p })), files: { ...b.files }, out: b.out }; mutate(c); return () => check(c); };

test("the switch: the repository's own file is valid; a token is empty or 32 hex characters", () => {
  assert.deepEqual(measurementProblems(loadMeasurement()), []);
  assert.deepEqual(measurementProblems({ webAnalyticsToken: "" }), []);
  assert.deepEqual(measurementProblems({ webAnalyticsToken: TOKEN }), []);
  for (const bad of ["abc", "0123456789ABCDEF0123456789ABCDEF", `${TOKEN}0`, "<script>"]) assert.ok(measurementProblems({ webAnalyticsToken: bad }).length, bad);
  assert.ok(measurementProblems({}).length);
  assert.equal(webAnalyticsOn({ measurement: { webAnalyticsToken: "" } }), false);
});

test("off: no script from a third party on any page, and the words say so; Cloudflare delivering the site is said either way", () => {
  const b = withSwitch({ webAnalyticsToken: "" });
  for (const p of b.pages) assert.doesNotMatch(p.html, /cloudflareinsights|cdn-cgi/, p.path);
  for (const [lang, path] of [["en", "/privacy/"], ["vi", "/vi/privacy/"], ["ja", "/ja/privacy/"]]) {
    const html = b.pages.find((p) => p.path === path).html;
    assert.doesNotMatch(html, /Web Analytics/, path);
    assert.match(html, /Cloudflare/, `${path} says Cloudflare delivers the site`);
    assert.equal(siteParagraph(lang, b.ctx).includes("Web Analytics"), false);
  }
  assert.match(siteParagraph("en", b.ctx), /^This website sets no cookies\. It has no analytics\./);
});

test("on: every page has exactly one script of the visit count, with the token, and the words name it", () => {
  const b = withSwitch({ webAnalyticsToken: TOKEN });
  for (const p of b.pages) {
    const tags = p.html.match(/<script[^>]*beacon\.min\.js[^>]*><\/script>/g) || [];
    assert.equal(tags.length, 1, p.path);
    assert.ok(tags[0].includes(`src="${BEACON_SRC}"`) && tags[0].includes(`"token": "${TOKEN}"`), p.path);
  }
  for (const lang of ["en", "vi", "ja"]) assert.match(siteParagraph(lang, b.ctx), /Web Analytics/);
  assert.doesNotMatch(siteParagraph("en", b.ctx), /no analytics/);
  const sticker = b.pages.find((p) => p.path === "/stickers/").html;
  assert.match(sticker, /counted as a visit by Cloudflare Web Analytics/);
  assert.doesNotThrow(tryRun(b, () => {}));
});

test("the checks refuse a page and its words apart, and any other third-party script", () => {
  const on = withSwitch({ webAnalyticsToken: TOKEN });
  assert.throws(tryRun(on, (c) => { const p = c.pages.find((x) => x.path === "/"); p.html = p.html.replace(/<script defer src="[^"]*beacon[^>]*><\/script>\n?/, ""); }), /has 0 of its scripts/);
  assert.throws(tryRun(on, (c) => { const p = c.pages.find((x) => x.path === "/"); p.html = p.html.replace(TOKEN, "f".repeat(32)); }), /another token than measurement\.json/);
  assert.throws(tryRun(on, (c) => { const p = c.pages.find((x) => x.path === "/privacy/"); p.html = p.html.replace("Cloudflare Web Analytics", "a counter"); }), /not the one composed/);
  assert.throws(tryRun(on, (c) => { const p = c.pages.find((x) => x.path === "/"); p.html = p.html.replace("</body>", '<script src="https://stats.example.com/a.js"></script></body>'); }), /a script from a third party/);
  assert.throws(tryRun(on, (c) => { const p = c.pages.find((x) => x.path === "/"); p.html = p.html.replace("</body>", "<script>var u='/cdn-cgi/challenge-platform/scripts/jsd/main.js'</script></body>"); }), /mentions a Cloudflare script of its own/);
  const off = withSwitch({ webAnalyticsToken: "" });
  assert.throws(tryRun(off, (c) => { const p = c.pages.find((x) => x.path === "/"); p.html = p.html.replace("</body>", `<script defer src="${BEACON_SRC}" data-cf-beacon='{"token": "${TOKEN}"}'></script></body>`); }), /a script from a third party/);
  assert.throws(tryRun(off, (c) => { const p = c.pages.find((x) => x.path === "/ja/privacy/"); p.html = p.html.replace("アクセス解析も行いません。", "アクセス解析を行います。"); }), /not the one composed/);
});
