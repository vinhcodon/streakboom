import { LINES } from "./lines.ts";
import type { Band, Lang, Line, Trigger } from "./lines.ts";

export interface Ctx {
  lang: Lang;
  tier: number; // closeness tier 1..4
  band: Band;
  hour: number; // local hour 0..23
  gentle: boolean; // drop spicy lines
  stage?: number; // escalation stage of a repeated action (1 = the ordinary pool), LN-2
  vars?: Partial<Record<TokenName, string>>; // values for the {tokens} of lines, LN-3; a line is eligible only if all are known
}

/** The tokens a line may contain. */
export type TokenName = "name" | "time" | "weekday" | "pokes";

/** The tokens in a text, e.g. "{name}" gives ["name"]. */
export function tokensOf(text: string): string[] {
  return [...text.matchAll(/\{([a-z]+)\}/g)].map((m) => m[1]);
}

/** A text with its tokens filled in (an unknown token is left out, which `candidates` prevents). */
export function fill(text: string, vars: Ctx["vars"] = {}): string {
  // a value at the very start of a line begins with a capital letter, as the first word of a sentence ("ông nội" -> "Ông nội")
  return text.replace(/\{([a-z]+)\}/g, (_m: string, k: string, at: number) => {
    const v = (vars as Record<string, string | undefined>)[k] ?? "";
    return at === 0 && v ? v[0].toLocaleUpperCase() + v.slice(1) : v;
  });
}

function hourIn(h: number, [s, e]: [number, number]): boolean {
  return s <= e ? h >= s && h < e : h >= s || h < e;
}

export function candidates(trigger: Trigger, ctx: Ctx, lines: Line[] = LINES): Line[] {
  return lines.filter(
    (l) =>
      l.lang === ctx.lang &&
      l.trigger === trigger &&
      (!l.tiers || l.tiers.includes(ctx.tier)) &&
      (!l.bands || l.bands.includes(ctx.band)) &&
      (!l.hours || hourIn(ctx.hour, l.hours)) &&
      (l.stage ?? 1) === (ctx.stage ?? 1) &&
      tokensOf(l.text).every((k) => !!(ctx.vars as Record<string, string | undefined> | undefined)?.[k]) &&
      !(ctx.gentle && l.spicy)
  );
}

/**
 * Pick a line for a trigger. Avoids lines in `recent`; if every candidate was used recently
 * it only avoids the most recent one. Lines that target a specific band/tier weigh double.
 */
export function pick(
  trigger: Trigger,
  ctx: Ctx,
  recent: string[],
  rnd: () => number = Math.random,
  lines: Line[] = LINES
): Line | null {
  const all = candidates(trigger, ctx, lines);
  if (all.length === 0) return null;
  let pool = all.filter((l) => !recent.includes(l.id));
  if (pool.length === 0) {
    const last = recent[recent.length - 1];
    pool = all.filter((l) => l.id !== last);
    if (pool.length === 0) pool = all;
  }
  const weight = (l: Line) => (l.bands || l.tiers ? 2 : 1);
  const total = pool.reduce((s, l) => s + weight(l), 0);
  let r = rnd() * total;
  for (const l of pool) {
    r -= weight(l);
    if (r < 0) return l;
  }
  return pool[pool.length - 1];
}

/**
 * The shuffle bag after a line was said (LN-1): the ids said in this round of the trigger. Every line is said once
 * before any is said again; when all the candidates have been said, a new round starts with just this one.
 */
export function bagAfter(used: string[], line: Line, cands: Line[], max = 200): string[] {
  const next = [...used.filter((x) => x !== line.id), line.id];
  if (cands.every((c) => next.includes(c.id))) return [line.id];
  return next.slice(-max);
}

export function remember(recent: string[], id: string, max = 24): string[] {
  return [...recent.filter((x) => x !== id), id].slice(-max);
}

export function resolveLang(setting: "auto" | Lang, navLang: string): Lang {
  if (setting !== "auto") return setting;
  const n = navLang.toLowerCase();
  return n.startsWith("vi") ? "vi" : n.startsWith("ja") ? "ja" : "en";
}
