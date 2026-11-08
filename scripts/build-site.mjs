// Builds the landing page's copy of the real Peak: turns the app's cat rig (TypeScript) into plain
// browser JavaScript in site/peak/, so the page draws the same cat the app does and cannot drift.
// Needs Node 22.13 or newer (module.stripTypeScriptTypes). Usage: node scripts/build-site.mjs
import { stripTypeScriptTypes } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "app", "src", "lib", "rig");
const out = join(root, "site", "peak");
mkdirSync(out, { recursive: true });

for (const name of ["keys", "engine", "draw"]) {
  const ts = readFileSync(join(src, `${name}.ts`), "utf8");
  const js = stripTypeScriptTypes(ts, { mode: "strip" }).replace(/(from\s+["']\.\/\w+)\.ts(["'])/g, "$1.js$2");
  writeFileSync(join(out, `${name}.js`), js);
}
console.log("site/peak/ built from app/src/lib/rig/");
