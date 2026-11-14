// The local table of commands to Peak (spec 14, section 5, tier 1; step S1 of docs/plans/adaptive-peak-plan.md).
//
// A short message that is plainly a command to the cat ("lượn đi", "go away", "消えて") is recognised here, with no key and no
// network. Pure functions, no I/O, nothing calls this from the app yet.
//
//  - Only the WHOLE message counts: at most MAX_WORDS words (MAX_JA_CHARS characters when there are no spaces), no question
//    mark, and after the polite endings and the punctuation are taken off it must be one of the phrases of the table (an `exact`
//    match) or fit one of its few patterns (a `pattern` match, which the app confirms with a card before acting). A sentence that
//    only CONTAINS a command ("hôm nay anh lượn đi họp") is not a command and goes to the chat as it always has.
//  - Vietnamese is matched with and without its diacritics ("luon di" is "lượn đi").
//  - A phrase may belong to ONE skill only (a test fails otherwise): "lượn đi" (go away) and "đi ngủ đi" (go to sleep) are two
//    wishes, never one.
//  - The phrases below are a SEED written by the assistant to prove the machinery, not data: they are to be replaced and
//    extended from the phrase survey (docs/plans/adaptive-peak-survey.md). Coverage is measured by `evaluate` on held-out
//    phrases, never on the ones the table was written from.

import { LEAVE_SKILL, SEAT_SKILL } from "./skills.ts";

export type Skill = "leave" | "seat" | "return" | "sleep" | "quiet";
export const SKILLS: readonly Skill[] = ["leave", "seat", "return", "sleep", "quiet"];

export interface IntentMatch {
  skill: Skill;
  /** `exact`: the whole message is a phrase of the table, act at once. `pattern`: it fits a pattern, confirm first. */
  kind: "exact" | "pattern";
}

/** At most this many words (space-separated) in a command. */
export const MAX_WORDS = 6;
/** At most this many characters in a command written without spaces (Japanese). */
export const MAX_JA_CHARS = 16;

interface SkillTable {
  phrases: string[];
  patterns: RegExp[];
}

/** Vietnamese, English and Japanese together: the languages do not share phrases, so one table serves all three. */
export const TABLE: Record<Skill, SkillTable> = {
  // the phrases and patterns of "leave" are written in its skill file (ADR-0103)
  leave: { phrases: LEAVE_SKILL.phrases, patterns: LEAVE_SKILL.patterns.map((s) => new RegExp(s)) },
  // "go back to your place" is NOT a wish to be left alone (ADR-0108); its phrases are in its skill file
  seat: { phrases: SEAT_SKILL.phrases, patterns: SEAT_SKILL.patterns.map((s) => new RegExp(s)) },
  return: {
    phrases: [
      "quay lại đi", "quay về đi", "trở lại đi", "về đi", "lại đây", "ra đây đi", "ra đây",
      "come back", "come here", "i'm back",
      "戻って", "戻っておいで", "こっち来て", "こっちおいで", "おいで",
    ],
    patterns: [/^(please )?come (back|here)( now)?$/],
  },
  sleep: {
    phrases: [
      "đi ngủ đi", "đi ngủ", "ngủ đi", "ngủ đi nào", "ngủ đi con",
      "go to sleep", "sleep", "nap time", "go to bed", "bedtime",
      "寝て", "おやすみ", "寝なさい", "ねんねして",
    ],
    patterns: [/^go (to )?(sleep|bed)( now)?$/],
  },
  quiet: {
    phrases: [
      "im đi", "im lặng đi", "im đi nào", "yên lặng đi", "đừng nói nữa", "bé mồm thôi", "bé mồm",
      "be quiet", "quiet", "shh", "hush", "stop talking", "shut up",
      "静かに", "黙って", "しーっ", "おしゃべりやめて",
    ],
    patterns: [/^(please )?(be )?(quiet|silent)( now)?$/, /^(im|im lặng|yên lặng) (đi|nào|một chút)$/],
  },
};

