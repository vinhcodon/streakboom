// The chat commands that bring a pet out or send it in ("gọi Paws ra đi", "Paws go in", "Pawsを呼んで"), ADR-0139.
// Pure and local: no model, no key, no chat turn counted. Short on purpose: a long sentence is a conversation and goes to the chat.
// Only a message that names exactly one pet (Paws or Peak) and says out or in is a command; anything else is not.

import { PETS, type PetId } from "./duo.ts";

export type DuoAct = "out" | "in";
export interface DuoCommand { target: PetId; act: DuoAct }

const MAX_CHARS = 40;

// Going in wins over going out: "send Paws in" and "bring Paws in" hold the word "bring"/"send" but mean in.
const IN = [
  /\bvào\b/, /\bđi\s+ngủ\b/, /\bcất\b/, /\bnghỉ\s+đi\b/, /\bvề\s+(nhà|đi)\b/,
  /\bgo\s+(back\s+)?in\b/, /\b(send|bring|put|take|tuck)\b.*\b(in|away)\b/, /\btuck\b/, /\bgo\s+away\b/,
  /戻/, /しまっ/, /引っ込/, /入って/, /お休み/,
];
const OUT = [
  /\bgọi\b/, /\bra\b/, /\bđi\s+ra\b/, /\bthả\b/, /\bmời\b/,
  /\bcall\b/, /\bbring\b/, /\bout\b/, /\bcome\b/, /\blet\b.*\bout\b/, /\bappear\b/,
  /呼/, /出/, /おいで/, /来て/,
];

function find(text: string, id: PetId): boolean { return text.includes(id); }

/** The command in a chat message, or null when the message is just a message. */
export function parseDuoCommand(raw: string): DuoCommand | null {
  const text = raw.toLowerCase().replace(/[.,!?¿。、！？~…]+/g, " ").replace(/\s+/g, " ").trim();
  if (!text || [...text].length > MAX_CHARS) return null;
  const paws = find(text, "paws");
  const peak = find(text, "peak");
  if (paws === peak) return null; // none, or both: not a command for one pet
  const target: PetId = paws ? "paws" : "peak";
  if (IN.some((r) => r.test(text))) return { target, act: "in" };
  if (OUT.some((r) => r.test(text))) return { target, act: "out" };
  return null;
}

const BOTH = [/@(everyone|all|both)\b/, /cả hai/, /hai đứa/, /hai bạn/, /hai đứa bây/, /\bboth\b/, /\byou two\b/, /二人/, /ふたり/, /両方/];

export interface Out { peak: boolean; paws: boolean }

/** Who a message is for (ADR-0145): every pet that is out. A name ("Paws ơi", "Peak, ...", "@Paws ...") picks one, also when both are out; a message that
 *  opens with one name is for that one unless the next words name the other too; a word for both ("hai đứa", "both") keeps both. A name of a pet that is in
 *  sends the message to whoever is out. Nobody out gives an empty list: the caller does not send. */
export function addressees(raw: string, out: Out): PetId[] {
  const here = PETS.filter((p) => out[p]);
  if (here.length === 0) return [];
  if (here.length === 1) return here;
  const text = raw.toLowerCase();
  const names = text.includes("paws") && text.includes("peak");
  // a message that opens with one name ("Peak, what do you think of Paws?", "@Paws ...") is for that pet, unless the next words name the other one too
  const lead = /^\s*@?(peak|paws)/.exec(text);
  if (lead && names) {
    const other = lead[1] === "peak" ? "paws" : "peak";
    if (!new RegExp(String.raw`^\s*@?${lead[1]}[\s,&]*(và|and|với|と)?[\s,]*@?${other}`).test(text)) return [lead[1] as PetId];
  }
  if (names || BOTH.some((r) => r.test(text))) return here;
  if (text.includes("paws") !== text.includes("peak")) return [text.includes("paws") ? "paws" : "peak"];
  return here;
}

/** The pets a message calls out (ADR-0157): the pets named by an `@` mention at the start of the message that are not out ("@Paws what do you think", "@Peak @Paws hi").
 *  A mention is a call, as in common chat applications, and the same as `/call`. A name without the `@`, and a name in the middle of a sentence, call nobody. */
export function summons(raw: string, out: Out): PetId[] {
  const names: PetId[] = [];
  let rest = raw;
  for (;;) {
    const m = /^\s*@(peak|paws)(?![\p{L}\p{N}_])[\s,&]*(?:và|and|với)?[\s,]*/iu.exec(rest);
    if (!m) break;
    const p = m[1].toLowerCase() as PetId;
    if (!out[p] && !names.includes(p)) names.push(p);
    rest = rest.slice(m[0].length);
  }
  return names;
}

const RELAY = [/\bhỏi\s+(paws|peak)\b/, /\bask\s+(paws|peak)\b/, /(paws|peak)\s*に\s*(聞い|きい|尋ね|たずね)/];

/** "Hỏi Paws xem...", "ask Peak what...", "Pawsに聞いて": the person asks one pet to ask the other (ADR-0141, situation 8). Short messages only; the pet
 *  named is the one that answers, the other pet is the one that turns to it. One hop, decided here, never by the model. */
export function parseRelay(raw: string): { target: PetId; via: PetId } | null {
  const text = raw.toLowerCase().replace(/\s+/g, " ").trim();
  if (!text || [...text].length > 100) return null;
  for (const r of RELAY) {
    const m = r.exec(text);
    if (m) {
      const target = m[1] as PetId;
      return { target, via: target === "paws" ? "peak" : "paws" };
    }
  }
  return null;
}
