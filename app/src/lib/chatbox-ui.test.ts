import { test } from "node:test";
import assert from "node:assert/strict";
import { BOX_UI, boxStrings, slashLabel } from "./chatbox-ui.ts";
import { slashItems } from "./chatbox.ts";

test("every language has every word, and the names of the pets are never translated", () => {
  const keys = Object.keys(BOX_UI.en).sort();
  for (const l of ["vi", "ja"] as const) {
    assert.deepEqual(Object.keys(BOX_UI[l]).sort(), keys, l);
    assert.deepEqual(Object.keys(BOX_UI[l].slash).sort(), Object.keys(BOX_UI.en.slash).sort(), `${l} slash`);
    for (const [k, v] of Object.entries(BOX_UI[l])) if (typeof v === "string") assert.ok(v.trim().length > 0, `${l}.${k}`);
  }
  for (const l of ["vi", "en", "ja"] as const) {
    assert.match(BOX_UI[l].slash.outPaws, /Paws/);
    assert.match(BOX_UI[l].slash.inPeak, /Peak/);
    assert.ok(BOX_UI[l].say.length > 3 && !/Peak|Paws/.test(BOX_UI[l].say), "one simple line that names nobody");
    assert.match(BOX_UI[l].writing, /\{name\}/);
  }
});

test("an unknown language falls back to English; the slash labels follow the language", () => {
  assert.equal(boxStrings("fr").today, "Today");
  assert.equal(boxStrings(undefined).today, "Today");
  assert.equal(boxStrings("vi").today, "Hôm nay");
  const items = slashItems("", { peak: true, paws: false });
  assert.deepEqual(items.map((i) => slashLabel(boxStrings("vi"), i)), ["Gọi Paws ra", "Cho Peak vào", "Giữ hộp luôn mở", "Xóa cuộc trò chuyện này"]);
  assert.equal(slashLabel(boxStrings("vi"), slashItems("name Vinh", { peak: true, paws: true })[0]), "Hãy gọi tôi là Vinh");
  assert.equal(slashLabel(boxStrings("ja"), slashItems("name Vinh", { peak: true, paws: true })[0]), "Vinhと呼んで");
});
