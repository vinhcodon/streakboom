// The sticker catalogue (ADR-0077, Q9): the normalisation that search and rules share, the word matching, the golden table of the
// tags the rules give the 31 stickers of set-v2, each language's rules alone, the cap, the overrides, and what the build refuses.
import test from "node:test";
import assert from "node:assert/strict";
import { buildCatalog, catalogProblems, loadOverrides, loadRules, loadVocabulary, normalize, phraseIn, proposalMarkdown, slugOf } from "./catalog.mjs";
import { loadStickers } from "./stickers.mjs";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const set = loadStickers();
const vocab = loadVocabulary();
const rules = loadRules();

test("the normalisation: no tone marks, d with stroke, apostrophes and punctuation in English and Vietnamese; Japanese keeps its marks", () => {
  const table = [
    ["vi", "Chào buổi sáng!", "chao buoi sang"], ["vi", "mệt rồi", "met roi"], ["vi", "Đừng làm phiền, đang bận!", "dung lam phien dang ban"],
    ["vi", "Ơ!", "o"], ["vi", "Ủa?", "ua"], ["vi", "Ú òa!", "u oa"], ["vi", "Xỉu ngang!", "xiu ngang"], ["vi", "Hứ!", "hu"],
    ["vi", "Cuộc sống mà.", "cuoc song ma"], ["vi", "ĐI CHƠI ĐI", "di choi di"], ["vi", "ằ ẳ ẵ ặ ầ ẩ ẫ ậ ề ể ễ ệ ồ ổ ỗ ộ ờ ở ỡ ợ ừ ử ữ ự ỳ ỷ ỹ ỵ", "a a a a a a a a e e e e o o o o o o o o u u u u y y y y"],
    ["en", "It's Friday!", "its friday"], ["en", "I'm dead!", "im dead"], ["en", "Let’s go out!", "lets go out"], ["en", "Nyah nyah!", "nyah nyah"], ["en", "no-entry road sign", "no entry road sign"],
    ["ja", "おはよう！", "おはよう!"], ["ja", "ｶﾞﾝﾊﾞﾚ", "がんばれ"], ["ja", "オッケー", "おっけー"], ["ja", "  ふふっ。 ", "ふふっ。"],
  ];
  for (const [lang, input, want] of table) assert.equal(normalize(lang, input), want, `${lang}: ${input}`);
  // typing without marks finds the same words
  assert.equal(normalize("vi", "met roi"), normalize("vi", "mệt rồi"));
});

test("a phrase matches word by word in English and Vietnamese, as text in Japanese", () => {
  assert.ok(phraseIn("en", "oh", "Oh!"));
  assert.ok(!phraseIn("en", "oh", "Boohoo…"), "'oh' is not inside 'boohoo'");
  assert.ok(phraseIn("en", "ok", "Peak winks and makes an OK sign."));
  assert.ok(!phraseIn("en", "ok", "Okay"));
  assert.ok(phraseIn("en", "lets go out", "Let's go out!"));
  assert.ok(phraseIn("en", "no entry", "holds a no-entry road sign"));
  assert.ok(!phraseIn("en", "good job", "good morning job"));
  assert.ok(phraseIn("vi", "xin lỗi", "Xin lỗi nhé."));
  assert.ok(phraseIn("vi", "xin loi", "Xin lỗi nhé."), "a rule without marks matches the same");
  assert.ok(!phraseIn("vi", "ơ", "Ú òa!"));
  assert.ok(phraseIn("ja", "ふふ", "ふふっ。"));
  assert.ok(!phraseIn("en", "", "anything"));
});

// what the rules give each sticker of set-v2: emotions | situations | cheekiness (the table Vinh skims in docs/plans/sticker-tags-proposed.md)
const GOLDEN = {
  "01": "happy,sleepy|morning|0", "02": "sleepy|night|0", "03": "sleepy||0", "04": "happy,excited|friday,work-day|0", "05": "loving||0",
  "06": "grateful|thanks|0", "07": "sorry|apology|0", "08": "happy|celebration|0", "09": "happy|birthday,celebration|0", "10": "determined|work-day,encouragement|0",
  "11": "laughing|funny-reply|0", "12": "blissful||0", "13": "laughing,playful|funny-reply|0", "14": "playful||0", "15": "playful||0",
  "16": "happy,excited|invitation|0", "17": "excited|news|0", "18": "sad||0", "19": "stressed|work-day,deadline|0", "20": "shocked||0",
  "21": "confused||0", "22": "thinking||0", "23": "teasing|refusal|1", "24": "annoyed||1", "25": "exhausted|work-day|2",
  "26": "annoyed||1", "27": "teasing,shy|waiting|1", "28": "deadpan|work-day|2", "29": "deadpan||2", "30": "happy|agreement|0", "31": "firm|refusal|1",
};
const SLUGS = ["good-morning", "sweet-dreams", "sleepy", "friday", "love-you", "thank-you", "sorry", "congrats", "happy-birthday", "you-got-this", "haha", "bliss", "hehe", "meow", "peekaboo", "lets-go-out", "popcorn-time", "boohoo", "deadline", "oh", "huh", "let-me-think", "nyah-nyah", "ugh-really", "im-dead", "hmph", "whos-waiting", "good-job", "life-you-know", "ok", "nope"];

