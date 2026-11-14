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

// the visit count of Cloudflare Web Analytics (ADR-0096): its own switch, scripts/site/catalog/measurement.json
const MEASUREMENT = () => process.env.STREAKBOOM_MEASUREMENT_FILE || join(dirname(fileURLToPath(import.meta.url)), "catalog", "measurement.json");
export const loadMeasurement = () => JSON.parse(readFileSync(MEASUREMENT(), "utf8"));
export const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";
export const WA_MODES = ["off", "auto", "manual"];
/** The mode of the visit count: off, auto (Cloudflare adds its script) or manual (the build adds the tag). */
export const webAnalyticsMode = (ctx) => ctx?.measurement?.webAnalytics || "off";
/** True when the site counts visits with Cloudflare Web Analytics, by whichever mode. */
export const webAnalyticsOn = (ctx) => webAnalyticsMode(ctx) !== "off";
/** True when the build itself puts the script tag in the pages (manual mode). */
export const webAnalyticsManual = (ctx) => webAnalyticsMode(ctx) === "manual";
/** True when the words say that visitors in the EU are not counted (auto mode and the dashboard option). */
export const excludesEu = (ctx) => webAnalyticsMode(ctx) === "auto" && ctx?.measurement?.excludeEu === true;
/** True when the privacy words and the live check accept Cloudflare's own bot-protection script (JavaScript detections). */
export const allowsBotScript = (ctx) => ctx?.measurement?.allowBotScript === true;
/** True when the site is meant to be served through Cloudflare's proxy (the default); the live check then insists that a page it reads came through it. */
export const behindCloudflare = (ctx) => ctx?.measurement?.behindCloudflare !== false;
/** What the build refuses about that switch. */
export function measurementProblems(m) {
  const problems = [];
  const mode = m?.webAnalytics;
  const t = m?.webAnalyticsToken ?? "";
  if (!WA_MODES.includes(mode)) problems.push("measurement.json: webAnalytics must be \"off\", \"auto\" or \"manual\"");
  if (typeof t !== "string") problems.push("measurement.json: the token must be a string");
  else if (mode === "manual" && !/^[0-9a-f]{32}$/.test(t)) problems.push("measurement.json: manual mode needs the 32 hex characters of a Cloudflare Web Analytics site tag");
  else if (mode !== "manual" && t) problems.push("measurement.json: a token is only for manual mode (an unused token is a mistake)");
  if (m?.allowBotScript !== undefined && typeof m.allowBotScript !== "boolean") problems.push("measurement.json: allowBotScript must be true or false");
  if (m?.behindCloudflare !== undefined && typeof m.behindCloudflare !== "boolean") problems.push("measurement.json: behindCloudflare must be true or false");
  if (m?.excludeEu !== undefined && typeof m.excludeEu !== "boolean") problems.push("measurement.json: excludeEu must be true or false");
  if (m?.excludeEu === true && mode !== "auto") problems.push("measurement.json: excludeEu is only for auto mode (it is a setting of the Cloudflare dashboard)");
  return problems;
}
/** The one script tag of the visit count in manual mode, or "" otherwise. */
export const beaconTag = (ctx) => (webAnalyticsManual(ctx) ? `<script type="module" src="${BEACON_SRC}" data-cf-beacon='{"token": "${ctx.measurement.webAnalyticsToken}"}'></script>` : "");

/** The paragraph "This website" of the privacy page, composed from what the build really does: cookies, the visit count, the copy counter, Cloudflare. */
export function siteParagraph(lang, ctx) {
  const S = STRINGS[lang];
  const parts = [S.pv_site_nocookie];
  if (allowsBotScript(ctx)) parts.push(S.pv_site_bot);
  parts.push(webAnalyticsOn(ctx) ? S.pv_site_wa : countingOn(ctx) ? S.pv_site_pv_none : S.pv_site_none);
  if (excludesEu(ctx)) parts.push(S.pv_site_wa_eu);
  if (countingOn(ctx)) parts.push(S.pv_site_cnt);
  parts.push(S.pv_site_cf, S.pv_site_tail);
  return parts.join(lang === "ja" ? "" : " ");
}

/** The note of the sticker page about what is sent: the copy counter or nothing, and the visit count when it is on. */
export function stickerNote(lang, ctx) {
  const S = STRINGS[lang];
  const base = countingOn(ctx) ? S.st_privacy_on : S.st_privacy;
  return webAnalyticsOn(ctx) ? `${base}${lang === "ja" ? "" : " "}${S.st_privacy_wa}` : base;
}

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

/** The sections of the privacy page, with the paragraph about this website composed from what the build does (siteParagraph). */
export function privacySections(lang, ctx) {
  const sections = STRINGS[lang].pv_sections;
  const i = sections.findIndex((s) => s.id === "website" || /^(This website|Trang web này|このウェブサイトについて)$/.test(s.h));
  if (i < 0) throw new Error("the privacy section about this website was not found, so the counting text cannot replace it");
  return sections.map((s, k) => (k === i ? { ...s, p: [siteParagraph(lang, ctx)] } : s));
}
