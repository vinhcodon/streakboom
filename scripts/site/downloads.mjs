// The download counter of the website (ADR-0052): the number of downloads of the Windows installer from GitHub, with a ledger
// that keeps the count of releases GitHub has already deleted. Downloads, not installs and not people: an update is a download.
//
//   current = the installer's download_count of every release GitHub lists now (the API, public data)
//   ledger  = the previous ledger, published with the last deploy (https://streakboom.com/downloads.json)
//   new ledger = for every tag the larger of the two counts; the total is their sum, so a deleted release stays in it
//
// Nothing here runs in the visitor's browser. The build calls it only when STREAKBOOM_DOWNLOADS=live (the Pages workflow);
// local builds, the preview server and the tests use no network and show no number.
import { ORIGIN, REPO } from "./facts.mjs";

/** The installer asset of a release: `Streakboom_<version>_x64-setup.exe` (not `latest.json`). */
const isInstaller = (asset) => /-setup\.exe$/i.test(asset.name || "");

/** { tag: downloads of the installer } from the list of releases the API returns. */
export function installerCounts(releases) {
  if (!Array.isArray(releases)) throw new Error("downloads: the releases are not a list");
  const out = {};
  for (const r of releases) {
    const n = (r.assets || []).filter(isInstaller).reduce((sum, a) => sum + (Number(a.download_count) || 0), 0);
    if (r.tag_name) out[r.tag_name] = n;
  }
  return out;
}

/** Check the shape of a ledger read from the live site; returns it, or throws. */
export function checkLedger(ledger) {
  const ok = ledger && typeof ledger === "object" && ledger.perTag && typeof ledger.perTag === "object"
    && Object.values(ledger.perTag).every((n) => Number.isInteger(n) && n >= 0);
  if (!ok) throw new Error("downloads: the previous ledger has an unexpected shape; not publishing a total that may have lost its history");
  return ledger;
}

/** Merge the previous ledger (or null at the very first run) with the current counts: per tag the larger one. */
export function mergeLedger(previous, current, today) {
  const perTag = {};
  for (const [tag, n] of Object.entries(previous ? previous.perTag : {})) perTag[tag] = n;
  for (const [tag, n] of Object.entries(current)) perTag[tag] = Math.max(perTag[tag] || 0, n);
  const sorted = Object.fromEntries(Object.entries(perTag).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })));
  const total = Object.values(sorted).reduce((sum, n) => sum + n, 0);
  const before = previous ? Object.values(previous.perTag).reduce((sum, n) => sum + n, 0) : 0;
  if (total < before) throw new Error(`downloads: the new total ${total} is lower than the previous ${before}`);
  return { updated: today, total, perTag: sorted };
}

const get = async (url, headers, fetchFn) => {
  const res = await fetchFn(url, { headers });
  return res;
};

/** The previous ledger from the live site: null when there is none yet (a 404), an error for anything else. */
export async function previousLedger({ url = `${ORIGIN}/downloads.json`, fetchFn = fetch } = {}) {
  let res;
  try {
    res = await get(url, { "User-Agent": "streakboom-site-build", "Cache-Control": "no-cache" }, fetchFn);
  } catch (e) {
    throw new Error(`downloads: could not read the previous ledger (${e.message}); not publishing a total that may have lost its history`);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`downloads: the previous ledger answered ${res.status}; not publishing a total that may have lost its history`);
  return checkLedger(await res.json());
}

/** The releases GitHub lists now (public; the token only lifts the rate limit). */
export async function listReleases({ repo = REPO, token = "", fetchFn = fetch } = {}) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "streakboom-site-build" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await get(`https://api.github.com/repos/${repo}/releases?per_page=100`, headers, fetchFn);
  if (!res.ok) throw new Error(`downloads: the GitHub API answered ${res.status} for the releases`);
  return res.json();
}

/** The new ledger: the live site's previous one merged with GitHub's current counts. */
export async function liveLedger({ today, token = "", fetchFn = fetch } = {}) {
  const [releases, previous] = await Promise.all([listReleases({ token, fetchFn }), previousLedger({ fetchFn })]);
  return mergeLedger(previous, installerCounts(releases), today);
}

/** The number as a visitor reads it, in the language's own grouping (1,234 / 1.234). */
export const formatCount = (n, lang) => new Intl.NumberFormat(lang === "vi" ? "vi-VN" : lang === "ja" ? "ja-JP" : "en-US").format(n);
