// What is shown of a reply when it is long (docs/plans/chat-box-issues-and-overlay-proposal.md, part 2). The old rule cut every reply at 239 characters,
// in the middle of a sentence, and the cut text went back to the model as its own words. This cuts at the end of a sentence when there is one,
// else at a word, and adds an ellipsis only when a sentence was broken. Pure.

/** The end of a sentence: . ! ? … then a space or the end, or the full-width 。！？ (no space follows them), perhaps with a closing quote or bracket. */
const SENTENCE_END = /[.!?…]["')\]”’»」』]*(?=\s|$)|[。！？]["')\]”’»」』]*/g;

/** The same letters in one form (a text from a model or a paste may come with the marks apart), without surrounding blanks. */
export const nfc = (s: string): string => s.normalize("NFC").trim();

/**
 * `text` as it is shown: whole when it fits `max`; else cut after the last whole sentence that fits (when that keeps at least 40% of `max`), else at the
 * last word (with "…"), else at `max - 1` characters (with "…"). Never cuts a pair of surrogates in two.
 */
export function clipReply(text: string, max: number): string {
  const t = nfc(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  let end = -1;
  for (const m of cut.matchAll(SENTENCE_END)) end = (m.index ?? 0) + m[0].length;
  if (end >= max * 0.4) return cut.slice(0, end).trimEnd();
  const space = cut.lastIndexOf(" ");
  let head = space >= max * 0.4 ? cut.slice(0, space) : cut.slice(0, max - 1);
  const last = head.charCodeAt(head.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) head = head.slice(0, -1); // half of a pair
  return head.trimEnd().replace(/[,;:\-–—]+$/u, "") + "…";
}

/** The language of a text for the `lang` attribute of a window: `ja` with kana, `vi` with letters that only Vietnamese has, else `en`. */
export function docLang(text: string): "ja" | "vi" | "en" {
  if (/[぀-ヿ]/.test(text)) return "ja";
  if (/[đĐơƠưƯăĂ]|[Ạ-ỹ]/.test(text)) return "vi";
  return "en";
}
