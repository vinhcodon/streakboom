// Tests of the download counter (ADR-0052). Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkLedger, formatCount, installerCounts, liveLedger, mergeLedger, previousLedger } from "./downloads.mjs";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";

const release = (tag, n) => ({
  tag_name: tag,
  assets: [{ name: "latest.json", download_count: 99 }, { name: `Streakboom_${tag.slice(1)}_x64-setup.exe`, download_count: n }],
});
const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

test("only the installer counts, not latest.json", () => {
  assert.deepEqual(installerCounts([release("v0.3.1", 3), release("v0.3.0", 1)]), { "v0.3.1": 3, "v0.3.0": 1 });
  assert.deepEqual(installerCounts([{ tag_name: "v1", assets: [{ name: "latest.json", download_count: 5 }] }]), { v1: 0 });
  assert.throws(() => installerCounts({}), /not a list/);
});

test("the ledger keeps a deleted release and never goes down", () => {
  const first = mergeLedger(null, { "v0.3.1": 3, "v0.3.0": 1 }, "2026-11-11");
  assert.deepEqual(first, { updated: "2026-11-11", total: 4, perTag: { "v0.3.0": 1, "v0.3.1": 3 }, history: [{ date: "2026-11-11", total: 4 }] });
  // v0.3.0 is deleted by a release, v0.3.2 appears, v0.3.1 grows
  const next = mergeLedger(first, { "v0.3.2": 2, "v0.3.1": 5 }, "2026-11-20");
  assert.equal(next.total, 1 + 5 + 2);
  assert.deepEqual(Object.keys(next.perTag), ["v0.3.0", "v0.3.1", "v0.3.2"]);
  // GitHub shows a smaller number than the ledger (it must not): the ledger's number stays
  assert.equal(mergeLedger(next, { "v0.3.2": 0, "v0.3.1": 1 }, "2026-11-21").total, 8);
  // versions sort as numbers, not as text
  assert.deepEqual(Object.keys(mergeLedger(null, { "v0.10.0": 1, "v0.9.0": 1 }, "2026-01-01").perTag), ["v0.9.0", "v0.10.0"]);
});

test("the daily history: one entry per day, the same day replaces, a ledger without history starts one", () => {
  const a = mergeLedger({ total: 4, perTag: { v1: 4 } }, { v1: 4 }, "2026-11-11"); // a ledger from before the history
  assert.deepEqual(a.history, [{ date: "2026-11-11", total: 4 }]);
  const b = mergeLedger(a, { v1: 5 }, "2026-11-11"); // the same day again: replaced, not added
  assert.deepEqual(b.history, [{ date: "2026-11-11", total: 5 }]);
  const c = mergeLedger(b, { v1: 9 }, "2026-11-12");
  assert.deepEqual(c.history, [{ date: "2026-11-11", total: 5 }, { date: "2026-11-12", total: 9 }]);
  // at most 400 days are kept
  let l = null;
  for (let i = 0; i < 405; i++) l = mergeLedger(l, { v1: i }, new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10));
  assert.equal(l.history.length, 400);
  assert.equal(l.history.at(-1).total, 404);
  // a date that goes back stops the build
  assert.throws(() => mergeLedger(c, { v1: 9 }, "2026-11-10"), /not be in order/);
});

test("a ledger of an unexpected shape stops the build", () => {
  assert.throws(() => checkLedger(null), /unexpected shape/);
  assert.throws(() => checkLedger({ perTag: { v1: -1 } }), /unexpected shape/);
  assert.throws(() => checkLedger({ perTag: { v1: "3" } }), /unexpected shape/);
  assert.throws(() => checkLedger({ perTag: { v1: 3 }, history: [{ date: "2026-11-11", total: 3 }, { date: "2026-11-10", total: 4 }] }), /unexpected shape/);
  assert.throws(() => checkLedger({ perTag: { v1: 3 }, history: [{ date: "2026-11-10", total: 5 }, { date: "2026-11-11", total: 4 }] }), /unexpected shape/);
  assert.deepEqual(checkLedger({ perTag: { v1: 3 } }).perTag, { v1: 3 });
});

test("the previous ledger: a 404 starts a new one, anything else stops the build", async () => {
  assert.equal(await previousLedger({ fetchFn: async () => reply(404) }), null);
  assert.deepEqual((await previousLedger({ fetchFn: async () => reply(200, { total: 4, perTag: { v1: 4 } }) })).perTag, { v1: 4 });
  await assert.rejects(previousLedger({ fetchFn: async () => reply(500) }), /answered 500/);
  await assert.rejects(previousLedger({ fetchFn: async () => { throw new Error("offline"); } }), /could not read the previous ledger \(offline\)/);
  await assert.rejects(previousLedger({ fetchFn: async () => reply(200, { nonsense: true }) }), /unexpected shape/);
});

