// The sticker catalogue (spec 13 section 2, ADR-0077 Q9): the tags of each sticker are given by the system, at build time, from a
// keyword dictionary (scripts/site/catalog/tag-rules.json) applied to the words of the sticker, over a controlled vocabulary
// (tags.json), with corrections that win (overrides.json). Nothing here calls a service: the same files give the same tags.
// The one-page proposal for Vinh to skim is docs/plans/sticker-tags-proposed.md, written by `node scripts/site/tags-report.mjs`
// and checked by the build to be up to date.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LANGS } from "../../site/strings.mjs";
import { normalize } from "../../site/normalize.js"; // the same function the page uses for what the visitor types

const HERE = join(dirname(fileURLToPath(import.meta.url)), "catalog");
export const MAX_PER_KIND = 3;
const readJson = (name) => JSON.parse(readFileSync(join(HERE, name), "utf8"));
export const loadVocabulary = () => readJson("tags.json");
export const loadRules = () => readJson("tag-rules.json");
export const loadOverrides = () => readJson("overrides.json");

export { normalize };

/** The words of a normalised English or Vietnamese text. */
const tokens = (s) => (s ? s.split(" ") : []);

/** True if the phrase occurs in the text: word by word (English, Vietnamese) or as text (Japanese). */
export function phraseIn(lang, phrase, text) {
  const p = normalize(lang, phrase), t = normalize(lang, text);
  if (!p || !t) return false;
  if (lang === "ja") return t.includes(p);
  const pt = tokens(p), tt = tokens(t);
  for (let i = 0; i + pt.length <= tt.length; i++) if (pt.every((w, k) => tt[i + k] === w)) return true;
  return false;
}

/** The fields a language's rules are read against: the caption and the title in the language; for English also the alt text. */
const fieldsOf = (st, lang) => [st.text?.[lang], st.title?.[lang], ...(lang === "en" ? [st.alt?.en] : [])].filter(Boolean);

/** The address of a sticker's permalink in English: its English title, lower case, letters and digits joined by dashes. */
export function slugOf(st) {
  return normalize("en", st.title?.en || "").replace(/ /g, "-");
}

/** Gives every sticker its tags. Returns { stickers: [{ id, slug, emotions, situations, synonyms, edge, why, capped }], problems }. */
export function buildCatalog(set, vocab = loadVocabulary(), rules = loadRules(), overrides = loadOverrides()) {
  const problems = [];
  const order = new Map(vocab.tags.map((t, i) => [t.id, i]));
  const byId = new Map(vocab.tags.map((t) => [t.id, t]));
  for (const id of Object.keys(rules.rules)) if (!byId.has(id)) problems.push(`tag-rules.json: the rule "${id}" is not in the vocabulary (tags.json)`);
  const slugs = new Set();
  const out = [];
  for (const st of set.stickers) {
    const slug = slugOf(st);
    if (!slug) problems.push(`sticker ${st.id}: no English title to make an address from`);
    if (slugs.has(slug)) problems.push(`sticker ${st.id}: the address "${slug}" is already used`);
    slugs.add(slug);
    const why = {};
    for (const [tag, byLang] of Object.entries(rules.rules)) {
      for (const lang of LANGS) {
        const hit = (byLang[lang] || []).find((phrase) => fieldsOf(st, lang).some((field) => phraseIn(lang, phrase, field)));
        if (hit) { (why[tag] ||= []).push(`${lang}: ${hit}`); }
      }
    }
    let tags = Object.keys(why);
    const ov = overrides.overrides?.[slug] || {};
    for (const kind of ["emotions", "situations"]) {
      for (const t of ov[kind]?.add || []) if (!tags.includes(t)) { tags.push(t); (why[t] ||= []).push("override: added"); }
      for (const t of ov[kind]?.remove || []) { tags = tags.filter((x) => x !== t); delete why[t]; }
    }
    const pick = (kind) => {
      const all = tags.filter((t) => byId.get(t)?.kind === kind).sort((a, b) => order.get(a) - order.get(b));
      return { kept: all.slice(0, MAX_PER_KIND), capped: all.slice(MAX_PER_KIND) };
    };
    const e = pick("emotion"), s = pick("situation");
    const kept = new Set([...e.kept, ...s.kept]);
    let edge = 0;
    for (const r of rules.edge || []) if ((r.anyTag || []).some((t) => kept.has(t))) edge = Math.max(edge, r.edge);
    if (Number.isInteger(ov.edge)) edge = ov.edge;
    const synonyms = {};
    for (const lang of LANGS) {
      const words = [...kept].flatMap((t) => byId.get(t)?.synonyms?.[lang] || []).concat(ov.synonyms?.[lang] || []);
      synonyms[lang] = [...new Set(words)];
    }
    out.push({ id: st.id, slug, emotions: e.kept, situations: s.kept, synonyms, edge, why: Object.fromEntries([...kept].map((t) => [t, why[t] || []])), capped: [...e.capped, ...s.capped] });
  }
  return { stickers: out, problems };
}

