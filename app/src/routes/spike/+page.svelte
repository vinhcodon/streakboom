<script lang="ts">
  // The page of the duo render spike (exp/duo-prototype only): one or two rigs and nothing else. See src-tauri/src/spike.rs.
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import Pet from "$lib/PetRig.svelte";
  import type { PetState } from "$lib/sprites";

  const q = new URLSearchParams(location.search);
  const n = Number(q.get("n") ?? "1");
  const id = Number(q.get("id") ?? "0");
  const inside = q.get("m") === "s1" || q.get("m") === "s3"; // the pets walk inside the canvas
  const W = Number(q.get("w") ?? "200");
  const H = Number(q.get("h") ?? "200");
  const pets = Array.from({ length: n }, (_, i) => ({ i }));

  let pose: PetState = $state("idle");
  let tick = $state(0);
  let dir: 1 | -1 = $state(1);
  let phase = $state("warm");
  let offs = $state(pets.map(() => 0));

  function mark(name: string) {
    phase = name;
    if (id === 0) void invoke("spike_phase", { name }).catch(() => {});
  }

  onMount(() => {
    const t0 = performance.now();
    mark("warm");
    // 12 s warm, 45 s still, 45 s walk, 20 s still again, then the end
    const plan: [number, string][] = [[12, "still"], [57, "walk"], [102, "still2"], [122, "end"]];
    let k = 0;
    const timer = setInterval(() => {
      const t = (performance.now() - t0) / 1000;
      if (k < plan.length && t >= plan[k][0]) {
        const name = plan[k][1];
        k++;
        mark(name);
        pose = name === "walk" ? "walk" : "idle";
        tick++;
      }
      if (phase === "walk") {
        dir = Math.sin(t * 1.3) >= 0 ? 1 : -1;
        if (inside) offs = pets.map((_, i) => Math.sin(t * 1.3 + i * 1.7) * Math.max(0, Math.min(W - 160, 100 + (W > 600 ? 400 : 0))));
      }
    }, 66); // the walk tick of the real app
    return () => clearInterval(timer);
  });
</script>

<div style="position:fixed;inset:0;overflow:hidden;background:transparent">
  {#each pets as p (p.i)}
    <div style="position:absolute;left:{p.i * (W > 600 ? 600 : 200) + 20 + (inside ? offs[p.i] : 0)}px;top:{(H > 600 ? H - 220 : 20)}px;width:140px;height:140px">
      <Pet {pose} {dir} {tick} />
    </div>
  {/each}
</div>
