// The line factory (LN-4, ADR-0043): the pure part. The author runs `scripts/line-factory.mjs`, which asks a model for
// candidate lines; nothing here reaches the app by itself. This module builds the request, reads the answer and throws away
// what the character must never say (too long, a repeat, assistant talk, the wrong voice). The author picks what stays.

import type { Lang, Line, Trigger } from "./lines.ts";

export const SITUATION: Partial<Record<Trigger, string>> = {
  greeting: "Peak greets the user when the app starts (closeness tier {tier}: 1 shy, 2 teasing, 3 and 4 close friends)",
  return: "the user comes back after being away for a while",
  morning: "a morning remark",
  night: "a remark late at night",
  long: "the user has been working for hours without a break (tease the situation, never the person)",
  idle: "Peak says something on its own while it sits on the user's desktop (mood band: {band})",
  click: "the user pokes Peak once with the mouse",
  pet: "the user strokes Peak's head",
  belly: "the user rubs Peak's belly and Peak enjoys it",
  huff: "the user rubbed Peak's belly and it was a trap: Peak flinches and complains playfully",
  how: "the user asks how Peak is (mood band: {band})",
  hint: "Peak gently hints that it likes its head being scratched",
  fall: "Peak cries out because the window it was sitting on has just vanished (very short, an exclamation)",
};

export interface FactoryRequest {
  lang: Lang;
  trigger: Trigger;
  count: number;
  /** Lines already in the pool, so that the model does not repeat them. */
  existing: string[];
  tier?: number;
  band?: string;
  /** The character notes (the persona voice file), included so that the model writes in Peak's voice. */
  voice: string;
}

const LANGUAGE: Record<Lang, string> = { vi: "Vietnamese", en: "English", ja: "Japanese" };
const RULES: Record<Lang, string> = {
  vi: "Natural everyday Vietnamese, first person \"mình\", addressing the user as \"bạn\".",
  en: "Natural everyday English, first person, addressing the user as \"you\".",
  ja: "Natural casual Japanese in the plain form (endings like だよ and ね), never the formal です/ます form, never cat-speak like にゃ; call the user きみ.",
};

/** The text sent to the model. It contains the character, the situation and the lines already there, nothing about any user. */
export function buildPrompt(r: FactoryRequest): string {
  const situation = (SITUATION[r.trigger] ?? `the situation "${r.trigger}"`).replace("{tier}", String(r.tier ?? 2)).replace("{band}", r.band ?? "content");
  const lines = [
    `You write short lines for Peak, a small cat that lives on a user's desktop. Voice notes for Peak: ${r.voice.trim()}`,
    `Write ${r.count} NEW lines in ${LANGUAGE[r.lang]}. ${RULES[r.lang]}`,
    `The situation: ${situation}.`,
    "Rules: one line each, at most 90 characters, a single sentence or two short ones, playful and warm, a little dry humour. Tease the situation, never the person or the quality of their work. No guilt (Peak never makes the user feel bad for being away), no sarcasm aimed at the user, no mention of being an AI, an assistant, a model or a program, no emoji, no hashtags, no quotation marks around the line. Do not repeat or lightly reword any existing line. Vary the openings and the ideas.",
    "Output only the lines, one per line, with no numbering and no bullets.",
  ];
  if (r.existing.length) lines.push("Existing lines (do not repeat them):\n" + r.existing.map((l) => "- " + l).join("\n"));
  return lines.join("\n\n");
}

/** One candidate per non-empty line of the answer, with list marks and quotes removed. */
export function parseCandidates(answer: string): string[] {
  return answer
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["'“「]+|["'”」]+$/g, "").trim())
    .filter((l) => l.length > 0);
}

const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
const words = (t: string) => new Set(norm(t).split(" ").filter(Boolean));
/** How alike two lines are, 0..1 (shared words over all words; for Japanese, shared characters). */
export function similarity(a: string, b: string, lang: Lang): number {
  const sa = lang === "ja" ? new Set([...norm(a).replace(/\s/g, "")]) : words(a);
  const sb = lang === "ja" ? new Set([...norm(b).replace(/\s/g, "")]) : words(b);
  if (!sa.size || !sb.size) return 0;
  let both = 0;
  for (const x of sa) if (sb.has(x)) both++;
  return both / (sa.size + sb.size - both);
}

const BANNED = [/\b(AI|A\.I\.|assistant|chatbot|language model|program|algorithm)\b/i, /trợ lý|mô hình ngôn ngữ|chatbot/i, /アシスタント|\bAI\b|プログラム/, /#\w/, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u];

export interface Verdict {
  line: string;
  ok: boolean;
  reason?: string;
}

/** Keep what can stay: not too long, not a repeat of an existing line or of an earlier candidate, no banned pattern, the right script. */
export function filterCandidates(cands: string[], lang: Lang, existing: string[], maxLen = 90, maxSimilarity = 0.6): Verdict[] {
  const kept: string[] = [];
  return cands.map((line) => {
    const no = (reason: string): Verdict => ({ line, ok: false, reason });
    if (line.length > maxLen) return no(`too long (${line.length})`);
    if (line.length < 4) return no("too short");
    if (BANNED.some((re) => re.test(line))) return no("assistant talk, emoji or a hashtag");
    if (lang === "ja") {
      if (!/[぀-ヿ一-鿿]/.test(line)) return no("no Japanese characters");
      if (/です[。！？…」）]|ます[。！？…」）]|にゃ/.test(line)) return no("not the casual voice");
    }
    if (lang === "vi" && !/[ăâêôơưđạ-ỹ]/i.test(line) && !/\b(mình|bạn|nhé|nè|đâu)\b/i.test(line)) return no("does not look Vietnamese");
    for (const e of existing) if (similarity(line, e, lang) >= maxSimilarity) return no(`like an existing line: ${e}`);
    for (const k of kept) if (similarity(line, k, lang) >= maxSimilarity) return no("like an earlier candidate");
    kept.push(line);
    return { line, ok: true };
  });
}

/** The survivors as code to paste next to the other lines, for the author to review. */
export function toSnippet(lang: Lang, trigger: Trigger, lines: string[], batch: string, opts = ""): string {
  const texts = lines.map((l) => JSON.stringify(l)).join(", ");
  return `...mk(${JSON.stringify(lang)}, ${JSON.stringify(trigger)}, [${texts}], ${opts || "{}"}, ${JSON.stringify(batch)}),`;
}

/** The existing lines of a trigger and language, as plain text, for the request. */
export const existingLines = (all: Line[], lang: Lang, trigger: Trigger): string[] => all.filter((l) => l.lang === lang && l.trigger === trigger && l.stage === undefined).map((l) => l.text);
