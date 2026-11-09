// An interactive Peak for the hero, drawn by the app's own rig (built into ./peak/ by scripts/build-site.mjs).
import { Rig } from "./peak/engine.js";
import { drawFrame } from "./peak/draw.js";
import { t } from "./i18n.js";

const POSES = ["idle", "happy", "purr", "sleep", "wake", "walk", "gasp", "sad", "curious"];
const TIMED = { happy: 1400, purr: 2600, gasp: 900, curious: 1800, wake: 1500 }; // then back to idle
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

export function startPeak(canvas, chipBox) {
  const rig = new Rig();
  const ctx = canvas.getContext("2d");
  const scale = canvas.width / 120;
  const chips = new Map();
  let back = 0;
  let raf = 0;
  let last = 0;
  let visible = true;

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

  function setPose(pose, tilt = 0) {
    clearTimeout(back);
    rig.setPose(pose, 1, tilt, true);
    for (const [p, b] of chips) b.setAttribute("aria-pressed", String(p === pose));
    if (TIMED[pose]) back = setTimeout(() => setPose("idle"), TIMED[pose]);
    wake();
  }

  // pose chips
  for (const pose of POSES) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.addEventListener("click", () => setPose(pose));
    chips.set(pose, b);
    chipBox.append(b);
  }
  const label = () => chips.forEach((b, p) => (b.textContent = t("pose_" + p)));
  label();
  document.addEventListener("langchange", label);

  // the eyes follow the pointer, like the app; a click is a poke
  addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / 220;
    const dy = (e.clientY - (r.top + r.height / 2)) / 220;
    const near = Math.hypot(dx, dy) < 2.2;
    rig.lookAt(near ? { x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) } : null);
    if (!reduceMotion && !raf) wake();
  });
  canvas.addEventListener("click", () => setPose("gasp"));
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
    if (visible) wake();
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => !document.hidden && wake());

  setPose("idle");
  paint();
}
