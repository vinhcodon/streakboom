import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_SEEN_PER_WEEK, formatReport, lineReport } from "./linereport.ts";
import type { Line } from "./lines.ts";

const mk = (n: number, lang: "vi" | "en" | "ja" = "vi"): Line[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${lang}.click.${i}`, lang, trigger: "click", text: "t" + i, spicy: false }));

test("the report counts the smallest pool and says how often one line is seen", () => {
  const rows = lineReport([...mk(10), ...mk(10, "en"), ...mk(10, "ja")], { click: 60 });
  const vi = rows.find((r) => r.lang === "vi" && r.trigger === "click")!;
  assert.equal(vi.smallest, 10);
  assert.equal(vi.perLinePerWeek, 6);
  assert.equal(vi.tooFew, true);
  assert.equal(vi.toAdd, Math.ceil(60 / MAX_SEEN_PER_WEEK) - 10);
});

test("a pool big enough is not flagged and needs nothing", () => {
  const r = lineReport(mk(30), { click: 60 }).find((x) => x.lang === "vi")!;
  assert.equal(r.tooFew, false);
  assert.equal(r.toAdd, 0);
});

test("a trigger with no lines at all is the worst case", () => {
  const r = lineReport([], { click: 5 }).find((x) => x.lang === "vi")!;
  assert.equal(r.smallest, 0);
  assert.equal(r.tooFew, true);
});

test("the real pools: the report covers every trigger and language, and the text lists the worst first", () => {
  const rows = lineReport();
  assert.equal(rows.length % 3, 0);
  for (const r of rows) assert.ok(r.smallest <= r.largest);
  const text = formatReport(rows, "vi");
  const first = text.split("\n")[1].trim().split(/\s+/)[0];
  const worst = rows.filter((r) => r.lang === "vi").sort((a, b) => b.perLinePerWeek - a.perLinePerWeek)[0].trigger;
  assert.equal(first, worst);
  assert.match(text, /lines to add per language/);
});