test("the live ledger merges GitHub's counts with the site's ledger, and fails when GitHub does", async () => {
  const fetchFn = async (url) => (String(url).includes("api.github.com")
    ? reply(200, [release("v0.3.1", 4), release("v0.3.0", 1)])
    : reply(200, { total: 7, perTag: { "v0.2.5": 6, "v0.3.0": 1 } }));
  const l = await liveLedger({ today: "2026-11-12", fetchFn });
  assert.equal(l.total, 6 + 1 + 4);
  await assert.rejects(liveLedger({ today: "d", fetchFn: async (url) => (String(url).includes("api.github.com") ? reply(403) : reply(404)) }), /GitHub API answered 403/);
});

test("the number is written in each language's own grouping", () => {
  assert.equal(formatCount(1234, "en"), "1,234");
  assert.equal(formatCount(1234, "vi"), "1.234");
  assert.equal(formatCount(1234, "ja"), "1,234");
});

// ---- the pages with a ledger (a build in a temporary folder, so _site is left alone)
const ledger = { updated: "2026-11-11", total: 1234, perTag: { "v0.3.0": 234, "v0.3.1": 1000 }, history: [{ date: "2026-11-10", total: 1100 }, { date: "2026-11-11", total: 1234 }] };
const withCounter = (() => {
  const out = join(mkdtempSync(join(tmpdir(), "sb-dl-")), "_site");
  return build({ out, downloads: ledger });
})();
const clone = () => ({ ctx: { ...withCounter.ctx }, pages: withCounter.pages.map((p) => ({ ...p })), files: { ...withCounter.files }, out: withCounter.out });
const page = (c, path) => c.pages.find((p) => p.path === path);
const fails = (mutate, expected) => {
  const c = clone();
  mutate(c);
  assert.throws(() => check(c), (e) => expected.test(e.message), `expected the checks to fail with ${expected}`);
};

test("with a ledger every home page shows the total in its own language, and downloads.json is published", () => {
  const c = clone();
  assert.doesNotThrow(() => check(c));
  assert.match(page(c, "/").html, /<p class="sub downloads">GitHub downloads so far: 1,234 \(counts downloads, including updates, not people\)\.<\/p>/);
  assert.match(page(c, "/vi/").html, /Lượt tải từ GitHub đến nay: 1\.234/);
  assert.match(page(c, "/ja/").html, /ダウンロード数（これまで）：1,234/);
  assert.deepEqual(JSON.parse(c.files["downloads.json"]), ledger);
  // only the home pages show it
  for (const p of c.pages) if (!["/", "/vi/", "/ja/"].includes(p.path)) assert.ok(!p.html.includes('class="sub downloads"'), p.path);
});
test("without a ledger no page shows a number and there is no downloads.json", () => {
  const c = clone();
  const plain = build({ out: join(mkdtempSync(join(tmpdir(), "sb-nodl-")), "_site") });
  assert.ok(!plain.files["downloads.json"]);
  assert.ok(!plain.pages.some((p) => p.html.includes('class="sub downloads"')));
  assert.ok(c.files["downloads.json"]);
});
test("a number on the page that is not the ledger's total", () => fails((c) => {
  const p = page(c, "/");
  p.html = p.html.replace("1,234", "9,999");
}, /does not show 1,234/));
test("a total that is not the sum of the ledger", () => fails((c) => {
  c.ctx.downloads = { ...ledger, total: 1235 };
}, /not the sum of the ledger/));
test("a download line that talks about installs", () => fails((c) => {
  const p = page(c, "/");
  p.html = p.html.replace("GitHub downloads so far: 1,234", "Installs so far: 1,234");
}, /talks about installs or users/));
test("a counter that is on but not shown", () => fails((c) => {
  const p = page(c, "/vi/");
  p.html = p.html.replace(/<p class="sub downloads">[^<]*<\/p>/, "");
}, /does not show it/));
test("a ledger file that differs from the one the pages show", () => fails((c) => {
  c.files["downloads.json"] = c.files["downloads.json"].replace("1234", "1233");
}, /downloads\.json is missing or is not the ledger/));

// ADR-0065: the download button is the installer itself, so it must exist
test("assertInstaller: the release and its installer must be published", async () => {
  const { assertInstaller } = await import("./downloads.mjs");
  const ok = [{ tag_name: "v1.2.3", draft: false, assets: [{ name: "Streakboom_1.2.3_x64-setup.exe" }, { name: "latest.json" }] }];
  assert.doesNotThrow(() => assertInstaller(ok, "1.2.3", "Streakboom_1.2.3_x64-setup.exe"));
  assert.throws(() => assertInstaller([], "1.2.3", "Streakboom_1.2.3_x64-setup.exe"), /no published release v1\.2\.3/);
  assert.throws(() => assertInstaller([{ ...ok[0], draft: true }], "1.2.3", "Streakboom_1.2.3_x64-setup.exe"), /draft/);
  assert.throws(() => assertInstaller([{ tag_name: "v1.2.3", assets: [{ name: "latest.json" }] }], "1.2.3", "Streakboom_1.2.3_x64-setup.exe"), /no asset named/);
});
