// The search index of the sticker pages (spec 13 section 3, plan v0.2): the search is by MEANING and does not depend on the language of the
// page: whatever language a visitor types, in whatever language the page is, the stickers are found and shown in the page's language.
// So the index is not per page language but per SCRIPT, two small JSON files built from the manifest and the tags the rules gave:
//   latin: English and Vietnamese together (titles, words on the pictures, synonyms, tag names), normalised for Latin letters;
//   ja:    Japanese (the same fields), normalised for Japanese.
// A query that has kana or kanji reads the ja file, any other query reads the latin file (the page loads one when it is needed). The
// fields are normalised here with the same function the page uses for the query (site/normalize.js).
import { normalize } from "../../site/normalize.js";
import { tagName } from "./catalog.mjs";

export const INDEX_VERSION = 2;
export const KINDS = ["latin", "ja"];
export const indexPath = (kind) => `assets/stickers/search-${kind}.json`;
export const indexUrl = (kind) => `/${indexPath(kind)}`;

const unique = (list) => [...new Set(list.filter(Boolean))];

/** { latin: { v, items }, ja: { v, items } }, each item { id, t, x, s, g }: title, words on the picture, synonyms, tag names (lists of normalised strings). */
export function buildSearchIndex(set, catalog, vocab) {
  const byId = new Map(catalog.stickers.map((c) => [c.id, c]));
  const make = (langs, normLang) => set.stickers.map((st) => {
    const c = byId.get(st.id);
    const tags = [...c.emotions, ...c.situations];
    const n = (w) => normalize(normLang, w);
    return {
      id: st.id,
      t: unique(langs.map((l) => n(st.title[l]))),
      x: unique(langs.map((l) => n(st.text[l]))),
      s: unique(langs.flatMap((l) => c.synonyms[l]).map(n)),
      g: unique(langs.flatMap((l) => tags.map((t) => tagName(vocab, t, l))).map(n)),
    };
  });
  return {
    latin: { v: INDEX_VERSION, items: make(["en", "vi"], "en") },
    ja: { v: INDEX_VERSION, items: make(["ja"], "ja") },
  };
}
