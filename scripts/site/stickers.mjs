// The Peak stickers (ADR-0051, ADR-0053): the page of each language shows the set in that language, taken at build time from ONE
// folder of the repository, docs/plans/assets/stickers/set-v2/ (vi/, en/, ja/ with NN.png, and manifest.json). The manifest is the
// single source of the text on each image, the short title, the alt text, the `reviewed` flag per language, the licence and the
// font credits. Nothing here hard-codes the number or the order of the stickers.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./facts.mjs";
import { LANGS } from "../../site/strings.mjs";

export const STICKER_DIR = join(ROOT, "docs", "plans", "assets", "stickers", "set-v2");
/** Where the images of a language are served from. */
export const stickerUrl = (lang, id) => `/assets/stickers/${lang}/${id}.png`;
export const CC_URL = "https://creativecommons.org/licenses/by/4.0/";

/** Reads and checks the manifest; throws with every problem found, so a wrong set never reaches the site. */
export function loadStickers(dir = STICKER_DIR) {
  const problems = [];
  const file = join(dir, "manifest.json");
  if (!existsSync(file)) throw new Error(`stickers: ${file} does not exist`);
  const m = JSON.parse(readFileSync(file, "utf8"));
  if (m.license !== "CC BY 4.0") problems.push(`the licence is "${m.license}", the pages say CC BY 4.0`);
  if (m.creator !== "Streakboom") problems.push(`the creator is "${m.creator}", the pages say Streakboom`);
  if (!Array.isArray(m.stickers) || !m.stickers.length) problems.push("the manifest has no stickers");
  const ids = new Set();
  for (const st of m.stickers || []) {
    if (!/^[0-9]{2,3}$/.test(st.id || "")) problems.push(`sticker id "${st.id}" is not a number like 01`);
    if (ids.has(st.id)) problems.push(`sticker ${st.id} is listed twice`);
    ids.add(st.id);
    for (const lang of LANGS) {
      for (const key of ["text", "title", "alt"]) {
        if (typeof st[key]?.[lang] !== "string" || !st[key][lang].trim()) problems.push(`sticker ${st.id}: no ${key} in ${lang}`);
      }
      if (typeof st.reviewed?.[lang] !== "boolean") problems.push(`sticker ${st.id}: no reviewed flag for ${lang}`);
      if (!existsSync(join(dir, lang, `${st.id}.png`))) problems.push(`sticker ${st.id}: ${lang}/${st.id}.png does not exist`);
    }
  }
  for (const lang of LANGS) {
    if (!(m.credits || []).some((c) => c.font && c.license && (c.langs || []).includes(lang))) problems.push(`no font credit for ${lang}`);
  }
  if (problems.length) throw new Error(`The sticker set is not usable:\n  - ${problems.join("\n  - ")}`);
  return { ...m, dir };
}

/** The font credits that apply to a language, as "Be Vietnam Pro and M PLUS Rounded 1c" (names only). */
export function fontNames(set, lang) {
  return [...new Set(set.credits.filter((c) => c.langs.includes(lang)).map((c) => c.font))].join(" · ");
}

/** True while some sticker of this language has not been read by a native speaker (the page then says so). */
export const needsReviewNote = (set, lang) => set.stickers.some((s) => s.reviewed[lang] !== true);
