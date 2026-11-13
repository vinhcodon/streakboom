// Anonymous counting of sticker copies (ADR-0092, from Q7 of ADR-0077). The switch is scripts/site/catalog/counting.json: with no endpoint nothing is
// counted, the page sends nothing and the texts say so; with an endpoint the page sends one small note per copy and the texts say that. The build
// keeps the two together (scripts/site/checks.mjs), so the page never sends before the text says so.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STRINGS } from "../../site/strings.mjs";

// the environment variable is for the tests only (they build once with counting on)
const FILE = () => process.env.STREAKBOOM_COUNTING_FILE || join(dirname(fileURLToPath(import.meta.url)), "catalog", "counting.json");
export const loadCounting = () => JSON.parse(readFileSync(FILE(), "utf8"));

/** True when the build counts copies. */
export const countingOn = (ctx) => Boolean(ctx?.counting?.endpoint);

/** What the build refuses about the switch: an endpoint must be a plain https address of the Worker (workers.dev or streakboom.com), no query, no secret in it. */
export function countingProblems(counting) {
  const e = counting?.endpoint;
  if (e === undefined || typeof e !== "string") return ["counting.json: the endpoint must be a string (empty = off)"];
  if (!e) return [];
  let u;
  try { u = new URL(e); } catch { return ["counting.json: the endpoint is not an address"]; }
  const problems = [];
  if (u.protocol !== "https:") problems.push("counting.json: the endpoint must be https");
  if (!/(^|\.)workers\.dev$|(^|\.)streakboom\.com$/.test(u.hostname)) problems.push("counting.json: the endpoint must be on workers.dev or streakboom.com (the Worker of ADR-0092)");
  if (u.search || u.hash || u.username || u.password) problems.push("counting.json: the endpoint has a query, a fragment or a login in it (no secret goes in an address)");
  return problems;
}

/** The sections of the privacy page, with the paragraph about this website replaced by the one that says a copy is counted when counting is on. */
export function privacySections(lang, ctx) {
  const sections = STRINGS[lang].pv_sections;
  if (!countingOn(ctx)) return sections;
  const i = sections.findIndex((s) => s.id === "website" || /^(This website|Trang web này|このウェブサイトについて)$/.test(s.h));
  if (i < 0) throw new Error("the privacy section about this website was not found, so the counting text cannot replace it");
  return sections.map((s, k) => (k === i ? { ...s, p: [STRINGS[lang].pv_site_on] } : s));
}