test("the rules give each of the 31 stickers the tags, the cheekiness and the address of the golden table", () => {
  const cat = buildCatalog(set);
  assert.deepEqual(cat.problems, []);
  assert.equal(cat.stickers.length, 31);
  for (const c of cat.stickers) assert.equal(`${c.emotions.join(",")}|${c.situations.join(",")}|${c.edge}`, GOLDEN[c.id], `sticker ${c.id} ${c.slug}`);
  // an address never changes once published (ADR-0073 and spec 13): the list is a snapshot
  assert.deepEqual(cat.stickers.map((c) => c.slug), SLUGS);
  assert.equal(new Set(SLUGS).size, SLUGS.length);
  assert.deepEqual(catalogProblems(set, cat), []);
  for (const c of cat.stickers) for (const lang of ["en", "vi", "ja"]) assert.ok(c.synonyms[lang].length > 0, `${c.id} ${lang}`);
});

test("each language's rules alone tag every sticker, so no language depends on the English words", () => {
  for (const lang of ["en", "vi", "ja"]) {
    const only = { ...rules, rules: Object.fromEntries(Object.entries(rules.rules).map(([t, r]) => [t, { [lang]: r[lang] || [] }])) };
    const cat = buildCatalog(set, vocab, only);
    for (const c of cat.stickers) assert.ok(c.emotions.length || c.situations.length, `${lang}: sticker ${c.id} (${c.slug}) gets no tag from the ${lang} rules alone`);
  }
});

test("at most three emotions and three situations are kept, by the order of the vocabulary; the rest is reported", () => {
  const fake = { ...set, stickers: [{ id: "01", text: { en: "happy laugh love thanks sorry", vi: "x", ja: "x" }, title: { en: "Pile up", vi: "x", ja: "x" }, alt: { en: "happy laugh love thanks sorry", vi: "x", ja: "x" } }] };
  const rl = { ...rules, rules: { sorry: { en: ["sorry"] }, grateful: { en: ["thanks"] }, loving: { en: ["love"] }, laughing: { en: ["laugh"] }, happy: { en: ["happy"] } } };
  const c = buildCatalog(fake, vocab, rl).stickers[0];
  assert.deepEqual(c.emotions, ["happy", "laughing", "loving"], "the first three of the vocabulary");
  assert.deepEqual(c.capped, ["grateful", "sorry"]);
});

test("an override wins over the rules", () => {
  const ov = { overrides: { "nope": { emotions: { add: ["annoyed"], remove: ["firm"] }, edge: 2, synonyms: { vi: ["không đời nào"] } } } };
  const nope = buildCatalog(set, vocab, rules, ov).stickers.find((c) => c.slug === "nope");
  assert.deepEqual(nope.emotions, ["annoyed"]);
  assert.equal(nope.edge, 2);
  assert.ok(nope.synonyms.vi.includes("không đời nào"));
  // the shipped overrides file is valid (empty for now)
  assert.deepEqual(catalogProblems(set, buildCatalog(set), vocab, rules, loadOverrides()), []);
});

test("what the build refuses about the tags", () => {
  const cat = buildCatalog(set);
  const bad = (fn) => { const p = catalogProblems(set, fn(structuredClone(cat))); return p.join("\n"); };
  assert.match(bad((c) => { c.stickers[2].emotions = []; c.stickers[2].situations = []; return c; }), /sticker 03 "Sleepy".*no rule gives it an emotion or a situation/);
  assert.match(bad((c) => { c.stickers[0].synonyms.vi = []; return c; }), /no synonym in vi/);
  const unknown = buildCatalog(set, vocab, { ...rules, rules: { ...rules.rules, ghost: { en: ["boo"] } } });
  assert.match(catalogProblems(set, unknown).join("\n"), /the rule "ghost" is not in the vocabulary/);
  const wrongOverride = { overrides: { "no-such-sticker": { edge: 1 }, "nope": { emotions: { add: ["ghost"] }, edge: 5 } } };
  const w = catalogProblems(set, buildCatalog(set, vocab, rules, wrongOverride), vocab, rules, wrongOverride).join("\n");
  assert.match(w, /no sticker has the address "no-such-sticker"/);
  assert.match(w, /unknown tag "ghost"/);
  assert.match(w, /cheekiness 5/);
  const noSyn = structuredClone(vocab); noSyn.tags[0].synonyms.ja = [];
  assert.match(catalogProblems(set, cat, noSyn).join("\n"), /"happy" has no synonyms in ja/);
  const dupe = { ...set, stickers: [set.stickers[0], { ...set.stickers[0], id: "99" }] };
  assert.match(buildCatalog(dupe).problems.join("\n"), /the address "good-morning" is already used/);
  assert.equal(slugOf({ title: { en: "Let's go out" } }), "lets-go-out");
});

test("the build keeps the proposal page up to date, and refuses an untagged sticker", () => {
  const b = build({ out: join(mkdtempSync(join(tmpdir(), "cat-")), "_site") });
  const run = (mutate) => { const c = { ctx: { ...b.ctx, catalog: structuredClone(b.ctx.catalog) }, pages: b.pages, files: b.files, out: b.out }; mutate(c.ctx); return () => check(c); };
  assert.doesNotThrow(run(() => {}));
  assert.throws(run((ctx) => { ctx.catalog.stickers[0].edge = 2; }), /sticker-tags-proposed\.md is out of date/);
  assert.throws(run((ctx) => { ctx.catalog.stickers[4].emotions = []; ctx.catalog.stickers[4].situations = []; }), /sticker tags: sticker 05/);
  // the proposal is the one the generator writes
  assert.ok(proposalMarkdown(set, buildCatalog(set)).includes("| 31 | `nope` | Nope. | Firm | Refusal | 1 cheeky |"));
});
