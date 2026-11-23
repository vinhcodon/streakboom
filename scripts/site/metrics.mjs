// The numbers of the project dashboard (ADR-0120): what is public is collected here, what is read by hand from Cloudflare, Clarity and Search Console
// is typed into docs/metrics/weekly.csv, and the four CSV files the dashboard reads are written from both. No token, no login: only public addresses.
//   node scripts/site/metrics.mjs --out <folder>     collects, appends today's row to docs/metrics/repo-history.csv, writes the CSV files into <folder>
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT } from "./facts.mjs";
import { channelTotals, loadChannelBackfill } from "./downloads.mjs";

export const LEDGER_URL = "https://streakboom.com/downloads.json";
export const REPO_API = "https://api.github.com/repos/vinhcodon/streakboom";
export const WEEKLY_COLUMNS = ["week", "cloudflare_visits", "clarity_sessions", "clarity_download_clicks", "search_console_indexed_pages", "search_console_impressions"];
export const REPO_COLUMNS = ["date", "stars", "forks", "open_issues", "watchers"];
export const METRICS_DIR = join(ROOT, "docs", "metrics");

/** A Stable has an even middle number, a Preview an odd one (ADR-0090). */
export const channelOf = (tag) => (Number(String(tag).replace(/^v/, "").split(".")[1]) % 2 === 0 ? "stable" : "preview");

/** A plain CSV (no quotes, no commas in a cell) as rows of objects; empty lines are skipped. */
export function parseCsv(text) {
  const lines = String(text).replace(/\r/g, "").split("\n").filter((l) => l.trim() !== "");
  if (!lines.length) return { columns: [], rows: [] };
  const columns = lines[0].split(",").map((c) => c.trim());
  return { columns, rows: lines.slice(1).map((l) => Object.fromEntries(l.split(",").map((v, i) => [columns[i], v.trim()]))) };
}
const toCsv = (columns, rows) => columns.join(",") + "\n" + rows.map((r) => columns.map((c) => r[c] ?? "").join(",")).join("\n") + (rows.length ? "\n" : "");

/** The daily totals of the download ledger (downloads.json, ADR-0052). */
export function dailyCsv(ledger) {
  if (!Array.isArray(ledger?.history) || !ledger.history.length) throw new Error("the ledger has no daily history");
  return toCsv(["date", "total"], ledger.history.map((h) => ({ date: h.date, total: h.total })));
}
/** The cumulative downloads of each day with the two channels (ADR-0163): the history of the ledger, a day without the split taking it from the backfill
 *  (the days before the ledger kept it) and the day of the ledger from its counts per version. A day that cannot be split has empty cells. */
export function channelCsv(ledger, backfill = loadChannelBackfill()) {
  if (!Array.isArray(ledger?.history) || !ledger.history.length) throw new Error("the ledger has no daily history");
  const rows = ledger.history.map((h) => {
    let { stable, preview } = h;
    if (stable === undefined) {
      const b = backfill[h.date];
      if (b && b.stable + b.preview === h.total) ({ stable, preview } = b);
      else if (h.date === ledger.updated && h.total === ledger.total) ({ stable, preview } = channelTotals(ledger.perTag) || {});
    }
    return { date: h.date, total: h.total, stable, preview };
  });
  return toCsv(["date", "total", "stable", "preview"], rows);
}
/** The downloads of each version, with its channel. */
export function versionsCsv(ledger) {
  if (!ledger?.perTag || typeof ledger.perTag !== "object") throw new Error("the ledger has no per-version counts");
  return toCsv(["tag", "channel", "downloads"], Object.entries(ledger.perTag).map(([tag, downloads]) => ({ tag, channel: channelOf(tag), downloads })));
}

/** The history of the repository's numbers with today's row added (or replaced, so a second run on a day changes nothing but the numbers of that day). */
export function repoHistoryCsv(previousText, today, repo) {
  const rows = parseCsv(previousText || "").rows.filter((r) => r.date !== today);
  rows.push({ date: today, stars: repo.stargazers_count, forks: repo.forks_count, open_issues: repo.open_issues_count, watchers: repo.subscribers_count });
  rows.sort((a, b) => (a.date < b.date ? -1 : 1));
  return toCsv(REPO_COLUMNS, rows);
}

/** What is wrong with the hand-typed weekly file, as a list of sentences (empty = fine). A number may be left empty when it was not read that week. */
export function weeklyProblems(text) {
  const { columns, rows } = parseCsv(text);
  const problems = [];
  if (columns.join(",") !== WEEKLY_COLUMNS.join(",")) problems.push(`the columns must be exactly: ${WEEKLY_COLUMNS.join(",")}`);
  const seen = new Set();
  rows.forEach((r, i) => {
    const n = i + 2;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.week || "") || Number.isNaN(Date.parse(r.week))) problems.push(`line ${n}: week must be the Monday of the week as YYYY-MM-DD`);
    else if (new Date(r.week + "T00:00:00Z").getUTCDay() !== 1) problems.push(`line ${n}: ${r.week} is not a Monday`);
    if (seen.has(r.week)) problems.push(`line ${n}: week ${r.week} appears twice`);
    seen.add(r.week);
    for (const c of WEEKLY_COLUMNS.slice(1)) if (r[c] !== undefined && r[c] !== "" && !/^\d+$/.test(r[c])) problems.push(`line ${n}: ${c} must be a whole number or empty`);
  });
  return problems;
}

/** Collects everything and returns the CSV files by name plus the text of the new repo history. `fetchFn` and `read` are injected for the tests. */
export async function collect({ fetchFn = fetch, read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : ""), today = new Date().toISOString().slice(0, 10), dir = METRICS_DIR } = {}) {
  const get = async (url) => { const r = await fetchFn(url, { headers: { "User-Agent": "streakboom-metrics", Accept: "application/json" } }); if (!r.ok) throw new Error(`${url} answered ${r.status}`); return r.json(); };
  const ledger = await get(LEDGER_URL);
  const repo = await get(REPO_API);
  const weekly = read(join(dir, "weekly.csv")) || toCsv(WEEKLY_COLUMNS, []);
  const bad = weeklyProblems(weekly);
  if (bad.length) throw new Error("docs/metrics/weekly.csv: " + bad.join("; "));
  const history = repoHistoryCsv(read(join(dir, "repo-history.csv")), today, repo);
  return {
    files: { "downloads_daily.csv": dailyCsv(ledger), "downloads_by_version.csv": versionsCsv(ledger), "downloads_channel.csv": channelCsv(ledger), "repo.csv": history, "weekly.csv": weekly },
    history,
    summary: { ledgerUpdated: ledger.updated, total: ledger.total, versions: Object.keys(ledger.perTag).length, stars: repo.stargazers_count, issues: repo.open_issues_count, weeks: parseCsv(weekly).rows.length },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--out");
  if (i < 0 || !process.argv[i + 1]) { console.error("usage: node scripts/site/metrics.mjs --out <folder>"); process.exit(2); }
  const out = resolve(process.argv[i + 1]);
  try {
    const r = await collect();
    mkdirSync(out, { recursive: true });
    for (const [name, text] of Object.entries(r.files)) writeFileSync(join(out, name), text);
    writeFileSync(join(METRICS_DIR, "repo-history.csv"), r.history);
    console.log(JSON.stringify({ out, ...r.summary }));
  } catch (e) { console.error(e.message); process.exit(1); }
}
