// The one normalisation of the sticker catalogue (spec 13 section 3): the build uses it for the tag rules and for the search index, and
// the page uses it for what the visitor types, so the two cannot drift. Plain JavaScript with no DOM, so Node can test it.
//
// English and Vietnamese: lower case, no tone marks or other diacritics, "d with a stroke" as d, apostrophes removed, every other mark a
// space ("met roi" is "mệt rồi"). Japanese: width-normalised (NFKC), lower case, katakana folded to hiragana (so ガンバレ and がんばれ
// meet); the marks of kana are NOT removed (that would change letters).
export function normalize(lang, text) {
  const t = String(text || "");
  if (lang === "ja") {
    return t.normalize("NFKC").toLowerCase().replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/\s+/g, " ").trim();
  }
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase()
    .replace(/['’`]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
