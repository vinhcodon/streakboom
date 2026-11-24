<script lang="ts">
  // Paws as an invited round portrait (issue 15, revision r1; exp/duo-prototype only, behind STREAKBOOM_PAWS_PORTRAIT=1): the existing front picture in a quiet
  // round frame beside the chat. It fades in, nods once toward Peak, and then keeps still: no pointer tracking, no ringing, nothing that asks for an answer.
  // It lets the mouse through and never takes the keyboard; it goes with the chat (the program fades it out with "portrait-leave").
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import PawsFront from "$lib/PawsFront.svelte";

  let shown = $state(false);
  let nodding = $state(false);
  let leaving = $state(false);

  function nod() {
    nodding = false;
    requestAnimationFrame(() => (nodding = true));
    setTimeout(() => (nodding = false), 800);
  }

  onMount(() => {
    const offs: (() => void)[] = [];
    requestAnimationFrame(() => (shown = true));
    // the greeting: one small, earnest nod toward Peak, then Peak (if awake and on the screen) may glance back once (its page turns its head only when idle)
    const t = setTimeout(() => { nod(); void invoke("duo_face", { listener: "peak", speaker: "paws" }).catch(() => {}); }, 450);
    void listen("duo-nod", () => nod()).then((f) => offs.push(f)); // a pass in the talk is still a nod
    void listen("portrait-leave", () => { leaving = true; }).then((f) => offs.push(f));
    return () => { clearTimeout(t); offs.forEach((f) => f()); };
  });
</script>

<div class="stage" class:shown class:leaving>
  <div class="frame" class:nodding>
    <PawsFront class="pic" gx={0} gy={0} />
  </div>
</div>

<style>
  :global(html, body) { margin: 0; background: transparent; overflow: hidden; user-select: none; -webkit-user-select: none; }
  .stage { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease-out; }
  .stage.shown { opacity: 1; }
  .stage.leaving { opacity: 0; }
  /* a quiet round frame: a soft light disc and a thin ring, a soft shadow as the chat's pills have (ADR-0155) */
  .frame { width: 84vmin; height: 84vmin; border-radius: 50%; overflow: hidden; background: #f4f1ec; box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9), 0 4px 14px rgba(0, 0, 0, 0.28); display: flex; align-items: flex-end; justify-content: center; }
  .frame :global(.pic) { width: 92%; height: 92%; pointer-events: none; -webkit-user-drag: none; transform-origin: 50% 90%; }
  .frame.nodding :global(.pic) { animation: nod 0.7s ease-in-out 1; }
  @keyframes nod { 0%, 100% { rotate: 0deg; translate: 0 0; } 30% { rotate: 6deg; translate: 0 3px; } 60% { rotate: -2deg; translate: 0 -1px; } }
  @media (prefers-reduced-motion: reduce) { .stage { transition: none; } .frame.nodding :global(.pic) { animation: none; } }
</style>
