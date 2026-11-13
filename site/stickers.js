// The sticker page (ADR-0051, ADR-0053, ADR-0060, plan v0.2 to v0.4): the picture itself is the button. Tap or click copies the PNG to the
// clipboard (the picture as it is, 360 px; ?px=NN on the address can shrink it to try); where the phone supports it, the confirmation
// carries a Share link. The only thing kept is a short list of the last stickers you used, in this browser only (local storage, never
// sent anywhere), by their address (slug), with one Clear button. The search reads a small index file of the site itself. There is no other request than the pictures and that file.
// Without this script the pictures are still there (real <img> elements).
import { t } from "./ui.js";
import { scriptOf, search } from "./search.js";

const COPY_PX = 360; // the copy is the picture as it is: 360 px, as sharp as it can be (ADR-0075; 180 and 128 were tried and were too small and soft)
// To try other sizes in a chat, open the page with ?px=NN (48 to 360); nothing is stored, and without it the size is COPY_PX.
const asked = Number(new URLSearchParams(location.search).get("px"));
const COPY_SIDE = Number.isInteger(asked) && asked >= 48 && asked <= 360 ? asked : COPY_PX;

// What is kept, by the sticker's English address (its slug), which never changes (ADR-0073 kept the lists per set because numbers change;
// slugs do not). The lists of the older versions (numbers, per set) are moved here once and dropped.
const MINE_KEY = "streakboom-stickers-mine";
const LEGACY_KEY = "streakboom-sticker-recent";
const SET_ID = (document.getElementById("sticker-recent") || { dataset: {} }).dataset.set || "";
const RECENT_MAX = 10;
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* blocked (a private window): nothing is remembered */ } },
  del(key) { try { localStorage.removeItem(key); } catch { /* blocked: nothing to drop */ } },
};

const hint = document.getElementById("sticker-hint");
const status = document.getElementById("sticker-status");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canCopy = !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem);
const touch = matchMedia("(pointer: coarse)").matches;

const mainButtons = new Map([...document.querySelectorAll(".sticker-grid:not(.recent-grid) .sticker")].map((b) => [b.dataset.slug, b]));
const slugOfId = new Map([...mainButtons.values()].map((b) => [b.dataset.id, b.dataset.slug]));

let resetTimer = 0;
let doneTimer = 0;
let copies = 0; // copies in this visit, so that the line after a copy changes when you copy again

// ---- the saved and the last used stickers (this browser only)
function readMine() {
  const out = { recent: [] };
  try {
    const j = JSON.parse(store.get(MINE_KEY) || "null");
    if (j && j.v === 1) {
      const clean = (list, max) => (Array.isArray(list) ? list.filter((x) => typeof x === "string").slice(0, max) : []);
      out.recent = clean(j.recent, RECENT_MAX);
    }
  } catch {
    // a damaged list is ignored
  }
  return out;
}
function writeMine(mine) {
  if (mine.recent.length) store.set(MINE_KEY, JSON.stringify({ v: 1, recent: mine.recent }));
  else store.del(MINE_KEY);
}
// the older list of numbers, kept per set: moved by slug when there is none yet, then dropped
(function migrate() {
  const old = store.get(`${LEGACY_KEY}-${SET_ID}`);
  if (old && !store.get(MINE_KEY)) {
    try {
      const ids = JSON.parse(old);
      const recent = Array.isArray(ids) ? ids.map((id) => slugOfId.get(id)).filter(Boolean).slice(0, RECENT_MAX) : [];
      if (recent.length) writeMine({ recent });
    } catch {
      // not a list: dropped
    }
  }
  store.del(`${LEGACY_KEY}-${SET_ID}`);
  store.del(LEGACY_KEY);
})();

const recentBox = document.getElementById("sticker-recent");
const recentList = document.getElementById("sticker-recent-list");
const mineFoot = document.getElementById("sticker-mine-foot");

function fill(list, slugs) {
  list.textContent = "";
  for (const slug of slugs) {
    const li = document.createElement("li");
    li.className = "sticker-item";
    const b = mainButtons.get(slug).cloneNode(true);
    b.dataset.recent = "1";
    b.querySelector("img").loading = "eager";
    b.addEventListener("click", () => copy(b));
    li.append(b);
    list.append(li);
  }
}
function showMine() {
  if (!recentBox || !recentList) return;
  const mine = readMine();
  const recent = mine.recent.filter((s) => mainButtons.has(s));
  fill(recentList, recent);
  recentBox.hidden = recent.length === 0;
  if (mineFoot) mineFoot.hidden = recent.length === 0;
}
function remember(button) {
  const slug = button.dataset.slug;
  if (!slug) return;
  const mine = readMine();
  mine.recent = [slug, ...mine.recent.filter((x) => x !== slug)].slice(0, RECENT_MAX);
  writeMine(mine);
  // a sticker tapped inside a row stays where it is until the next visit (it would move under the finger)
  if (!button.dataset.recent) showMine();
}
// ---- what Peak says after a copy (a line that changes with the sticker and the visit; a quiet one late at night, by the person's own clock)
function copyLine(slug) {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 6) return t("st_night");
  const lines = t("st_lines");
  if (!Array.isArray(lines) || !lines.length) return String(lines);
  let h = 0;
  for (const c of slug) h = (h + c.charCodeAt(0)) % 997;
  return lines[(h + copies) % lines.length];
}

