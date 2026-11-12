// The page's script. Everything a reader or a crawler needs (the facts, the version, the notes, both languages) is static HTML
// built by scripts/build-site.mjs; this file only adds the small interactive parts:
//  - on phones and computers that are not Windows the .exe download is replaced by "send the link to my PC" (the page decides this
//    itself in a small script in the head, before the first paint; this file only runs the share button),
//  - start the interactive Peak after the first paint (it must never delay the page).
import { t } from "./ui.js";
import { startPeak } from "./peak.js";

const shareBtn = document.getElementById("share-btn");
let toastTimer;
shareBtn?.addEventListener("click", async () => {
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

// A click on a download link starts the download at once (the link is the .exe itself, ADR-0065); this only says, for a moment, what
// to expect, because the installer is not code-signed yet and Windows warns. Nothing is recorded or sent.
const toast = document.getElementById("dl-toast");
let dlTimer;
if (toast) {
  for (const a of document.querySelectorAll("#download-btn, #direct-dl")) {
    a.addEventListener("click", () => {
      toast.textContent = t("dl_started");
      toast.dataset.on = "1";
      clearTimeout(dlTimer);
      dlTimer = setTimeout(() => { toast.dataset.on = ""; }, 12000);
    });
  }
}

// The interactive Peak starts when the browser is idle after the first paint. The canvas has fixed width and height in the
// HTML, so nothing moves when it starts.
const canvas = document.getElementById("peak");
const poses = document.getElementById("poses");
if (canvas && poses) {
  const start = () => startPeak(canvas, poses);
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 1000 });
  else setTimeout(start, 200);
}
