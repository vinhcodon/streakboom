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

import { applyMention, mentionItems, mentionsIn, mentionToken, recallStep, slashItems, withMention } from "./chatbox.ts";

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

test("a double click writes @Name in front when both are out, and replaces a mention that is already at the start, keeping the rest", () => {
  const both = { peak: true, paws: true };
  assert.equal(withMention("", "paws", both), "@Paws ");
  assert.equal(withMention("hello", "peak", both), "@Peak hello");
  assert.equal(withMention("@Paws ", "peak", both), "@Peak "); // Paws then Peak: the field says Peak
  assert.equal(withMention("@Paws hello", "peak", both), "@Peak hello");
  assert.equal(withMention("@everyone hello @Paws", "paws", both), "@Paws hello @Paws"); // only the mentions at the start are replaced
  assert.equal(withMention("@Paws @Peak hi", "peak", both), "@Peak hi");
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

import { readFileSync } from "node:fs";
import { settled } from "./chatbox.ts";

test("while a word is composed the list and the height follow the last settled text; afterwards the field", () => {
  assert.equal(settled("/ou", "/ouu", true), "/ou");
  assert.equal(settled("/ou", "/out", false), "/out");
  assert.equal(settled("", "chào", true), "");
});

test("the box page names its language, has a full font stack, shows text after nfc, and leaves the field alone between composition start and end", () => {
  const page = readFileSync(new URL("../routes/chatbox/+page.svelte", import.meta.url), "utf8");
  assert.ok(/document\.documentElement\.lang\s*=\s*view\.lang/.test(page), "lang is set from the chosen language");
  assert.ok(page.includes('"Segoe UI", "Segoe UI Variable Text", "Noto Sans", Arial, sans-serif'), "the font stack");
  assert.ok(page.includes("nfc(l.text)"), "every line is shown after nfc");
  assert.ok(page.includes("oncompositionstart") && page.includes("oncompositionend"), "composition is handled");
  assert.ok(/function grow\(\) \{\s*if \(!input \|\| composing\) return;/.test(page), "the height is not touched while composing");
  assert.ok(page.includes("settled(settledDraft, draft, composing)"), "the list follows the settled draft");
});

test("a mention being typed: found before the caret, offered by its first letters, and replaced when chosen", () => {
  assert.deepEqual(mentionToken("hello @pa", 9), { start: 6, query: "pa" });
  assert.deepEqual(mentionToken("@", 1), { start: 0, query: "" });
  assert.equal(mentionToken("mail me@pa", 10), null, "an @ inside a word is not a mention");
  assert.equal(mentionToken("hello @Paws and", 15), null, "the caret is past the mention");
  const both = { peak: true, paws: true };
  assert.deepEqual(mentionItems("", both).map((i) => i.id), ["peak", "paws", "everyone"]);
  assert.deepEqual(mentionItems("p", both).map((i) => i.id), ["peak", "paws"]);
  assert.deepEqual(mentionItems("ev", both).map((i) => i.id), ["everyone"]);
  assert.deepEqual(mentionItems("al", both).map((i) => i.id), ["everyone"], "all finds everyone");
  assert.equal(mentionItems("peak", { peak: false, paws: true })[0].resting, true, "a pet that is in is marked resting");
  const t = mentionToken("hello @pa world", 9)!;
  assert.deepEqual(applyMention("hello @pa world", 9, t, mentionItems("pa", both)[0]), { text: "hello @Paws world", caret: 12 });
});

test("a name already in the message is not offered again; everyone is not offered once anyone is named", () => {
  const both = { peak: true, paws: true };
  const tok = (d: string) => mentionToken(d, d.length)!;
  const offered = (d: string) => mentionItems(tok(d).query, both, mentionsIn(d, tok(d))).map((i) => i.id);
  assert.deepEqual(offered("@Peak @"), ["paws"], "Peak is already there; everyone adds nothing");
  assert.deepEqual(offered("@Peak @p"), ["paws"]);
  assert.deepEqual(offered("@Peak @Paws @"), [], "both named: nothing left");
  assert.deepEqual(offered("@everyone @"), [], "everyone named: nothing more");
  assert.deepEqual(offered("hello @"), ["peak", "paws", "everyone"]);
  assert.deepEqual(offered("@Paws hello @pe"), ["peak"], "a name earlier in the message counts");
  assert.deepEqual([...mentionsIn("@peak and @Paws, @all", null)].sort(), ["everyone", "paws", "peak"]);
  assert.deepEqual([...mentionsIn("mail me@peak.com", null)], [], "an @ inside a word is not a mention");
  assert.deepEqual([...mentionsIn("@Peaks hi", null)], [], "@Peaks is not @Peak");
});

test("the pin command shows the way that is possible now, and /unpin finds it (ADR-0157)", () => {
  const away = { peak: true, paws: false };
  assert.deepEqual(slashItems("pin", away, false).map((i) => i.id), ["pin"]);
  assert.deepEqual(slashItems("pin", away, true).map((i) => i.id), [], "pinned: the list offers the way back, not pin again");
  assert.deepEqual(slashItems("unpin", away, true).map((i) => i.id), ["unpin"]);
  assert.deepEqual(slashItems("unpin", away, false).map((i) => i.id), [], "not pinned: nothing to undo");
  assert.deepEqual(slashItems("bo ghim", away, true).map((i) => i.id), ["unpin"]);
  assert.equal(slashItems("", away, true).find((i) => i.id === "unpin")?.act.kind, "pin", "the same toggle behind both");
});
