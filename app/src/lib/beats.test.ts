import { test } from "node:test";
import assert from "node:assert/strict";
import { BEATS, STARTLE, beatMs, wordsAtMs } from "./beats.ts";
import { chooseBeat, distance } from "./choose.ts";
import { EVENTS, MOOD_APPRAISAL } from "./events.ts";
import { MOODS, moodPose } from "./sprites.ts";
import { LINES } from "./lines.ts";
import { candidates } from "./selector.ts";
import type { Lang } from "./lines.ts";

const POSES = ["idle", "look", "walk", "sleep", "held", "happy", "think", "land", "drowsy", "purr", "huff", "nod", "smirk", "gasp", "notice", "curious", "sad", "wake"];
const range = (x: number, lo: number, hi: number) => x >= lo && x <= hi;

test("the startle: the body moves first, the words come 100 to 300 ms into the jolt, and the action follows within 1.5 s", () => {
  assert.equal(STARTLE.steps[0].sayAt, undefined, "no words in the freeze");
  const at = wordsAtMs(STARTLE)!;
  assert.ok(at >= 150, "words come after the freeze");
  assert.ok(at - STARTLE.steps[0].ms >= 100 && at - STARTLE.steps[0].ms <= 300, "100 to 300 ms after the jolt begins");
  assert.ok(beatMs(STARTLE) <= 1500);
});

test("every beat uses existing poses, has a home inside the appraisal ranges, and the words never come first or late", () => {
  for (const b of BEATS) {
    for (const s of b.steps) {
      assert.ok(POSES.includes(s.pose), `${b.id}: ${s.pose}`);
      assert.ok(s.ms > 0);
    }
    const h = b.home;
    assert.ok(range(h.surprise, 0, 1) && range(h.arousal, 0, 1) && range(h.aboutUser, 0, 1) && range(h.control, 0, 1) && range(h.valence, -1, 1), b.id);
    const at = wordsAtMs(b);
    if (at !== null) assert.ok(at >= 100 && at <= 600, `${b.id}: words ${at} ms after the body moves`);
  }
  assert.equal(new Set(BEATS.map((b) => b.id)).size, BEATS.length);
});

test("no two beats sit on the same point, so a choice is never arbitrary", () => {
  for (let i = 0; i < BEATS.length; i++)
    for (let j = i + 1; j < BEATS.length; j++) assert.ok(distance(BEATS[i].home, BEATS[j].home) > 0.02, `${BEATS[i].id} and ${BEATS[j].id} are too close`);
});

test("each event is shown with the beat it was shown with before the beats existed", () => {
  const first = (id: keyof typeof EVENTS) => chooseBeat(EVENTS[id].appraisal);
  assert.equal(first("poked").id, "perk");
  assert.equal(first("poked").steps[0].pose, "happy");
  assert.equal(first("scratched").steps[0].pose, "happy");
  assert.equal(first("named").steps[0].pose, "happy");
  assert.equal(first("belly_enjoyed").steps[0].pose, "purr");
  assert.equal(first("belly_trap").steps[0].pose, "huff");
  assert.equal(first("ground_lost").id, "startle");
  // and with the same delay between the body and the words as before (RX-3a)
  assert.equal(wordsAtMs(first("poked")), 150);
  assert.equal(wordsAtMs(first("scratched")), 200);
  assert.equal(wordsAtMs(first("belly_enjoyed")), 500);
  assert.equal(wordsAtMs(first("belly_trap")), 250);
});

test("the six feelings of a brain's mood tag are points of the same space and give the pose they gave before", () => {
  for (const m of MOODS) {
    const b = chooseBeat(MOOD_APPRAISAL[m]);
    assert.equal(b.steps[0].pose, moodPose(m, false), `${m} -> ${b.id}`);
  }
  assert.equal(new Set(MOODS.map((m) => chooseBeat(MOOD_APPRAISAL[m]).id)).size, MOODS.length, "seven feelings, seven different beats");
});

test("a choice is deterministic, and an unknown point still gets a beat", () => {
  const ap = { surprise: 0.5, valence: 0, arousal: 0.5, aboutUser: 0.5, control: 0.5 };
  assert.equal(chooseBeat(ap).id, chooseBeat({ ...ap }).id);
  assert.ok(BEATS.includes(chooseBeat({ surprise: 5, valence: -9, arousal: 7, aboutUser: 2, control: -3 })));
});

test("every event's words come from a pool that exists in all three languages, with stage lines where it repeats", () => {
  for (const ev of Object.values(EVENTS)) {
    if (ev.words === null) continue;
    for (const lang of ["vi", "en", "ja"] as Lang[]) {
      assert.ok(candidates(ev.words, { lang, tier: 2, band: "content", hour: 12, gentle: true }).length > 0, `${ev.id} ${lang}`);
      if (ev.repeat) assert.ok(LINES.some((l) => l.lang === lang && l.trigger === ev.words && l.stage === 2), `${ev.id} ${lang} has no stage lines`);
    }
  }
});
