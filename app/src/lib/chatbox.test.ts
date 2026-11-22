import { test } from "node:test";
import assert from "node:assert/strict";
import { TIME_GAP_MS, groupTurns, timeLabel, type BoxTurn } from "./chatbox.ts";

const t = (id: number, who: BoxTurn["who"], text: string, at: number): BoxTurn => ({ id, who, text, at });

test("turns of one speaker in a row are one group, a new speaker is a new group", () => {
  const items = groupTurns([t(1, "person", "hi", 1000), t(2, "person", "how are you", 2000), t(3, "peak", "fine", 3000), t(4, "paws", "splendid", 4000), t(5, "person", "ok", 5000)]);
  assert.deepEqual(items.map((i) => (i.kind === "group" ? `${i.who}:${i.lines.length}` : "time")), ["time", "person:2", "peak:1", "paws:1", "person:1"]);
});

test("a time comes first and after a long gap, not between close turns", () => {
  const items = groupTurns([t(1, "person", "a", 0), t(2, "peak", "b", 1000), t(3, "person", "c", 1000 + TIME_GAP_MS + 1)]);
  assert.deepEqual(items.map((i) => i.kind), ["time", "group", "group", "time", "group"]);
});

test("a speaker coming back after a long gap starts a new group even if it is the same one", () => {
  const items = groupTurns([t(1, "peak", "a", 0), t(2, "peak", "b", TIME_GAP_MS + 5)]);
  assert.deepEqual(items.map((i) => i.kind), ["time", "group", "time", "group"]);
});

test("no turns, no items", () => assert.deepEqual(groupTurns([]), []));

test("the time label says Today for the same day", () => {
  const noon = new Date(2026, 10, 22, 12, 30).getTime();
  assert.match(timeLabel(noon, noon + 60_000, "en-GB", "Today"), /^Today 12:30$/);
  assert.doesNotMatch(timeLabel(noon - 2 * 24 * 3600_000, noon, "en-GB", "Today"), /Today/);
});
