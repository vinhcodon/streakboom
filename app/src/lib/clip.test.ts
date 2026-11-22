import { test } from "node:test";
import assert from "node:assert/strict";
import { clipReply, docLang, nfc } from "./clip.ts";

test("a short reply is shown whole, in one form of the letters", () => {
  assert.equal(clipReply("Chào bạn!", 240), "Chào bạn!");
  assert.equal(clipReply("  Hello  ", 240), "Hello");
  const decomposed = "Việt".normalize("NFD");
  assert.equal(clipReply(decomposed, 240), "Việt".normalize("NFC"));
});

test("a long reply is cut after the last whole sentence that fits, without an ellipsis", () => {
  const s = "Mình nghe rồi. Hôm nay bạn làm việc nhiều, nên nghỉ một chút nhé. Còn nếu bạn muốn nói tiếp thì mình ở đây, không vội đâu, cứ từ từ.";
  const r = clipReply(s, 70);
  assert.equal(r, "Mình nghe rồi. Hôm nay bạn làm việc nhiều, nên nghỉ một chút nhé.");
  assert.ok(!r.endsWith("…"));
});

test("with no sentence end that fits, it is cut at a word and says so", () => {
  const s = "một hai ba bốn năm sáu bảy tám chín mười mười một mười hai mười ba mười bốn mười lăm";
  const r = clipReply(s, 40);
  assert.ok(r.endsWith("…") && r.length <= 40, r);
  assert.ok(!r.slice(0, -1).endsWith(" "), "no blank before the ellipsis");
  assert.ok(s.startsWith(r.slice(0, -1)), "what is kept is the start of the text, whole words");
});

test("full-width stops end a sentence, and a text with no blanks is cut at the limit", () => {
  const ja = "今日はおつかれさま。ゆっくり休んでね。明日もいっしょにがんばろう。";
  assert.equal(clipReply(ja, 20), "今日はおつかれさま。ゆっくり休んでね。");
  const solid = "あ".repeat(100);
  const r = clipReply(solid, 30);
  assert.equal(r.length, 30);
  assert.ok(r.endsWith("…"));
});

test("a pair of surrogates is not cut in two", () => {
  const s = "a".repeat(38) + "😀😀😀 tail";
  const r = clipReply(s, 39);
  for (const ch of r) assert.notEqual(ch, "�");
  assert.ok(!/[\ud800-\udbff]…$/.test(r), "no half pair before the ellipsis");
});

test("the language of a window follows the text", () => {
  assert.equal(docLang("Gọi Paws ra, xóa cuộc trò chuyện"), "vi");
  assert.equal(docLang("tranh duong"), "en");
  assert.equal(docLang("どいて"), "ja");
  assert.equal(docLang("Hello there"), "en");
  assert.equal(nfc("ê"), "ê");
});
