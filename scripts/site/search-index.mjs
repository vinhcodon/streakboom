// The search index of the sticker pages (spec 13 section 3, plan v0.2): one small JSON file per language, built from the manifest and
// the tags the rules gave (catalog.mjs), read by the page when the search box is first used. The fields are normalised here with the
// same function the page uses for the query (site/normalize.js).
import { normalize } from "../../site/normalize.js";
import { LANGS } from "../../site/strings.mjs";
import { tagName } from "./catalog.mjs";

export const INDEX_VERSION = 1;
export const indexPath = (lang) => `assets/stickers/search-${lang}.json`;
export const indexUrl = (lang) => `/${indexPath(lang)}`;

const unique = (list) => [...new Set(list.filter(Boolean))];

/** { lang: { v, items: [{ id, t, x, s, g }] } } : title, words on the picture, synonyms, tag names. In the Vietnamese and Japanese
 *  index the English title is also a synonym (people type English words such as "deadline" or "love"). */
export function buildSearchIndex(set, catalog, vocab) {
  const out = {};
  const byId = new Map(catalog.stickers.map((c) => [c.id, c]));
  for (const lang of LANGS) {
    const items = set.stickers.map((st) => {
      const c = byId.get(st.id);
      const synonyms = [...c.synonyms[lang], ...(lang === "en" ? [] : [st.title.en])];
      return {
        id: st.id,
        t: normalize(lang, st.title[lang]),
        x: normalize(lang, st.text[lang]),
        s: unique(synonyms.map((w) => normalize(lang, w))),
        g: unique([...c.emotions, ...c.situations].map((t) => normalize(lang, tagName(vocab, t, lang)))),
      };
    });
    out[lang] = { v: INDEX_VERSION, items };
  }
  return out;
}
