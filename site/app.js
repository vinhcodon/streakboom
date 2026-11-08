// Entry point: language, the interactive Peak, and the download button and updates list from GitHub Releases.
// If the API fails or is rate limited, the static fallback links in index.html still work.
import { applyLang, lang, t } from "./i18n.js";
import { startPeak } from "./peak.js";

const REPO = "vinhcodon/streakboom";
const API = `https://api.github.com/repos/${REPO}/releases?per_page=5`;

const btn = document.getElementById("download-btn");
const meta = document.getElementById("download-meta");
const list = document.getElementById("release-list");
let releases = null;
let failed = false;

const fmtDate = (iso) => new Date(iso).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", { year: "numeric", month: "short", day: "numeric" });

function renderReleases() {
  list.textContent = "";
  if (failed) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `https://github.com/${REPO}/releases`;
    a.textContent = t("load_fail");
    li.append(a);
    list.append(li);
    return;
  }
  if (!releases) return;
  for (const r of releases) {
    const li = document.createElement("li");
    const h = document.createElement("h3");
    const a = document.createElement("a");
    a.href = r.html_url;
    a.textContent = r.name || r.tag_name;
    h.append(a);
    const m = document.createElement("div");
    m.className = "meta";
    m.textContent = fmtDate(r.published_at);
    li.append(h, m);
    if (r.body) {
      const pre = document.createElement("pre");
      pre.textContent = r.body; // textContent: release notes are never injected as HTML
      li.append(pre);
    }
    list.append(li);
  }
}

function renderDownload() {
  const latest = releases?.[0];
  const exe = latest?.assets.find((a) => a.name.endsWith("-setup.exe"));
  if (!exe) return;
  btn.href = exe.browser_download_url;
  meta.removeAttribute("data-i18n");
  meta.textContent = `${latest.tag_name} · ${(exe.size / 1048576).toFixed(0)} MB · ${fmtDate(latest.published_at)}`;
}

// language
document.getElementById("lang-btn").addEventListener("click", () => applyLang(lang === "vi" ? "en" : "vi"));
document.addEventListener("langchange", () => {
  renderReleases();
  renderDownload();
});
applyLang();

startPeak(document.getElementById("peak"), document.getElementById("poses"));

try {
  const res = await fetch(API, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(res.status);
  releases = (await res.json()).filter((r) => !r.draft && !r.prerelease);
  if (!releases.length) throw new Error("no releases");
} catch {
  failed = true;
}
renderReleases();
renderDownload();
