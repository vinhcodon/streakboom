// The chat commands that bring a pet out or send it in ("gọi Paws ra đi", "Paws go in", "Pawsを呼んで"), ADR-0139.
// Pure and local: no model, no key, no chat turn counted. Short on purpose: a long sentence is a conversation and goes to the chat.
// Only a message that names exactly one pet (Paws or Peak) and says out or in is a command; anything else is not.

import type { PetId } from "./duo.ts";

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

/** Which pet answers a chat message (ADR-0139/0140): the one the person names; with no name (or both names), the pet last spoken to.
 *  Paws can answer only while it is out; otherwise Peak does. ("Both, one after the other" is not built.) */
export function addressedPet(raw: string, lastSpoken: PetId, pawsOut: boolean): PetId {
  const text = raw.toLowerCase();
  const paws = text.includes("paws");
  const peak = text.includes("peak");
  let who: PetId = paws && !peak ? "paws" : peak && !paws ? "peak" : lastSpoken;
  if (who === "paws" && !pawsOut) who = "peak";
  return who;
}

const BOTH = [/cả hai/, /hai đứa/, /hai bạn/, /hai đứa bây/, /\bboth\b/, /\byou two\b/, /二人/, /ふたり/, /両方/];

/** Who a message is for: both pets (both names, or a word for both) while Paws is out; else the one pet `addressedPet` picks. */
export function addressees(raw: string, lastSpoken: PetId, pawsOut: boolean): PetId[] {
  if (!pawsOut) return ["peak"];
  const text = raw.toLowerCase();
  const names = text.includes("paws") && text.includes("peak");
  if (names || BOTH.some((r) => r.test(text))) return ["peak", "paws"];
  return [addressedPet(raw, lastSpoken, pawsOut)];
}
