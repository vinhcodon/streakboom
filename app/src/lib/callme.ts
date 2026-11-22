// What the pets call the person (ADR-0144): said in the chat ("call me Vinh", "gọi tôi là Vinh", "Vinhと呼んで") or with `/name Vinh`, understood on the device:
// no model, no key. One name for both pets. Short messages only; the name is cleaned and bounded by the memory module.

import { cleanName } from "./memory.ts";

const MAX_CHARS = 60;

const PATTERNS: RegExp[] = [
  /^(?:please |hãy |làm ơn )?call me (.+)$/i,
  /^(?:please )?(?:my name is|i am called|i'm called) (.+)$/i,
  /^(?:hãy |làm ơn )?(?:gọi|kêu) (?:tôi|mình|tớ|em|anh|chị) là (.+)$/i,
  /^(?:tên (?:tôi|mình|tớ) là|tôi tên là|mình tên là) (.+)$/i,
  /^(.+?)\s*(?:と|って)(?:呼んで|呼んでね|呼んでください)$/,
];

/** The name in a message that tells the pets what to call the person, or null when the message is just a message. */
export function parseCallMe(raw: string): string | null {
  const text = raw.trim().replace(/[.!。！]+$/u, "").trim();
  if (!text || [...text].length > MAX_CHARS) return null;
  for (const r of PATTERNS) {
    const m = r.exec(text);
    if (m) {
      const name = cleanName(m[1].replace(/^["“「']+|["”」']+$/gu, ""));
      // a name is a word or two, not a sentence
      if (name && name.split(/\s+/).length <= 3) return name;
    }
  }
  return null;
}
