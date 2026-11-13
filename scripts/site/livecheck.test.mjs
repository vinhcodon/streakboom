// Tests of the check of the live site (ADR-0096). Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { BEACON_SRC } from "./counting.mjs";
import { checkLive, liveProblems } from "./livecheck.mjs";

const TOKEN = "0123456789abcdef0123456789abcdef";
const off = { measurement: { webAnalyticsToken: "" } }, on = { measurement: { webAnalyticsToken: TOKEN } };
const H = (o = {}) => new Headers(o);
const page = (extra = "") => `<html><body><script type="module" src="/app.js?v=1"></script>${extra}</body></html>`;
const tag = `<script defer src="${BEACON_SRC}" data-cf-beacon='{"token": "${TOKEN}"}'></script>`;

test("a clean page is clean, with the switch off or on", () => {
  assert.deepEqual(liveProblems("/", page(), H(), off), []);
  assert.deepEqual(liveProblems("/", page(tag), H(), on), []);
});

test("what Cloudflare can add is found: the automatic analytics script, the bot script, error reporting, a cookie, any other script", () => {
  const auto = `<script defer src="${BEACON_SRC}/vcc0123" data-cf-beacon='{"x":1}'></script>`;
  assert.match(liveProblems("/", page(auto), H(), off).join(), /automatic copy of the analytics script/);
  assert.match(liveProblems("/", page(tag + auto), H(), on).join(), /automatic copy/);
  assert.match(liveProblems("/", page("<script>var u='/cdn-cgi/challenge-platform/scripts/jsd/main.js'</script>"), H(), off).join(), /bot-detection script/);
  assert.match(liveProblems("/", page(), H({ nel: "{}" }), off).join(), /Network Error Logging/);
  assert.match(liveProblems("/", page(), H({ "report-to": "{}" }), off).join(), /Network Error Logging/);
  assert.match(liveProblems("/", page(), H({ "set-cookie": "__cf_bm=1; path=/" }), off).join(), /a cookie is set \(__cf_bm\)/);
  assert.match(liveProblems("/", page('<script src="https://stats.example.com/a.js"></script>'), H(), on).join(), /a script from a third party/);
});

test("the analytics script must match the switch: absent when off, present with the token when on", () => {
  assert.match(liveProblems("/", page(tag), H(), off).join(), /no token/);
  assert.match(liveProblems("/", page(), H(), on).join(), /is not on the page/);
});

test("a page turned away is reported as not checked, not as clean; another error is a problem", async () => {
  const fake = (status) => async () => new Response("x", { status, headers: { server: "cloudflare" } });
  const r = await checkLive({ origin: "https://x.example", fetchFn: fake(403), ctx: off });
  assert.equal(r.problems.length, 0);
  assert.equal(r.skipped.length, 7);
  assert.match(r.skipped[0], /answered 403 \(cloudflare\), not checked/);
  const r2 = await checkLive({ origin: "https://x.example", fetchFn: fake(500), ctx: off });
  assert.equal(r2.problems.length, 7);
  const r3 = await checkLive({ origin: "https://x.example", fetchFn: async () => new Response(page(), { status: 200 }), ctx: off });
  assert.deepEqual(r3, { problems: [], skipped: [] });
});
