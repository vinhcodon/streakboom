// The sticker page (ADR-0051, ADR-0053): the picture itself is the button. Tap or click copies the PNG to the clipboard; where the
// phone supports it, the confirmation carries a Share link. Nothing is recorded, stored or sent anywhere: there is no request except
// the one for the picture that is already on the page. Without this script the pictures are still there (real <img> elements).
import { t } from "./ui.js";

const hint = document.getElementById("sticker-hint");
const status = document.getElementById("sticker-status");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canCopy = !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem);
const touch = matchMedia("(pointer: coarse)").matches;

let resetTimer = 0;
let doneTimer = 0;

function say(text, shareFile) {
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
      } catch {
        // the sheet was dismissed (or sharing failed): nothing to do
      }
    });
    status.append(" ", share);
  }
  clearTimeout(doneTimer);
  doneTimer = setTimeout(() => { status.dataset.on = ""; status.textContent = ""; }, 7000);
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
  });
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
  let file = null;
  try {
    file = new File([await blobPromise], `${title}.png`, { type: "image/png" });
  } catch {
    // no File constructor: no Share
  }
  say(t("st_copied"), file);
}

document.querySelectorAll(".sticker").forEach((b) => b.addEventListener("click", () => copy(b)));
if (hint) hint.hidden = false; // the hint says "tap", which is only true with this script running