function say(text, shareFile, onShared) {
  status.textContent = "";
  status.append(text);
  status.dataset.on = "1";
  // Share only on a touch phone that can share this file (navigator.canShare with files)
  if (shareFile && touch && navigator.canShare && navigator.canShare({ files: [shareFile] })) {
    const share = document.createElement("button");
    share.type = "button";
    share.className = "sticker-share";
    share.textContent = t("st_share");
    share.addEventListener("click", async () => {
      try {
        await navigator.share({ files: [shareFile] });
        if (onShared) onShared();
      } catch {
        // the sheet was dismissed (or sharing failed): nothing to do
      }
    });
    status.append(" ", share);
  }
  clearTimeout(doneTimer);
  doneTimer = setTimeout(() => { status.dataset.on = ""; status.textContent = ""; }, 7000);
}

/** The picture at COPY_SIDE (a PNG with its transparency); if anything fails, the original picture. */
async function shrink(blob) {
  try {
    const bmp = await createImageBitmap(blob);
    const side = Math.min(COPY_SIDE, bmp.width);
    if (side >= bmp.width) return blob; // the original file, not re-encoded
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = Math.round((bmp.height * side) / bmp.width);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const out = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    return out || blob;
  } catch {
    return blob;
  }
}

async function copy(button) {
  if (!canCopy) {
    say(t("st_copy_failed"));
    return;
  }
  const img = button.querySelector("img");
  const title = button.dataset.title || "sticker";
  const url = img.currentSrc || img.src;
  // the promise is handed to ClipboardItem at once, inside the tap: Safari only accepts a copy that starts in the gesture
  const blobPromise = fetch(url).then((r) => {
    if (!r.ok) throw new Error("fetch");
    return r.blob();
  }).then(shrink);
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blobPromise })]);
  } catch {
    say(t("st_copy_failed"));
    return;
  }
  button.classList.remove("copied");
  if (!reduceMotion) void button.offsetWidth; // restart the little bounce
  button.classList.add("copied");
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => button.classList.remove("copied"), 1600);
  remember(button);
  let file = null;
  try {
    file = new File([await blobPromise], `${title}.png`, { type: "image/png" });
  } catch {
    // no File constructor: no Share
  }
  say(copyLine(button.dataset.slug || ""), file, () => remember(button));
  copies++;
}

document.querySelectorAll(".sticker").forEach((b) => b.addEventListener("click", () => copy(b)));

// ---- the search (plan v0.2): by meaning, whatever language is typed and whatever language the page is in; the index (Latin letters, or
// Japanese) is read from the site the first time a query of that script is typed; it filters and orders the pictures already on the page
// (which are in the page's language), and nothing is sent anywhere (the request is for a file of the site itself)
const searchBox = document.getElementById("sticker-search");
const query = document.getElementById("sticker-q");
const searchStatus = document.getElementById("sticker-search-status");
const page = document.querySelector(".stickers-page");
const itemById = new Map([...document.querySelectorAll(".sticker-grid:not(.recent-grid) .sticker")].map((b) => [b.dataset.id, b.closest(".sticker-item")]));
const loaded = {}; // the items of each index, by script
const loading = {};
let noneShown = 0; // the line for "nothing found" changes each time nothing is found again, not on every key
let wasNone = false;
let noneLine = "";
function loadIndex(kind) {
  loading[kind] ||= fetch(`/assets/stickers/search-${kind}.json`).then((r) => {
    if (!r.ok) throw new Error("index");
    return r.json();
  }).then((j) => {
    if (j.v !== 2 || !Array.isArray(j.items)) throw new Error("index version");
    loaded[kind] = j.items;
    return loaded[kind];
  });
  return loading[kind];
}
function showAll() {
  for (const li of itemById.values()) { li.hidden = false; li.style.order = ""; }
  page.classList.remove("searching");
  wasNone = false;
}
function applySearch() {
  const text = query.value;
  if (!text.trim()) { showAll(); searchStatus.textContent = ""; return; }
  const kind = scriptOf(text);
  const found = search(kind, loaded[kind], text);
  const rank = new Map(found.map((r, i) => [r.id, i + 1]));
  for (const [id, li] of itemById) { li.hidden = !rank.has(id); li.style.order = rank.has(id) ? String(rank.get(id)) : ""; }
  page.classList.add("searching");
  if (found.length) {
    wasNone = false;
    searchStatus.textContent = t("st_search_count").replace("%n", String(found.length));
  } else {
    if (!wasNone) {
      const lines = t("st_search_none");
      noneLine = Array.isArray(lines) ? lines[noneShown++ % lines.length] : String(lines);
      wasNone = true;
    }
    searchStatus.textContent = noneLine;
  }
}
function searchOff() {
  showAll();
  searchStatus.textContent = t("st_search_off");
}
if (searchBox && query) {
  query.addEventListener("focus", () => { loadIndex("latin").catch(() => {}); }, { once: true });
  query.addEventListener("input", () => { loadIndex(scriptOf(query.value)).then(applySearch, searchOff); });
  query.addEventListener("keydown", (e) => { if (e.key === "Escape" && query.value) { query.value = ""; applySearch(); } });
  searchBox.hidden = false;
}
const clear = document.getElementById("sticker-recent-clear");
if (clear) clear.addEventListener("click", () => { store.del(MINE_KEY); showMine(); });
showMine();
if (hint) hint.hidden = false; // the hint says "tap", which is only true with this script running
