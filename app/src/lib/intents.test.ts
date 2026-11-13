import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_WORDS, SKILLS, TABLE, clashes, evaluate, fold, matchIntent, mayBeCommand, normalize, type Sample, type Skill } from "./intents.ts";

const skillOf = (t: string) => matchIntent(t)?.skill ?? null;

test("a phrase of the table is recognised by its whole message, in the three languages", () => {
  assert.equal(skillOf("lượn đi"), "leave");
  assert.equal(skillOf("go away"), "leave");
  assert.equal(skillOf("消えて"), "leave");
  assert.equal(skillOf("quay lại đi"), "return");
  assert.equal(skillOf("come back"), "return");
  assert.equal(skillOf("戻って"), "return");
  assert.equal(skillOf("đi ngủ đi"), "sleep");
  assert.equal(skillOf("go to sleep"), "sleep");
  assert.equal(skillOf("おやすみ"), "sleep");
  assert.equal(skillOf("im đi"), "quiet");
  assert.equal(skillOf("be quiet"), "quiet");
  assert.equal(skillOf("静かに"), "quiet");
  assert.equal(matchIntent("lượn đi")?.kind, "exact");
});

test("go away and go to sleep are two different wishes", () => {
  assert.notEqual(skillOf("lượn đi"), skillOf("đi ngủ đi"));
  assert.equal(skillOf("đi ngủ đi"), "sleep");
  assert.equal(skillOf("đi chỗ khác chơi"), "leave");
});

test("Vietnamese is matched with and without its diacritics, in any case, with punctuation", () => {
  assert.equal(skillOf("luon di"), "leave");
  assert.equal(skillOf("LƯỢN ĐI!"), "leave");
  assert.equal(skillOf("  Lượn   đi... "), "leave");
  assert.equal(skillOf("di ngu di"), "sleep");
  assert.equal(skillOf("im lang di"), "quiet");
  assert.equal(fold("Đi ngủ đi"), "di ngu di");
});

test("polite endings are taken off", () => {
  assert.equal(skillOf("lượn đi nhé"), "leave");
  assert.equal(skillOf("lượn đi mà"), "leave");
  assert.equal(skillOf("go away please"), "leave");
  assert.equal(skillOf("消えてください"), "leave");
  assert.equal(skillOf("静かにね"), "quiet");
  assert.equal(skillOf("quay lại đi nha"), "return");
  assert.equal(skillOf("luon di nhe"), "leave", "an ending typed without its diacritics");
  assert.equal(skillOf("quay lai di nha"), "return");
});

test("full-width letters and the apostrophe of I'm back are folded", () => {
  assert.equal(skillOf("ＧＯ ＡＷＡＹ"), "leave");
  assert.equal(skillOf("I’m back"), "return");
  assert.equal(skillOf("i'm back"), "return");
  assert.equal(normalize("消えて　"), "消えて");
});

test("a sentence that only contains a command is not a command", () => {
  for (const t of [
    "hôm nay anh lượn đi họp",
    "tôi sẽ lượn đi một chút rồi quay lại",
    "I will go away for the weekend and come back on Monday",
    "the cat should go to sleep now because it is late",
    "あとで消えてほしいかも",
    "đi ngủ đi thôi muộn rồi mai còn họp sớm",
  ]) assert.equal(matchIntent(t), null, t);
});

test("a question is not a command", () => {
  for (const t of ["lượn đi?", "can you go away?", "go to sleep？", "消えて？"]) assert.equal(matchIntent(t), null, t);
  assert.equal(mayBeCommand("go away?"), false);
});

test("more than six words is never a command, even when it starts with a phrase", () => {
  assert.equal(MAX_WORDS, 6);
  assert.equal(matchIntent("go away go away go away go away"), null);
  assert.equal(mayBeCommand("one two three four five six"), true);
  assert.equal(mayBeCommand("one two three four five six seven"), false);
  assert.equal(matchIntent("消えてほしいときにはどこかへ行ってくださいお願いします"), null);
});

test("empty, punctuation only and unrelated messages match nothing", () => {
  for (const t of ["", "   ", "...", "?!", "hello", "xin chào", "こんにちは", "thanks", "ok", "123"]) assert.equal(matchIntent(t), null, JSON.stringify(t));
});

