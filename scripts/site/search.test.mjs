// The search of the sticker pages (plan v0.2, spec 13 section 3): tables of what people would type, in each language, with the
// sticker they mean. "top1" means the first result; otherwise the sticker must be among the first three. The expected slugs are
// the English addresses of set-v2.
import test from "node:test";
import assert from "node:assert/strict";
import { distance, search } from "../../site/search.js";
import { normalize } from "../../site/normalize.js";
import { buildCatalog, loadVocabulary } from "./catalog.mjs";
import { buildSearchIndex } from "./search-index.mjs";
import { loadStickers } from "./stickers.mjs";

const set = loadStickers();
const vocab = loadVocabulary();
const catalog = buildCatalog(set, vocab);
const index = buildSearchIndex(set, catalog, vocab);
const slugOf = new Map(catalog.stickers.map((c) => [c.id, c.slug]));
const run = (lang, q) => search(lang, index[lang].items, q).map((r) => slugOf.get(r.id));

/** [query, expected slug or [any of them], top1?] */
const EN = [
  ["morning", "good-morning", 1], ["wake up", "good-morning"], ["bedtime", "sweet-dreams"], ["good night", "sweet-dreams"], ["tired", ["sleepy", "im-dead"]],
  ["yawn", "sleepy"], ["weekend", "friday"], ["tgif", "friday"], ["i love you", "love-you", 1], ["heart", "love-you"], ["thx", "thank-you"],
  ["appreciate", "thank-you"], ["my bad", "sorry"], ["oops", "sorry"], ["congratulations", "congrats"], ["well done", ["congrats", "good-job"]],
  ["bday", "happy-birthday"], ["cake", "happy-birthday"], ["you can do it", "you-got-this"], ["good luck", "you-got-this"], ["lol", "haha"], ["funny", "haha"],
  ["cry", "boohoo"], ["tears", "boohoo"], ["omg", "oh"], ["what", "huh"], ["wonder", "let-me-think"], ["sarcastic", ["good-job", "life-you-know"]],
  ["grumpy", ["hmph", "ugh-really"]], ["gossip", "popcorn-time"], ["drama", "popcorn-time"], ["panic", "deadline"], ["overdue", "deadline"],
  ["burned out", "im-dead"], ["no way", ["nope", "nyah-nyah"]], ["refuse", "nope"], ["okay", "ok"], ["agree", "ok"], ["hang out", "lets-go-out"], ["trip", "lets-go-out"],
  ["meow", "meow", 1], ["good mor", "good-morning", 1], ["peek", "peekaboo", 1], ["birth", "happy-birthday", 1],
  // typos
  ["mornig", "good-morning", 1], ["congrts", "congrats", 1], ["birthdya", "happy-birthday", 1], ["dedline", "deadline", 1], ["sory", "sorry", 1], ["peekabo", "peekaboo", 1], ["slepy", "sleepy", 1],
];
const VI = [
  ["chao buoi sang", "good-morning", 1], ["buoi sang", "good-morning"], ["ngu ngon", "sweet-dreams", 1], ["buon ngu", "sleepy", 1], ["met", ["sleepy", "im-dead"]],
  ["met roi", ["sleepy", "im-dead"]], ["ngap", "sleepy"], ["thu sau", "friday", 1], ["cuoi tuan", "friday"], ["yeu qua", "love-you", 1], ["yeu", "love-you"],
  ["cam on", "thank-you", 1], ["cam on nha", "thank-you", 1], ["xin loi", "sorry", 1], ["chuc mung", ["congrats", "happy-birthday"]], ["sinh nhat", "happy-birthday", 1],
  ["co len", "you-got-this", 1], ["cuoi", ["haha", "hehe"]], ["buon cuoi", "haha"], ["hi hi", "hehe", 1], ["meo", "meow", 1], ["u oa", "peekaboo", 1],
  ["di choi", "lets-go-out", 1], ["hong", "popcorn-time", 1], ["hong chuyen", "popcorn-time", 1], ["huhu", "boohoo", 1], ["khoc", "boohoo"], ["o", "oh", 1], ["ua", "huh", 1],
  ["de minh nghi", "let-me-think", 1], ["nghi", "let-me-think"], ["con lau", "nyah-nyah", 1], ["leu leu", "nyah-nyah"], ["gom", "ugh-really", 1], ["xiu ngang", "im-dead", 1],
  ["xiu", "im-dead"], ["hu", "hmph", 1], ["ai doi dau", "whos-waiting", 1], ["doi", "whos-waiting"], ["gioi qua", "good-job", 1], ["cuoc song", "life-you-know", 1],
  ["ok", "ok", 1], ["khong nha", "nope", 1], ["tu choi", ["nope", "nyah-nyah"]], ["deadline", "deadline", 1], ["han chot", "deadline"],
  ["sep", ["friday", "you-got-this", "deadline", "im-dead", "good-job"]], ["di lam", ["friday", "you-got-this", "deadline", "im-dead", "good-job"]],
  // typed with the marks, and with typos
  ["Chào buổi sáng", "good-morning", 1], ["mệt rồi", ["sleepy", "im-dead"]], ["Không nha", "nope", 1], ["chao buoi sag", "good-morning", 1], ["cam om", "thank-you", 1], ["xin loy", "sorry", 1],
  ["english deadline", "deadline"], ["love", "love-you"],
];
const JA = [
  ["おはよう", "good-morning", 1], ["朝", "good-morning"], ["ねむい", "sleepy", 1], ["眠い", "sleepy"], ["おやすみ", "sweet-dreams", 1], ["金曜日", "friday", 1], ["週末", "friday"],
  ["ありがとう", "thank-you", 1], ["感謝", "thank-you"], ["ごめん", "sorry", 1], ["ごめんね", "sorry", 1], ["おめでとう", "congrats", 1], ["誕生日", "happy-birthday", 1],
  ["がんばって", "you-got-this", 1], ["頑張って", "you-got-this"], ["あはは", "haha", 1], ["笑", ["haha", "hehe"]], ["にゃ", "meow", 1], ["いないいない", "peekaboo", 1],
  ["あそび", "lets-go-out"], ["わくわく", "popcorn-time", 1], ["うえーん", "boohoo", 1], ["泣く", "boohoo"], ["えっ", "oh", 1], ["あれ", "huh", 1], ["考え中", "let-me-think", 1],
  ["べーっ", "nyah-nyah", 1], ["うわぁ", "ugh-really", 1], ["もうだめ", "im-dead", 1], ["むっ", "hmph", 1], ["待ってない", "whos-waiting"], ["すごい", "good-job"],
  ["人生", "life-you-know", 1], ["オッケー", "ok", 1], ["だめ", ["nope", "im-dead"]], ["いや", "nope"], ["締め切り", "deadline", 1], ["期限", "deadline"], ["ツンデレ", "whos-waiting"],
  // half-typed, katakana for hiragana, half-width
  ["おはよ", "good-morning", 1], ["ありがと", "thank-you", 1], ["ガンバッテ", "you-got-this"], ["ｵｯｹｰ", "ok", 1],
  ["deadline", "deadline"], ["love", "love-you"],
];

