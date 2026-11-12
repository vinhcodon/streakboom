// The sticker page (ADR-0051, ADR-0053, ADR-0060): the picture itself is the button. Tap or click copies the PNG to the clipboard
// (the picture as it is, 360 px; ?px=NN on the address can shrink it to try); where the phone supports it, the confirmation carries a Share
// link. The only thing kept is a short list of the last stickers you used, in this browser only (local storage: sticker numbers, never
// sent anywhere; the row has a Clear button). There is no request except the one for the picture that is already on the page.
// Without this script the pictures are still there (real <img> elements).
import { t } from "./ui.js";

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
const clear = document.getElementById("sticker-recent-clear");
if (clear) clear.addEventListener("click", () => { writeRecent([]); showRecent(); });
showRecent();
if (hint) hint.hidden = false; // the hint says "tap", which is only true with this script running
