<script lang="ts">
  // The mochi cat, drawn on a canvas from a spring-driven rig (see rig/engine.ts). Pose changes
  // are continuous morphs, not swaps. While the cat stands still nothing redraws at all (CPU ~0);
  // only a short blink or tail twitch now and then (about 24 fps) and light z's/dots at about 11 fps.
  import { onMount } from "svelte";
  import type { PetState } from "$lib/sprites";
  import { Rig } from "$lib/rig/engine";
  import { drawBody, drawFrame, drawFx } from "$lib/rig/draw";

  let {
    pose,
    dir,
    tilt = 0,
    tick = 0,
    gaze = null,
  }: { pose: PetState; dir: 1 | -1; tilt?: number; tick?: number; gaze?: { x: number; y: number } | null } = $props();

  const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rig = new Rig();
  let canvas: HTMLCanvasElement | undefined = $state();
  let ctx: CanvasRenderingContext2D | null = null;
  let raf = 0;
  let frameTimer: ReturnType<typeof setTimeout> | undefined;
  let last = 0;
  let lastTick = -1;

  // Frame intervals of the slower modes (see Rig.mode). Every painted frame costs real CPU here
  // (software drawing), so these are as slow as still looks smooth (PR-4, engineering log).
  const SOFT_MS = 41; // about 24 fps: a blink, a tail flick, the eyes looking around
  const WALK_MS = 33; // about 30 fps: two paints per window move (the walk tick is 66 ms), so the steps stay even
  const LIGHT_MS = 90; // about 11 fps: the z's of sleep, the dots of thinking (5 fps looked slow and choppy)

  let dpr = 1;
  let cache: HTMLCanvasElement | null = null; // the settled cat, drawn once, while only z's or dots move
  let cacheOk = false;

  function paint() {
    cacheOk = false;
    if (ctx) drawFrame(ctx, rig.frame());
  }

  /** Sleeping and thinking: the cat does not change, only small effects do, so reuse one drawing of it. */
  function paintLight() {
    if (!ctx || !canvas) return;
    const f = rig.frame();
    if (!cache) {
      cache = document.createElement("canvas");
      cache.width = canvas.width;
      cache.height = canvas.height;
    }
    if (!cacheOk) {
      const cc = cache.getContext("2d")!;
      cc.setTransform(1, 0, 0, 1, 0, 0);
      cc.clearRect(0, 0, cache.width, cache.height);
      cc.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBody(cc, f);
      cacheOk = true;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cache, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFx(ctx, f);
  }

  // Redraw only as often as the motion needs (see Rig.mode): a standing cat costs nothing.
  function loop() {
    raf = 0;
    frameTimer = undefined;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    // fixed 1/120 s sub-steps keep the springs stable at any frame rate
    const n = Math.max(1, Math.round(dt * 120));
    for (let i = 0; i < n; i++) rig.step(dt / n);
    const mode = rig.mode;
    if (mode === "light") paintLight();
    else paint();
    if (mode === "full") raf = requestAnimationFrame(loop);
    else if (mode === "soft") frameTimer = setTimeout(loop, SOFT_MS);
    else if (mode === "walk") frameTimer = setTimeout(loop, WALK_MS);
    else if (mode === "light") frameTimer = setTimeout(loop, LIGHT_MS);
  }

  function wake() {
    if (raf) return;
    clearTimeout(frameTimer); // a pending slow frame is replaced by a fast one
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  // the eyes follow the cursor while it is over the cat
  $effect(() => {
    rig.lookAt(gaze ? { x: gaze.x, y: gaze.y } : null);
    if (!reduceMotion) wake();
  });

  // follow the pose; the same pose with a new tick replays its one-shot move
  $effect(() => {
    const replay = tick !== lastTick;
    lastTick = tick;
    if (reduceMotion) {
      // jump straight to the end pose
      rig.setPose(pose, dir, tilt, replay);
      for (let i = 0; i < 600 && (rig.mode === "full" || rig.mode === "soft"); i++) rig.step(1 / 60);
      paint();
      return;
    }
    rig.setPose(pose, dir, tilt, replay);
    wake();
  });

  onMount(() => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas) {
      canvas.width = 120 * dpr;
      canvas.height = 120 * dpr;
      ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    paint();
    // blink and tail twitch, only while standing around
    let timer: ReturnType<typeof setTimeout> | undefined;
    let n = 0;
    const idleLoop = () => {
      timer = setTimeout(() => {
        if (!reduceMotion && (rig.pose === "idle" || rig.pose === "look" || rig.pose === "think")) {
          rig.blink();
          if (++n % 3 === 0) rig.twitch();
          wake();
        }
        idleLoop();
      }, 2800 + Math.random() * 3800);
    };
    idleLoop();
    // test hook for the preview tooling: step the simulation by hand
    (window as unknown as Record<string, unknown>).__cat = {
      rig,
      advance(sec: number) {
        for (let i = 0; i < Math.round(sec * 120); i++) rig.step(1 / 120);
        paint();
      },
    };
    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(frameTimer);
    };
  });
</script>

<canvas bind:this={canvas} width="120" height="120" style="width:120px;height:120px;display:block" aria-label="pet"></canvas>
