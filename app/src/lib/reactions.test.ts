import { test } from "node:test";
import assert from "node:assert/strict";
import { AUTO_GAP_MS, AUTO_PER_MINUTE, endReaction, mayReact, newGate, priorityOf, startReaction } from "./reactions.ts";
import { EVENTS, type EventDef } from "./events.ts";
import { moodBeat } from "./choose.ts";
import { MOODS, moodPose } from "./sprites.ts";
import { NOTICE, wordsAtMs } from "./beats.ts";

const auto = (id: string, cooldownMs = 20_000, surprise = 0.5): EventDef => ({ id: id as never, appraisal: { surprise, valence: 0, arousal: 0.5, aboutUser: 0, control: 0 }, words: null, automatic: true, cooldownMs });

test("a reaction the user caused is never held back, unless a higher one is under way", () => {
  let g = newGate();
  assert.equal(mayReact(g, EVENTS.poked, 1000), true);
  g = startReaction(g, EVENTS.ground_lost, 1000); // the fall (high priority) is under way
  assert.equal(mayReact(g, EVENTS.poked, 1500), false, "a poke does not break into the fall");
  g = endReaction(g, 2000);
  assert.equal(mayReact(g, EVENTS.poked, 2100), true);
});

test("a higher priority may break in on a lower one, an equal one may not", () => {
  const low = auto("low", 0, 0.1);
  const high = auto("high", 0, 0.9);
  let g = startReaction(newGate(), low, 0);
  assert.equal(mayReact(g, high, 10), true);
  assert.equal(mayReact(g, low, 10), false);
  assert.ok(priorityOf(high) > priorityOf(low));
});

test("an automatic reaction waits for its cool-down, for the gap after the last reaction and for the budget of a minute", () => {
  const e = auto("a", 20_000);
  let g = startReaction(newGate(), e, 0);
  g = endReaction(g, 1000);
  assert.equal(mayReact(g, e, 5_000), false, "inside the cool-down");
  assert.equal(mayReact(g, auto("b", 0), 1000 + AUTO_GAP_MS - 1), false, "inside the gap after the last reaction");
  assert.equal(mayReact(g, e, 21_000), true);
  // the budget
  let h = newGate();
  let t = 0;
  for (let i = 0; i < AUTO_PER_MINUTE; i++) {
    const x = auto("x" + i, 0);
    assert.equal(mayReact(h, x, t), true, `reaction ${i}`);
    h = endReaction(startReaction(h, x, t), t + 100);
    t += AUTO_GAP_MS + 200;
  }
  assert.equal(mayReact(h, auto("more", 0), t), false, "the minute's budget is used up");
  assert.equal(mayReact(h, auto("more", 0), 61_000 + 100), true, "a minute later it is back");
});

test("the fall is the highest-priority event and the only one Peak starts by itself", () => {
  const ranked = Object.values(EVENTS).sort((x, y) => priorityOf(y) - priorityOf(x));
  assert.equal(ranked[0].id, "ground_lost");
  assert.deepEqual(Object.values(EVENTS).filter((e) => e.automatic).map((e) => e.id), ["ground_lost"]);
});

test("the beat for a brain's mood gives the pose moodPose gave, for every mood, an unknown tag and the Gentle tone", () => {
  for (const gentle of [false, true]) {
    for (const m of [...MOODS, "weird", undefined, ""]) assert.equal(moodBeat(m, gentle).steps[0].pose, moodPose(m, gentle), `${m} gentle=${gentle}`);
  }
});

test("the notice lead-in is one short step with no words", () => {
  assert.equal(NOTICE.steps.length, 1);
  assert.equal(NOTICE.steps[0].pose, "notice");
  assert.ok(NOTICE.steps[0].ms >= 300 && NOTICE.steps[0].ms <= 600);
  assert.equal(wordsAtMs(NOTICE), null);
});
