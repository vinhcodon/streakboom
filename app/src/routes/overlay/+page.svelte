<script lang="ts">
  // The developer overlay (TT-1, spec/10 section 7): draws what Peak believes about the screen. It exists only in a build
  // with the cargo feature `terrain-overlay` (the window is opened from a tray item that only that build has); a release
  // never opens it. It shows the grid, the windows (a colour per opaque number), the surfaces (green lines, bright when the
  // cat would have room), the cat's feet and the ledge it would choose (a red mark). Click-through, transparent.
  import { onMount } from "svelte";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import type { GroundMap } from "$lib/groundmap";
  import type { Surface } from "$lib/terrain";

  interface OverlayData {
    map: GroundMap | null;
    surfaces: Surface[];
    target: { x: number; y: number } | null;
    feet: { x: number; y: number } | null;
    note: string;
    /** The screen picture experiment (ADR-0119), or null while it is off: lines and a mask in grid cells. */
    picture: {
      gw: number;
      gh: number;
      threshold: number;
      catCells: number;
      hsegs: { x0: number; x1: number; y: number; strength: number; roomAbove: number; room: boolean }[];
      vsegs: { x: number; y0: number; y1: number; strength: number }[];
      empty: number[];
      /** The kind of each cell: 0 none, 1 plain, 2 panel, 3 rough (stage 2a, plan section 8). */
      kinds: number[];
      regions: { kind: "plain" | "panel" | "rough"; x0: number; y0: number; x1: number; y1: number; area: number; grey: number; borderShare: number }[];
    } | null;
  }
  let canvas: HTMLCanvasElement;
  let data: OverlayData | null = null;

  const hue = (id: number) => (id * 47) % 360;

  function draw() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    const g = canvas.getContext("2d")!;
    g.clearRect(0, 0, canvas.width, canvas.height);
    if (!data || !data.map) return;
    const m = data.map;
    // physical px of the screen -> pixels of this canvas (the window starts at the work area's corner)
    const px = (x: number) => x - m.x;
    const py = (y: number) => y - m.y;
    const cw = m.w / m.cols;
    const ch = m.h / m.rows;
    g.lineWidth = 1;
    for (let r = 0; r < m.rows; r++)
      for (let c = 0; c < m.cols; c++) {
        const k = m.cells[r * m.cols + c];
        const id = m.ids?.[r * m.cols + c] ?? 0;
        const x = c * cw;
        const y = r * ch;
        if (k === "desktop") g.fillStyle = "rgba(255,255,255,0.10)";
        else if (k === "taskbar") g.fillStyle = "rgba(0,120,255,0.25)";
        else g.fillStyle = `hsla(${hue(id)}, 70%, 55%, ${k === "foreground" ? 0.28 : 0.18})`;
        g.fillRect(x, y, cw, ch);
        g.strokeStyle = "rgba(255,255,255,0.25)";
        g.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
        if (id) {
          g.fillStyle = "rgba(255,255,255,0.8)";
          g.font = "11px sans-serif";
          g.fillText(String(id % 10000), x + 4, y + 14);
        }
      }
    // the surfaces: a thick green line along each edge, a dull one where there is no room for the cat
    for (const s of data.surfaces) {
      g.strokeStyle = s.roomy ? "rgb(0,230,90)" : "rgba(150,150,150,0.9)";
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(px(s.x0), py(s.y));
      g.lineTo(px(s.x1), py(s.y));
      g.stroke();
    }
    // the cat's feet and the chosen ledge
    if (data.feet) {
      g.strokeStyle = "white";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(px(data.feet.x) - 12, py(data.feet.y));
      g.lineTo(px(data.feet.x) + 12, py(data.feet.y));
      g.moveTo(px(data.feet.x), py(data.feet.y) - 12);
      g.lineTo(px(data.feet.x), py(data.feet.y) + 12);
      g.stroke();
    }
    if (data.target) {
      g.strokeStyle = "rgb(255,50,50)";
      g.lineWidth = 4;
      g.beginPath();
      g.arc(px(data.target.x), py(data.target.y), 16, 0, Math.PI * 2);
      g.stroke();
    }
    // what Peak sees in the picture of the screen: the empty space faintly, the ledges (green with room above for the cat, grey
    // without), the walls (orange); drawn in grid cells, scaled to this window
    const pic = data.picture;
    if (pic) {
      const sx = canvas.width / pic.gw;
      const sy = canvas.height / pic.gh;
      // the kinds of ground in three faint tints: plains blue, panels purple, rough ground red; each area outlined
      const tint = ["", "rgba(80,160,255,0.12)", "rgba(170,90,255,0.22)", "rgba(255,70,70,0.22)"];
      for (let y = 0; y < pic.gh; y++)
        for (let x = 0; x < pic.gw; x++) {
          const k = pic.kinds[y * pic.gw + x];
          if (k) {
            g.fillStyle = tint[k];
            g.fillRect(x * sx, y * sy, sx, sy);
          }
        }
      g.lineWidth = 1;
      for (const r of pic.regions) {
        if (r.kind === "plain") continue;
        g.strokeStyle = r.kind === "panel" ? "rgba(170,90,255,0.9)" : "rgba(255,70,70,0.9)";
        g.strokeRect(r.x0 * sx + 0.5, r.y0 * sy + 0.5, (r.x1 - r.x0 + 1) * sx - 1, (r.y1 - r.y0 + 1) * sy - 1);
      }
      g.lineWidth = 3;
      for (const h of pic.hsegs) {
        g.strokeStyle = h.room ? "rgb(0,230,90)" : "rgba(170,170,170,0.9)";
        g.beginPath();
        g.moveTo(h.x0 * sx, (h.y + 0.5) * sy);
        g.lineTo((h.x1 + 1) * sx, (h.y + 0.5) * sy);
        g.stroke();
      }
      g.strokeStyle = "rgb(255,150,0)";
      for (const v of pic.vsegs) {
        g.beginPath();
        g.moveTo((v.x + 0.5) * sx, v.y0 * sy);
        g.lineTo((v.x + 0.5) * sx, (v.y1 + 1) * sy);
        g.stroke();
      }
    }
    g.fillStyle = "rgba(0,0,0,0.65)";
    g.fillRect(8, 8, 620, pic ? 64 : 24);
    g.fillStyle = "white";
    g.font = "13px sans-serif";
    g.fillText(data.note, 14, 25);
    if (pic) {
      const n = (k: string) => pic.regions.filter((r) => r.kind === k).length;
      g.fillText(`areas: ${n("plain")} plains (blue), ${n("panel")} panels (purple), ${n("rough")} rough (red)`, 14, 63);
    }
    if (pic) g.fillText(`picture: ${pic.hsegs.length} ledges (${pic.hsegs.filter((h) => h.room).length} with room), ${pic.vsegs.length} walls, threshold ${pic.threshold}, cat = ${pic.catCells} cells`, 14, 44);
  }

  onMount(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    let un: (() => void) | undefined;
    getCurrentWebviewWindow()
      .listen<OverlayData>("overlay-data", (e) => {
        data = e.payload;
        draw();
      })
      .then((f) => (un = f));
    window.addEventListener("resize", draw);
    draw();
    return () => {
      un?.();
      window.removeEventListener("resize", draw);
    };
  });
</script>

<canvas bind:this={canvas} style="position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none"></canvas>
