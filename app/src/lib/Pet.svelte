<script lang="ts">
  // The mochi cat: a layered vector rig animated with CSS and the Web Animations API.
  //  - four views that are ALWAYS in the DOM and cross-fade into one another:
  //      front (idle, look, think, happy, land, drowsy, wake), side (walk),
  //      hang (held, picked up by the scruff), sleep (curled loaf)
  //  - inside the front view, eyes, mouth, head tilt and gaze change with CSS transitions, so
  //    a change of mood eases instead of jumping
  //  - moves between views get a short choreography: turning around (a horizontal squeeze),
  //    a jolt when picked up, a squash on landing, a stretch on waking up
  // Standing still has no continuous animation (it keeps the CPU near zero): only short blink
  // and tail-twitch bursts now and then. Hidden views run no animation at all.
  import { onMount } from "svelte";
  import type { PetState } from "$lib/sprites";

  let { pose, dir, tilt = 0, tick = 0 }: { pose: PetState; dir: 1 | -1; tilt?: number; tick?: number } = $props();

  type View = "front" | "side" | "hang" | "sleep";
  const viewOf = (p: PetState): View => (p === "walk" ? "side" : p === "held" ? "hang" : p === "sleep" ? "sleep" : "front");
  const view = $derived(viewOf(pose));

  // ---- what the front view looks like in each pose (all of it eases via CSS transitions)
  const eyeSet = $derived(pose === "happy" ? "happy" : "open");
  const mouth = $derived(
    pose === "happy" ? "open" : pose === "think" ? "flat" : pose === "drowsy" ? "yawn" : "smile"
  );
  const lidOpen = $derived(pose === "drowsy" ? 0.45 : pose === "wake" ? 0.6 : 1); // 1 = wide open
  const headPose = $derived(
    pose === "think" ? "rotate(6deg)" : pose === "drowsy" ? "translate(0px, 4px) rotate(-3deg)" : "none"
  );
  const gazePose = $derived(pose === "think" ? "translate(4px, -4px)" : "none");

  // ---- blink and tail twitch (short bursts only)
  let blink = $state(false);
  let twitch = $state(false);
  onMount(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let n = 0;
    const loop = () => {
      timer = setTimeout(() => {
        if (pose === "idle" || pose === "look" || pose === "think") {
          blink = true;
          setTimeout(() => (blink = false), 130);
          if (++n % 3 === 0) {
            twitch = true;
            setTimeout(() => (twitch = false), 500);
          }
        }
        loop();
      }, 2800 + Math.random() * 3800);
    };
    loop();
    return () => clearTimeout(timer);
  });

  // ---- choreography between and within poses (Web Animations API, so it can replay)
  const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let flipEl: SVGGElement | undefined = $state();
  let frontEl: SVGGElement | undefined = $state();
  let hangEl: SVGGElement | undefined = $state();
  let prev: { pose: PetState; dir: number; tick: number } | null = null;

  /**
   * Turn around: narrow the body and open it again facing the other way, with a little hop at
   * the narrowest point (a thin sliver would look like a card being flipped).
   */
  function turn(from: number, to: number, ms = 260) {
    flipEl?.animate(
      [
        { transform: `scaleX(${from}) translateY(0)` },
        { transform: `scaleX(${to * 0.42}) translateY(-4px) scaleY(1.04)`, offset: 0.5 },
        { transform: `scaleX(${to}) translateY(0)` },
      ],
      { duration: ms, easing: "ease-in-out" }
    );
  }

  const BOUNCE: Keyframe[] = [
    { transform: "translateY(0) scale(1, 1)" },
    { transform: "translateY(-14px) scale(0.95, 1.06)", offset: 0.18 },
    { transform: "translateY(0) scale(1.07, 0.9)", offset: 0.38 },
    { transform: "translateY(-8px) scale(0.98, 1.03)", offset: 0.58 },
    { transform: "translateY(0) scale(1.03, 0.96)", offset: 0.78 },
    { transform: "translateY(0) scale(1, 1)" },
  ];
  const SQUASH: Keyframe[] = [
    { transform: "scale(1.1, 0.8)" },
    { transform: "scale(0.96, 1.06)", offset: 0.45 },
    { transform: "scale(1, 1)" },
  ];
  const STRETCH: Keyframe[] = [
    { transform: "scale(1, 1)" },
    { transform: "scale(0.94, 1.05)", offset: 0.2 }, // reach up
    { transform: "scale(1.07, 0.9)", offset: 0.5 }, // long and low
    { transform: "scale(0.98, 1.03)", offset: 0.78 },
    { transform: "scale(1, 1)" },
  ];
  const SINK: Keyframe[] = [
    { transform: "translateY(0) scale(1, 1)" },
    { transform: "translateY(5px) scale(1.03, 0.95)" },
  ];
  const JOLT: Keyframe[] = [
    { transform: "translateY(14px) scale(1.06, 0.86)" },
    { transform: "translateY(-3px) scale(0.97, 1.05)", offset: 0.55 },
    { transform: "translateY(0) scale(1, 1)" },
  ];

  $effect(() => {
    const p = pose;
    const d = dir;
    const t = tick;
    if (!flipEl) return;
    const was = prev;
    prev = { pose: p, dir: d, tick: t };
    if (!was || reduceMotion) return;

    const from = viewOf(was.pose);
    const to = viewOf(p);
    if (from !== to) {
      if (from === "side" || to === "side") turn(was.dir, d); // facing front <-> facing sideways
      if (to === "hang") hangEl?.animate(JOLT, { duration: 260, easing: "ease-out" }); // yanked up
    } else if (d !== was.dir) {
      turn(was.dir, d, 200); // changed direction while walking
    }
    // one-shot moves, replayed even if the same pose comes again
    if (p !== was.pose || t !== was.tick) {
      const opts = (duration: number) => ({ duration, easing: "ease-out" }) as KeyframeAnimationOptions;
      if (p === "happy") frontEl?.animate(BOUNCE, opts(1100));
      else if (p === "land") frontEl?.animate(SQUASH, opts(380));
      else if (p === "wake") frontEl?.animate(STRETCH, opts(650));
      else if (p === "drowsy") frontEl?.animate(SINK, opts(900));
    }
  });