function table(lang, rows) {
  test(`search in ${lang}: ${rows.length} things people type find the sticker they mean`, () => {
    const failed = [];
    for (const [q, want, top1] of rows) {
      const got = run(lang, q);
      const wanted = Array.isArray(want) ? want : [want];
      const window = top1 ? got.slice(0, 1) : got.slice(0, 3);
      if (!wanted.some((w) => window.includes(w))) failed.push(`${JSON.stringify(q)} wanted ${wanted.join("|")}${top1 ? " first" : " in the first three"}, got ${got.slice(0, 4).join(", ") || "nothing"}`);
    }
    assert.deepEqual(failed, []);
    assert.ok(rows.length >= 40, "at least 40 queries per language");
  });
}
table("en", EN);
table("vi", VI);
table("ja", JA);

for (const lang of ["en", "vi", "ja"]) {
  test(`search in ${lang}: the words on every picture and every title find that sticker first; a typo still finds it in the first three`, () => {
    const failed = [];
    for (const st of set.stickers) {
      const slug = slugOf.get(st.id);
      for (const field of ["title", "text"]) {
        const q = st[field][lang];
        const got = run(lang, q);
        // two stickers can share the very same words on the picture (for example "OK!" and an OK in another): the first must be one that has them
        const sameWords = set.stickers.filter((o) => normalize(lang, o[field][lang]) === normalize(lang, q)).map((o) => slugOf.get(o.id));
        if (!sameWords.includes(got[0])) failed.push(`${lang} ${field} ${JSON.stringify(q)}: wanted ${slug}, first was ${got[0]}`);
      }
      if (lang !== "ja") {
        for (const word of normalize(lang, st.title[lang]).split(" ").filter((w) => w.length >= 5)) {
          const typo = word.slice(0, 2) + word.slice(3); // one letter lost
          const q = normalize(lang, st.title[lang]).replace(word, typo);
          if (!run(lang, q).slice(0, 3).includes(slug)) failed.push(`${lang} typo ${JSON.stringify(q)} for ${slug}`);
        }
      }
    }
    assert.deepEqual(failed, []);
  });
}

