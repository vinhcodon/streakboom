// Entry point: language, the interactive Peak, the download button and the "updates" list.
// The download button always points at the latest release page (never at a version-specific link, since
// GitHub keeps only the two newest releases). The version, date and notes come from CHANGELOG.md in the
// repository, so a new release needs no change here.
import { applyLang, lang, t } from "./i18n.js";
import { startPeak } from "./peak.js";

const REPO = "vinhcodon/streakboom";
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const CHANGELOG_URL = `${RAW}/CHANGELOG.md`;
const MANIFEST_URL = `${RAW}/updates/latest.json`; // fallback: newest version and its notes only
const CHANGELOG_PAGE = `https://github.com/${REPO}/blob/main/CHANGELOG.md`;
const SHOW = 3; // newest entries shown

const meta = document.getElementById("download-meta");
const list = document.getElementById("release-list");
let entries = null; // [{ version, date, title, items: [text] }] newest first, or null while loading
let failed = false;

const fmtDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", { year: "numeric", month: "short", day: "numeric" });
};

/** "## 0.2.1 (2026-11-08), a title" headings, each followed by "- " bullets (wrapped lines are joined). */
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

function renderReleases() {
  list.textContent = "";
  if (failed) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = CHANGELOG_PAGE;
    a.textContent = t("load_fail");
    li.append(a);
    list.append(li);
    return;
  }
  if (!entries) return;
  for (const e of entries.slice(0, SHOW)) {
    const li = document.createElement("li");
    const h = document.createElement("h3");
    h.textContent = `Streakboom ${e.version}`;
    const m = document.createElement("div");
    m.className = "meta";
    m.textContent = [e.date && fmtDate(e.date), e.title].filter(Boolean).join(" · ");
    const ul = document.createElement("ul");
    for (const text of e.items) {
      const item = document.createElement("li");
      item.textContent = text; // textContent: changelog text is never injected as HTML
      ul.append(item);
    }
    li.append(h, m, ul);
    list.append(li);
  }
}

function renderDownload() {
  const latest = entries?.[0];
  if (!latest) return;
  // the install step names the real file for the current version
  const exeName = document.getElementById("exe-name");
  if (exeName) exeName.textContent = `Streakboom_${latest.version}_x64-setup.exe`;
  meta.removeAttribute("data-i18n");
  meta.textContent = [`v${latest.version}`, latest.date && fmtDate(latest.date)].filter(Boolean).join(" · ");
}

// Peak is Windows only. On a phone, a Mac or Linux the .exe is useless, so offer to send the link to a PC instead.
const platform = navigator.userAgentData?.platform || navigator.userAgent;
const isWindows = /windows/i.test(platform) && !/phone|mobile/i.test(navigator.userAgent);
document.body.classList.toggle("not-windows", !isWindows);

const shareBtn = document.getElementById("share-btn");
let toastTimer;
shareBtn.addEventListener("click", async () => {
  const url = location.href.split("#")[0];
  try {
    if (navigator.share) {
      await navigator.share({ title: document.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    shareBtn.textContent = t("link_copied");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (shareBtn.textContent = t("share_btn")), 2500);
  } catch {
    // share sheet dismissed, or clipboard blocked: nothing to do
  }
});

// language
document.getElementById("lang-btn").addEventListener("click", () => applyLang(lang === "vi" ? "en" : "vi"));
document.addEventListener("langchange", () => {
  renderReleases();
  renderDownload();
});
applyLang();

startPeak(document.getElementById("peak"), document.getElementById("poses"));

async function getText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(res.status);
  return res.text();
}

async function loadEntries() {
  // Both requests start together, so a host that hangs costs one timeout (6 s), not two in a row.
  // The manifest (committed by the release script) has the newest version and its notes as one paragraph.
  const changelog = getText(CHANGELOG_URL).then(parseChangelog);
  const manifest = getText(MANIFEST_URL).then((text) => {
    const m = JSON.parse(text);
    return [{ version: m.version, date: (m.pub_date || "").slice(0, 10), title: "", items: [m.notes].filter(Boolean) }];
  });
  manifest.catch(() => {}); // only used if the changelog fails; no unhandled rejection otherwise
  try {
    const parsed = await changelog;
    if (parsed.length) return parsed;
  } catch {
    // fall through to the manifest
  }
  return manifest;
}

try {
  entries = await loadEntries();
} catch {
  failed = true; // offline or blocked: the download button and the links still work
}
renderReleases();
renderDownload();
