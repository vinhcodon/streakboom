// The numbers of the project dashboard (ADR-0120): the channel of a version, the CSV files, the history of the repository and the check of the hand-typed file.
import test from "node:test";
import assert from "node:assert/strict";
import { WEEKLY_COLUMNS, channelOf, collect, dailyCsv, parseCsv, repoHistoryCsv, versionsCsv, weeklyProblems } from "./metrics.mjs";

const LEDGER = { updated: "2026-11-14", total: 112, perTag: { "v0.10.0": 3, "v0.9.8": 3, "v0.8.1": 4 }, history: [{ date: "2026-11-13", total: 64 }, { date: "2026-11-14", total: 112 }] };
const REPO = { stargazers_count: 1, forks_count: 0, open_issues_count: 0, subscribers_count: 0 };
const HEAD = WEEKLY_COLUMNS.join(",");

test("a version with an even middle number is a Stable, an odd one a Preview", () => {
  for (const [tag, ch] of [["v0.10.0", "stable"], ["v0.8.1", "stable"], ["v0.4.2", "stable"], ["v0.9.8", "preview"], ["v0.11.5", "preview"], ["0.7.7", "preview"]]) assert.equal(channelOf(tag), ch, tag);
});

test("the daily and per-version files come from the ledger; a ledger without them is refused", () => {
  assert.equal(dailyCsv(LEDGER), "date,total\n2026-11-13,64\n2026-11-14,112\n");
  assert.equal(versionsCsv(LEDGER), "tag,channel,downloads\nv0.10.0,stable,3\nv0.9.8,preview,3\nv0.8.1,stable,4\n");
  assert.throws(() => dailyCsv({}), /no daily history/);
  assert.throws(() => versionsCsv({}), /no per-version/);
});

test("the history of the repository keeps one row per day, in date order; a second run on the same day replaces that row", () => {
  const first = repoHistoryCsv("", "2026-11-15", REPO);
  assert.equal(first, "date,stars,forks,open_issues,watchers\n2026-11-15,1,0,0,0\n");
  const again = repoHistoryCsv(first, "2026-11-15", { ...REPO, stargazers_count: 2 });
  assert.equal(parseCsv(again).rows.length, 1);
  assert.equal(parseCsv(again).rows[0].stars, "2");
  const next = repoHistoryCsv(again, "2026-11-12", REPO);
  assert.deepEqual(parseCsv(next).rows.map((r) => r.date), ["2026-11-12", "2026-11-15"]);
});

test("the hand-typed weekly file: the header, a Monday, whole numbers, no repeated week", () => {
  assert.deepEqual(weeklyProblems(HEAD + "\n"), []);
  assert.deepEqual(weeklyProblems(HEAD + "\n2026-11-09,120,30,4,16,900\n2026-11-16,,,,,\n"), [], "an empty number is allowed");
  assert.ok(weeklyProblems("week,visits\n").some((p) => /columns/.test(p)));
  assert.ok(weeklyProblems(HEAD + "\n2026-11-10,1,1,1,1,1\n").some((p) => /not a Monday/.test(p)));
  assert.ok(weeklyProblems(HEAD + "\n11/09/2026,1,1,1,1,1\n").some((p) => /YYYY-MM-DD/.test(p)));
  assert.ok(weeklyProblems(HEAD + "\n2026-11-09,1.5,1,1,1,1\n").some((p) => /whole number/.test(p)));
  assert.ok(weeklyProblems(HEAD + "\n2026-11-09,1,1,1,1,1\n2026-11-09,2,2,2,2,2\n").some((p) => /twice/.test(p)));
});

test("collect reads the two public addresses and the two files, writes nothing, and fails loudly", async () => {
  const fetchFn = async (url) => ({ ok: true, status: 200, json: async () => (url.includes("downloads.json") ? LEDGER : REPO) });
  const read = (p) => (p.endsWith("weekly.csv") ? HEAD + "\n2026-11-09,120,30,4,16,900\n" : "");
  const r = await collect({ fetchFn, read, today: "2026-11-15" });
  assert.deepEqual(Object.keys(r.files), ["downloads_daily.csv", "downloads_by_version.csv", "repo.csv", "weekly.csv"]);
  assert.equal(r.summary.total, 112); assert.equal(r.summary.weeks, 1); assert.equal(r.summary.stars, 1);
  await assert.rejects(collect({ fetchFn: async () => ({ ok: false, status: 503 }), read }), /answered 503/);
  await assert.rejects(collect({ fetchFn, read: () => HEAD + "\n2026-11-10,1,1,1,1,1\n" }), /not a Monday/);
});