test("a pattern match is reported as a pattern (the app confirms before acting)", () => {
  assert.deepEqual(matchIntent("go play outside"), { skill: "leave", kind: "pattern" });
  assert.deepEqual(matchIntent("go and play"), { skill: "leave", kind: "pattern" });
  assert.equal(matchIntent("đi chỗ nào đó chơi")?.kind, "pattern");
});

test("no phrase belongs to two skills (the normal form and the form without diacritics)", () => {
  assert.deepEqual(clashes(), []);
  const seen = new Map<string, Skill>();
  for (const s of SKILLS) for (const p of TABLE[s].phrases) {
    const key = fold(normalize(p));
    assert.ok(!seen.has(key) || seen.get(key) === s, `${p} is in ${s} and ${seen.get(key)}`);
    seen.set(key, s);
  }
});

test("every phrase of the table is recognised as its own skill", () => {
  for (const s of SKILLS) for (const p of TABLE[s].phrases) assert.equal(skillOf(p), s, `${p} should be ${s}`);
});

test("every skill has phrases in the three languages", () => {
  const has = {
    vi: (p: string) => /[\u00C0-\u1EF9]/.test(p) || /^[a-z ]+$/.test(p),
    en: (p: string) => /^[a-z' ]+$/.test(p),
    ja: (p: string) => /[\u3040-\u30ff\u4e00-\u9fff]/.test(p),
  };
  for (const s of SKILLS) {
    assert.ok(TABLE[s].phrases.some(has.ja), `${s}: no Japanese phrase`);
    assert.ok(TABLE[s].phrases.some((p) => /[\u00C0-\u1EF9]/.test(p)), `${s}: no Vietnamese phrase with diacritics`);
    assert.ok(TABLE[s].phrases.some(has.en), `${s}: no English phrase`);
  }
});

test("evaluate: coverage, wrong skill, misses and false positives on labelled samples", () => {
  const samples: Sample[] = [
    { text: "lượn đi", skill: "leave" },
    { text: "go away", skill: "leave" },
    { text: "xéo đi", skill: "leave" }, // not in the seed table: a miss
    { text: "đi ngủ đi", skill: "leave" }, // a different wish: counted as a wrong skill
    { text: "hôm nay trời nóng quá", skill: null },
    { text: "lượn đi", skill: null }, // an ordinary sample that matches: a false positive
    { text: "tôi sẽ đi họp lát", skill: null },
    { text: "ok", skill: null },
  ];
  const e = evaluate(samples);
  assert.equal(e.commands, 4);
  assert.equal(e.right, 2);
  assert.equal(e.coverage, 0.5);
  assert.deepEqual(e.missed.map((s) => s.text), ["xéo đi"]);
  assert.deepEqual(e.wrongSkill.map((s) => s.text), ["đi ngủ đi"]);
  assert.equal(e.ordinary, 4);
  assert.deepEqual(e.falsePositives.map((s) => s.text), ["lượn đi"]);
  assert.equal(e.falsePositiveRate, 0.25);
  assert.deepEqual(evaluate([]), { commands: 0, right: 0, wrongSkill: [], missed: [], ordinary: 0, falsePositives: [], coverage: 0, falsePositiveRate: 0 });
});

test("ordinary chat lines of the three languages never match (a first negative set; the real one comes from the survey)", () => {
  const ordinary = [
    "hôm nay trời nóng quá", "tôi sẽ đi họp lát nữa", "mở giúp mình file báo cáo", "cà phê chưa?", "chiều nay họp lúc ba giờ",
    "ngủ ngon nhé", "mai là thứ hai rồi", "nhắc mình gọi cho mẹ", "đang build, chờ chút", "test này sao lại đỏ vậy",
    "good morning", "what time is it", "i have a meeting at three", "need coffee", "this build is slow", "see you tomorrow",
    "thank you", "lunch?", "reading the docs now", "almost done",
    "おはよう", "ありがとう", "今日は暑いね", "会議が三時からです", "コーヒーが飲みたい", "お疲れさま", "ちょっと休憩", "もうすぐ終わる",
  ];
  const e = evaluate(ordinary.map((text) => ({ text, skill: null })));
  assert.deepEqual(e.falsePositives, []);
  assert.equal(e.falsePositiveRate, 0);
});
