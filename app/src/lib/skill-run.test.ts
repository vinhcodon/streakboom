import test from "node:test";
import assert from "node:assert/strict";
import { GATES, VERBS, gatesPass, runSteps, validateSkill, type Host, type Step } from "./skill-run.ts";
import { LEAVE_SKILL, SKILL_FILES } from "./skills.ts";
import { FAREWELLS } from "./farewell.ts";

function fakeHost(log: string[], over: Partial<Host> = {}): Host {
  return {
    say: (pool, ms) => void log.push(`say ${pool} ${ms}`),
    pose: (p) => void log.push(`pose ${p}`),
    wait: async (ms) => void log.push(`wait ${ms}`),
    walkToEdge: async () => (log.push("walk"), true),
    hide: async (m) => (log.push(`hide ${m}`), true),
    count: (k) => void log.push(`count ${k}`),
    ...over,
  };
}

test("every skill file is well formed, with a unique name", () => {
  const names = new Set<string>();
  for (const s of SKILL_FILES) {
    assert.deepEqual(validateSkill(s), [], s.skill);
    assert.ok(!names.has(s.skill), `${s.skill} twice`);
    names.add(s.skill);
  }
});

test("the leave skill runs its steps in the written order: say, nod, wait, walk, hide, count", async () => {
  const log: string[] = [];
  const r = await runSteps(LEAVE_SKILL.steps, fakeHost(log), () => true);
  assert.equal(r, "done");
  assert.deepEqual(log, ["say farewells 2400", "pose nod", "wait 2400", "walk", "hide 20", "count leave"]);
});

test("a walk that does not reach the edge stops the skill: nothing is hidden and nothing is counted", async () => {
  const log: string[] = [];
  const r = await runSteps(LEAVE_SKILL.steps, fakeHost(log, { walkToEdge: async () => (log.push("walk"), false) }), () => true);
  assert.equal(r, "failed");
  assert.ok(!log.some((l) => l.startsWith("hide") || l.startsWith("count")));
});

test("a hide that did not work is not counted", async () => {
  const log: string[] = [];
  const r = await runSteps(LEAVE_SKILL.steps, fakeHost(log, { hide: async () => (log.push("hide"), false) }), () => true);
  assert.equal(r, "failed");
  assert.ok(!log.includes("count leave"));
});

test("when the skill is no longer alive it stops before the next step, also after a wait", async () => {
  let alive = true;
  const log: string[] = [];
  const r = await runSteps(LEAVE_SKILL.steps, fakeHost(log, { wait: async () => void (alive = false) }), () => alive);
  assert.equal(r, "cancelled");
  assert.deepEqual(log, ["say farewells 2400", "pose nod"]);
  // already dead at the start: nothing at all
  const log2: string[] = [];
  assert.equal(await runSteps(LEAVE_SKILL.steps, fakeHost(log2), () => false), "cancelled");
  assert.deepEqual(log2, []);
  // cancelled during the walk (it reports false, but the skill is gone): cancelled, not failed
  let a2 = true;
  assert.equal(await runSteps(LEAVE_SKILL.steps, fakeHost([], { walkToEdge: async () => ((a2 = false), false) }), () => a2), "cancelled");
});

test("the gates of the leave skill are those the page used before: not quiet, held, flying, away or leaving", () => {
  const ok = { quiet: false, held: false, flying: false, away: false, leaving: false };
  assert.ok(gatesPass(LEAVE_SKILL.gates, ok));
  for (const k of Object.keys(ok) as (keyof typeof ok)[]) assert.ok(!gatesPass(LEAVE_SKILL.gates, { ...ok, [k]: true }), k);
  assert.ok(!gatesPass(["a_gate_nobody_wrote"], ok), "an unknown gate refuses");
  assert.deepEqual([...LEAVE_SKILL.gates].sort(), [...GATES].sort());
});

test("a skill file that steps outside the closed list is refused", () => {
  const bad = (change: (d: any) => void) => {
    const d = JSON.parse(JSON.stringify(LEAVE_SKILL));
    change(d);
    return validateSkill(d);
  };
  assert.deepEqual(validateSkill(JSON.parse(JSON.stringify(LEAVE_SKILL))), []);
  assert.ok(bad((d) => d.steps.push({ verb: "run_program", path: "calc.exe" })).some((x) => x.includes("not a verb")));
  assert.ok(bad((d) => (d.steps[1].extra = 1)).some((x) => x.includes("not a field")));
  assert.ok(bad((d) => (d.steps[0].pool = "nowhere")).some((x) => x.includes("does not exist")));
  assert.ok(bad((d) => (d.gates = ["whenever"])).length > 0);
  assert.ok(bad((d) => (d.hacks = true)).some((x) => x.includes("unknown key")));
  assert.ok(bad((d) => delete d.steps).some((x) => x.includes("missing key")));
  assert.ok(bad((d) => (d.patterns = ["("])).some((x) => x.includes("regular expression")));
  assert.ok(bad((d) => (d.steps[2].ms = 60_000)).some((x) => x.includes("wait ms")));
  assert.ok(bad((d) => (d.steps[4].minutes = 0)).some((x) => x.includes("minutes")));
  assert.ok(bad((d) => d.steps.unshift({ verb: "count", key: "leave" })).some((x) => x.includes("count comes before hide")));
  assert.ok(bad((d) => (d.pools.farewells.vi = ["only one"])).some((x) => x.includes("at least two")));
  assert.ok(validateSkill(null).length > 0 && validateSkill("x").length > 0);
});

test("the verbs are a closed list of six and the interpreter knows each of them", () => {
  assert.deepEqual([...VERBS], ["say", "pose", "wait", "walk_to_edge", "hide", "count"]);
  const every: Step[] = [{ verb: "say", pool: "p" }, { verb: "pose", pose: "idle" }, { verb: "wait", ms: 1 }, { verb: "walk_to_edge" }, { verb: "hide", minutes: 1 }, { verb: "count", key: "k" }];
  const log: string[] = [];
  return runSteps(every, fakeHost(log), () => true).then((r) => {
    assert.equal(r, "done");
    assert.equal(log.length, 6);
  });
});

test("the goodbyes and the description of the skill file stay under the charter's tests", () => {
  assert.equal(FAREWELLS, LEAVE_SKILL.pools.farewells);
  assert.ok(LEAVE_SKILL.description.includes("[skill:leave]"));
  assert.deepEqual(LEAVE_SKILL.after_return, [{ verb: "pose", pose: "wake" }]);
});
