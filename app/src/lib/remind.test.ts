import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_CLARIFY, MAX_KEPT, MAX_LABEL, MISSED_WINDOW_DAYS, PENDING_MS, REMIND_LINES, addKept, answerOf, cleanLabel, describeDate, dueToday, fallsOn,
  hasKept, markDone, missedSince, parseKept, parseRemindAnswer, parseRemindArgs, pendingAlive, pruneOneOff, remindSay, removeKept, replyKind, validMd, type KeptDay, type RemindLine,
} from "./remind.ts";
import { BANNED } from "./banned.ts";
import { dayKey } from "./state.ts";

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).getTime();
const kept = (md: string, over: Partial<KeptDay> = {}): KeptDay => ({ id: `k-${md}`, md, year: 0, label: "mẹ", t: 0, done: "", ...over });

test("a label is one short clean line", () => {
  assert.equal(cleanLabel("  sinh nhật <b>mẹ</b> \n [x] | y "), "sinh nhật b mẹ /b x y");
  assert.equal(cleanLabel("a".repeat(100)).length, MAX_LABEL);
  assert.equal(cleanLabel("   "), "");
});

test("only real days of a year are valid, 29 February included", () => {
  for (const ok of ["01-01", "12-31", "02-29", "03-12"]) assert.equal(validMd(ok), true, ok);
  for (const bad of ["00-10", "13-01", "02-30", "04-31", "3-12", "03-1", "", "ab-cd", "03/12"]) assert.equal(validMd(bad), false, bad);
});

test("the model's arguments are accepted in exactly two forms and nothing else", () => {
  assert.deepEqual(parseRemindArgs("03-12|mẹ"), { md: "03-12", year: 0, label: "mẹ", t: 0 });
  assert.deepEqual(parseRemindArgs("03-12|mẹ|more"), { md: "03-12", year: 0, label: "mẹ", t: 0, more: true });
  assert.equal(parseRemindArgs("03-12|mẹ|other"), null);
  assert.equal(parseRemindArgs("03-12|mẹ|more|x"), null);
  assert.deepEqual(parseRemindArgs("2026-11-20|kỳ thi"), { md: "11-20", year: 2026, label: "kỳ thi", t: 0 });
  for (const bad of [null, undefined, "", "03-12", "03-12|", "13-40|x", "1999-03-12|x", "2101-03-12|x", "tomorrow|x", "03-12 |  ", "2026-02-30|x"]) {
    assert.equal(parseRemindArgs(bad as string), null, String(bad));
  }
});

test("yes and no are whole short answers in the three languages; a sentence is neither", () => {
  for (const y of ["đúng", "Đúng rồi!", "ừ", "yes", "Yep.", "That's right", "Giữ đi", "keep it", "はい", "うん", "お願い"]) assert.equal(answerOf(y), "yes", y);
  for (const n of ["không", "Không phải", "sai rồi", "Đừng giữ", "thôi", "no", "Nope", "no thanks", "いいえ", "ちがう", "やめて"]) assert.equal(answerOf(n), "no", n);
  for (const x of ["đúng rồi nhưng mà đổi sang ngày 13", "maybe", "hello", "", "mẹ mình"]) assert.equal(answerOf(x), null, x);
});

test("a question waits half an hour for its answer", () => {
  const p = { md: "03-12", year: 0, label: "mẹ", t: 1000 };
  assert.equal(pendingAlive(p, 1000 + PENDING_MS - 1), true);
  assert.equal(pendingAlive(p, 1000 + PENDING_MS), false);
  assert.equal(pendingAlive(null, 5), false);
});

test("a day is kept once, the list has a limit, and a row can be removed", () => {
  const p = { md: "03-12", year: 0, label: "Mẹ", t: 0 };
  let r = addKept([], p, 5, "a");
  assert.equal(r.result, "added");
  assert.equal(r.list[0].done, "");
  r = addKept(r.list, { ...p, label: "mẹ" }, 6, "b");
  assert.equal(r.result, "same");
  assert.equal(r.list.length, 1);
  const full = Array.from({ length: MAX_KEPT }, (_, i) => kept("01-01", { id: `i${i}`, label: `x${i}` }));
  assert.equal(addKept(full, p, 7, "z").result, "full");
  assert.deepEqual(removeKept(r.list, "a"), []);
});

test("29 February is kept on 28 February in a year without it", () => {
  const k = kept("02-29");
  assert.equal(fallsOn(k, new Date(2028, 1, 29)), true);
  assert.equal(fallsOn(k, new Date(2027, 1, 28)), true);
  assert.equal(fallsOn(k, new Date(2028, 1, 28)), false);
  assert.equal(fallsOn(k, new Date(2027, 2, 1)), false);
});

test("a one-off day falls on its own year only", () => {
  const k = kept("11-20", { year: 2026 });
  assert.equal(fallsOn(k, new Date(2026, 10, 20)), true);
  assert.equal(fallsOn(k, new Date(2027, 10, 20)), false);
});

test("what is due today is celebrated once", () => {
  const list = [kept("11-14"), kept("11-15", { id: "other" })];
  const now = at(2026, 11, 14);
  assert.deepEqual(dueToday(list, now).map((k) => k.id), ["k-11-14"]);
  const done = markDone(list, ["k-11-14"], now);
  assert.equal(done[0].done, "2026-11-14");
  assert.deepEqual(dueToday(done, now), []);
  assert.deepEqual(dueToday(done, at(2027, 11, 14)).map((k) => k.id), ["k-11-14"]); // next year it comes again
});

