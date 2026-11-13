// The search of the sticker pages (spec 13 section 3), on the client, over an index file per language built at build time
// (scripts/site/search-index.mjs). Plain JavaScript with no DOM, so Node tests it with a table of queries.
//
// An index item is { id, t, x, s, g }: the sticker's number, its title, the words on the picture, the synonyms and the tag names,
// all already normalised (site/normalize.js). A query is normalised the same way; each word of it must be found as a word of a field,
// whole, as the start of a word (the person is still typing), or with a small typo (a distance of 1 for words of 4 to 7 letters, 2
// for longer ones). The results are the stickers that match the most words of the query, best first; a sticker that matches only some
// words is shown only when no sticker matches more (so "met roi" finds the tired ones even if "roi" is in no sticker).
import { normalize } from "./normalize.js";

const WEIGHT = { t: 3, x: 3, s: 2, g: 2 };

/** Which index a query reads: "ja" if it has kana or kanji, otherwise "latin" (English, Vietnamese and any other Latin text). */
export const scriptOf = (query) => (/[\u3040-\u30ff\u3400-\u9fff\uff66-\uff9f]/.test(String(query || "")) ? "ja" : "latin");

/** Edit distance with swaps of neighbours (a typed "teh" for "the" is one edit), stopping when it must exceed `max`. */
export function distance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = [];
  for (let i = 0; i <= a.length; i++) { d[i] = [i]; }
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

const maxTypos = (len) => (len >= 8 ? 2 : len >= 4 ? 1 : 0);

/** How well the query word q matches the field word w: 1 whole, 0.8 start of the word, 0.5 with a typo, 0 not at all. */
function wordQuality(q, w) {
  if (q === w) return 1;
  if (q.length >= 2 && w.startsWith(q)) return 0.8;
  const m = maxTypos(q.length);
  if (m && distance(q, w, m) <= m) return 0.5;
  return 0;
}

const bigrams = (s) => { const out = new Set(); for (let i = 0; i + 1 < s.length; i++) out.add(s.slice(i, i + 2)); return out; };

/** Japanese: the query is text without spaces; a field matches when it contains it, or shares most of its pairs of characters. */
function textQuality(q, f) {
  if (!q || !f) return 0;
  if (f === q) return 1.2;
  if (f.includes(q)) return 1;
  if (q.length < 3) return 0;
  const bq = bigrams(q), bf = bigrams(f);
  let hit = 0;
  for (const b of bq) if (bf.has(b)) hit++;
  const coverage = hit / bq.size;
  return coverage >= 0.6 ? 0.5 * coverage : 0;
}

/** The ids of the stickers that match, best first: [{ id, matched, score }]. `kind` is the script of the index ("latin" or "ja", see scriptOf).
 *  An empty query matches nothing (the page shows all). */
export function search(kind, items, query) {
  const lang = kind === "ja" ? "ja" : "en";
  const q = normalize(lang, query);
  if (!q) return [];
  const out = [];
  if (kind === "ja") {
    const text = q.replace(/ /g, "");
    items.forEach((it, order) => {
      let best = 0;
      for (const [key, w] of Object.entries(WEIGHT)) {
        const fields = Array.isArray(it[key]) ? it[key] : [it[key]];
        for (const f of fields) best = Math.max(best, w * textQuality(text, normalize("ja", f)));
      }
      if (best > 0) out.push({ id: it.id, matched: 1, score: best, order });
    });
  } else {
    const words = [...new Set(q.split(" "))];
    items.forEach((it, order) => {
      let matched = 0, score = 0;
      const fields = Object.keys(WEIGHT).map((key) => [WEIGHT[key], (Array.isArray(it[key]) ? it[key] : [it[key]]).flatMap((f) => (f ? f.split(" ") : []))]);
      for (const word of words) {
        let best = 0;
        for (const [w, fieldWords] of fields) for (const fw of fieldWords) { const quality = wordQuality(word, fw); if (quality * w > best) best = quality * w; }
        if (best > 0) { matched++; score += best; }
      }
      // the query is the whole title or the whole words on the picture: it comes first ("good job" before "Amazing, good job!")
      if (matched === words.length && [...(it.t || []), ...(it.x || [])].some((f) => f === q)) score += 2;
      if (matched) out.push({ id: it.id, matched, score, order });
    });
  }
  const most = out.reduce((m, r) => Math.max(m, r.matched), 0);
  return out.filter((r) => r.matched === most).sort((a, b) => b.score - a.score || a.order - b.order).map(({ id, matched, score }) => ({ id, matched, score }));
}
