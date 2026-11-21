<script lang="ts">
  // The window of Paws (exp/duo-prototype only, ADR-0139, step 2): the side view of the Mochi art (docs/plans/assets/paws), a slow
  // breathing, turned to face the way it came in. No logic of its own yet: the scenes and the hit test are the next steps.
  const q = new URLSearchParams(location.search);
  const from = q.get("from") ?? "up"; // the side it came from: it faces away from that side
  const flip = from === "left" ? -1 : 1;
</script>

<div class="stage">
  <img src="/paws/paws-side.svg" alt="" style="transform: scaleX({flip})" />
</div>

<style>
  :global(html, body) { margin: 0; background: transparent; overflow: hidden; }
  .stage { width: 200px; height: 200px; display: flex; align-items: flex-end; justify-content: center; }
  img { width: 180px; height: 180px; animation: breathe 3.2s ease-in-out infinite; transform-origin: 50% 100%; }
  @keyframes breathe { 0%, 100% { translate: 0 0; } 50% { translate: 0 -3px; } }
  @media (prefers-reduced-motion: reduce) { img { animation: none; } }
</style>
