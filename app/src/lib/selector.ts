import { LINES } from "./lines.ts";
import type { Band, Lang, Line, Trigger } from "./lines.ts";

export interface Ctx {
  lang: Lang;
  tier: number; // closeness tier 1..4
  band: Band;
  hour: number; // local hour 0..23
  gentle: boolean; // drop spicy lines
  days?: number; // streak milestone, for the "milestone" trigger
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
      (l.days === undefined || l.days === ctx.days) &&
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

export function remember(recent: string[], id: string, max = 24): string[] {
  return [...recent.filter((x) => x !== id), id].slice(-max);
}

export function resolveLang(setting: "auto" | Lang, navLang: string): Lang {
  if (setting !== "auto") return setting;
  const n = navLang.toLowerCase();
  return n.startsWith("vi") ? "vi" : n.startsWith("ja") ? "ja" : "en";
}
