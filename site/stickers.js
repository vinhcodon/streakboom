// The sticker page (ADR-0051, ADR-0053, ADR-0060): the picture itself is the button. Tap or click copies the PNG to the clipboard
// (the picture as it is, 360 px; ?px=NN on the address can shrink it to try); where the phone supports it, the confirmation carries a Share
// link. The only thing kept is a short list of the last stickers you used, in this browser only (local storage: sticker numbers, never
// sent anywhere; the row has a Clear button). There is no request except the one for the picture that is already on the page.
// Without this script the pictures are still there (real <img> elements).
import { t } from "./ui.js";
import { search } from "./search.js";

const COPY_PX = 360; // the copy is the picture as it is: 360 px, as sharp as it can be (ADR-0075; 180 and 128 were tried and were too small and soft)
// To try other sizes in a chat, open the page with ?px=NN (48 to 360); nothing is stored, and without it the size is COPY_PX.
const asked = Number(new URLSearchParams(location.search).get("px"));
const COPY_SIDE = Number.isInteger(asked) && asked >= 48 && asked <= 360 ? asked : COPY_PX;
// the numbers of a set mean nothing in another set (ADR-0073): the list is kept per set, and the one of an older set is dropped
const LEGACY_KEY = "streakboom-sticker-recent";
const SET_ID = (document.getElementById("sticker-recent") || { dataset: {} }).dataset.set || "";
const RECENT_KEY = `${LEGACY_KEY}-${SET_ID}`;
const RECENT_MAX = 10;

const hint = document.getElementById("sticker-hint");
const status = document.getElementById("sticker-status");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canCopy = !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem);
const touch = matchMedia("(pointer: coarse)").matches;

let resetTimer = 0;
let doneTimer = 0;

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

// ---- the last stickers used (this browser only)
function readRecent() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(list) ? list.filter((x) => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}
function writeRecent(list) {
  try {
    if (list.length) localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    else localStorage.removeItem(RECENT_KEY);
  } catch {
    // storage is blocked (a private window): the row simply does not remember
  }
}

try {
  localStorage.removeItem(LEGACY_KEY);
} catch {
  // storage is blocked: nothing to drop
}
const recentBox = document.getElementById("sticker-recent");
const recentList = document.getElementById("sticker-recent-list");
const mainButtons = new Map([...document.querySelectorAll(".sticker-grid:not(.recent-grid) .sticker")].map((b) => [b.dataset.id, b]));

function showRecent() {
  if (!recentBox || !recentList) return;
  const ids = readRecent().filter((id) => mainButtons.has(id));
  recentList.textContent = "";
  for (const id of ids) {
    const li = document.createElement("li");
    li.className = "sticker-item";
    const b = mainButtons.get(id).cloneNode(true);
    b.dataset.recent = "1";
    b.querySelector("img").loading = "eager";
    b.addEventListener("click", () => copy(b));
    li.append(b);
    recentList.append(li);
  }
  recentBox.hidden = ids.length === 0;
}

function remember(button) {
  const id = button.dataset.id;
  if (!id) return;
  writeRecent([id, ...readRecent().filter((x) => x !== id)].slice(0, RECENT_MAX));
  // a sticker tapped inside the row stays where it is until the next visit (it would move under the finger)
  if (!button.dataset.recent) showRecent();
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
  say(t("st_copied"), file, () => remember(button));
}

document.querySelectorAll(".sticker").forEach((b) => b.addEventListener("click", () => copy(b)));

// ---- the search (plan v0.2): the index of this language is read from the site the first time the box is used; it filters and orders the
// pictures already on the page, and nothing is sent anywhere (the request is for a file of the site itself)
const lang = document.documentElement.lang || "en";
const searchBox = document.getElementById("sticker-search");
const query = document.getElementById("sticker-q");
const searchStatus = document.getElementById("sticker-search-status");
const page = document.querySelector(".stickers-page");
const itemById = new Map([...document.querySelectorAll(".sticker-grid:not(.recent-grid) .sticker")].map((b) => [b.dataset.id, b.closest(".sticker-item")]));
let indexItems = null;
let loading = null;
function loadIndex() {
  loading ||= fetch(`/assets/stickers/search-${lang}.json`).then((r) => {
    if (!r.ok) throw new Error("index");
    return r.json();
  }).then((j) => {
    if (j.v !== 1 || !Array.isArray(j.items)) throw new Error("index version");
    indexItems = j.items;
    return indexItems;
  });
  return loading;
}
function showAll() {
  for (const li of itemById.values()) { li.hidden = false; li.style.order = ""; }
  page.classList.remove("searching");
}
function applySearch() {
  const text = query.value;
  if (!text.trim()) { showAll(); searchStatus.textContent = ""; return; }
  const found = search(lang, indexItems, text);
  const rank = new Map(found.map((r, i) => [r.id, i + 1]));
  for (const [id, li] of itemById) { li.hidden = !rank.has(id); li.style.order = rank.has(id) ? String(rank.get(id)) : ""; }
  page.classList.add("searching");
  searchStatus.textContent = found.length ? t("st_search_count").replace("%n", String(found.length)) : t("st_search_none");
}
function searchOff() {
  showAll();
  searchStatus.textContent = t("st_search_off");
}
if (searchBox && query) {
  query.addEventListener("focus", () => { loadIndex().catch(() => {}); }, { once: true });
  query.addEventListener("input", () => { loadIndex().then(applySearch, searchOff); });
  query.addEventListener("keydown", (e) => { if (e.key === "Escape" && query.value) { query.value = ""; applySearch(); } });
  searchBox.hidden = false;
}
const clear = document.getElementById("sticker-recent-clear");
if (clear) clear.addEventListener("click", () => { writeRecent([]); showRecent(); });
showRecent();
if (hint) hint.hidden = false; // the hint says "tap", which is only true with this script running
