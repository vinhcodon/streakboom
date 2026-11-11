import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanName,
  defaultMemory,
  forgetAll,
  forgetHabits,
  nextMark,
  parseMemory,
  recordAsked,
  recordSession,
  recordTouch,
  setName,
  shareMark,
  shouldAsk,
  usualPart,
  type Memory,
} from "./memory.ts";
import { allMemTexts, memKeys, memLine } from "./memlines.ts";

const at = (y: number, mo: number, d: number, h: number) => new Date(y, mo - 1, d, h, 0, 0).getTime();
const ctx = (over = {}) => ({ lang: "en" as const, gentle: false, hour: 20, ...over });

function sessions(m: Memory, hours: number[]): Memory {
  hours.forEach((h, i) => (m = recordSession(m, at(2026, 11, 1 + i, h))));
  return m;
}

test("names are cleaned and bounded", () => {
  assert.equal(cleanName("  Mochi\n<b> "), "Mochi b");
  assert.equal(cleanName("x".repeat(50)).length, 20);
  assert.equal(setName(defaultMemory(), "petName", "  Bông ").petName, "Bông");
});

test("a damaged file falls back to defaults", () => {
  assert.deepEqual(parseMemory("not json"), defaultMemory());
  assert.deepEqual(parseMemory(null), defaultMemory());
  const m = parseMemory(JSON.stringify({ hours: [1, 2], petName: 5, touches: { poke: -3 }, marks: [{ id: 1 }] }));
  assert.equal(m.hours.length, 24);
  assert.equal(m.petName, "");
  assert.equal(m.touches.poke, 0);
  assert.equal(m.marks.length, 0);
});

test("round trip keeps everything", () => {
  let m = sessions(defaultMemory(), [20, 21, 22]);
  m = setName(setName(m, "petName", "Bông"), "callMe", "Vinh");
  assert.deepEqual(parseMemory(JSON.stringify(m)), m);
});

test("sessions count distinct days once", () => {
  let m = recordSession(defaultMemory(), at(2026, 11, 1, 9));
  m = recordSession(m, at(2026, 11, 1, 20));
  m = recordSession(m, at(2026, 11, 2, 9));
  assert.equal(m.sessions, 3);
  assert.equal(m.days, 2);
  assert.ok(!("bestStreak" in m) && !("longestAwayDays" in m), "no streak and no record of absences are kept (spec 12)");
});

test("with learning off nothing is recorded", () => {
  const off = { ...defaultMemory(), learn: false };
  assert.deepEqual(recordSession(off, Date.now()), off);
  assert.deepEqual(recordTouch(off, "poke"), off);
  assert.equal(nextMark({ ...off, days: 500, touches: { poke: 999, scratch: 0, chat: 99 } }), null);
});

test("a habit needs enough sessions and a clear favourite", () => {
  assert.equal(usualPart(sessions(defaultMemory(), [20, 20, 20])), null); // too few
  assert.equal(usualPart(sessions(defaultMemory(), [20, 21, 19, 20, 22, 20, 18, 20])), "evening");
  assert.equal(usualPart(sessions(defaultMemory(), [8, 14, 20, 2, 9, 15, 21, 3])), null); // no favourite
});

test("habit lines only appear at that time of day, and never invent a memory", () => {
  const m = sessions(defaultMemory(), [20, 21, 19, 20, 22, 20, 18, 20]);
  assert.ok(memLine("habit", m, ctx({ hour: 20 })));
  assert.equal(memLine("habit", m, ctx({ hour: 9 })), null);
  assert.equal(memLine("habit", defaultMemory(), ctx()), null);
  assert.equal(memLine("greet", defaultMemory(), ctx()), null); // does not know the name
  assert.equal(memLine("named", defaultMemory(), ctx()), null);
  assert.equal(memLine("away", m, ctx({ absentDays: 1 })), null);
});

test("lines use the stored names and never leave a placeholder behind", () => {
  let m = setName(setName(defaultMemory(), "petName", "Bông"), "callMe", "Vinh");
  const t = memLine("greet", m, ctx(), () => 0)!;
  assert.ok(t.includes("Vinh"));
  assert.ok(memLine("named", m, ctx(), () => 0)!.includes("Bông"));
  for (const lang of ["en", "vi", "ja"] as const)
    for (const k of memKeys(lang)) {
      const kind = (k === "greet" || k === "away" || k === "named" || k === "calledMe" || k === "pet" || k.startsWith("mark.") ? k : "habit") as never;
      m = { ...m, sessions: 20, hours: Array(24).fill(0).map((_, h) => (h === 20 ? 20 : 0)) };
      const out = memLine(kind, m, { lang, gentle: false, hour: 20, absentDays: 3, n: 30 });
      if (out) assert.ok(!/[{}]/.test(out), out);
    }
});

