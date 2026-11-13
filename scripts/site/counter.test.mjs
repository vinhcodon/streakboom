// Tests of the counter of sticker copies and of its switch (ADR-0092). Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import worker, { MAX_STICKERS_PER_DAY } from "./worker/count.mjs";
import { countingOn, countingProblems, loadCounting } from "./counting.mjs";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";

// a fake of the D1 calls the Worker makes: the table is a Map of "day|slug|lang" to a number
const fakeDb = () => {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      return {
        bind(...a) {
          return {
            async first() {
              if (sql.startsWith("SELECT 1")) return [...rows.keys()].some((k) => k.startsWith(`${a[0]}|${a[1]}|`)) ? { x: 1 } : null;
              if (sql.startsWith("SELECT COUNT")) return { c: new Set([...rows.keys()].filter((k) => k.startsWith(`${a[0]}|`)).map((k) => k.split("|")[1])).size };
              throw new Error(sql);
            },
            async run() { const k = a.join("|"); rows.set(k, (rows.get(k) || 0) + 1); },
          };
        },
        async all() { return { results: [...rows].map(([k, n]) => { const [day, slug, lang] = k.split("|"); return { day, slug, lang, n }; }) }; },
      };
    },
  };
};
const env = (extra = {}) => ({ DB: fakeDb(), READ_TOKEN: "secret-token", ALLOWED_ORIGIN: "https://streakboom.com", ...extra });
const post = (body, headers = {}) => new Request("https://c.example/", { method: "POST", body, headers });

test("a note \"<sticker> <language>\" adds one to the day's total, and nothing else is kept", async () => {
  const e = env();
  assert.equal((await worker.fetch(post("thank-you vi", { origin: "https://streakboom.com" }), e)).status, 204);
  assert.equal((await worker.fetch(post("thank-you vi"), e)).status, 204);
  assert.equal((await worker.fetch(post("thank-you en"), e)).status, 204);
  const day = new Date().toISOString().slice(0, 10);
  assert.deepEqual([...e.DB.rows], [[`${day}|thank-you|vi`, 2], [`${day}|thank-you|en`, 1]]);
});

test("anything but exactly that note is refused: other text, other languages, a long text, another origin", async () => {
  const e = env();
  for (const bad of ["hello", "thank-you de", "Thank-You vi", "thank-you vi extra", "thank you vi", "", "x".repeat(500), '{"a":1}', "-x vi"]) assert.equal((await worker.fetch(post(bad), e)).status, 400, bad);
  assert.equal((await worker.fetch(post("thank-you vi", { origin: "https://evil.example" }), e)).status, 403);
  assert.equal((await worker.fetch(new Request("https://c.example/", { method: "GET" }), e)).status, 404);
  assert.equal(e.DB.rows.size, 0);
});

test("Safari sends the origin null for a POST that asks for no referrer: it is counted (seen on an iPhone, 2026-11-14)", async () => {
  const e = env();
  assert.equal((await worker.fetch(post("thank-you vi", { origin: "null" }), e)).status, 204);
  assert.equal(e.DB.rows.size, 1);
});

test("a day with too many different names stops counting new ones, and the known ones still count", async () => {
  const e = env();
  for (let i = 0; i < MAX_STICKERS_PER_DAY; i++) await worker.fetch(post(`s${i} en`), e);
  await worker.fetch(post("brand-new en"), e);
  await worker.fetch(post("s0 en"), e);
  const day = new Date().toISOString().slice(0, 10);
  assert.equal(e.DB.rows.has(`${day}|brand-new|en`), false);
  assert.equal(e.DB.rows.get(`${day}|s0|en`), 2);
});

test("the rate limiter of Cloudflare, when present, can refuse (429)", async () => {
  const e = env({ LIMITER: { limit: async () => ({ success: false }) } });
  assert.equal((await worker.fetch(post("thank-you vi"), e)).status, 429);
  assert.equal(e.DB.rows.size, 0);
});

test("the totals need the secret token", async () => {
  const e = env();
  await worker.fetch(post("ok en"), e);
  const get = (token) => worker.fetch(new Request("https://c.example/totals", { headers: token ? { authorization: `Bearer ${token}` } : {} }), e);
  assert.equal((await get("")).status, 401);
  assert.equal((await get("wrong-token!")).status, 401);
  const ok = await get("secret-token");
  assert.equal(ok.status, 200);
  assert.deepEqual((await ok.json()).rows.map((r) => [r.slug, r.lang, r.n]), [["ok", "en", 1]]);
  assert.equal((await worker.fetch(new Request("https://c.example/totals"), env({ READ_TOKEN: undefined }))).status, 401, "no token set: closed");
});

