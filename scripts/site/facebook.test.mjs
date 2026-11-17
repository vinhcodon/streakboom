// The Facebook Page (ADR-0134): a plain link "Facebook" in the footer of every page, a sameAs, and nothing of Facebook that runs.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";
import { FACEBOOK_URL } from "./facts.mjs";

const b = build({ out: join(mkdtempSync(join(tmpdir(), "sb-fb-")), "_site") });
const tryRun = (mutate) => { const c = { ctx: { ...b.ctx }, pages: b.pages.map((p) => ({ ...p })), files: { ...b.files }, out: b.out }; mutate(c); return () => check(c); };
const page = (c, path) => c.pages.find((p) => p.path === path);

test("the address is the one with the username, never the profile.php form", () => {
  assert.equal(FACEBOOK_URL, "https://www.facebook.com/streakboom");
});

test("every page has exactly one footer link named Facebook, as plain as the GitHub link (no script, no target trick), in the three languages", () => {
  for (const p of b.pages.filter((x) => x.path !== "/404.html")) {
    const links = [...p.html.matchAll(/<a href="([^"]*facebook\.com[^"]*)">([^<]*)<\/a>/g)];
    assert.equal(links.length, 1, p.path);
    assert.deepEqual([links[0][1], links[0][2]], [FACEBOOK_URL, "Facebook"], p.path);
    assert.ok(/<footer[\s\S]*facebook\.com\/streakboom[\s\S]*<\/footer>/.test(p.html), p.path + ": in the footer");
  }
  assert.doesNotThrow(() => check({ ctx: { ...b.ctx }, pages: b.pages, files: b.files, out: b.out }));
});

test("the structured data of the three home pages has the Page in sameAs beside GitHub; the author's own sameAs is not touched", () => {
  for (const path of ["/", "/vi/", "/ja/"]) {
    const ld = [...page(b, path).html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<")));
    const nodes = ld.flatMap((o) => (o["@graph"] ? o["@graph"] : [o]));
    const app = nodes.find((o) => o["@type"] === "SoftwareApplication");
    assert.deepEqual(app.sameAs, ["https://github.com/vinhcodon/streakboom", FACEBOOK_URL], path);
    assert.deepEqual(nodes.find((o) => o["@type"] === "Person").sameAs, ["https://github.com/vinhcodon"], path);
  }
});

test("the build refuses a missing or doubled link, the profile.php form, a script, a pixel, a like button, and a missing sameAs", () => {
  const home = (c) => page(c, "/");
  assert.throws(tryRun((c) => { home(c).html = home(c).html.replace(`<a href="${FACEBOOK_URL}">Facebook</a> · `, ""); }), /exactly one link "Facebook"/);
  assert.throws(tryRun((c) => { home(c).html = home(c).html.replace(`<a href="${FACEBOOK_URL}">Facebook</a>`, `<a href="${FACEBOOK_URL}">Facebook</a> · <a href="${FACEBOOK_URL}">Facebook</a>`); }), /exactly one link/);
  assert.throws(tryRun((c) => { home(c).html = home(c).html.replace(FACEBOOK_URL + '">', "https://www.facebook.com/profile.php?id=61596355604714\">"); }), /exactly one link|something of Facebook/);
  assert.throws(tryRun((c) => { home(c).html = home(c).html.replace("</body>", '<script>fbq("init","1")</script></body>'); }), /something of Facebook/);
  assert.throws(tryRun((c) => { home(c).html = home(c).html.replace("</body>", '<script src="https://connect.facebook.net/en_US/sdk.js"></script></body>'); }), /something of Facebook|third party/);
  assert.throws(tryRun((c) => { home(c).html = home(c).html.replace("</body>", '<div class="fb-like"></div></body>'); }), /something of Facebook/);
  assert.throws(tryRun((c) => { home(c).html = home(c).html.replace(',"' + FACEBOOK_URL + '"', "").replace(/,?"https:\/\/www\.facebook\.com\/streakboom"/, ""); }), /sameAs/);
});
