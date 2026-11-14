// The skill interpreter (ADR-0103, stage 1): a skill is a text file (src/lib/skills/*.skill.json) with phrases, a description for
// the model, pools of lines, gates, limits and STEPS. The steps are run here, one after the other, and each step is one verb of a
// CLOSED list. A skill cannot do anything that is not a verb, and nothing the model writes is ever run: the model may only name a
// skill, as it does with [skill:leave]. A new verb is a decision (an ADR), as a new sense is.
//
// Pure: the page gives a `host` that does the real things (a bubble, a pose, a walk, hiding the window); this file only decides
// the order, stops when a step fails or when the skill is no longer alive, and checks that a skill file is well formed.

export const VERBS = ["say", "pose", "wait", "walk_to_edge", "hide", "count"] as const;
export type Verb = (typeof VERBS)[number];

export const GATES = ["not_quiet", "not_held", "not_flying", "not_away", "not_leaving"] as const;
export type Gate = (typeof GATES)[number];

export type Step =
  | { verb: "say"; pool: string; ms?: number }
  | { verb: "pose"; pose: string }
  | { verb: "wait"; ms: number }
  | { verb: "walk_to_edge" }
  | { verb: "hide"; minutes: number }
  | { verb: "count"; key: string };

export interface SkillDef {
  skill: string;
  description: string;
  phrases: string[];
  patterns: string[];
  pools: Record<string, Record<string, string[]>>;
  gates: string[];
  limits: Record<string, number>;
  steps: Step[];
  after_return: Step[];
}

/** What the page does for each verb. `walk_to_edge` and `hide` say whether they worked: a false stops the skill. */
export interface Host {
  say(pool: string, ms: number): void;
  pose(pose: string): void;
  wait(ms: number): Promise<void>;
  walkToEdge(): Promise<boolean>;
  hide(minutes: number): Promise<boolean>;
  count(key: string): void;
}

export type RunResult = "done" | "failed" | "cancelled";

/** Run the steps in order. Stops with "cancelled" as soon as `alive()` is false (checked before each step and after each wait), and with "failed" when a walk or a hide reports false. */
export async function runSteps(steps: readonly Step[], host: Host, alive: () => boolean, trace: (s: string) => void = () => {}): Promise<RunResult> {
  for (let i = 0; i < steps.length; i++) {
    if (!alive()) return "cancelled";
    const s = steps[i];
    trace(`step ${i} ${s.verb}`);
    switch (s.verb) {
      case "say":
        host.say(s.pool, s.ms ?? 0);
        break;
      case "pose":
        host.pose(s.pose);
        break;
      case "wait":
        await host.wait(s.ms);
        if (!alive()) return "cancelled";
        break;
      case "walk_to_edge":
        if (!(await host.walkToEdge())) return alive() ? "failed" : "cancelled";
        break;
      case "hide":
        if (!(await host.hide(s.minutes))) return "failed";
        break;
      case "count":
        host.count(s.key);
        break;
    }
  }
  return "done";
}

/** One line of a pool, not the one just said (`last`), chosen with `rand` (a number in [0, 1), so that a test can fix it). */
export function pickLine(pool: readonly string[], last: string | null, rand: () => number = Math.random): string {
  const rest = pool.filter((l) => l !== last);
  const from = rest.length ? rest : pool;
  return from[Math.min(from.length - 1, Math.floor(rand() * from.length))] ?? "";
}

/** Gates the page evaluates: the state of Peak at the moment of the command. */
export interface GateState {
  quiet: boolean;
  held: boolean;
  flying: boolean;
  away: boolean;
  leaving: boolean;
}

/** May the skill start now? Every named gate must pass. An unknown gate refuses (the safe side). */
export function gatesPass(gates: readonly string[], s: GateState): boolean {
  return gates.every((g) => {
    switch (g) {
      case "not_quiet": return !s.quiet;
      case "not_held": return !s.held;
      case "not_flying": return !s.flying;
      case "not_away": return !s.away;
      case "not_leaving": return !s.leaving;
      default: return false;
    }
  });
}

const KEYS = ["skill", "description", "phrases", "patterns", "pools", "gates", "limits", "steps", "after_return"];
const STEP_KEYS: Record<Verb, string[]> = {
  say: ["verb", "pool", "ms"],
  pose: ["verb", "pose"],
  wait: ["verb", "ms"],
  walk_to_edge: ["verb"],
  hide: ["verb", "minutes"],
  count: ["verb", "key"],
};