test("the switch: off by default; an endpoint must be a plain https address of the Worker", () => {
  assert.deepEqual(countingProblems(loadCounting()), [], "the switch in the repository is valid (off, or the address of the Worker)");
  assert.deepEqual(countingProblems({ endpoint: "" }), []);
  assert.deepEqual(countingProblems({ endpoint: "https://streakboom-count.example-name.workers.dev" }), []);
  assert.deepEqual(countingProblems({ endpoint: "https://count.streakboom.com" }), []);
  for (const bad of ["http://a.workers.dev", "https://evil.example", "https://a.workers.dev/?token=1", "https://user:pw@a.workers.dev", "not an address"]) assert.ok(countingProblems({ endpoint: bad }).length, bad);
  assert.ok(countingProblems({}).length);
  assert.equal(countingOn({ counting: { endpoint: "" } }), false);
});

test("counting on: the pages carry the address and the text that says a copy is counted; the checks refuse the page and the text apart", () => {
  // the pages with counting off are built from an empty switch, whatever the repository has now
  const offDir = mkdtempSync(join(tmpdir(), "sb-cnt-"));
  writeFileSync(join(offDir, "counting.json"), JSON.stringify({ endpoint: "" }));
  process.env.STREAKBOOM_COUNTING_FILE = join(offDir, "counting.json");
  let off;
  try { off = build({ out: join(offDir, "_site") }); } finally { delete process.env.STREAKBOOM_COUNTING_FILE; }
  for (const p of off.pages.filter((x) => /stickers|privacy/.test(x.path))) assert.doesNotMatch(p.html, /data-count=|a copy is counted|bộ đếm|カウンター/, p.path);
  assert.doesNotMatch(off.files["llms-full.txt"], /only adds one to that day/);
  const on = () => ({ ...off.ctx, counting: { endpoint: "https://streakboom-count.x.workers.dev" } });
  // build the pages again with counting on, through the same function the build uses
  const dir = mkdtempSync(join(tmpdir(), "sb-cnt2-"));
  const cfg = join(dir, "counting.json");
  writeFileSync(cfg, JSON.stringify({ endpoint: "https://streakboom-count.x.workers.dev" }));
  process.env.STREAKBOOM_COUNTING_FILE = cfg;
  try {
    const b = build({ out: join(dir, "_site") });
    assert.equal(b.ctx.counting.endpoint, "https://streakboom-count.x.workers.dev");
    for (const lang of ["", "/vi", "/ja"]) {
      const st = b.pages.find((p) => p.path === `${lang}/stickers/`).html, pv = b.pages.find((p) => p.path === `${lang}/privacy/`).html;
      assert.match(st, /data-count="https:\/\/streakboom-count\.x\.workers\.dev"/);
      assert.doesNotMatch(pv, /no analytics|không có công cụ phân tích|アクセス解析も行いません/);
    }
    assert.match(b.files["llms-full.txt"], /only adds one to that day/);
    const run = (mutate) => { const c = { ctx: { ...b.ctx }, pages: b.pages.map((p) => ({ ...p })), files: { ...b.files }, out: b.out }; mutate(c); return () => check(c); };
    assert.doesNotThrow(run(() => {}));
    assert.throws(run((c) => { const p = c.pages.find((x) => x.path === "/stickers/"); p.html = p.html.replace(/ data-count="[^"]*"/, ""); }), /no address to send to/);
    assert.throws(run((c) => { const p = c.pages.find((x) => x.path === "/privacy/"); p.html = off.pages.find((x) => x.path === "/privacy/").html; }), /does not say a copy is counted/);
    assert.throws(run((c) => { const p = c.pages.find((x) => x.path === "/vi/stickers/"); p.html = off.pages.find((x) => x.path === "/vi/stickers/").html; }), /no address to send to/);
  } finally {
    delete process.env.STREAKBOOM_COUNTING_FILE;
  }
  // off, but a page with an address: refused
  const c = { ctx: { ...off.ctx }, pages: off.pages.map((p) => ({ ...p })), files: { ...off.files }, out: off.out };
  const sp = c.pages.find((x) => x.path === "/stickers/");
  sp.html = sp.html.replace('class="section stickers-page"', 'class="section stickers-page" data-count="https://a.workers.dev"');
  assert.throws(() => check(c), /has an address to send to while counting is off/);
  assert.ok(on().counting.endpoint);
});

test("stickers.js sends only when the page carries the address, one note per sticker and view, with no cookie and no referrer", () => {
  const js = readFileSync(join(import.meta.dirname, "..", "..", "site", "stickers.js"), "utf8");
  assert.match(js, /const COUNT_URL = document\.querySelector\("\.stickers-page"\)\?\.dataset\.count \|\| ""/);
  assert.match(js, /if \(!COUNT_URL \|\| !slug \|\| counted\.has\(slug\) \|\| navigator\.webdriver\) return;/);
  assert.match(js, /credentials: "omit"[^}]*referrerPolicy: "no-referrer"/);
  assert.equal((js.match(/countCopy\(/g) || []).length, 2, "defined once, called once (after a copy, not after Share)");
});