// Words that may stand around a command without being part of it ("thôi lượn đi", "lượn đi nào", "em lượn đi", "please go away").
// They are taken off both ends before the phrase is looked up, so the table needs no copy of every phrase with every filler.
const VI_TRAILING = ["nhé", "nha", "nhá", "nghen", "mà", "ạ", "nè", "đó", "nào", "thôi", "em"];
const VI_LEADING = ["thôi", "em", "nè", "ê", "ừ"];
const EN_TRAILING = ["please", "pls", "plz", "thanks", "thx", "now"];
const EN_LEADING = ["please", "pls", "plz", "ok", "okay", "hey", "just"];
const VI_ENDINGS = VI_TRAILING;
const EN_ENDINGS = EN_TRAILING;
const JA_ENDINGS = /(ください|下さい|くださいね|ね|よ|な|ぞ)$/u;

/** Lower case, NFKC (full-width letters and the ideographic space), punctuation to spaces, spaces collapsed. */
export function normalize(text: string): string {
  let t = text.normalize("NFKC").toLowerCase();
  t = t.replace(/[“”"'‘’`´]/g, "'");
  t = t.replace(/[　]/g, " ");
  // punctuation becomes a space (keeps letters of every script, digits, and the apostrophe of "i'm")
  t = t.replace(/[^\p{L}\p{N}\p{M}' ]+/gu, " ");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

/** The same text in lower case without Vietnamese diacritics (d with a stroke becomes d). */
export function fold(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}+/gu, "").replace(/đ/g, "d").normalize("NFC");
}

// the same fillers without diacritics ("nhe" for "nhé", "thoi" for "thôi"), for a message typed without them
const TRAILING = new Set([...VI_TRAILING, ...VI_TRAILING.map((w) => fold(w)), ...EN_TRAILING]);
const LEADING = new Set([...VI_LEADING, ...VI_LEADING.map((w) => fold(w)), ...EN_LEADING]);

/** What Peak is called: the name the person gave it (if any) and "peak", normalised; a name may be a word or two. */
function nameForms(names: readonly string[] | undefined): string[] {
  const out = new Set<string>(["peak"]);
  for (const n of names ?? []) {
    const f = normalize(n);
    if (f.length >= 2 && f.split(" ").length <= 2) {
      out.add(f);
      out.add(fold(f));
    }
  }
  return [...out];
}

/**
 * Take the fillers off both ends: polite and softening words, and Peak's names ("peak lượn đi", "lượn đi em", "thôi lượn đi",
 * "please go away", "go away now"). Never takes the last word away when it is the only one, and the core of a command (the
 * word "đi") is never a filler. Repeats while something comes off, a few times at most.
 */
function stripFillers(t: string, names: readonly string[] | undefined): string {
  const nms = nameForms(names);
  let cur = t;
  for (let i = 0; i < 6; i++) {
    const before = cur;
    // names, at either end
    for (const n of nms) {
      if (cur === n) break;
      if (cur.startsWith(n + " ")) cur = cur.slice(n.length + 1);
      else if (cur.endsWith(" " + n)) cur = cur.slice(0, cur.length - n.length - 1);
    }
    const words = cur.split(" ");
    if (words.length > 1 && LEADING.has(words[0])) cur = words.slice(1).join(" ");
    const w2 = cur.split(" ");
    if (w2.length > 1 && TRAILING.has(w2[w2.length - 1])) cur = w2.slice(0, -1).join(" ");
    const ja = cur.replace(JA_ENDINGS, "");
    if (ja !== cur && ja.length > 0) cur = ja;
    if (cur === before) break;
  }
  return cur;
}

/** A command the MODEL recognised (tier 2, spec 14 section 5) is taken only from a short message, a little longer than the table allows. */
export const SKILL_MAX_WORDS = 10;

/** May a message the model took for a command act? Short enough and not a question: a long sentence that merely mentions leaving never does. */
export function shortEnoughForSkill(text: string): boolean {
  if (/[?？]/.test(text)) return false;
  const n = normalize(text);
  if (!n) return false;
  const words = n.split(" ").length;
  if (words > SKILL_MAX_WORDS) return false;
  if (words === 1 && [...n].length > MAX_JA_CHARS * 2) return false;
  return true;
}

/** Is the message short enough, and not a question, to be a command at all? */
export function mayBeCommand(text: string): boolean {
  if (/[?？]/.test(text)) return false;
  const n = normalize(text);
  if (!n) return false;
  const words = n.split(" ").length;
  if (words > MAX_WORDS) return false;
  if (words === 1 && [...n].length > MAX_JA_CHARS) return false;
  return true;
}

const phraseIndex = new Map<string, Skill | "clash">();
let indexed = false;

function addKey(key: string, skill: Skill) {
  const had = phraseIndex.get(key);
  if (had === undefined) phraseIndex.set(key, skill);
  else if (had !== skill) phraseIndex.set(key, "clash");
}

function buildIndex() {
  if (indexed) return;
  indexed = true;
  for (const skill of SKILLS) {
    for (const p of TABLE[skill].phrases) {
      const n = normalize(p);
      addKey(n, skill);
      addKey(fold(n), skill);
    }
  }
}

/** Phrases of the table that are written for more than one skill (the normal and the folded form). Must be empty. */
export function clashes(): string[] {
  indexed = false;
  phraseIndex.clear();
  buildIndex();
  return [...phraseIndex.entries()].filter(([, v]) => v === "clash").map(([k]) => k);
}

/** Which command, if any, is this whole message? A phrase that clashes between two skills is never matched. */
export function matchIntent(text: string, names?: readonly string[]): IntentMatch | null {
  if (!mayBeCommand(text)) return null;
  buildIndex();
  const base = stripFillers(normalize(text), names);
  if (!base) return null;
  const forms = [base, fold(base)];
  for (const f of forms) {
    const hit = phraseIndex.get(f);
    if (hit && hit !== "clash") return { skill: hit, kind: "exact" };
  }
  for (const skill of SKILLS) {
    for (const re of TABLE[skill].patterns) {
      if (forms.some((f) => re.test(f))) return { skill, kind: "pattern" };
    }
  }
  return null;
}

export interface Sample {
  text: string;
  /** The skill the person meant; null = an ordinary message that must not match anything. */
  skill: Skill | null;
}

export interface Evaluation {
  /** Command samples: how many, and how many were matched to the RIGHT skill. */
  commands: number;
  right: number;
  /** Command samples matched to a different skill (counted as misses, listed separately: the worst kind). */
  wrongSkill: Sample[];
  /** Command samples not matched at all. */
  missed: Sample[];
  /** Ordinary samples: how many, and the ones that matched something (false positives). */
  ordinary: number;
  falsePositives: Sample[];
  /** right / commands and falsePositives / ordinary, 0 when there are no samples of that kind. */
  coverage: number;
  falsePositiveRate: number;
}

/** Coverage and false positives of the table on labelled samples (the held-out half of the phrase survey, and the ordinary lines). */
export function evaluate(samples: Sample[], names?: readonly string[]): Evaluation {
  const wrongSkill: Sample[] = [];
  const missed: Sample[] = [];
  const falsePositives: Sample[] = [];
  let commands = 0;
  let right = 0;
  let ordinary = 0;
  for (const s of samples) {
    const m = matchIntent(s.text, names);
    if (s.skill === null) {
      ordinary++;
      if (m) falsePositives.push(s);
    } else {
      commands++;
      if (!m) missed.push(s);
      else if (m.skill === s.skill) right++;
      else wrongSkill.push(s);
    }
  }
  return {
    commands,
    right,
    wrongSkill,
    missed,
    ordinary,
    falsePositives,
    coverage: commands ? right / commands : 0,
    falsePositiveRate: ordinary ? falsePositives.length / ordinary : 0,
  };
}
