<script lang="ts">
  // The shared object of the duo scenes (exp/duo-prototype only): a ball, or a cushion. A window of its own while a scene runs.
  import { onMount } from "svelte";
  import { listen } from "@tauri-apps/api/event";
  let kind = $state(new URLSearchParams(location.search).get("kind") ?? "ball");
  onMount(() => {
    let off: (() => void) | undefined;
    void listen<string>("ball-kind", (e) => (kind = e.payload === "cushion" ? "cushion" : "ball")).then((f) => (off = f));
    return () => off?.();
  });
</script>

<svg viewBox="0 0 48 48" width="48" height="48" role="img" aria-label={kind}>
  {#if kind === "cushion"}
    <rect x="4" y="22" width="40" height="22" rx="9" fill="#e8b4b8" stroke="#e9eef5" stroke-width="2"/>
    <path d="M12 30 Q24 36 36 30" fill="none" stroke="#c98a90" stroke-width="2" stroke-linecap="round"/>
  {:else}
    <ellipse cx="24" cy="44" rx="14" ry="3" fill="#000" fill-opacity="0.12"/>
    <circle cx="24" cy="28" r="15" fill="#e2603f" stroke="#e9eef5" stroke-width="2"/>
    <path d="M10 24 Q24 34 38 24" fill="none" stroke="#fdfdfd" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="19" cy="21" r="3" fill="#fff" fill-opacity="0.5"/>
  {/if}
</svg>

<style>
  :global(html, body) { margin: 0; background: transparent; overflow: hidden; }
  svg { display: block; }
</style>
