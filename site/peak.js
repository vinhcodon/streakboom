// The interactive Peak of the hero, drawn by the app's own rig (built into ./peak/ by scripts/build-site.mjs).
// It plays "a day of Peak" by itself (site/scenes.js, sequenced by site/tour.js) with a caption for each scene, and settles into
// standing still after one round. Like the real Peak it is polite: it stops when the visitor takes control, when the pointer
// is over it, when the page is hidden or scrolled away, and it does not move by itself at all when the system asks for less motion.
import { Rig } from "./peak/engine.js";
import { drawFrame } from "./peak/draw.js";
import { HOVER_GRACE_MS, LOOPS, RESUME_LOOPS, RESUME_MS, SCENES } from "./scenes.js";
import { createTour } from "./tour.js";
import { t } from "./ui.js";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const HAPPY = SCENES.findIndex((s) => s.id === "happy"); // a click is a poke: in the app it makes Peak happy
const GASP = SCENES.findIndex((s) => s.id === "gasp"); // a right click pushes Peak in the app (ADR-0055); here it only gets a fright

export function startPeak(canvas, chipBox) {
  const rig = new Rig();
  const ctx = canvas.getContext("2d");
  const scale = canvas.width / 120;
  const caption = document.getElementById("peak-caption");
  const status = document.getElementById("peak-status");
  const chips = [];
  let raf = 0;
  let last = 0;
  let visible = true;
  let holdTimer = 0;
  let captionTimer = 0;

  // Peak is drawn a little smaller than the canvas so the round backdrop never cuts off its paws or tail
  const FIT = 0.84;
  const paint = () => {
    const s = scale * FIT;
    const off = (canvas.width - 120 * s) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(s, 0, 0, s, off, off + canvas.width * 0.02);
    drawFrame(ctx, rig.frame());
  };

  const loop = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const n = Math.max(1, Math.round(dt * 120)); // fixed small steps keep the springs stable
    for (let i = 0; i < n; i++) rig.step(dt / n);
    paint();
    if (rig.mode !== "idle" && visible && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const wake = () => {
    if (reduceMotion) {
      for (let i = 0; i < 600 && rig.mode === "full"; i++) rig.step(1 / 60);
      paint();
    } else if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };

  const stand = () => {
    rig.setPose("idle", 1, 0, false);
    wake();
  };

  /** The caption fades out, changes and fades in; the box has a fixed height, so nothing moves. */
  function setCaption(text, announce) {
    if (!caption || caption.textContent === text) return;
    clearTimeout(captionTimer);
    if (reduceMotion) caption.textContent = text;
    else {
      caption.classList.add("swap");
      captionTimer = setTimeout(() => {
        caption.textContent = text;
        caption.classList.remove("swap");
      }, 180);
    }
    // the automatic captions are not read out; what the visitor chooses is
    if (announce && status) status.textContent = text;
  }

  function showScene(i, { user }) {
    const sc = SCENES[i];
    clearTimeout(holdTimer);
    rig.setPose(sc.pose, sc.dir, 0, true);
    chips.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    setCaption(t("cap_" + sc.id), user);
    // a scene chosen by hand also returns to standing after its hold (a tour scene does it through onHold)
    if (user && sc.hold) holdTimer = setTimeout(stand, sc.hold);
    wake();
    if (!user && !userPaused) refreshToggle();
  }

  // ---- the tour
  let userPaused = false;
  let toggle = null;
  const tour = reduceMotion
    ? null
    : createTour({
        scenes: SCENES, loops: LOOPS, resumeMs: RESUME_MS, resumeLoops: RESUME_LOOPS,
        onScene: showScene,
        onHold: stand,
        onSettle: () => {
          stand();
          chips.forEach((b) => b.setAttribute("aria-pressed", "false"));
          refreshToggle();
        },
      });

  function refreshToggle() {
    if (!toggle || !tour) return;
    toggle.textContent = userPaused || tour.settled ? t("tour_play") : t("tour_pause");
  }

  // ---- the chips (one per scene) are in the page's HTML; here they get their behaviour
  chipBox.querySelectorAll(".chip[data-scene]").forEach((b) => {
    const i = Number(b.dataset.scene);
    b.addEventListener("click", () => (tour ? tour.select(i) : showScene(i, { user: true })));
    chips[i] = b;
  });
  const pendingToggle = chipBox.querySelector("#tour-toggle");

  if (!tour) pendingToggle?.remove(); // "reduce motion": no tour, so no Pause button
  else {
    toggle = pendingToggle;
    toggle.removeAttribute("data-pending"); // the button was in the HTML (invisible) so its room was reserved
    toggle.addEventListener("click", () => {
      if (userPaused || tour.settled) {
        userPaused = false;
        tour.unblock("paused");
        if (tour.settled) tour.start();
      } else {
        userPaused = true;
        tour.block("paused");
      }
      refreshToggle();
    });
    refreshToggle();

    // polite: the tour waits while the pointer or the keyboard is on the cat and its buttons, and the page is not in view
    const area = canvas.closest(".hero-art") || canvas;
    // Only a mouse or a pen "hovers". A finger has no hover: on a phone a touch (or a scroll that starts on the cat) also fires
    // pointerenter, and if the browser never sends the matching pointerleave (Safari on iPhone can skip it after the touch
    // is taken over for scrolling) the tour would wait for ever. So touch never blocks the tour.
    area.addEventListener("pointerenter", (e) => e.pointerType !== "touch" && tour.block("hover"));
    area.addEventListener("pointerleave", () => tour.unblock("hover", HOVER_GRACE_MS));
    area.addEventListener("pointercancel", () => tour.unblock("hover", HOVER_GRACE_MS));
    // keyboard focus only (a tap on a button must not hold the tour; some phones focus a tapped button and never blur it)
    const keyboardFocus = (e) => { try { return e.target.matches(":focus-visible"); } catch { return true; } };
    area.addEventListener("focusin", (e) => keyboardFocus(e) && tour.block("focus"));
    area.addEventListener("focusout", () => tour.unblock("focus", HOVER_GRACE_MS));
    document.addEventListener("visibilitychange", () => (document.hidden ? tour.block("hidden") : tour.unblock("hidden")));
  }

  // the eyes follow the pointer, like the app; a click is a poke
  addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / 220;
    const dy = (e.clientY - (r.top + r.height / 2)) / 220;
    const near = Math.hypot(dx, dy) < 2.2;
    rig.lookAt(near ? { x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) } : null);
    if (!reduceMotion && !raf) wake();
  });
  canvas.addEventListener("click", () => (tour ? tour.select(HAPPY) : showScene(HAPPY, { user: true })));
  // a right click on the picture of Peak itself (not on the page around it) shows the fright, like the push of the app
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (tour) tour.select(GASP);
    else showScene(GASP, { user: true });
    setCaption(t("cap_push"), true);
  });
  canvas.style.cursor = "pointer";

  // blink now and then, only while standing around
  (function blinkLater() {
    setTimeout(() => {
      if (!reduceMotion && !document.hidden && visible && ["idle", "curious"].includes(rig.pose)) {
        rig.blink();
        wake();
      }
      blinkLater();
    }, 2200 + Math.random() * 3000);
  })();

  // do not animate while off screen or in a background tab
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (tour) (visible ? tour.unblock("offscreen") : tour.block("offscreen"));
    if (visible) wake();
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => !document.hidden && wake());

  rig.setPose("idle", 1, 0, true);
  paint();
  if (tour) tour.start();
}
