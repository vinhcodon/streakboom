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
// what the rules give each sticker of set-v2 (by address, so that a new sticker in the middle of the list moves nothing): emotions | situations | cheekiness
// (the table Vinh skims in docs/plans/sticker-tags-proposed.md)
const GOLDEN = {
  "good-morning": "happy,sleepy|morning|0",
  "sweet-dreams": "sleepy|night|0",
  "sleepy": "sleepy||0",
  "friday": "happy,excited|friday,work-day|0",
  "love-you": "loving||0",
  "thank-you": "grateful|thanks|0",
  "sorry": "sorry|apology|0",
  "congrats": "happy|celebration|0",
  "happy-birthday": "happy|birthday,celebration|0",
  "you-got-this": "determined|work-day,encouragement|0",
  "amazing": "happy,excited|work-day,praise|0",
  "haha": "laughing|funny-reply|0",
  "bliss": "blissful||0",
  "hehe": "laughing,playful|funny-reply|0",
  "meow": "playful||0",
  "peekaboo": "playful||0",
  "lets-go-out": "happy,excited|invitation|0",
  "popcorn-time": "excited|news|0",
  "boohoo": "sad||0",
  "deadline": "stressed|work-day,deadline|0",
  "oh": "shocked||0",
  "huh": "confused||0",
  "let-me-think": "thinking||0",
  "nyah-nyah": "teasing|refusal|1",
  "ugh-really": "annoyed||1",
  "im-dead": "exhausted|work-day|2",
  "hmph": "annoyed||1",
  "whos-waiting": "teasing,shy|waiting|1",
  "good-job": "deadpan|work-day,praise|2",
  "great-idea": "deadpan|work-day,praise|2",
  "life-you-know": "deadpan||2",
  "ok": "happy|agreement|0",
  "nope": "firm|refusal|1",
};
const SLUGS = Object.keys(GOLDEN);

test("the rules give each sticker of the set the tags, the cheekiness and the address of the golden table", () => {
  const cat = buildCatalog(set);
  assert.deepEqual(cat.problems, []);
  assert.equal(cat.stickers.length, set.stickers.length, "every sticker of the manifest is in the catalogue");
  for (const c of cat.stickers) assert.equal(`${c.emotions.join(",")}|${c.situations.join(",")}|${c.edge}`, GOLDEN[c.slug], `sticker ${c.id} ${c.slug}`);
  // an address never changes once published (ADR-0073 and spec 13): every address of the table is still there, whatever the order of the set
  assert.deepEqual([...cat.stickers.map((c) => c.slug)].sort(), [...SLUGS].sort());
  assert.equal(new Set(cat.stickers.map((c) => c.slug)).size, cat.stickers.length);
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
  assert.match(proposalMarkdown(set, buildCatalog(set)), /| d+ | `nope` | Nope. | Firm | Refusal | 1 cheeky |/);
});

// plan v0.8: the editorial row "Peak's picks"
import { loadPopular, popularProblems } from "./catalog.mjs";
test("the editorial row is Vinh's list, in its order, on the three sticker pages, and the build refuses a bad list", () => {
  const popular = loadPopular();
  assert.deepEqual(popular.slugs, ["thank-you", "ok", "good-morning", "sorry", "congrats", "haha", "friday", "deadline"]);
  const cat = buildCatalog(set);
  assert.deepEqual(popularProblems(popular, cat), []);
  assert.match(popularProblems({ slugs: ["thank-you", "ok", "good-morning"] }, cat).join("\n"), /4 to 12 stickers/);
  assert.match(popularProblems({ slugs: ["thank-you", "ok", "good-morning", "sorry", "no-such"] }, cat).join("\n"), /"no-such" is not the address/);
  assert.match(popularProblems({ slugs: ["thank-you", "ok", "good-morning", "sorry", "ok"] }, cat).join("\n"), /listed twice/);
  const b = build({ out: join(mkdtempSync(join(tmpdir(), "pop-")), "_site") });
  for (const [path, title] of [["/stickers/", "Peak's picks"], ["/vi/stickers/", "Peak gợi ý"], ["/ja/stickers/", "Peakのおすすめ"]]) {
    const html = b.pages.find((p) => p.path === path).html;
    const row = html.match(/<div id="sticker-popular"[\s\S]*?<\/ul>/)[0];
    assert.ok(row.includes(`<h2>${title}</h2>`), path);
    assert.deepEqual([...row.matchAll(/data-slug="([^"]*)"/g)].map((m) => m[1]), popular.slugs, path);
  }
  const run = (mutate) => { const c = { ctx: b.ctx, pages: b.pages.map((p) => ({ ...p })), files: b.files, out: b.out }; mutate(c); return () => check(c); };
  assert.throws(run((c) => { const p = c.pages.find((x) => x.path === "/vi/stickers/"); p.html = p.html.replace('data-slug="thank-you"', 'data-slug="sorry"'); }), /the row of picks is not the list of popular\.json/);
});
