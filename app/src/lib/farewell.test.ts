import { test } from "node:test";
import assert from "node:assert/strict";
import { AWAY_MINUTES, FAREWELLS, FAREWELL_BUBBLE_MS, LEAVE_DEADLINE_MAX_MS, LEAVE_DEADLINE_MIN_MS, LEAVE_PACE_PX_S, RETRY_SECS, leaveDeadlineMs, isLeaveCommand, mayLeave, nearerEdge, pickFarewell, type FarewellLang, type LeaveGate } from "./farewell.ts";
import { BANNED } from "./banned.ts";

const LANGS: FarewellLang[] = ["vi", "en", "ja"];

test("every language has at least five goodbyes, short, all different", () => {
  for (const lang of LANGS) {
    const pool = FAREWELLS[lang];
    assert.ok(pool.length >= 5, `${lang}: ${pool.length}`);
    assert.equal(new Set(pool).size, pool.length, `${lang}: a line is repeated`);
    for (const t of pool) {
      assert.ok(t.length >= 4 && t.length <= 60, `${lang}: "${t}" is ${t.length} characters`);
      assert.equal(t, t.trim());
    }
  }
});

test("no goodbye counts an absence, misses the person, is lonely, keeps a streak or begs (the banned patterns of the other lines)", () => {
  for (const lang of LANGS) for (const t of FAREWELLS[lang]) for (const re of BANNED[lang]) assert.ok(!re.test(t), `${lang}: "${t}" matches ${re}`);
});

test("no goodbye promises a return, names a time, asks the person for anything or speaks of itself as a program", () => {
  const no: RegExp[] = [
    /quay lại|trở lại|sớm thôi|lát nữa quay|đợi mình|chờ mình|phút|giờ/i,
    /come back|be back|back soon|see you soon|wait for me|minutes?|hours?|\bsoon\b/i,
    /戻って|戻る|すぐ帰|待って|分|時間|またすぐ/,
    /\b(AI|program|assistant|chatbot)\b|trợ lý|プログラム|アシスタント/i,
    /\?|？/,
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|#\w/u,
  ];
  for (const lang of LANGS) for (const t of FAREWELLS[lang]) for (const re of no) assert.ok(!re.test(t), `${lang}: "${t}" matches ${re}`);
});

test("a goodbye is never the one just said, and the choice follows the random number", () => {
  for (const lang of LANGS) {
    const pool = FAREWELLS[lang];
    for (const last of pool) for (const r of [0, 0.5, 0.999]) assert.notEqual(pickFarewell(lang, last, () => r), last);
    assert.equal(pickFarewell(lang, null, () => 0), pool[0]);
    assert.equal(pickFarewell(lang, null, () => 0.999), pool[pool.length - 1]);
    assert.ok(pool.includes(pickFarewell(lang, "something else")));
  }
});

test("the numbers are the ones the author chose (20 minutes, ADR-0086) and sane", () => {
  assert.equal(AWAY_MINUTES, 20);
  assert.ok(FAREWELL_BUBBLE_MS >= 1500 && FAREWELL_BUBBLE_MS <= 4000);
  assert.ok(LEAVE_DEADLINE_MIN_MS >= 5000 && LEAVE_DEADLINE_MAX_MS <= 30_000 && LEAVE_DEADLINE_MIN_MS < LEAVE_DEADLINE_MAX_MS);
  assert.equal(LEAVE_PACE_PX_S, 110);
  assert.ok(RETRY_SECS >= 60 && RETRY_SECS <= 900);
});

test("only an exact phrase to go away is the command; other skills and long sentences are not", () => {
  for (const t of ["lượn đi", "luon di nhe", "go away", "Go away please", "消えて", "đi chỗ khác chơi"]) assert.equal(isLeaveCommand(t), true, t);
  for (const t of ["đi ngủ đi", "im đi", "quay lại đi", "go to sleep", "hôm nay tôi lượn đi họp", "lượn đi?", "", "hello", "go play outside"]) assert.equal(isLeaveCommand(t), false, t);
});

const ok: LeaveGate = { quiet: false, held: false, flying: false, away: false, leaving: false };

test("Peak may leave on any build (ADR-0100), but not in Quiet mode, carried, in the air, away or already leaving", () => {
  assert.equal(mayLeave(ok), true);
  for (const k of ["quiet", "held", "flying", "away", "leaving"] as const) assert.equal(mayLeave({ ...ok, [k]: true }), false, k);
});

test("the nearer side edge: left when less room on the left, else right", () => {
  assert.equal(nearerEdge(40, 900), -1);
  assert.equal(nearerEdge(900, 40), 1);
  assert.equal(nearerEdge(300, 300), 1);
  assert.equal(nearerEdge(0, 0), 1);
});

test("the time given to the walk to the edge comes from the distance and always leaves room to get there (ADR-0101)", () => {
  // the walk could cover the whole distance within the time, for every distance up to what the longest deadline allows
  for (const room of [0, 30, 100, 430, 640, 960, 1300, 1600, 2000]) {
    const ms = leaveDeadlineMs(room);
    assert.ok(ms >= LEAVE_DEADLINE_MIN_MS && ms <= LEAVE_DEADLINE_MAX_MS, `${room}: ${ms}`);
    assert.ok((ms / 1000) * LEAVE_PACE_PX_S >= room, `${room} px in ${ms} ms at ${LEAVE_PACE_PX_S} px/s`);
  }
  // the numbers, so that a change is a decision
  assert.equal(leaveDeadlineMs(0), 6000);
  assert.equal(leaveDeadlineMs(100), 6000);
  assert.equal(leaveDeadlineMs(430), 7082);
  assert.equal(leaveDeadlineMs(1300), 17364);
  assert.equal(leaveDeadlineMs(5000), 20_000);
  // a farther edge never gets a shorter time
  let last = 0;
  for (let room = 0; room <= 3000; room += 50) {
    const ms = leaveDeadlineMs(room);
    assert.ok(ms >= last, `${room}`);
    last = ms;
  }
  // nonsense in, sane out
  for (const bad of [NaN, Infinity, -5, -Infinity]) {
    const ms = leaveDeadlineMs(bad as number);
    assert.ok(ms >= LEAVE_DEADLINE_MIN_MS && ms <= LEAVE_DEADLINE_MAX_MS, String(bad));
  }
});
