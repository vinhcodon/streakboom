// Run with: node --test src/lib/ui.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { UI } from "./ui.ts";
import { LANGS } from "./lines.ts";

const flat = (o: unknown, prefix = ""): Record<string, string> => {
  const out: Record<string, string> = {};
  if (Array.isArray(o)) o.forEach((v, i) => Object.assign(out, flat(v, `${prefix}[${i}]`)));
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) Object.assign(out, flat(v, prefix ? `${prefix}.${k}` : k));
  else out[prefix] = String(o);
  return out;
};
const placeholders = (s: string) => (s.match(/\{[a-zA-Z]+\}/g) ?? []).sort().join(",");

test("every language has every interface string, nothing empty", () => {
  const en = flat(UI.en);
  for (const lang of LANGS) {
    const mine = flat(UI[lang]);
    assert.deepEqual(Object.keys(mine).sort(), Object.keys(en).sort(), `${lang} has other keys than en`);
    for (const [k, v] of Object.entries(mine)) assert.ok(v.trim().length > 0, `${lang} ${k} is empty`);
  }
});

test("placeholders such as {v}, {n} and {company} are kept in every language", () => {
  const en = flat(UI.en);
  for (const lang of LANGS) {
    const mine = flat(UI[lang]);
    for (const k of Object.keys(en)) assert.equal(placeholders(mine[k]), placeholders(en[k]), `${lang} ${k}`);
  }
});

test("all four brains are described in every language, in the offered order", () => {
  for (const lang of LANGS) {
    assert.deepEqual(Object.keys(UI[lang].providers), ["gemini", "groq", "claude", "openai"], lang);
    for (const p of Object.values(UI[lang].providers)) for (const v of Object.values(p)) assert.ok(v.length > 0);
  }
});

test("Japanese interface strings are written in Japanese", () => {
  const jp = /[぀-ヿ一-鿿]/;
  const ja = flat(UI.ja);
  // proper nouns, units and punctuation may be Latin; every sentence-sized string must contain kana or kanji
  for (const [k, v] of Object.entries(ja)) if (v.length > 24) assert.ok(jp.test(v), `${k}: ${v}`);
  assert.equal(UI.ja.capHit.length, UI.en.capHit.length);
  assert.equal(UI.ja.tourSteps.length, UI.en.tourSteps.length);
});

test("18+ and the help card exist in every language (spec 12 sections 4 and 5)", () => {
  for (const lang of ["en", "vi", "ja"] as const) {
    const u = UI[lang];
    assert.match(u.tourSteps[0], /18/, `${lang}: the first tour card says 18+`);
    assert.match(u.brainAdult, /18/);
    assert.ok(u.helpTitle.length > 5 && u.helpText.length > 60);
    assert.ok(!/\d{3,}/.test(u.helpText), `${lang}: no phone number is compiled in`);
  }
});

test("the tray menu has its own words in every language, none left in English (ADR-0055)", () => {
  for (const key of ["trayShow", "traySettings", "trayQuiet", "trayQuit"] as const) {
    for (const lang of ["vi", "ja"] as const) assert.notEqual(UI[lang][key], UI.en[key], `${lang}.${key} is still English`);
    assert.ok(UI.en[key].length > 0);
  }
});