test("a day missed while Peak was not there is said once on its return, never on the first run", () => {
  const list = [kept("11-12")];
  const now = at(2026, 11, 14);
  assert.deepEqual(missedSince(list, "2026-11-10", now).map((k) => k.id), ["k-11-12"]);
  assert.deepEqual(missedSince(list, "", now), []); // never checked: nothing is "missed"
  assert.deepEqual(missedSince(list, "2026-11-13", now), []); // Peak saw 12 November's end: nothing came by since
  assert.deepEqual(missedSince(markDone(list, ["k-11-12"], at(2026, 11, 12)), "2026-11-10", now), []); // already celebrated on the day
  assert.deepEqual(missedSince([kept("11-14")], "2026-11-10", now), []); // today is "due", not "missed"
});

test("a day older than the window is not said at all", () => {
  const now = at(2026, 11, 20);
  assert.deepEqual(missedSince([kept("11-10")], "2026-11-01", now), []);
  assert.equal(MISSED_WINDOW_DAYS, 7);
  assert.deepEqual(missedSince([kept("11-14")], "2026-11-01", now).map((k) => k.id), ["k-11-14"]);
});

test("a one-off day is dropped a week after it passed; a yearly day is never dropped", () => {
  const list = [kept("11-01", { year: 2026, id: "old" }), kept("11-20", { year: 2026, id: "soon" }), kept("01-01", { id: "yearly" })];
  assert.deepEqual(pruneOneOff(list, at(2026, 11, 14)).map((k) => k.id).sort(), ["soon", "yearly"]);
  assert.deepEqual(pruneOneOff(list, at(2026, 11, 3)).map((k) => k.id).sort(), ["old", "soon", "yearly"]);
});

test("a date reads in the person's language", () => {
  assert.equal(describeDate("03-12", 0, "en"), "12 March");
  assert.equal(describeDate("11-20", 2026, "en"), "20 November 2026");
  assert.equal(describeDate("03-12", 0, "vi"), "ngày 12 tháng 3");
  assert.equal(describeDate("03-12", 2027, "vi"), "ngày 12 tháng 3 năm 2027");
  assert.equal(describeDate("03-12", 0, "ja"), "3月12日");
});

test("the scripted lines exist in the three languages, put the words in, and break no banned pattern", () => {
  const kinds = Object.keys(REMIND_LINES) as RemindLine[];
  for (const k of kinds) {
    for (const lang of ["en", "vi", "ja"] as const) {
      const pool = REMIND_LINES[k][lang];
      assert.ok(pool.length >= 2, `${k} ${lang}`);
      for (const t of pool) {
        for (const re of BANNED[lang]) assert.doesNotMatch(t, re, `${k} ${lang}: ${t}`);
        assert.doesNotMatch(t, /\d+\s*(days?|ngày|日)\b.*(without|không|ない)/i); // no count of days away
      }
      const said = remindSay(k, lang, { label: "LABEL", date: "DATE" });
      assert.doesNotMatch(said, /\{(label|date)\}/);
      if (k === "today" || k === "missed" || k === "ask") assert.match(said, /LABEL/);
      if (k === "ask" || k === "kept") assert.match(said, /DATE/);
    }
  }
});

test("a line is not repeated right after itself", () => {
  const a = remindSay("today", "en", { label: "X" }, null, () => 0);
  const b = remindSay("today", "en", { label: "X" }, a, () => 0);
  assert.notEqual(a, b);
});

test("the stored list is read with bounds and bad rows are dropped", () => {
  const good = { id: "a", md: "03-12", year: 0, label: "mẹ", t: 5, done: "2026-03-12" };
  const parsed = parseKept([good, { id: "b", md: "13-40", label: "x" }, { md: "03-12", label: "no id" }, null, 5, { ...good, id: "c", label: "  ", t: "x" }]);
  assert.deepEqual(parsed, [good]);
  assert.deepEqual(parseKept("nope"), []);
  assert.deepEqual(parseKept(undefined), []);
  assert.equal(parseKept(Array.from({ length: 80 }, (_, i) => ({ id: `i${i}`, md: "01-01", label: `l${i}` }))).length, MAX_KEPT);
  assert.equal(parseKept([{ id: "d", md: "01-01", label: "x", year: 1850 }])[0].year, 0);
  assert.equal(dayKey(at(2026, 11, 14)), "2026-11-14");
});

test("'uh' and the other small yeses are yeses; a few unknown words are 'short'; a real message is 'other'", () => {
  for (const y of ["uh", "Uhm", "uh huh", "vâng", "dạ", "được rồi", "okie", "yup"]) assert.equal(replyKind(y), "yes", y);
  for (const n of ["ko", "nah", "hông"]) assert.equal(replyKind(n), "no", n);
  for (const sh of ["uhh", "ờ thì", "chắc vậy", "hmm", "maybe"]) assert.equal(replyKind(sh), "short", sh);
  for (const o of ["hôm nay mình đi làm về muộn quá", "what is the date today and also something else", ""]) assert.equal(replyKind(o), "other", o);
  assert.equal(MAX_CLARIFY, 2);
});

test("a day already kept is recognised, so the model naming it again is not asked about again", () => {
  const p = { md: "11-14", year: 0, label: "Sinh nhật Thảo Nguyên", t: 0 };
  assert.equal(hasKept([kept("11-14", { label: "sinh nhật thảo nguyên" })], p), true);
  assert.equal(hasKept([kept("11-15", { label: "sinh nhật thảo nguyên" })], p), false);
  assert.equal(hasKept([], p), false);
});

test("the model's answer to the open question is exactly yes or no, and never taken for a day", () => {
  assert.equal(parseRemindAnswer("yes"), "yes");
  assert.equal(parseRemindAnswer(" No "), "no");
  for (const bad of ["maybe", "yes please", "", null, undefined, "03-12|mẹ"]) assert.equal(parseRemindAnswer(bad as string), null, String(bad));
  assert.equal(parseRemindArgs("yes"), null); // a yes is not a day
});
