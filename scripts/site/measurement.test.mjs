// Tests of the visit count of Cloudflare Web Analytics and of what the pages say about it (ADR-0096): three modes, off, auto and manual. Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";
import { BEACON_SRC, allowsBotScript, loadMeasurement, measurementProblems, siteParagraph, webAnalyticsOn } from "./counting.mjs";

const TOKEN = "0123456789abcdef0123456789abcdef";
const OFF = { webAnalytics: "off" }, AUTO = { webAnalytics: "auto", excludeEu: true }, MANUAL = { webAnalytics: "manual", webAnalyticsToken: TOKEN };
const withSwitch = (m, c) => {
  const dir = mkdtempSync(join(tmpdir(), "sb-wa-"));
  writeFileSync(join(dir, "measurement.json"), JSON.stringify(m));
  writeFileSync(join(dir, "counting.json"), JSON.stringify(c ?? { endpoint: "" }));
  process.env.STREAKBOOM_MEASUREMENT_FILE = join(dir, "measurement.json");
  process.env.STREAKBOOM_COUNTING_FILE = join(dir, "counting.json");
  try { return build({ out: join(dir, "_site") }); } finally { delete process.env.STREAKBOOM_MEASUREMENT_FILE; delete process.env.STREAKBOOM_COUNTING_FILE; }
};
const tryRun = (b, mutate) => { const c = { ctx: { ...b.ctx }, pages: b.pages.map((p) => ({ ...p })), files: { ...b.files }, out: b.out }; mutate(c); return () => check(c); };
const home = (c) => c.pages.find((x) => x.path === "/");

test("the switch: the repository's own file is valid; the modes and their token and EU rules", () => {
  assert.deepEqual(measurementProblems(loadMeasurement()), []);
  assert.deepEqual(measurementProblems(OFF), []);
  assert.deepEqual(measurementProblems(AUTO), []);
  assert.deepEqual(measurementProblems(MANUAL), []);
  assert.ok(measurementProblems({}).length, "no mode");
  assert.ok(measurementProblems({ webAnalytics: "on" }).length, "unknown mode");
  assert.ok(measurementProblems({ webAnalytics: "manual" }).length, "manual needs a token");
  for (const bad of ["abc", "0123456789ABCDEF0123456789ABCDEF", `${TOKEN}0`, "<script>"]) assert.ok(measurementProblems({ webAnalytics: "manual", webAnalyticsToken: bad }).length, bad);
  assert.ok(measurementProblems({ webAnalytics: "auto", webAnalyticsToken: TOKEN }).length, "a token with auto is a mistake");
  assert.ok(measurementProblems({ webAnalytics: "manual", webAnalyticsToken: TOKEN, excludeEu: true }).length, "excludeEu is only for auto");
  assert.ok(measurementProblems({ webAnalytics: "auto", excludeEu: "yes" }).length);
  assert.ok(measurementProblems({ webAnalytics: "auto", allowBotScript: "yes" }).length);
  assert.deepEqual(measurementProblems({ webAnalytics: "auto", excludeEu: true, allowBotScript: true }), []);
  assert.equal(webAnalyticsOn({ measurement: OFF }), false);
  assert.equal(webAnalyticsOn({ measurement: AUTO }), true);
});

test("off: no script from a third party on any page, and the words say so; Cloudflare delivering the site is said in every mode", () => {
  const b = withSwitch(OFF);
  for (const p of b.pages) assert.doesNotMatch(p.html, /cloudflareinsights|cdn-cgi/, p.path);
  for (const [lang, path] of [["en", "/privacy/"], ["vi", "/vi/privacy/"], ["ja", "/ja/privacy/"]]) {
    const html = b.pages.find((p) => p.path === path).html;
    assert.doesNotMatch(html, /Web Analytics/, path);
    assert.match(html, /Cloudflare/, `${path} says Cloudflare delivers the site`);
    assert.equal(siteParagraph(lang, b.ctx).includes("Web Analytics"), false);
  }
  assert.match(siteParagraph("en", b.ctx), /^This website sets no cookies\. It has no analytics\./);
});

