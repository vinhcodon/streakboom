import { test } from "node:test";
import assert from "node:assert/strict";
import { PASS_GAP_MS, newPass, passEnd, passLine, passStats, passStep } from "./pass.ts";

const line = (n: number, dx: number, dt: number, y = 0) => Array.from({ length: n }, (_, i) => ({ x: i * dx, y, t: i * dt }));

test("a fast straight pass has a high top speed, no reversal and the net move", () => {
  const st = passStats(line(5, 40, 30))!; // 40 px every 30 ms: about 1333 px per second
  assert.equal(st.n, 5);
  assert.equal(st.vmax, 1333);
  assert.equal(st.rev, 0);
  assert.equal(st.dx, 160);
  assert.equal(st.path, 160);
  assert.equal(st.ms, 120);
});

test("a slow stroke back and forth counts its reversals and is too slow to be written", () => {
  const pts = [0, 30, 0, 30, 0, 30].map((x, i) => ({ x, y: 0, t: i * 200 })); // 150 px per second
  const st = passStats(pts)!;
  assert.equal(st.rev, 4);
  assert.equal(passLine(st, 140), null);
});

test("a single event is not a pass", () => {
  assert.equal(passStats([{ x: 1, y: 1, t: 0 }]), null);
  assert.equal(passStats([]), null);
});

test("a gap ends the pass and starts the next; leaving the sprite ends it too", () => {
  let s = newPass();
  const out: (number | null)[] = [];
  for (const p of line(4, 50, 20)) {
    const r = passStep(s, p);
    s = r.state;
    out.push(r.done ? r.done.n : null);
  }
  assert.deepEqual(out, [null, null, null, null]);
  const r = passStep(s, { x: 500, y: 0, t: 60 + PASS_GAP_MS + 1 });
  assert.equal(r.done!.n, 4); // the first pass is handed over
  assert.equal(r.state.pts.length, 1); // and the new one begins
  const e = passEnd(r.state);
  assert.equal(e.done, null); // one event only: nothing to say
  assert.equal(e.state.pts.length, 0);
});

test("the line holds fixed words and numbers only", () => {
  const l = passLine(passStats(line(5, 40, 30)), 140.4)!;
  assert.match(l, /^pass n=\d+ ms=\d+ path=\d+ vmax=\d+ vavg=\d+ rev=\d+ dx=-?\d+ dy=-?\d+ w=\d+$/);
});
