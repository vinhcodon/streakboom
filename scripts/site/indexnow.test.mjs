// IndexNow (ADR-0124): the switch, the body of the request, the ping against a fake network, and the files the build serves and refuses.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";
import { ENDPOINT, indexNowProblems, loadIndexNow, payloadOf, submit, urlsOf } from "./indexnow.mjs";

const KEY = "0123456789abcdef0123456789abcdef";
const CFG = { enabled: true, key: KEY };
const ORIGIN = "https://streakboom.com";

test("the switch: the repository's own file is valid; the key and the flag are checked", () => {
  assert.deepEqual(indexNowProblems(loadIndexNow()), []);
  assert.deepEqual(indexNowProblems(CFG), []);
  for (const bad of ["", "abc", KEY.toUpperCase(), KEY + "0", "<script>", 12]) assert.ok(indexNowProblems({ enabled: true, key: bad }).length, String(bad));
  assert.ok(indexNowProblems({ enabled: "yes", key: KEY }).length);
  assert.ok(indexNowProblems(null).length);
});

test("the body names the host, the key, where the key is served and every page of the sitemap", () => {
  const urls = urlsOf(ORIGIN);
  assert.ok(urls.length >= 16 && urls.includes(ORIGIN + "/") && urls.includes(ORIGIN + "/story/") && urls.includes(ORIGIN + "/ja/how-it-works/"));
  assert.ok(urls.every((u) => u.startsWith(ORIGIN + "/")));
  assert.deepEqual(payloadOf(CFG, ["https://streakboom.com/"], ORIGIN), { host: "streakboom.com", key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList: ["https://streakboom.com/"] });
});

/** A fake network: the key file answers with `keyText` (or the status `keyStatus`), IndexNow with `post`. */
function net({ keyText = KEY, keyStatus = 200, post = 200, throwOn = null } = {}) {
  const calls = [];
  const fetchFn = async (url, opts = {}) => {
    calls.push({ url, method: opts.method || "GET", body: opts.body });
    if (throwOn === url) throw new Error("network down");
    if (url === ENDPOINT) return { ok: post < 400, status: post, text: async () => "" };
    return { ok: keyStatus < 400, status: keyStatus, text: async () => keyText };
  };
  return { fetchFn, calls };
}

test("the ping: it checks that the key file is live, then posts the list; 200 and 202 are accepted", async () => {
  for (const post of [200, 202]) {
    const n = net({ post });
    const r = await submit({ cfg: CFG, fetchFn: n.fetchFn, origin: ORIGIN, urls: ["https://streakboom.com/"] });
    assert.equal(r.sent, true); assert.equal(r.status, post);
    assert.equal(n.calls[0].url, `${ORIGIN}/${KEY}.txt`, "the key file is read first");
    assert.equal(n.calls[1].url, ENDPOINT); assert.equal(n.calls[1].method, "POST");
    assert.deepEqual(JSON.parse(n.calls[1].body), payloadOf(CFG, ["https://streakboom.com/"], ORIGIN));
  }
});

test("the ping never throws and sends nothing when it cannot be right: off, a bad key, a key file that is not live or holds another text, a refusal, a network error", async () => {
  const sent = (n) => n.calls.some((c) => c.url === ENDPOINT);
  let n = net(); let r = await submit({ cfg: { enabled: false, key: KEY }, fetchFn: n.fetchFn, origin: ORIGIN });
  assert.equal(r.sent, false); assert.equal(n.calls.length, 0, "off: not even a request");
  n = net(); r = await submit({ cfg: { enabled: true, key: "nope" }, fetchFn: n.fetchFn, origin: ORIGIN });
  assert.equal(r.sent, false); assert.equal(n.calls.length, 0);
  n = net({ keyStatus: 404 }); r = await submit({ cfg: CFG, fetchFn: n.fetchFn, origin: ORIGIN });
  assert.equal(r.sent, false); assert.match(r.reason, /not live/); assert.equal(sent(n), false);
  n = net({ keyText: "something else" }); r = await submit({ cfg: CFG, fetchFn: n.fetchFn, origin: ORIGIN });
  assert.equal(r.sent, false); assert.equal(sent(n), false);
  for (const post of [400, 403, 422, 429]) { n = net({ post }); r = await submit({ cfg: CFG, fetchFn: n.fetchFn, origin: ORIGIN }); assert.equal(r.sent, false); assert.equal(r.status, post); }
  n = net({ throwOn: ENDPOINT }); r = await submit({ cfg: CFG, fetchFn: n.fetchFn, origin: ORIGIN });
  assert.equal(r.sent, false); assert.match(r.reason, /network down/);
});

const tmpBuild = () => build({ out: join(mkdtempSync(join(tmpdir(), "sb-in-")), "_site") });
const tryRun = (b, mutate) => { const c = { ctx: { ...b.ctx }, pages: b.pages.map((p) => ({ ...p })), files: { ...b.files }, out: b.out }; mutate(c); return () => check(c); };

test("the build serves exactly the key at the root, and refuses a missing, wrong, repeated or unwanted key file", () => {
  const b = tmpBuild();
  const key = b.ctx.indexnow.key;
  assert.equal(b.files[`${key}.txt`], key, "exactly the key, no newline");
  assert.doesNotThrow(() => check({ ctx: { ...b.ctx }, pages: b.pages, files: b.files, out: b.out }));
  assert.throws(tryRun(b, (c) => { delete c.files[`${key}.txt`]; }), /key file is missing/);
  assert.throws(tryRun(b, (c) => { c.files[`${key}.txt`] = key + "\n"; }), /exactly the key/);
  assert.throws(tryRun(b, (c) => { c.files["a".repeat(32) + ".txt"] = "x"; }), /2 key files/);
  assert.throws(tryRun(b, (c) => { c.ctx.indexnow = { enabled: false, key }; }), /off in indexnow.json but a key file/);
  assert.throws(tryRun(b, (c) => { c.files["sitemap.xml"] += key; }), /sitemap.xml names the IndexNow key/);
  assert.throws(tryRun(b, (c) => { c.ctx.indexnow = { enabled: true, key: "short" }; }), /32 lower-case hexadecimal/);
});
