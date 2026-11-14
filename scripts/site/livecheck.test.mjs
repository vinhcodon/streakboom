// Tests of the check of the live site (ADR-0096). Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { BEACON_SRC } from "./counting.mjs";
import { checkLive, liveProblems } from "./livecheck.mjs";

const TOKEN = "0123456789abcdef0123456789abcdef";
const off = { measurement: { webAnalytics: "off" } }, auto = { measurement: { webAnalytics: "auto", excludeEu: true } }, autoBot = { measurement: { webAnalytics: "auto", excludeEu: true, allowBotScript: true } }, manual = { measurement: { webAnalytics: "manual", webAnalyticsToken: TOKEN } };
const H = (o = {}) => new Headers(o);
const page = (extra = "") => `<html><body><script type="module" src="/app.js?v=1"></script>${extra}</body></html>`;
const tag = `<script type="module" src="${BEACON_SRC}" data-cf-beacon='{"token": "${TOKEN}"}'></script>`;
const autoTag = `<script type="module" src="${BEACON_SRC}/vcc0123" data-cf-beacon='{"version":"2024"}'></script>`;

test("a clean page is clean in every mode", () => {
  assert.deepEqual(liveProblems("/", page(), H(), off), []);
  assert.deepEqual(liveProblems("/", page(autoTag), H(), auto), []);
  assert.deepEqual(liveProblems("/", page(), H(), auto), [], "auto does not require the script on every page");
  assert.deepEqual(liveProblems("/", page(tag), H(), manual), []);
});

test("what Cloudflare can add is found: a script the mode does not allow, the bot script, error reporting, a cookie, any other script", () => {
  assert.match(liveProblems("/", page(autoTag), H(), off).join(), /automatic copy of the analytics script/);
  assert.match(liveProblems("/", page(autoTag), H(), manual).join(), /automatic copy/);
  assert.match(liveProblems("/", page(tag), H(), auto).join(), /tag of manual mode is on the page/);
  assert.match(liveProblems("/", page(tag), H(), off).join(), /tag of manual mode is on the page/);
  assert.match(liveProblems("/", page("<script>var u='/cdn-cgi/challenge-platform/scripts/jsd/main.js'</script>"), H(), auto).join(), /bot-detection script/);
  assert.match(liveProblems("/", page(), H({ nel: "{}" }), auto).join(), /Network Error Logging/);
  assert.match(liveProblems("/", page(), H({ "report-to": "{}" }), auto).join(), /Network Error Logging/);
  assert.match(liveProblems("/", page(), H({ "set-cookie": "__cf_bm=1; path=/" }), auto).join(), /a cookie is set \(__cf_bm\)/);
  assert.match(liveProblems("/", page('<script src="https://stats.example.com/a.js"></script>'), H(), auto).join(), /a script from a third party/);
});

test("the bot-protection script and the cookie of Cloudflare are allowed only when measurement.json says so", () => {
  const bot = "<script>var u='/cdn-cgi/challenge-platform/scripts/jsd/main.js'</script>";
  assert.deepEqual(liveProblems("/", page(autoTag + bot), H(), autoBot), []);
  assert.match(liveProblems("/", page(bot), H(), auto).join(), /bot-detection script/);
  assert.deepEqual(liveProblems("/", page(), H({ "set-cookie": "__cf_bm=1; path=/" }), autoBot), []);
  assert.match(liveProblems("/", page(), H({ "set-cookie": "_ga=1; path=/" }), autoBot).join(), /a cookie is set \(_ga\)/);
  assert.match(liveProblems("/", page(), H({ "set-cookie": "__cf_bm=1; path=/" }), auto).join(), /a cookie is set \(__cf_bm\)/);
});

test("manual mode needs its tag on the page", () => {
  assert.match(liveProblems("/", page(), H(), manual).join(), /is not on the page/);
});

test("a page turned away is reported as not checked, not as clean; another error is a problem", async () => {
  const fake = (status) => async () => new Response("x", { status, headers: { server: "cloudflare", "cf-ray": "abc" } });
  const r = await checkLive({ origin: "https://x.example", fetchFn: fake(403), ctx: off });
  assert.equal(r.problems.length, 0);
  assert.equal(r.skipped.length, 7);
  assert.match(r.skipped[0], /answered 403 \(cloudflare\), not checked/);
  const r2 = await checkLive({ origin: "https://x.example", fetchFn: fake(500), ctx: off });
  assert.equal(r2.problems.length, 7);
  const viaCf = async () => new Response(page(), { status: 200, headers: { "cf-ray": "abc" } });
  assert.deepEqual(await checkLive({ origin: "https://x.example", fetchFn: viaCf, ctx: off }), { problems: [], skipped: [] });
  // a page that came straight from GitHub (the resolver bypassed Cloudflare) is not checked, never a pass
  const direct = await checkLive({ origin: "https://x.example", fetchFn: async () => new Response(page(), { status: 200, headers: { server: "GitHub.com" } }), ctx: off });
  assert.equal(direct.problems.length, 0);
  assert.equal(direct.skipped.length, 7);
  assert.match(direct.skipped[0], /not answered through Cloudflare \(server GitHub\.com\)/);
  // unless the site is meant to be served without the proxy
  assert.deepEqual(await checkLive({ origin: "https://x.example", fetchFn: async () => new Response(page(), { status: 200, headers: { server: "GitHub.com" } }), ctx: { measurement: { webAnalytics: "off", behindCloudflare: false } } }), { problems: [], skipped: [] });
});
