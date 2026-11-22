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

import { recallStep, slashItems, withMention } from "./chatbox.ts";

test("the slash list offers only what can happen, and a start of a verb in English, Vietnamese or Japanese is enough", () => {
  const away = { peak: true, paws: false };
  assert.deepEqual(slashItems("", away).map((i) => i.id), ["out-paws", "in-peak", "pin", "clear"]);
  assert.deepEqual(slashItems("ca", away).map((i) => i.id), ["out-paws"]);
  assert.deepEqual(slashItems("gọi", away).map((i) => i.id), ["out-paws"]); // Vietnamese, with the marks
  assert.deepEqual(slashItems("goi paws", away).map((i) => i.id), ["out-paws"]); // and without
  assert.deepEqual(slashItems("goi peak", away).map((i) => i.id), []); // Peak is out: nothing to call
  assert.deepEqual(slashItems("ghim", away).map((i) => i.id), ["pin"]);
  assert.deepEqual(slashItems("xóa", away).map((i) => i.id), ["clear"]);
  assert.deepEqual(slashItems("固定", away).map((i) => i.id), ["pin"]);
  const both = { peak: true, paws: true };
  assert.deepEqual(slashItems("in", both).map((i) => i.id), ["in-paws", "in-peak"]);
  assert.deepEqual(slashItems("vào pa", both).map((i) => i.id), ["in-paws"]);
  assert.deepEqual(slashItems("zzz", both), []);
});

test("arrow up and down step through what was sent, and past the newest the field is empty again", () => {
  const list = ["one", "two", "three"];
  let r = recallStep(list, -1, -1); assert.deepEqual(r, { idx: 2, text: "three" });
  r = recallStep(list, r.idx, -1); assert.deepEqual(r, { idx: 1, text: "two" });
  r = recallStep(list, 0, -1); assert.deepEqual(r, { idx: 0, text: "one" }); // stays at the oldest
  r = recallStep(list, 1, 1); assert.deepEqual(r, { idx: 2, text: "three" });
  r = recallStep(list, 2, 1); assert.deepEqual(r, { idx: -1, text: "" });
  assert.deepEqual(recallStep(list, -1, 1), { idx: -1, text: null }); // down with nothing recalled: nothing
  assert.deepEqual(recallStep([], -1, -1), { idx: -1, text: null });
});

test("a double click writes @Name in front only when both are out and no mention is there already", () => {
  const both = { peak: true, paws: true };
  assert.equal(withMention("", "paws", both), "@Paws ");
  assert.equal(withMention("hello", "peak", both), "@Peak hello");
  assert.equal(withMention("@Paws hello", "peak", both), "@Paws hello"); // already a mention: not changed
  assert.equal(withMention("", "paws", { peak: true, paws: false }), ""); // one out: nobody to pick
  assert.equal(withMention("", "peak", { peak: false, paws: false }), "");
});

import { comboFromEvent } from "./chatbox.ts";

test("a pressed combination becomes the text of a global shortcut, or nothing when it cannot be one", () => {
  const ev = (code: string, o: Partial<{ ctrlKey: boolean; altKey: boolean; shiftKey: boolean; metaKey: boolean }> = {}) => ({ ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, code, ...o });
  assert.equal(comboFromEvent(ev("KeyP", { ctrlKey: true, altKey: true })), "Ctrl+Alt+P");
  assert.equal(comboFromEvent(ev("KeyP", { shiftKey: true, altKey: true, ctrlKey: true })), "Ctrl+Alt+Shift+P");
  assert.equal(comboFromEvent(ev("Digit7", { ctrlKey: true })), "Ctrl+7");
  assert.equal(comboFromEvent(ev("F5", { altKey: true })), "Alt+F5");
  assert.equal(comboFromEvent(ev("Space", { ctrlKey: true })), "Ctrl+Space");
  assert.equal(comboFromEvent(ev("KeyP")), null); // no modifier
  assert.equal(comboFromEvent(ev("KeyP", { shiftKey: true })), null); // Shift alone takes a letter from typing
  assert.equal(comboFromEvent(ev("ControlLeft", { ctrlKey: true })), null); // a bare modifier
  assert.equal(comboFromEvent(ev("Enter", { ctrlKey: true })), null); // a key that is not allowed
  assert.equal(comboFromEvent(ev("F13", { ctrlKey: true })), null);
});

import { nameFromSlash } from "./chatbox.ts";

test("/name takes the name after the verb and keeps its case; the list then offers that one command", () => {
  assert.equal(nameFromSlash("name Vinh"), "Vinh");
  assert.equal(nameFromSlash("tên Vinh Codon"), "Vinh Codon");
  assert.equal(nameFromSlash("name"), null);
  assert.equal(nameFromSlash("pin"), null);
  const both = { peak: true, paws: true };
  assert.deepEqual(slashItems("name Vinh", both).map((i) => [i.id, i.act]), [["name", { kind: "name", value: "Vinh" }]]);
  assert.ok(!slashItems("", both).some((i) => i.id === "name")); // not in the plain list: it needs a name
});
