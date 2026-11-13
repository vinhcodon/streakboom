// A version in the address of what the browser keeps (ADR-0087). GitHub Pages lets a browser keep any file for 10 minutes, so a page that
// changed could meet the old style.css or script. Here one short hash of every stylesheet, script and search index is added to their
// addresses (/style.css?v=ab12cd34ef): when any of them changes the addresses change and the browser asks again; when none changes the
// addresses stay and the browser keeps them. The hash is of the content, so the same files always give the same address.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const VERSION_LENGTH = 10;

const codeFiles = (dir, rel = "") => readdirSync(join(dir, rel), { withFileTypes: true }).flatMap((e) => {
  const r = rel ? `${rel}/${e.name}` : e.name;
  if (e.isDirectory()) return e.name === "assets" ? [] : codeFiles(dir, r);
  return e.name === "style.css" || e.name.endsWith(".js") ? [r] : [];
});

/** The version of a built folder: the hash of its stylesheet, its scripts (as they are in the repository) and the search indexes (given as text). */
export function versionOf(out, indexTexts = []) {
  const h = createHash("sha256");
  for (const f of codeFiles(out).sort()) h.update(`${f}\n${readFileSync(join(out, f), "utf8")}\n`);
  for (const t of indexTexts) h.update(`index\n${t}\n`);
  return h.digest("hex").slice(0, VERSION_LENGTH);
}

/** Adds ?v=<version> to what the scripts load: their imports of each other (static and dynamic) and the search index files. Throws if the index address is not found. */
export function versionScripts(out, version) {
  for (const f of codeFiles(out).filter((x) => x.endsWith(".js"))) {
    const file = join(out, f);
    let s = readFileSync(file, "utf8");
    const before = s;
    s = s.replace(/(\bfrom\s*["'])(\.{1,2}\/[^"'?]+\.js)(["'])/g, `$1$2?v=${version}$3`);
    s = s.replace(/(\bimport\s*\(\s*["'])(\.{1,2}\/[^"'?]+\.js)(["'])/g, `$1$2?v=${version}$3`);
    if (f === "stickers.js") {
      const idx = /(\/assets\/stickers\/search-\$\{kind\}\.json)(`)/;
      if (!idx.test(s)) throw new Error("stickers.js: the address of the search index was not found, so it cannot be versioned (ADR-0087)");
      s = s.replace(idx, `$1?v=${version}$2`);
    }
    if (s !== before) writeFileSync(file, s);
  }
}

/** The address of a file of the site with its version (no version when the build has none, as in a test that builds only pages). */
export const withVersion = (path, ctx) => (ctx?.assetVersion ? `${path}?v=${ctx.assetVersion}` : path);
