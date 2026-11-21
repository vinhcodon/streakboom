<script lang="ts">
  // The window of Paws (exp/duo-prototype only, ADR-0139): the Mochi art of ADR-0131 (side view, and the front view when it stands
  // and looks at the person), at the size of Peak (the 120 px canvas of the rig). It also runs the director of the duo scenes
  // (lib/scene.ts, pure and tested): the beats move the windows through Rust (duo_pos) and tell Peak's page what pose to show.
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import { newDirector, start, due, cancel, isLive, SCENES, type Beat, type DirectorState } from "$lib/scene";

  const q = new URLSearchParams(location.search);
  const from = q.get("from") ?? "up"; // the way it faces when it comes in
  let dir: 1 | -1 = $state(from === "left" ? -1 : 1);
  let front = $state(false); // standing, looking at the person
  let walking = $state(false); // a small bob of the body while it moves (the art has no legs to move)

  // ---- the director
  let director: DirectorState = newDirector();
  let token = 0;
  let loop: ReturnType<typeof setInterval> | undefined;
  const HALF = 300; // the half width of the stage floor, in logical px

  interface Stage { peak: [number, number]; paws: [number, number]; size: number; inset: number; body: number; scale: number }
  let stage: Stage | null = null;
  let cx = 0; // centre of the floor strip, physical px
  let floorY = 0;
  // positions on the floor strip, -1..1
  const pos: Record<string, number> = { peak: 0, paws: 0, ball: 0, cushion: -0.8 };
  const heldBy: Record<string, string | null> = { ball: null, cushion: null };
  let objShown: "ball" | "cushion" | null = null;
  const tweens: Record<string, { from: number; to: number; t0: number; ms: number } | undefined> = {};

  const px = (n: number) => Math.round(cx + n * HALF * (stage?.scale ?? 1));
  const winX = (who: string, n: number) => px(n) - Math.round((who === "ball" || who === "cushion" ? 24 * (stage?.scale ?? 1) : (stage?.size ?? 200) / 2));

  function place(who: string) {
    if (!stage) return;
    const n = pos[who];
    if (who === "peak" || who === "paws") {
      void invoke("duo_pos", { label: who, x: winX(who, n), y: floorY });
    } else if (objShown === who) {
      // an object sits on the floor of the pet window (the bottom of the pet window minus its own height), in front of its holder
      const holder = heldBy[who];
      const hx = holder ? pos[holder] + (holder === "paws" ? dir : peakDir) * 0.12 : n;
      const oy = floorY + stage.inset + stage.body - Math.round(48 * stage.scale) - (holder ? Math.round(14 * stage.scale) : 0);
      void invoke("duo_ball", { show: true, kind: who, x: winX(who, hx), y: oy });
    }
  }

  let peakDir: 1 | -1 = 1;
  function peakPose(pose: string, d: 1 | -1 = peakDir) {
    peakDir = d;
    void invoke("duo_peak_pose", { pose, dir: d, hold: true });
  }

  function tweenTo(who: string, to: number, speed = 0.32) {
    const dist = Math.abs(to - pos[who]);
    tweens[who] = { from: pos[who], to, t0: performance.now(), ms: Math.max(250, (dist / speed) * 1000) };
    if (who === "paws") { dir = to >= pos.paws ? 1 : -1; front = false; walking = true; }
    if (who === "peak") peakPose("walk", to >= pos.peak ? 1 : -1);
  }

  function frame() {
    const now = performance.now();
    for (const who of Object.keys(tweens)) {
      const tw = tweens[who];
      if (!tw) continue;
      const k = Math.min(1, (now - tw.t0) / tw.ms);
      pos[who] = tw.from + (tw.to - tw.from) * (1 - (1 - k) ** 2);
      place(who);
      if (k >= 1) {
        tweens[who] = undefined;
        if (who === "peak") peakPose("idle");
        if (who === "paws") { front = false; walking = false; }
      }
    }
    for (const o of ["ball", "cushion"]) if (heldBy[o]) { pos[o] = pos[heldBy[o]!]; place(o); }
  }

  function showObj(o: "ball" | "cushion", at: number) {
    if (objShown && objShown !== o) { void invoke("duo_ball", { show: false, kind: objShown, x: 0, y: 0 }); }
    objShown = o; pos[o] = at; place(o);
  }

  function run(b: Beat) {
    const who = b.who;
    switch (b.act) {
      case "wait":
        if (who === "ball") showObj("ball", typeof b.to === "number" ? b.to : 0.3);
        if (who === "peak") peakPose("idle");
        if (who === "paws") front = false;
        break;
      case "walk": case "shift":
        if (typeof b.to === "number" && who !== "ball" && who !== "cushion") tweenTo(who, b.to);
        break;
      case "face":
        if (who === "paws") { if (b.to === "front") front = true; else { front = false; dir = b.to === -1 ? -1 : b.to === 1 ? 1 : pos.peak >= pos.paws ? 1 : -1; } }
        if (who === "peak") peakPose("look", b.to === -1 ? -1 : b.to === 1 ? 1 : pos.paws >= pos.peak ? 1 : -1);
        break;
      case "carry": {
        const o = (b.obj ?? "ball") as "ball" | "cushion";
        if (o === "cushion" && objShown !== "cushion") showObj("cushion", pos.cushion);
        else if (objShown !== o) showObj(o, pos[o]);
        heldBy[o] = who;
        break;
      }
      case "drop": {
        const o = (b.obj ?? "ball") as "ball" | "cushion";
        if (heldBy[o]) { const h = heldBy[o]!; heldBy[o] = null; pos[o] = pos[h] + (h === "paws" ? dir : peakDir) * 0.12; place(o); }
        break;
      }
      case "nudge": {
        const o = (b.obj ?? "ball") as "ball" | "cushion";
        if (objShown !== o) showObj(o, pos[o]);
        heldBy[o] = null;
        if (typeof b.to === "number") tweens[o] = { from: pos[o], to: b.to === 0 ? 0 : Math.max(-0.9, Math.min(0.9, pos[o] + b.to * 0.55)), t0: performance.now(), ms: b.to === 0 ? 900 : 1800 };
        if (who === "peak") peakPose("look", b.to === -1 ? -1 : 1);
        break;
      }
      case "rest":
        if (who === "peak") peakPose("sleep");
        break;
    }
  }

  async function begin(id = "") {
    if (director.scene) return;
    stage = await invoke<Stage | null>("duo_stage");
    if (!stage) return;
    if (Math.abs(stage.peak[1] - stage.paws[1]) > 40 * stage.scale) return; // the two must stand on the same floor
    const r = start(director, { now: Date.now(), mode: "free", quiet: false, reactionActive: false, busy: false, reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches, out: ["peak", "paws"], ignoreGap: true }, SCENES.find((s) => s.id === id));
    if (!r) return;
    director = r.state; token = r.token;
    floorY = stage.peak[1];
    cx = Math.round((stage.peak[0] + stage.paws[0]) / 2 + stage.size / 2);
    pos.peak = (stage.peak[0] + stage.size / 2 - cx) / (HALF * stage.scale);
    pos.paws = (stage.paws[0] + stage.size / 2 - cx) / (HALF * stage.scale);
    peakDir = pos.paws >= pos.peak ? 1 : -1;
    peakPose("idle");
    loop = setInterval(() => {
      if (!isLive(director, token)) return;
      const x = due(director, token, Date.now());
      director = x.state;
      for (const b of x.beats) run(b);
      frame();
      if (x.ended) finish();
    }, 33);
  }

  function finish() {
    if (loop) clearInterval(loop);
    loop = undefined;
    for (const k of Object.keys(tweens)) tweens[k] = undefined;
    heldBy.ball = null; heldBy.cushion = null;
    objShown = null;
    front = false; walking = false;
    void invoke("duo_ball", { show: false, kind: "ball", x: 0, y: 0 });
    void invoke("duo_peak_pose", { pose: "idle", dir: peakDir, hold: false });
  }

  function stop() {
    const c = cancel(director, Date.now(), "touch");
    director = c.state;
    if (c.wasRunning || loop) finish();
  }

  onMount(() => {
    const offs: (() => void)[] = [];
    void listen<string>("scene-start", (e) => void begin(e.payload)).then((f) => offs.push(f));
    void listen("scene-cancel", () => stop()).then((f) => offs.push(f));
    return () => { stop(); offs.forEach((f) => f()); };
  });
</script>

<div class="stage" class:walking>
  {#if front}
    <img src="/paws/paws-front.svg" alt="" />
  {:else}
    <img src="/paws/paws-side.svg" alt="" style="transform: scaleX({dir})" />
  {/if}
</div>

<style>
  :global(html, body) { margin: 0; background: transparent; overflow: hidden; }
  .stage { width: 140px; height: 140px; box-sizing: border-box; padding: 10px; display: flex; align-items: flex-end; justify-content: center; }
  img { display: block; width: 100px; height: 100px; animation: breathe 3.2s ease-in-out infinite; transform-origin: 50% 100%; }
  @keyframes breathe { 0%, 100% { translate: 0 0; } 50% { translate: 0 -3px; } }
  .walking img { animation: bob 0.34s ease-in-out infinite; }
  @keyframes bob { 0%, 100% { translate: 0 0; rotate: -1.5deg; } 50% { translate: 0 -5px; rotate: 1.5deg; } }
  @media (prefers-reduced-motion: reduce) { img, .walking img { animation: none; } }
</style>
