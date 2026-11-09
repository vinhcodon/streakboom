import { test } from "node:test";
import assert from "node:assert/strict";
import { REPEAT_WINDOW_MS, bump, stageFor, type Repeat } from "./escalation.ts";
import { LINES } from "./lines.ts";
import { candidates, fill, tokensOf, bagAfter, pick, type Ctx } from "./selector.ts";
import type { Lang, Trigger } from "./lines.ts";

test("stages follow the length of the run", () => {
  assert.deepEqual([1, 3, 4, 6, 7, 9, 10, 25].map(stageFor), [1, 1, 2, 2, 3, 3, 4, 4]);
});

test("a run continues within the window and starts over after a pause", () => {
  let r: Repeat | undefined;
  r = bump(r, 1000, 25_000);
  r = bump(r, 5000, 25_000);
  r = bump(r, 20_000, 25_000);
  assert.equal(r.n, 3);
  r = bump(r, 20_000 + 25_000, 25_000); // exactly the window: over
  assert.equal(r.n, 1);
  assert.equal(bump({ n: 5, t: 10_000 }, 5_000, 25_000).n, 1, "a clock that went back starts over");
});

const LANGS: Lang[] = ["vi", "en", "ja"];
const ctx = (over: Partial<Ctx> = {}): Ctx => ({ lang: "en", tier: 2, band: "content", hour: 12, gentle: false, ...over });
const VARS = { name: "Linh", time: "23:40", weekday: "Monday", pokes: "5" };

test("every language has stage 2, 3 and 4 lines for the poke, the scratch and the belly rub, also in the gentle tone", () => {
  for (const lang of LANGS)
    for (const t of ["click", "pet", "belly"] as Trigger[])
      for (const stage of [2, 3, 4])
        for (const gentle of [false, true]) {
          const c = candidates(t, ctx({ lang, stage, gentle, vars: VARS }));
          assert.ok(c.length >= 3, `${lang} ${t} stage ${stage} gentle=${gentle}: ${c.length}`);
        }
});

test("the ordinary pool never holds a stage line, and a stage never holds ordinary lines", () => {
  for (const l of candidates("click", ctx({ vars: VARS }))) assert.equal(l.stage, undefined);
  for (const l of candidates("click", ctx({ stage: 3, vars: VARS }))) assert.equal(l.stage, 3);
});

test("tokens: a line with a token is eligible only when its value is known; fill replaces them", () => {
  assert.deepEqual(tokensOf("Hi {name}, it is {time}."), ["name", "time"]);
  assert.equal(fill("Hi {name}, it is {time}.", { name: "Linh", time: "23:40" }), "Hi Linh, it is 23:40.");
  assert.equal(fill("{name} is dangerous.", { name: "ông nội" }), "Ông nội is dangerous.", "a value at the start of a line is capitalised");
  assert.equal(fill("Hi {name}.", { name: "ông nội" }), "Hi ông nội.", "elsewhere it is left as given");
  const without = candidates("greeting", ctx({ tier: 3 }));
  const withName = candidates("greeting", ctx({ tier: 3, vars: { name: "Linh" } }));
  assert.ok(without.every((l) => tokensOf(l.text).length === 0));
  assert.ok(withName.length > without.length);
});

test("every token line is translated with the same tokens in the same place in all three languages", () => {
  const byLang = (lang: Lang) => LINES.filter((l) => l.lang === lang);
  const en = byLang("en");
  for (const lang of ["vi", "ja"] as Lang[]) {
    const other = byLang(lang);
    for (let i = 0; i < en.length; i++) {
      // vi is not ordered like en line by line, so compare by id
      const same = other.find((o) => o.id.slice(o.id.indexOf(".") + 1) === en[i].id.slice(en[i].id.indexOf(".") + 1));
      if (!same) continue;
      assert.deepEqual(tokensOf(same.text).sort(), tokensOf(en[i].text).sort(), `${same.id}`);
    }
  }
  // and every token a line uses is one the page can supply
  for (const l of LINES) for (const k of tokensOf(l.text)) assert.ok(["name", "time", "weekday", "pokes"].includes(k), `${l.id}: ${k}`);
});

test("a filled line is never left with an empty hole", () => {
  for (const l of LINES) {
    const t = fill(l.text, VARS);
    assert.ok(!/\{|\}/.test(t) && t.trim().length > 0, l.id);
    assert.ok(t.length <= 110, `${l.id} too long once filled: ${t.length}`);
  }
});

test("the shuffle bag: no line is said again while others of the round are unsaid, and the first round says them all", () => {
  const c = ctx({ lang: "en" });
  const cands = candidates("snack", c);
  assert.ok(cands.length >= 3);
  let used: string[] = [];
  const said: string[] = [];
  for (let i = 0; i < cands.length * 4; i++) {
    const line = pick("snack", c, used, Math.random)!;
    assert.ok(!used.includes(line.id), `${line.id} was said again inside its round`);
    said.push(line.id);
    used = bagAfter(used, line, cands);
  }
  assert.equal(new Set(said.slice(0, cands.length)).size, cands.length, "the first round says every line once");
  for (let i = 1; i < said.length; i++) assert.notEqual(said[i], said[i - 1], "no line twice in a row");
});

test("the bag trims old ids and keeps the round when the candidates change", () => {
  const cands = candidates("click", ctx({ lang: "en" }));
  const stale = Array.from({ length: 300 }, (_, i) => "gone." + i);
  const next = bagAfter(stale, cands[0], cands, 200);
  assert.ok(next.length <= 200 && next[next.length - 1] === cands[0].id);
});

test("the pools of the repeated actions in the REPEAT table are the ones with stage lines", () => {
  for (const k of Object.keys(REPEAT_WINDOW_MS)) assert.ok(LINES.some((l) => l.trigger === (k as Trigger) && l.stage === 2), k);
});