test("the distance counts a swap of neighbours as one edit and stops early", () => {
  assert.equal(distance("teh", "the", 2), 1);
  assert.equal(distance("sory", "sorry", 2), 1);
  assert.equal(distance("kitten", "sitting", 3), 3);
  assert.ok(distance("abc", "abcdefgh", 1) > 1);
});

test("the rules of the matching", () => {
  // an empty or marks-only query matches nothing (the page shows everything)
  for (const q of ["", "   ", "!!!"]) assert.deepEqual(search("en", index.en.items, q), []);
  // gibberish matches nothing
  assert.deepEqual(search("en", index.en.items, "zzzzqq"), []);
  assert.deepEqual(search("vi", index.vi.items, "xyzxyz"), []);
  // typed with or without marks, the same stickers in the same order
  assert.deepEqual(search("vi", index.vi.items, "mệt rồi"), search("vi", index.vi.items, "met roi"));
  assert.deepEqual(search("vi", index.vi.items, "CHÀO BUỔI SÁNG"), search("vi", index.vi.items, "chao buoi sang"));
  // the stickers that match the most words win: "good morning" is the one with both words, not every "good"
  const r = search("en", index.en.items, "good morning");
  assert.equal(slugOf.get(r[0].id), "good-morning");
  assert.ok(r.every((x) => x.matched === r[0].matched), "only the best-matching stickers are shown");
  // when a word matches nothing, the others still find stickers ("roi" is in no sticker)
  assert.ok(search("vi", index.vi.items, "met roi").length > 0);
  // a single letter is an exact word only, not a prefix of everything
  assert.ok(search("vi", index.vi.items, "o").length <= 3);
});

test("a catalogue of 3,000 stickers is searched in well under a second, and its index is small", () => {
  const items = [];
  for (let i = 0; i < 3000; i++) items.push({ id: String(i), t: `sticker ${i} nhan vat`, x: `chu ${i} tren hinh`, s: ["tu dong nghia mot", "tu dong nghia hai", "met", "vui"], g: ["vui", "cong viec"] });
  const t0 = performance.now();
  const r = search("vi", items, "cong viec met");
  const ms = performance.now() - t0;
  assert.ok(r.length > 0);
  assert.ok(ms < 1000, `${ms.toFixed(0)} ms`);
  assert.ok(JSON.stringify({ v: 1, items }).length < 600 * 1024, "the raw index stays under the budget before compression");
});