test("without a name, lines that need one are skipped, not broken", () => {
  const m = defaultMemory();
  assert.equal(memLine("greet", m, ctx()), null);
  const away = memLine("away", m, ctx({ absentDays: 4 }), () => 0.99);
  assert.ok(away === null || !away.includes("  "));
});

test("gentle tone drops sarcastic lines", () => {
  const m = setName(defaultMemory(), "callMe", "Vinh");
  for (let i = 0; i < 30; i++) {
    const t = memLine("greet", m, ctx({ gentle: true }), () => i / 30)!;
    assert.ok(!t.includes("almost got used"));
  }
});

test("pools: every language, short lines, no duplicates", () => {
  assert.deepEqual(memKeys("en").sort(), memKeys("vi").sort());
  assert.deepEqual(memKeys("en").sort(), memKeys("ja").sort());
  for (const lang of ["en", "vi", "ja"] as const) {
    const all = allMemTexts(lang);
    assert.equal(new Set(all).size, all.length);
    for (const t of all) assert.ok(t.length <= 110, t);
  }
});

test("milestones come once, in order, and only when reached", () => {
  let m = defaultMemory();
  assert.equal(nextMark(m), null);
  m = { ...m, days: 7 };
  assert.equal(nextMark(m), "days.7");
  m = shareMark(m, "days.7", 1);
  assert.equal(nextMark(m), null);
  m = shareMark(m, "days.7", 2);
  assert.equal(m.marks.length, 1);
  m = { ...m, touches: { poke: 60, scratch: 40, chat: 1 } };
  assert.equal(nextMark(m), "touch.100");
});

test("asking for a name is polite: not on day one, twice at most, spaced out", () => {
  const now = at(2026, 11, 10, 12);
  let m = defaultMemory();
  assert.equal(shouldAsk(m, "name", now, 0, 3), false);
  assert.equal(shouldAsk(m, "name", now, 2, 1), true);
  m = recordAsked(m, "name", now);
  assert.equal(shouldAsk(m, "name", now + 3_600_000, 2, 1), false); // too soon
  assert.equal(shouldAsk(m, "name", now + 3 * 86_400_000, 5, 1), true);
  m = recordAsked(m, "name", now + 3 * 86_400_000);
  assert.equal(shouldAsk(m, "name", now + 30 * 86_400_000, 40, 4), false); // twice is enough
  assert.equal(shouldAsk(setName(defaultMemory(), "petName", "A"), "name", now, 9, 4), false);
});

test("how to address the user is asked after the pet is named", () => {
  const now = at(2026, 11, 10, 12);
  assert.equal(shouldAsk(defaultMemory(), "callMe", now, 2, 1), false);
  assert.equal(shouldAsk(setName(defaultMemory(), "petName", "Bông"), "callMe", now, 2, 1), true);
  assert.equal(shouldAsk(defaultMemory(), "callMe", now, 3, 1), true);
});

test("forgetting", () => {
  let m = sessions(defaultMemory(), [20, 20, 20]);
  m = setName(setName(m, "petName", "Bông"), "callMe", "Vinh");
  m = recordTouch(m, "poke");
  const h = forgetHabits(m);
  assert.equal(h.sessions, 0);
  assert.equal(h.touches.poke, 0);
  assert.equal(h.petName, "Bông");
  const a = forgetAll({ ...m, learn: false });
  assert.equal(a.petName, "");
  assert.equal(a.callMe, "");
  assert.equal(a.learn, false);
});

import { addFacts, countChat, knownFor, removeFact, setFact, forgetFacts, EXTRACT_EVERY, MAX_FACTS } from "./memory.ts";

let idn = 0;
const nid = () => `f${++idn}`;