/** Everything the build refuses about the catalogue; returns a list of messages (empty when all is well). */
export function catalogProblems(set, catalog, vocab = loadVocabulary(), rules = loadRules(), overrides = loadOverrides()) {
  const problems = [...catalog.problems];
  const ids = new Set();
  for (const t of vocab.tags) {
    if (ids.has(t.id)) problems.push(`tags.json: the tag "${t.id}" is listed twice`);
    ids.add(t.id);
    if (!["emotion", "situation"].includes(t.kind)) problems.push(`tags.json: the tag "${t.id}" has the kind "${t.kind}"`);
    for (const lang of LANGS) {
      if (!t.names?.[lang]) problems.push(`tags.json: the tag "${t.id}" has no name in ${lang}`);
      if (!Array.isArray(t.synonyms?.[lang]) || !t.synonyms[lang].length) problems.push(`tags.json: the tag "${t.id}" has no synonyms in ${lang}`);
    }
  }
  const slugs = new Set(catalog.stickers.map((s) => s.slug));
  for (const [slug, ov] of Object.entries(overrides.overrides || {})) {
    if (!slugs.has(slug)) problems.push(`overrides.json: no sticker has the address "${slug}"`);
    for (const kind of ["emotions", "situations"]) for (const op of ["add", "remove"]) for (const t of ov[kind]?.[op] || []) if (!ids.has(t)) problems.push(`overrides.json: "${slug}" uses the unknown tag "${t}"`);
    if (ov.edge !== undefined && ![0, 1, 2].includes(ov.edge)) problems.push(`overrides.json: "${slug}" has the cheekiness ${ov.edge} (0, 1 or 2)`);
  }
  for (const r of rules.edge || []) for (const t of r.anyTag || []) if (!ids.has(t)) problems.push(`tag-rules.json: the cheekiness rule uses the unknown tag "${t}"`);
  const titleOf = new Map(set.stickers.map((s) => [s.id, s.title.en]));
  for (const c of catalog.stickers) {
    const name = `sticker ${c.id} "${titleOf.get(c.id)}"`;
    if (!c.emotions.length && !c.situations.length) problems.push(`${name}: no rule gives it an emotion or a situation: add words to tag-rules.json (or an override); no sticker is published without tags`);
    for (const lang of LANGS) if (!c.synonyms[lang].length) problems.push(`${name}: no synonym in ${lang}`);
  }
  return problems;
}

/** The names of tags in a language, for the proposal and later for the chips. */
export const tagName = (vocab, id, lang = "en") => vocab.tags.find((t) => t.id === id)?.names?.[lang] || id;

/** docs/plans/sticker-tags-proposed.md: every sticker with the tags the rules gave it and why, for Vinh to skim. */
export function proposalMarkdown(set, catalog, vocab = loadVocabulary()) {
  const edgeName = ["0 gentle", "1 cheeky", "2 very cheeky"];
  const lines = [
    "# Sticker tags proposed by the rules (to skim)",
    "",
    "Generated by `node scripts/site/tags-report.mjs` from `scripts/site/catalog/` (`tags.json`, `tag-rules.json`, `overrides.json`); the build fails if this file is out of date. **Do not edit it by hand.** To correct a sticker, add an entry to `overrides.json` (the key is the English address in the first column); to change what a word means, change `tag-rules.json`.",
    "",
    `Set: \`${set.version}\`, ${set.stickers.length} stickers. Tags are given by the rules, not by hand (ADR-0077, Q9). The tag names and synonyms in Vietnamese and Japanese were written by an AI and have no native reader.`,
    "",
    "| # | Address | English caption | Emotions | Situations | Cheekiness | Because (first words that matched) |",
    "|---|---|---|---|---|---|---|",
  ];
  const caption = new Map(set.stickers.map((s) => [s.id, s.text.en]));
  for (const c of catalog.stickers) {
    const names = (ids) => ids.map((t) => tagName(vocab, t)).join(", ") || "none";
    const because = Object.entries(c.why).map(([t, w]) => `${t} (${w[0]})`).join("; ");
    lines.push(`| ${c.id} | \`${c.slug}\` | ${caption.get(c.id).replace(/\|/g, "/")} | ${names(c.emotions)} | ${names(c.situations)} | ${edgeName[c.edge]} | ${because}${c.capped.length ? `; **capped, not kept:** ${c.capped.join(", ")}` : ""} |`);
  }
  const used = new Map();
  for (const c of catalog.stickers) for (const t of [...c.emotions, ...c.situations]) used.set(t, (used.get(t) || 0) + 1);
  lines.push("", "## How many stickers use each tag", "", "| Tag | Kind | Stickers |", "|---|---|---|");
  for (const t of vocab.tags) lines.push(`| ${t.id} (${t.names.en}) | ${t.kind} | ${used.get(t.id) || 0} |`);
  const unused = vocab.tags.filter((t) => !used.get(t.id)).map((t) => t.id);
  lines.push("", unused.length ? `Tags no sticker uses yet: ${unused.join(", ")}.` : "Every tag is used.", "", "A tag page needs six or more stickers (spec 13 section 2): " + (vocab.tags.filter((t) => (used.get(t.id) || 0) >= 6).map((t) => t.id).join(", ") || "none yet") + ".", "");
  return lines.join("\n");
}