/** What is wrong with a skill file? Empty when it is well formed: a closed set of keys, verbs and gates, pools that exist, numbers in range. */
export function validateSkill(def: unknown): string[] {
  const p: string[] = [];
  if (typeof def !== "object" || def === null) return ["the skill is not an object"];
  const d = def as Record<string, unknown>;
  for (const k of Object.keys(d)) if (!KEYS.includes(k)) p.push(`unknown key '${k}'`);
  for (const k of KEYS) if (!(k in d)) p.push(`missing key '${k}'`);
  if (p.length) return p;
  if (typeof d.skill !== "string" || !/^[a-z][a-z_]{1,23}$/.test(d.skill)) p.push("the name must be 2 to 24 lowercase letters or _");
  if (typeof d.description !== "string" || d.description.length < 40 || d.description.length > 2000) p.push("the description must be 40 to 2000 characters");
  if (!Array.isArray(d.phrases) || d.phrases.length === 0 || d.phrases.some((x) => typeof x !== "string" || !x.trim())) p.push("phrases must be a non-empty list of texts");
  if (!Array.isArray(d.patterns)) p.push("patterns must be a list");
  else
    for (const src of d.patterns as unknown[]) {
      try {
        if (typeof src !== "string") throw new Error("not a text");
        new RegExp(src);
      } catch {
        p.push(`pattern '${String(src)}' is not a regular expression`);
      }
    }
  const pools = d.pools as Record<string, Record<string, unknown>>;
  if (typeof pools !== "object" || pools === null) p.push("pools must be an object");
  if (!Array.isArray(d.gates) || d.gates.some((g) => !(GATES as readonly string[]).includes(g as string))) p.push("a gate is not on the closed list");
  const lim = d.limits as Record<string, unknown>;
  if (typeof lim !== "object" || lim === null || Object.values(lim).some((v) => typeof v !== "number" || !Number.isFinite(v) || v < 0)) p.push("limits must be non-negative numbers");
  for (const [name, list] of [["steps", d.steps], ["after_return", d.after_return]] as const) {
    if (!Array.isArray(list)) {
      p.push(`${name} must be a list`);
      continue;
    }
    list.forEach((s: unknown, i: number) => {
      const at = `${name}[${i}]`;
      if (typeof s !== "object" || s === null) return void p.push(`${at} is not an object`);
      const o = s as Record<string, unknown>;
      const verb = o.verb as Verb;
      if (!(VERBS as readonly string[]).includes(verb)) return void p.push(`${at}: '${String(o.verb)}' is not a verb of the closed list`);
      for (const k of Object.keys(o)) if (!STEP_KEYS[verb].includes(k)) p.push(`${at}: '${k}' is not a field of ${verb}`);
      if (verb === "say") {
        const pool = pools?.[o.pool as string];
        if (typeof o.pool !== "string" || !pool) p.push(`${at}: the pool '${String(o.pool)}' does not exist`);
        else for (const lang of ["vi", "en", "ja"]) if (!Array.isArray(pool[lang]) || (pool[lang] as unknown[]).length < 2) p.push(`${at}: the pool '${o.pool}' needs at least two lines in ${lang}`);
      }
      if (verb === "wait" && !(typeof o.ms === "number" && o.ms >= 0 && o.ms <= 10_000)) p.push(`${at}: wait ms must be 0 to 10000`);
      if (verb === "say" && o.ms !== undefined && !(typeof o.ms === "number" && o.ms >= 0 && o.ms <= 10_000)) p.push(`${at}: say ms must be 0 to 10000`);
      if (verb === "hide" && !(typeof o.minutes === "number" && o.minutes >= 1 && o.minutes <= 120)) p.push(`${at}: hide minutes must be 1 to 120`);
      if (verb === "pose" && typeof o.pose !== "string") p.push(`${at}: pose must be a text`);
      if (verb === "count" && typeof o.key !== "string") p.push(`${at}: count key must be a text`);
    });
  }
  // a skill that hides must say so before it walks, and may not count before the hide worked
  const steps = (d.steps as Step[]) ?? [];
  const iHide = steps.findIndex((s) => s.verb === "hide");
  const iCount = steps.findIndex((s) => s.verb === "count");
  if (iHide >= 0 && iCount >= 0 && iCount < iHide) p.push("count comes before hide: it would count a leaving that may fail");
  return p;
}
