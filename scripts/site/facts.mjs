// The facts the website is built from, read from the repository so the site cannot drift from the app:
// the version from app/src-tauri/tauri.conf.json, the release notes from CHANGELOG.md.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const ORIGIN = "https://streakboom.com";
export const REPO = "vinhcodon/streakboom";
export const REPO_URL = `https://github.com/${REPO}`;
export const RELEASES_URL = `${REPO_URL}/releases/latest`;
export const AUTHOR = { name: "Vinh Codon", github: "https://github.com/vinhcodon" };

export function appVersion() {
  return JSON.parse(readFileSync(join(ROOT, "app", "src-tauri", "tauri.conf.json"), "utf8")).version;
}

/** "## 0.2.5 (2026-11-09), a title" headings, each followed by "- " bullets (wrapped lines are joined). */
export function parseChangelog(text) {
  const out = [];
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const h = raw.match(/^##\s+(\d+\.\d+\.\d+[^\s(]*)\s*(?:\((\d{4}-\d{2}-\d{2})\))?\s*,?\s*(.*)$/);
    if (h) {
      cur = { version: h[1], date: h[2] || "", title: h[3].trim(), items: [] };
      out.push(cur);
    } else if (/^#{1,2}\s/.test(raw)) {
      cur = null; // some other heading ends the entry
    } else if (cur && /^-\s+/.test(raw)) {
      cur.items.push(raw.replace(/^-\s+/, "").trim());
    } else if (cur && cur.items.length && /^\s+\S/.test(raw)) {
      cur.items[cur.items.length - 1] += " " + raw.trim();
    }
  }
  return out.filter((e) => e.items.length);
}

export function changelog() {
  return parseChangelog(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8"));
}

const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/** 2026-11-09 -> "Nov 9, 2026" (English) or "9 tháng 11, 2026" (Vietnamese). Fixed tables, so the output does not depend on the Node build's locale data. */
export function fmtDate(iso, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return iso || "";
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return lang === "vi" ? `${d} tháng ${mo}, ${y}` : `${MONTHS.en[mo - 1]} ${d}, ${y}`;
}

/** Everything a page needs to know about the current release. */
export function context() {
  const entries = changelog();
  const version = appVersion();
  const latest = entries[0];
  if (!latest) throw new Error("CHANGELOG.md has no entries the site can read (## x.y.z (date) then '- ' lines)");
  return {
    entries,
    version,
    latest,
    date: latest.date,
    exe: `Streakboom_${version}_x64-setup.exe`,
  };
}
