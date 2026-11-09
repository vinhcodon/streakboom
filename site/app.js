// The page's script. Everything a reader or a crawler needs (the facts, the version, the notes, both languages) is static HTML
// built by scripts/build-site.mjs; this file only adds the small interactive parts:
//  - on phones and computers that are not Windows, replace the .exe download by "send the link to my PC",
//  - start the interactive Peak after the first paint (it must never delay the page).
import { t } from "./ui.js";
import { startPeak } from "./peak.js";

// Peak is Windows only. On a phone, a Mac or Linux the .exe is useless, so offer to send the link to a PC instead.
const platform = navigator.userAgentData?.platform || navigator.userAgent;
const isWindows = /windows/i.test(platform) && !/phone|mobile/i.test(navigator.userAgent);
document.body.classList.toggle("not-windows", !isWindows);

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

// The interactive Peak starts when the browser is idle after the first paint. The canvas has fixed width and height in the
// HTML, so nothing moves when it starts.
const canvas = document.getElementById("peak");
const poses = document.getElementById("poses");
if (canvas && poses) {
  const start = () => startPeak(canvas, poses);
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 1000 });
  else setTimeout(start, 200);
}
