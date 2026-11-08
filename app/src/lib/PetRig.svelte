<script lang="ts">
  // The mochi cat, drawn on a canvas from a spring-driven rig (see rig/engine.ts). Pose changes
  // are continuous morphs, not swaps. While the cat stands still nothing redraws at all (CPU ~0);
  // only a short blink or tail twitch now and then, and light z's/dots at ~12 fps.
  import { onMount } from "svelte";
  import type { PetState } from "$lib/sprites";
  import { Rig } from "$lib/rig/engine";
  import { drawFrame } from "$lib/rig/draw";

  let { pose, dir, tilt = 0, tick = 0 }: { pose: PetState; dir: 1 | -1; tilt?: number; tick?: number } = $props();

  const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rig = new Rig();
  let canvas: HTMLCanvasElement | undefined = $state();
  let ctx: CanvasRenderingContext2D | null = null;
  let raf = 0;
  let last = 0;
  let lastDraw = 0;
  let lastTick = -1;

  function paint() {
    if (ctx) drawFrame(ctx, rig.frame());
  }

  function loop(now: number) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    // fixed 1/120 s sub-steps keep the springs stable at any frame rate
    const n = Math.max(1, Math.round(dt * 120));
    for (let i = 0; i < n; i++) rig.step(dt / n);
    const mode = rig.mode;
    if (mode === "full" || now - lastDraw > 80) {
      paint();
      lastDraw = now;
    }
    if (mode !== "idle") raf = requestAnimationFrame(loop);
  }

  function wake() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  // follow the pose; the same pose with a new tick replays its one-shot move
  $effect(() => {
    const replay = tick !== lastTick;
    lastTick = tick;
    if (reduceMotion) {
      // jump straight to the end pose
      rig.setPose(pose, dir, tilt, replay);
      for (let i = 0; i < 600 && rig.mode === "full"; i++) rig.step(1 / 60);
      paint();
      return;
    }
    rig.setPose(pose, dir, tilt, replay);
    wake();
  });

  onMount(() => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
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
    };
  });
</script>

<canvas bind:this={canvas} width="120" height="120" style="width:120px;height:120px;display:block" aria-label="pet"></canvas>
