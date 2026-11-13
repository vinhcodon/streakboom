// A check of the LIVE site (ADR-0096). The build checks the files it makes; Cloudflare sits in front of streakboom.com and can add things after
// that (an analytics script, a bot-detection script, error-reporting headers, a cookie). This reads the live pages and fails when they carry anything
// the privacy page does not say: any script that is not the site's own (or the one Cloudflare Web Analytics script, only when measurement.json has a
// token), the bot-detection script, the automatic copy of the analytics script (its address has a suffix), the headers of Network Error Logging, a cookie.
//   node scripts/site/livecheck.mjs            checks the live site (the Pages workflow runs it after the deploy)
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { ORIGIN } from "./facts.mjs";
import { BEACON_SRC, loadMeasurement, webAnalyticsManual, webAnalyticsMode } from "./counting.mjs";

const PAGES = ["/", "/vi/", "/ja/", "/stickers/", "/vi/stickers/", "/ja/stickers/", "/privacy/"];

/** What is wrong with one live page: `html` is its text, `headers` a Headers object (or anything with get()), `ctx` has `measurement`. */
export function liveProblems(path, html, headers, ctx) {
  const problems = [];
  const mode = webAnalyticsMode(ctx);
  for (const m of html.matchAll(/<script\b([^>]*)>/g)) {
    const src = /\ssrc="([^"]*)"/.exec(m[1])?.[1];
    if (!src || src.startsWith("/")) continue;
    if (src.startsWith(`${BEACON_SRC}/`)) { if (mode !== "auto") problems.push(`${path}: the automatic copy of the analytics script (${src}) while measurement.json says "${mode}"; set the Cloudflare automatic setup to match`); }
    else if (src !== BEACON_SRC) problems.push(`${path}: a script from a third party: ${src}`);
    else if (mode !== "manual") problems.push(`${path}: the analytics tag of manual mode is on the page while measurement.json says "${mode}"`);
  }
  if (webAnalyticsManual(ctx) && !html.includes(`data-cf-beacon='{"token": "${ctx.measurement.webAnalyticsToken}"}'`)) problems.push(`${path}: the analytics script of measurement.json is not on the page`);
  if (/\/cdn-cgi\/challenge-platform/.test(html)) problems.push(`${path}: the bot-detection script of Cloudflare (JavaScript detections); turn it off`);
  const has = (n) => (headers?.get?.(n) ? true : false);
  if (has("nel") || has("report-to")) problems.push(`${path}: the headers of Network Error Logging (nel, report-to); turn it off`);
  if (has("set-cookie")) problems.push(`${path}: a cookie is set (${headers.get("set-cookie").split("=")[0]})`);
  return problems;
}

/** Reads the live pages; a page that is turned away (403, 429, 503) is reported as not checked, not as clean. */
export async function checkLive({ origin = ORIGIN, fetchFn = fetch, ctx = { measurement: loadMeasurement() } } = {}) {
  const problems = [], skipped = [];
  for (const path of PAGES) {
    const res = await fetchFn(origin + path, { headers: { "User-Agent": "streakboom-site-livecheck", "Accept": "text/html,application/xhtml+xml", "Cache-Control": "no-cache" } });
    if ([403, 429, 503].includes(res.status)) { skipped.push(`${path}: answered ${res.status} (${res.headers.get("server") || "?"}), not checked`); continue; }
    if (!res.ok) { problems.push(`${path}: answered ${res.status}`); continue; }
    problems.push(...liveProblems(path, await res.text(), res.headers, ctx));
  }
  return { problems, skipped };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { problems, skipped } = await checkLive();
  for (const s of skipped) console.log(`::warning::live check: ${s}`);
  if (problems.length) {
    console.error(`The live site does not say what it does (${problems.length}):\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    process.exit(1);
  }
  console.log(skipped.length ? `live check: nothing wrong in the pages that answered (${skipped.length} not checked)` : "live check: the live pages carry only what the privacy page says");
}