test("facts are deduplicated, bounded and cleaned", () => {
  let m = addFacts(defaultMemory(), ["Likes jazz", "likes jazz a lot", "Has a cat named Mun", "ab", "x\u0000y z <b>"], 1, nid);
  assert.deepEqual(m.facts.map((f) => f.text), ["Likes jazz", "Has a cat named Mun", "x y z b"]);
  for (let i = 0; i < 40; i++) m = addFacts(m, [`aa${i}x bb${i}y cc${i}z`], 2, nid);
  assert.equal(m.facts.length, MAX_FACTS);
  assert.equal(m.facts[MAX_FACTS - 1].text, "aa39x bb39y cc39z");
});

test("the user can edit and delete facts; an empty edit deletes", () => {
  let m = addFacts(defaultMemory(), ["Likes jazz", "Plays chess"], 1, () => "a");
  m = { ...m, facts: m.facts.map((f, i) => ({ ...f, id: `id${i}` })) };
  assert.equal(setFact(m, "id0", " Likes blues ").facts[0].text, "Likes blues");
  assert.equal(setFact(m, "id0", "  ").facts.length, 1);
  assert.equal(removeFact(m, "id1").facts.length, 1);
  assert.equal(forgetFacts(m).facts.length, 0);
});

test("facts are looked for every few messages, and never when switched off", () => {
  let m = defaultMemory();
  let due = false;
  for (let i = 0; i < EXTRACT_EVERY; i++) ({ memory: m, due } = countChat(m));
  assert.equal(due, true);
  const off = { ...defaultMemory(), aiLearn: false };
  assert.equal(countChat(off).due, false);
  assert.deepEqual(addFacts(off, ["Likes jazz"], 1, nid).facts, []);
});

test("only what the model may know is sent: names and, when on, the facts", () => {
  const m = addFacts(setName(setName(defaultMemory(), "callMe", "Vinh"), "petName", "Bông"), ["Likes jazz"], 1, nid);
  assert.deepEqual(knownFor(m, "en"), ["call the user Vinh", "your own name is Bông", "Likes jazz"]);
  assert.deepEqual(knownFor({ ...m, aiLearn: false }, "en"), ["call the user Vinh", "your own name is Bông"]);
  assert.deepEqual(knownFor(defaultMemory(), "vi"), []);
  assert.deepEqual(knownFor({ ...m, aiLearn: false }, "ja"), ["ユーザーを「Vinh」と呼ぶ", "あなた（ペット）の名前は「Bông」"]);
});

test("forgetting habits keeps facts; forgetting everything removes them", () => {
  const m = addFacts(sessions(defaultMemory(), [20, 20]), ["Likes jazz"], 1, nid);
  assert.equal(forgetHabits(m).facts.length, 1);
  assert.equal(forgetAll(m).facts.length, 0);
  assert.equal(parseMemory(JSON.stringify(m)).facts.length, 1);
});

import { same, tidyFacts } from "./memory.ts";

test("paraphrases and the model's third-person format are not stored twice", () => {
  assert.ok(same("Nuôi một con mèo tên là Peak", "nuôi một con mèo tên là peak"));
  assert.ok(same("Đang học nấu ăn", "Đang học nấu món ăn"));
  assert.ok(!same("Likes jazz", "Plays chess"));
  const m = addFacts(defaultMemory(), ["USER owns a cat named Peak", "The user has a daughter", "Có một con mèo tên Peak", "Đang học nấu ăn", "Đang học nấu món ăn"], 1, nid);
  assert.deepEqual(m.facts.map((f) => f.text), ["Có một con mèo tên Peak", "Đang học nấu ăn"]);
});

test("an old store is tidied when loaded: no USER-format facts, no repeats", () => {
  const raw = JSON.stringify({
    facts: [
      { id: "1", text: "Nuôi một con mèo tên là Peak", t: 1 },
      { id: "2", text: "USER owns a cat named Peak", t: 2 },
      { id: "3", text: "USER has a daughter", t: 3 },
      { id: "4", text: "Đang tự code cho pet desktop", t: 4 },
      { id: "5", text: "Đang tự code cho pet desktop", t: 5 },
    ],
  });
  assert.deepEqual(parseMemory(raw).facts.map((f) => f.id), ["1", "4"]);
  assert.deepEqual(tidyFacts([]), []);
});

test("an old memory file with a streak and a longest absence loads without them (spec 12)", () => {
  const old = JSON.stringify({ ...defaultMemory(), bestStreak: 9, longestAwayDays: 40 });
  const m = parseMemory(old) as unknown as Record<string, unknown>;
  assert.ok(!("bestStreak" in m) && !("longestAwayDays" in m));
});
