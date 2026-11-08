import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  bondDays,
  bumpDays,
  chatShare,
  dateKey,
  engage,
  engagementRate,
  lastDates,
  markShown,
  minuteIncrement,
  noShown,
  parseDays,
  presenceDays,
  retention,
  TELEMETRY_DAYS_MAX,
  type DayStat,
} from "./bond.ts";

const at = (y: number, mo: number, d: number, h = 12) => new Date(y, mo - 1, d, h, 0, 0).getTime();
const day = (d: string, over: Partial<DayStat> = {}): DayStat => ({ d, scratch: 0, rub: 0, poke: 0, chat: 0, shown: 0, engaged: 0, min: 0, quiet: 0, ...over });

test("calendar arithmetic does not depend on the length of a day", () => {
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2028-03-01", -1), "2028-02-29"); // leap year
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-29", -7), "2026-03-22"); // across a spring-forward week in Europe
  assert.equal(addDays("2026-10-25", 1), "2026-10-26"); // fall-back day in Europe: 25 hours, one date
});

test("lastDates gives n consecutive dates ending today", () => {
  const ds = lastDates(at(2026, 11, 8), 7);
  assert.deepEqual(ds, ["2026-11-08", "2026-11-07", "2026-11-06", "2026-11-05", "2026-11-04", "2026-11-03", "2026-11-02"]);
  assert.equal(lastDates(at(2026, 1, 2), 4)[3], "2025-12-30"); // across a year end
  assert.equal(new Set(lastDates(at(2026, 3, 29), 7)).size, 7);
});

test("bumpDays creates, increments, sorts, and survives a clock that moves backwards", () => {
  let d: DayStat[] = [];
  d = bumpDays(d, "scratch", at(2026, 11, 8));
  d = bumpDays(d, "scratch", at(2026, 11, 8, 20), 2);
  assert.equal(d.length, 1);
  assert.equal(d[0].scratch, 3);
  d = bumpDays(d, "rub", at(2026, 11, 9));
  d = bumpDays(d, "poke", at(2026, 11, 7)); // an earlier date appears later: no duplicate, still ascending
  d = bumpDays(d, "poke", at(2026, 11, 8)); // back to an existing entry in the middle
  assert.deepEqual(d.map((x) => x.d), ["2026-11-07", "2026-11-08", "2026-11-09"]);
  assert.equal(d[1].poke, 1);
  assert.equal(d[1].scratch, 3);
});

test("bumpDays keeps at most 60 days and caps minutes at a day", () => {
  let d: DayStat[] = [];
  for (let i = 0; i < 70; i++) d = bumpDays(d, "poke", at(2026, 1, 1) + i * 86_400_000);
  assert.equal(d.length, TELEMETRY_DAYS_MAX);
  assert.ok(d[0].d > "2026-01-01");
  d = bumpDays([], "min", at(2026, 11, 8), 5000);
  assert.equal(d[0].min, 1440);
});

test("Bond Days counts care, not chat or pokes, in the last 7 days only", () => {
  const now = at(2026, 11, 8);
  assert.equal(bondDays([], now), 0);
  const days = [
    day("2026-11-08", { poke: 9, chat: 40 }), // not care
    day("2026-11-07", { scratch: 1 }),
    day("2026-11-06", { rub: 1 }),
    day("2026-11-05", { engaged: 1 }),
    day("2026-11-02", { scratch: 5 }), // 6 days back: inside
    day("2026-11-01", { scratch: 5 }), // 7 days back: outside
  ];
  assert.equal(bondDays(days, now), 4);
  assert.equal(bondDays(days, at(2026, 11, 9)), 3); // the window slides
});

test("chat share is undefined without data, and pokes are not in it", () => {
  const now = at(2026, 11, 8);
  assert.equal(chatShare([], now), null);
  assert.equal(chatShare([day("2026-11-08", { poke: 50 })], now), null);
  assert.equal(chatShare([day("2026-11-08", { chat: 3 })], now), 1);
  assert.equal(chatShare([day("2026-11-08", { chat: 2, scratch: 1, rub: 1 })], now), 0.5);
});

test("engagement rate and presence", () => {
  const now = at(2026, 11, 8);
  assert.equal(engagementRate([], now), null);
  assert.equal(engagementRate([day("2026-11-08", { shown: 4, engaged: 1 })], now), 0.25);
  const days = [day("2026-11-08", { min: 4 }), day("2026-11-07", { min: 5 }), day("2026-10-01", { min: 300 })];
  assert.equal(presenceDays(days, now), 1);
});

test("retention uses a one-day tolerance after the first launch", () => {
  const first = at(2026, 11, 1, 23);
  const mk = (d: string) => [day(d, { min: 10 })];
  assert.equal(retention(mk("2026-11-04"), first, 3), true); // day 3
  assert.equal(retention(mk("2026-11-05"), first, 3), true); // day 4
  assert.equal(retention(mk("2026-11-03"), first, 3), false); // day 2
  assert.equal(retention(mk("2026-11-06"), first, 3), false); // day 5
  assert.equal(retention([day("2026-11-04", { min: 2 })], first, 3), false); // not present
  assert.equal(retention(mk("2026-11-04"), null, 3), null);
});

test("parseDays validates, clamps, merges, sorts and caps", () => {
  assert.deepEqual(parseDays("x"), []);
  const out = parseDays([
    { d: "2026-11-08", scratch: 2, min: 99999, poke: -4, chat: 1.9 },
    { d: "2026-11-07", rub: 1 },
    { d: "2026-11-08", scratch: 1 }, // duplicate date: merged
    { d: "11/08/2026", scratch: 5 }, // bad date: dropped
    null,
    { scratch: 5 },
  ]);
  assert.deepEqual(out.map((x) => x.d), ["2026-11-07", "2026-11-08"]);
  assert.equal(out[1].scratch, 3);
  assert.equal(out[1].min, 1440);
  assert.equal(out[1].poke, 0);
  assert.equal(out[1].chat, 1);
  const good = [day("2026-11-07", { rub: 2, quiet: 1 }), day("2026-11-08", { scratch: 1 })];
  assert.deepEqual(parseDays(JSON.parse(JSON.stringify(good))), good);
  const many = Array.from({ length: 80 }, (_, i) => day(addDays("2026-01-01", i), { poke: 1 }));
  assert.equal(parseDays(many).length, TELEMETRY_DAYS_MAX);
});

test("a minute counts only when the previous tick was recent", () => {
  assert.equal(minuteIncrement(1_000, 61_000), 1);
  assert.equal(minuteIncrement(1_000, 131_000), 0); // 130 s: the machine slept
  assert.equal(minuteIncrement(1_000, 1_000), 0);
  assert.equal(minuteIncrement(5_000, 1_000), 0);
});

test("a reaction counts once per unprompted line and only within 30 seconds", () => {
  let s = noShown();
  assert.equal(engage(s, 1000).engaged, false); // nothing was shown
  s = markShown(s, 10_000);
  let r = engage(s, 25_000);
  assert.equal(r.engaged, true);
  r = engage(r.state, 26_000);
  assert.equal(r.engaged, false); // the same line cannot count twice
  s = markShown(r.state, 100_000);
  r = engage(s, 140_000); // 40 s later
  assert.equal(r.engaged, false);
  s = markShown(r.state, 200_000);
  assert.equal(engage(s, 200_000).engaged, true);
  assert.equal(dateKey(at(2026, 11, 8)), "2026-11-08");
});