test("auto: the build adds no script (Cloudflare does), the words name Web Analytics and say the EU is not counted; the build refuses a script of its own", () => {
  const b = withSwitch(AUTO);
  for (const p of b.pages) assert.doesNotMatch(p.html, /cloudflareinsights|cdn-cgi/, p.path);
  for (const lang of ["en", "vi", "ja"]) assert.match(siteParagraph(lang, b.ctx), /Web Analytics/);
  assert.match(siteParagraph("en", b.ctx), /European Union are not counted/);
  assert.match(b.pages.find((p) => p.path === "/stickers/").html, /counted as a visit by Cloudflare Web Analytics/);
  assert.doesNotThrow(tryRun(b, () => {}));
  assert.throws(tryRun(b, (c) => { const p = home(c); p.html = p.html.replace("</body>", `<script defer src="${BEACON_SRC}" data-cf-beacon='{"token": "${TOKEN}"}'></script></body>`); }), /a script from a third party/);
  // without the EU statement the paragraph does not say it
  const noEu = withSwitch({ webAnalytics: "auto", excludeEu: false });
  assert.doesNotMatch(siteParagraph("en", noEu.ctx), /European Union/);
});

test("manual: every page has exactly one script of the visit count, with the token, and the words name it", () => {
  const b = withSwitch(MANUAL);
  for (const p of b.pages) {
    const tags = p.html.match(/<script[^>]*beacon\.min\.js[^>]*><\/script>/g) || [];
    assert.equal(tags.length, 1, p.path);
    assert.ok(tags[0].includes(`src="${BEACON_SRC}"`) && tags[0].includes(`"token": "${TOKEN}"`), p.path);
  }
  for (const lang of ["en", "vi", "ja"]) assert.match(siteParagraph(lang, b.ctx), /Web Analytics/);
  assert.doesNotMatch(siteParagraph("en", b.ctx), /no analytics|European Union/);
  assert.doesNotThrow(tryRun(b, () => {}));
});

test("the checks refuse a page and its words apart, and any other third-party script", () => {
  const on = withSwitch(MANUAL);
  assert.throws(tryRun(on, (c) => { const p = home(c); p.html = p.html.replace(/<script defer src="[^"]*beacon[^>]*><\/script>\n?/, ""); }), /has 0 of its scripts/);
  assert.throws(tryRun(on, (c) => { const p = home(c); p.html = p.html.replace(TOKEN, "f".repeat(32)); }), /another token than measurement\.json/);
  assert.throws(tryRun(on, (c) => { const p = c.pages.find((x) => x.path === "/privacy/"); p.html = p.html.replace("Cloudflare Web Analytics", "a counter"); }), /not the one composed/);
  assert.throws(tryRun(on, (c) => { const p = home(c); p.html = p.html.replace("</body>", '<script src="https://stats.example.com/a.js"></script></body>'); }), /a script from a third party/);
  assert.throws(tryRun(on, (c) => { const p = home(c); p.html = p.html.replace("</body>", "<script>var u='/cdn-cgi/challenge-platform/scripts/jsd/main.js'</script></body>"); }), /mentions a Cloudflare script of its own/);
  const off = withSwitch(OFF);
  assert.throws(tryRun(off, (c) => { const p = home(c); p.html = p.html.replace("</body>", `<script defer src="${BEACON_SRC}" data-cf-beacon='{"token": "${TOKEN}"}'></script></body>`); }), /a script from a third party/);
  assert.throws(tryRun(off, (c) => { const p = c.pages.find((x) => x.path === "/ja/privacy/"); p.html = p.html.replace("アクセス解析も行いません。", "アクセス解析を行います。"); }), /not the one composed/);
});

test("the privacy words name Cloudflare's bot protection only when it is allowed, in three languages", () => {
  const off = withSwitch({ webAnalytics: "off" }), bot = withSwitch({ webAnalytics: "auto", excludeEu: true, allowBotScript: true });
  assert.equal(allowsBotScript(off.ctx), false);
  assert.equal(allowsBotScript(bot.ctx), true);
  assert.doesNotMatch(siteParagraph("en", off.ctx), /bot protection/);
  assert.match(siteParagraph("en", bot.ctx), /^This website sets no cookies\. The one exception is Cloudflare's own bot protection/);
  for (const lang of ["vi", "ja"]) assert.ok(siteParagraph(lang, bot.ctx).length > siteParagraph(lang, off.ctx).length, lang);
  assert.doesNotThrow(tryRun(bot, () => {}));
});
