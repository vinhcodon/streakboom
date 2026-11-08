// Draws one frame of the cat on a 120x120 canvas (CSS pixels; the caller scales for the screen).

import type { Eye, Key, Leg, V } from "./keys.ts";
import type { Frame } from "./engine.ts";

const FUR = "#f6c26b";
const DARK = "#e9a94a";
const BELLY = "#fff1d6";
const PINK = "#f4a7a7";
const INK = "#2b2220";
const MOUTH = "#7a4b3a";

const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};

function ellipse(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number, fill: string, alpha = 1) {
  if (rx < 0.05 || ry < 0.05 || alpha < 0.01) return;
  c.globalAlpha = alpha;
  c.fillStyle = fill;
  c.beginPath();
  c.ellipse(x, y, rx, ry, (rot * Math.PI) / 180, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
}

function triangle(c: CanvasRenderingContext2D, a: V, b: V, d: V, fill: string, alpha = 1) {
  if (alpha < 0.01) return;
  c.globalAlpha = alpha;
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(a[0], a[1]);
  c.lineTo(b[0], b[1]);
  c.lineTo(d[0], d[1]);
  c.closePath();
  c.fill();
  c.globalAlpha = 1;
}

function drawLeg(c: CanvasRenderingContext2D, l: Leg) {
  if (l.a < 0.01) return;
  const col = mixHex(FUR, DARK, Math.min(1, Math.max(0, l.d)));
  if (l.t > 0.3) {
    c.globalAlpha = l.a;
    c.strokeStyle = col;
    c.lineWidth = l.t;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(l.hx, l.hy);
    c.lineTo(l.fx, l.fy);
    c.stroke();
    c.globalAlpha = 1;
  }
  ellipse(c, l.fx, l.fy, l.frx, l.fry, 0, col, l.a);
}

function drawEye(c: CanvasRenderingContext2D, e: Eye, f: Frame) {
  const ea = e.a * e.a * e.a; // a fading eye shrinks and vanishes quickly, no thin ghost bar
  if (ea < 0.02 || e.rx < 0.3) return;
  const hp = Math.max(0, Math.min(1, 1.6 * f.happy - 0.6)); // happy arcs and open eyes trade places with a blink-like gap, no overlap
  const open = Math.max(0, 1 - 1.6 * f.happy) * (1 - Math.max(0, Math.min(1, (0.28 - f.lid) / 0.2)));
  const happy = hp * ea;
  const closed = Math.max(0, 1 - 1.6 * f.happy) * Math.max(0, Math.min(1, (0.28 - f.lid) / 0.2)) * ea;
  const s = e.rx / 7.5;
  if (open > 0.01) {
    c.save();
    c.globalAlpha = open * ea;
    c.translate(e.x, e.y - e.ry);
    c.scale(1, Math.max(0.08, f.lid));
    c.translate(0, e.ry);
    const grow = 1 + 0.14 * f.wide;
    ellipse(c, 0, 0, e.rx * grow, e.ry * (1 + 0.16 * f.wide), 0, INK);
    ellipse(c, e.rx * 0.35, -e.ry * 0.37, e.rx * (0.45 + 0.08 * f.wide), e.rx * (0.45 + 0.08 * f.wide), 0, "#fff");
    ellipse(c, -e.rx * 0.32, e.ry * 0.42, e.rx * 0.2, e.rx * 0.2, 0, "#fff");
    c.restore();
  }
  c.strokeStyle = INK;
  c.lineCap = "round";
  c.lineWidth = 3;
  if (happy > 0.01) {
    c.globalAlpha = happy;
    c.beginPath();
    c.moveTo(e.x - 8 * s, e.y + 4);
    c.quadraticCurveTo(e.x, e.y - 7, e.x + 8 * s, e.y + 4);
    c.stroke();
  }
  if (closed > 0.01) {
    c.globalAlpha = closed;
    c.beginPath();
    c.moveTo(e.x - 8 * s, e.y + 1);
    c.quadraticCurveTo(e.x, e.y + 7, e.x + 8 * s, e.y + 1);
    c.stroke();
  }
  c.globalAlpha = 1;
}

function drawMouth(c: CanvasRenderingContext2D, k: Key, f: Frame) {
  const m = k.mouth;
  const sm = f.mouth.smile;
  c.lineCap = "round";
  if (sm > 0.01) {
    c.strokeStyle = MOUTH;
    c.lineWidth = 1.9;
    c.globalAlpha = sm;
    c.beginPath();
    c.moveTo(m.l0[0], m.l0[1]);
    c.quadraticCurveTo(m.l1[0], m.l1[1], m.l2[0], m.l2[1]);
    c.stroke();
    c.globalAlpha = sm * m.ra;
    c.beginPath();
    c.moveTo(m.r0[0], m.r0[1]);
    c.quadraticCurveTo(m.r1[0], m.r1[1], m.r2[0], m.r2[1]);
    c.stroke();
    c.globalAlpha = 1;
  }
  const [x, y] = m.l0;
  const s = m.s;
  if (f.mouth.open > 0.01) {
    c.globalAlpha = f.mouth.open;
    c.fillStyle = "#d9696f";
    c.beginPath();
    c.moveTo(x - 8 * s, y + 0.5);
    c.quadraticCurveTo(x, y + 11.5, x + 8 * s, y + 0.5);
    c.closePath();
    c.fill();
  }
  if (f.mouth.flat > 0.01) {
    c.globalAlpha = f.mouth.flat;
    c.strokeStyle = MOUTH;
    c.lineWidth = 1.9;
    c.beginPath();
    c.moveTo(x - 6 * s, y + 2.5);
    c.lineTo(x + 6 * s, y + 2.5);
    c.stroke();
  }
  if (f.mouth.o > 0.01) ellipse(c, x, y + 4.5, 3.4 * (0.5 + 0.5 * s), 3.4, 0, MOUTH, f.mouth.o);
  if (f.mouth.yawn > 0.01) ellipse(c, x, y + 5.5, 6 * s, 7.5, 0, "#d9696f", f.mouth.yawn);
  c.globalAlpha = 1;
}

export function drawFrame(c: CanvasRenderingContext2D, f: Frame) {
  const k = f.key;
  c.clearRect(0, 0, 120, 120);
  c.save();
  if (f.flip) {
    c.translate(120, 0);
    c.scale(-1, 1);
  }
  // hop and squash around the feet, lean around the scruff
  c.translate(60, 114);
  c.scale(1 - 0.6 * f.sq, 1 + f.sq);
  c.translate(-60, -114 + f.hop);
  if (Math.abs(f.tilt) > 0.01) {
    c.translate(60, 22);
    c.rotate((f.tilt * Math.PI) / 180);
    c.translate(-60, -22);
  }

  ellipse(c, k.shadow.x, k.shadow.y, k.shadow.rx, k.shadow.ry, 0, "#000", 0.08);

  // tail, behind everything
  c.strokeStyle = DARK;
  c.lineWidth = k.tail.w;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(k.tail.p0[0], k.tail.p0[1]);
  c.quadraticCurveTo(k.tail.p1[0], k.tail.p1[1], k.tail.p2[0], k.tail.p2[1]);
  c.stroke();

  drawLeg(c, k.legs[0]);
  drawLeg(c, k.legs[1]);
  ellipse(c, k.body.x, k.body.y, k.body.rx, k.body.ry, k.body.rot, FUR);
  ellipse(c, k.belly.x, k.belly.y, k.belly.rx, k.belly.ry, k.belly.rot, BELLY);
  drawLeg(c, k.legs[2]);
  drawLeg(c, k.legs[3]);

  // head: tilts about its centre and is nudged by the gaze
  c.save();
  const hx = k.head.x;
  const hy = k.head.y;
  c.translate(hx + f.gx * 0.25, hy + f.headDy + f.gy * 0.25);
  c.rotate((f.roll * Math.PI) / 180);
  c.translate(-hx, -hy);
  for (const e of [k.earL, k.earR]) {
    triangle(c, e.a, e.b, e.c, FUR, e.alpha ** 3);
    triangle(c, e.ia, e.ib, e.ic, PINK, e.alpha ** 3);
  }
  ellipse(c, hx, hy, k.head.rx, k.head.ry, 0, FUR);
  c.strokeStyle = DARK;
  c.lineWidth = 2.6;
  c.lineCap = "round";
  for (const s of k.stripes) {
    if (s.a < 0.01) continue;
    c.globalAlpha = s.a;
    c.beginPath();
    c.moveTo(s.x, s.y1);
    c.lineTo(s.x, s.y2);
    c.stroke();
  }
  c.globalAlpha = 1;
  // the eyes drift with the gaze inside the head
  c.save();
  c.translate(f.gx * 0.75, f.gy * 0.75);
  drawEye(c, k.eyeL, f);
  drawEye(c, k.eyeR, f);
  c.restore();
  for (const ch of [k.cheekL, k.cheekR]) ellipse(c, ch.x, ch.y, ch.rx, ch.ry, 0, "#f59e9e", ch.a * f.cheek);
  triangle(c, k.nose.a, k.nose.b, k.nose.c, "#e8828a");
  drawMouth(c, k, f);
  if (k.fx.sweat > 0.01) {
    c.globalAlpha = k.fx.sweat;
    c.fillStyle = "#8ecae6";
    c.beginPath();
    c.moveTo(99, 32);
    c.quadraticCurveTo(103, 38, 99, 41);
    c.quadraticCurveTo(95, 38, 99, 32);
    c.fill();
    c.globalAlpha = 1;
  }
  c.restore();

  // thinking dots and sleeping z's sit in front, outside the head
  if (f.dots > 0.01) {
    [[98, 30, 3], [107, 23, 4], [116, 14, 5]].forEach(([x, y, r], i) => {
      const pulse = 0.5 + 0.5 * Math.sin(f.time * 5.2 + i * 1.3);
      ellipse(c, x, y, r, r, 0, "#8a8a8a", f.dots * (0.25 + 0.75 * pulse));
    });
  }
  if (k.fx.z > 0.01) {
    c.fillStyle = "#6b7cff";
    c.font = "bold 18px sans-serif";
    [[92, 48, 18, 0], [102, 34, 13, 0.9]].forEach(([x, y, size, delay]) => {
      const ph = (((f.time - delay) / 2.4) % 1 + 1) % 1;
      c.globalAlpha = k.fx.z * Math.max(0, Math.min(1, Math.sin(ph * Math.PI) * 1.4));
      c.font = `bold ${size}px sans-serif`;
      c.fillText("z", x, y + 6 - 12 * ph);
    });
    c.globalAlpha = 1;
  }
  c.restore();
}