</script>

{#snippet eye(cx: number, k: string, active: boolean)}
  <g class="eyeset" class:show={active}>
    {#if k === "happy"}
      <path d="M{cx - 8} 70 q8 -11 16 0" fill="none" stroke="#2b2220" stroke-width="3" stroke-linecap="round" />
    {:else if k === "closed"}
      <path d="M{cx - 8} 67 q8 6 16 0" fill="none" stroke="#2b2220" stroke-width="3" stroke-linecap="round" />
    {:else if k === "wide"}
      <ellipse cx={cx} cy="66" rx="8.5" ry="11" fill="#2b2220" />
      <circle cx={cx + 3} cy="62" r="4" fill="#fff" />
      <circle cx={cx - 3} cy="70" r="1.8" fill="#fff" />
    {:else}
      <g class="lid" style="transform-origin: {cx}px 56px">
        <ellipse cx={cx} cy="66" rx="7.5" ry="9.5" fill="#2b2220" />
        <circle cx={cx + 2.6} cy="62.5" r="3.4" fill="#fff" />
        <circle cx={cx - 2.4} cy="70" r="1.5" fill="#fff" />
      </g>
    {/if}
  </g>
{/snippet}

<!-- The head, shared by every view. `mouthKind` picks one of the stacked mouths. -->
{#snippet head(mouthKind: string, blinking: boolean, cheeks: number, eyeKind: string)}
  <polygon points="26,52 30,22 54,38" fill="#f6c26b" />
  <polygon points="31,48 34,30 48,40" fill="#f4a7a7" />
  <polygon points="94,52 90,22 66,38" fill="#f6c26b" />
  <polygon points="89,48 86,30 72,40" fill="#f4a7a7" />
  <ellipse cx="60" cy="64" rx="42" ry="34" fill="#f6c26b" />
  <path d="M53 36 v7 M60 34 v9 M67 36 v7" stroke="#e9a94a" stroke-width="2.6" stroke-linecap="round" fill="none" />
  <g class="eyes" class:blink={blinking}>
    <g class="gaze" class:looking={pose === "look"} style="--gaze: {gazePose}">
      {#each ["open", "happy", "wide", "closed"] as k (k)}
        {@render eye(44, k, eyeKind === k)}
        {@render eye(76, k, eyeKind === k)}
      {/each}
    </g>
  </g>
  <ellipse class="cheek" cx="30" cy="78" rx="8" ry="4.6" fill="#f59e9e" style="--c: {cheeks}" />
  <ellipse class="cheek" cx="90" cy="78" rx="8" ry="4.6" fill="#f59e9e" style="--c: {cheeks}" />
  <path d="M56.5 74 h7 l-3.5 4.5 z" fill="#e8828a" />
  <path class="mouth" class:show={mouthKind === "smile"} d="M60 78.5 q-4 5 -9 1.5 M60 78.5 q4 5 9 1.5" stroke="#7a4b3a" stroke-width="1.9" stroke-linecap="round" fill="none" />
  <path class="mouth" class:show={mouthKind === "open"} d="M52 79 q8 11 16 0 z" fill="#d9696f" />
  <path class="mouth" class:show={mouthKind === "flat"} d="M54 81 h12" stroke="#7a4b3a" stroke-width="1.9" stroke-linecap="round" fill="none" />
  <circle class="mouth" class:show={mouthKind === "o"} cx="60" cy="83" r="3.4" fill="#7a4b3a" />
  <ellipse class="mouth" class:show={mouthKind === "yawn"} cx="60" cy="84" rx="6" ry="7.5" fill="#d9696f" />
{/snippet}

<svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="pet" style="--dir:{dir}; --tilt:{tilt}deg; --open:{lidOpen}">
  <g class="flip" bind:this={flipEl}>
    <!-- FRONT: idle, look, think, happy, land, drowsy, wake -->
    <g class="layer front" class:on={view === "front"}>
      <g class="all" bind:this={frontEl} style="transform-origin: 60px 114px">
        <ellipse cx="60" cy="115" rx="32" ry="4.5" fill="#000" opacity="0.08" />
        <g class="tail" class:twitch style="transform-origin: 86px 100px">
          <path d="M86 100 q24 0 22 -26" stroke="#e9a94a" stroke-width="10" stroke-linecap="round" fill="none" />
        </g>
        <ellipse cx="60" cy="92" rx="34" ry="24" fill="#f6c26b" />
        <ellipse cx="60" cy="101" rx="19" ry="13" fill="#fff1d6" />
        <ellipse cx="46" cy="110" rx="11" ry="6.5" fill="#f6c26b" />
        <ellipse cx="74" cy="110" rx="11" ry="6.5" fill="#f6c26b" />
        <g class="headfront" style="transform-origin: 60px 70px; --head: {headPose}">
          {@render head(mouth, blink, pose === "happy" ? 0.85 : 0.6, eyeSet)}
        </g>
        <g class="dots" class:show={pose === "think"}>
          <circle class="dot d1" cx="98" cy="30" r="3" fill="#8a8a8a" />
          <circle class="dot d2" cx="107" cy="23" r="4" fill="#8a8a8a" />
          <circle class="dot d3" cx="116" cy="14" r="5" fill="#8a8a8a" />
        </g>
      </g>
    </g>

    <!-- SIDE: walk, facing right -->
    <g class="layer side" class:on={view === "side"}>
      <ellipse cx="60" cy="115" rx="34" ry="4.5" fill="#000" opacity="0.08" />
      <g class="bob">
        <g class="tail wagwalk" style="transform-origin: 28px 90px">
          <path d="M28 90 q-20 -2 -16 -30" stroke="#e9a94a" stroke-width="9" stroke-linecap="round" fill="none" />
        </g>
        <rect class="leg legB" x="46" y="98" width="11" height="17" rx="5.5" fill="#e9a94a" style="transform-origin: 51px 99px" />
        <rect class="leg legA" x="82" y="98" width="11" height="17" rx="5.5" fill="#e9a94a" style="transform-origin: 87px 99px" />
        <ellipse cx="56" cy="88" rx="34" ry="22" fill="#f6c26b" />
        <ellipse cx="58" cy="99" rx="20" ry="9" fill="#fff1d6" />
        <rect class="leg legA" x="32" y="98" width="11" height="17" rx="5.5" fill="#f6c26b" style="transform-origin: 37px 99px" />
        <rect class="leg legB" x="68" y="98" width="11" height="17" rx="5.5" fill="#f6c26b" style="transform-origin: 73px 99px" />
        <g class="headwalk" style="transform-origin: 90px 70px">
          <polygon points="76,52 80,26 98,46" fill="#f6c26b" />
          <polygon points="81,48 83,34 94,46" fill="#f4a7a7" />
          <ellipse cx="92" cy="68" rx="27" ry="25" fill="#f6c26b" />
          <path d="M87 46 v6 M93 45 v8" stroke="#e9a94a" stroke-width="2.4" stroke-linecap="round" fill="none" />
          <g class="eyes" class:blink>
            <ellipse cx="102" cy="66" rx="6.5" ry="8.5" fill="#2b2220" />
            <circle cx="104.4" cy="62.6" r="3" fill="#fff" />
            <circle cx="100" cy="69.5" r="1.3" fill="#fff" />
          </g>
          <ellipse cx="94" cy="79" rx="7" ry="4" fill="#f59e9e" opacity="0.6" />
          <circle cx="118" cy="72" r="3" fill="#e8828a" />
          <path d="M115 78 q-3 4 -7 1.5" stroke="#7a4b3a" stroke-width="1.8" stroke-linecap="round" fill="none" />
        </g>
      </g>
    </g>

    <!-- HANG: picked up by the scruff; leans with the cursor (tilt), swings, tail droops -->
    <g class="layer hang" class:on={view === "hang"}>
      <g bind:this={hangEl} style="transform-origin: 60px 22px">
        <g class="hangtilt" style="transform-origin: 60px 22px">
          <g class="swing" style="transform-origin: 60px 22px">
            <g class="tail droop" style="transform-origin: 82px 92px">
              <path d="M82 92 q16 6 12 24" stroke="#e9a94a" stroke-width="9" stroke-linecap="round" fill="none" />
            </g>
            <rect x="38" y="100" width="10" height="14" rx="5" fill="#e9a94a" transform="rotate(8 43 100)" />
            <rect x="51" y="102" width="10" height="14" rx="5" fill="#e9a94a" />
            <rect x="63" y="102" width="10" height="14" rx="5" fill="#e9a94a" />
            <rect x="75" y="100" width="10" height="14" rx="5" fill="#e9a94a" transform="rotate(-8 80 100)" />
            <ellipse cx="60" cy="86" rx="30" ry="27" fill="#f6c26b" />
            <ellipse cx="60" cy="96" rx="17" ry="14" fill="#fff1d6" />
            <g transform="translate(0,-8)">
              {@render head("o", false, 0.6, "wide")}
              <path d="M99 40 q4 6 0 9 q-4 -3 0 -9" fill="#8ecae6" />
            </g>
          </g>
        </g>
      </g>
    </g>

    <!-- SLEEP: curled loaf -->
    <g class="layer sleepview" class:on={view === "sleep"}>
      <ellipse cx="60" cy="115" rx="40" ry="4.5" fill="#000" opacity="0.08" />
      <path d="M86 108 q24 2 20 -16" stroke="#e9a94a" stroke-width="9" stroke-linecap="round" fill="none" />
      <ellipse cx="60" cy="100" rx="40" ry="17" fill="#f6c26b" />
      <ellipse cx="60" cy="106" rx="24" ry="9" fill="#fff1d6" />
      <g transform="translate(0,18)">{@render head("flat", false, 0.6, "closed")}</g>
      <text class="z z1" x="92" y="48" font-size="18" font-weight="bold" font-family="sans-serif" fill="#6b7cff">z</text>
      <text class="z z2" x="102" y="34" font-size="13" font-weight="bold" font-family="sans-serif" fill="#6b7cff">z</text>
    </g>
  </g>
</svg>

<style>
  svg {
    display: block;
    overflow: visible;
    pointer-events: none;
  }
  .flip {
    transform: scaleX(var(--dir));
    transform-origin: 60px 60px;
  }

  /* ---- views cross-fade; a hidden view runs no animation ---- */
  .layer {
    opacity: 0;
    transition: opacity 170ms ease;
  }
  .layer.on {
    opacity: 1;
  }

  /* ---- eyes, mouths and cheeks ease between states ---- */
  .eyeset,
  .mouth {
    opacity: 0;
    transition: opacity 120ms ease;
  }
  .eyeset.show,
  .mouth.show {
    opacity: 1;
  }
  .cheek {
    opacity: var(--c);
    transition: opacity 200ms ease;
  }
  .lid {
    transform: scaleY(var(--open, 1));
    transition: transform 260ms ease;
  }
  .eyes {
    transform-origin: 60px 66px;
    transition: transform 60ms ease-out;
  }
  .eyes.blink {
    transform: scaleY(0.1);
  }
  .gaze {
    transform: var(--gaze, none);
    transition: transform 240ms ease;
  }
  .headfront {
    transform: var(--head, none);
    transition: transform 280ms ease;
  }
  .tail.twitch {
    animation: wag 0.5s ease-in-out;
  }
  @keyframes wag {
    0%,
    100% {
      transform: rotate(0);
    }
    25% {
      transform: rotate(-14deg);
    }
    60% {
      transform: rotate(10deg);
    }
  }
  .layer.on .gaze.looking {
    animation: lookshift 1.6s ease-in-out both;
  }
  @keyframes lookshift {
    0%,
    100% {
      transform: translateX(0);
    }
    25%,
    40% {
      transform: translateX(-5px);
    }
    65%,
    80% {
      transform: translateX(5px);
    }
  }

  /* ---- thinking dots ---- */
  .dots {
    opacity: 0;
    transition: opacity 200ms ease;
  }
  .dots.show {
    opacity: 1;
  }
  .layer.on .dots.show .dot {
    animation: pulse 1.2s ease-in-out infinite;
  }
  .d2 {
    animation-delay: 0.2s;
  }
  .d3 {
    animation-delay: 0.4s;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 0.25;
    }
    50% {
      opacity: 1;
    }
  }

  /* ---- walking: diagonal pairs of legs swing, body bobs, head nods, tail wags ---- */
  .layer.on .leg {
    animation: swing-leg 0.5s ease-in-out infinite alternate;
  }
  .layer.on .legB {
    animation-direction: alternate-reverse;
  }
  @keyframes swing-leg {
    from {
      transform: rotate(-24deg);
    }
    to {
      transform: rotate(24deg);
    }
  }
  .layer.on .bob {
    animation: bob 0.25s ease-in-out infinite alternate;
  }
  @keyframes bob {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-2.5px);
    }
  }
  .layer.on .headwalk {
    animation: nod 0.5s ease-in-out infinite alternate;
  }
  @keyframes nod {
    from {
      transform: rotate(-2deg);
    }
    to {
      transform: rotate(2deg);
    }
  }
  .layer.on .wagwalk {
    animation: wagwalk 0.5s ease-in-out infinite alternate;
  }
  @keyframes wagwalk {
    from {
      transform: rotate(-8deg);
    }
    to {
      transform: rotate(10deg);
    }
  }

  /* ---- held: leans with the cursor, swings around the scruff, tail droops ---- */
  .hangtilt {
    transform: rotate(var(--tilt));
    transition: transform 140ms ease-out;
  }
  .layer.on .swing {
    animation: swing 0.9s ease-in-out infinite alternate;
  }
  @keyframes swing {
    from {
      transform: rotate(-4deg);
    }
    to {
      transform: rotate(4deg);
    }
  }
  .layer.on .droop {
    animation: droop 0.9s ease-in-out infinite alternate;
  }
  @keyframes droop {
    from {
      transform: rotate(-6deg);
    }
    to {
      transform: rotate(8deg);
    }
  }

  /* ---- sleeping: little z's float up (small area, so cheap) ---- */
  .layer.on .z {
    animation: zfloat 2.4s ease-in-out infinite;
  }
  .z2 {
    animation-delay: 0.9s;
  }
  @keyframes zfloat {
    0% {
      opacity: 0;
      transform: translateY(6px);
    }
    40%,
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(-6px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .layer.on .leg,
    .layer.on .bob,
    .layer.on .headwalk,
    .layer.on .wagwalk,
    .layer.on .swing,
    .layer.on .droop,
    .layer.on .z,
    .layer.on .dots.show .dot,
    .layer.on .gaze.looking {
      animation: none;
    }
    .layer,
    .eyeset,
    .mouth,
    .lid,
    .gaze,
    .headfront {
      transition-duration: 1ms;
    }
  }
</style>
