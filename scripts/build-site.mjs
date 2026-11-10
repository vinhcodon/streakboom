// Builds the website (ADR-0034): static files in _site/, ready for GitHub Pages.
//   node scripts/build-site.mjs        builds and prints what it wrote; exits with an error if a check fails
// 1. Peak: the app's cat rig (TypeScript in app/src/lib/rig) becomes plain browser JavaScript in site/peak/, so the page
//    draws the same cat the app does and cannot drift from it. Needs Node 22.13 or newer (module.stripTypeScriptTypes).
// 2. Pages: home and privacy in English, Vietnamese and Japanese, the changelog and a 404 page, plus sitemap.xml, robots.txt,
//    llms.txt and llms-full.txt, filled in from site/strings.mjs, tauri.conf.json (version) and CHANGELOG.md (notes).
// 3. Checks (scripts/site/checks.mjs): version, FAQ against JSON-LD, hreflang, canonical, headings, alt text, links,
//    static facts, banned claims. A failed check throws: the deploy does not happen.
import { stripTypeScriptTypes } from "node:module";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, context } from "./site/facts.mjs";
import { PATHS, changelogPage, homePage, howPage, notFoundPage, privacyPage } from "./site/pages.mjs";
import { LANGS } from "../site/strings.mjs";
import { changelogFeed, llms, llmsFull, robots, sitemap } from "./site/files.mjs";
import { check } from "./site/checks.mjs";

export const OUT = join(ROOT, "_site");
const SITE = join(ROOT, "site");

/** The cat rig as browser JavaScript, in site/peak/. */
export function buildRig() {
  const src = join(ROOT, "app", "src", "lib", "rig");
  const out = join(SITE, "peak");
  mkdirSync(out, { recursive: true });
  for (const name of ["keys", "engine", "draw"]) {
    const ts = readFileSync(join(src, `${name}.ts`), "utf8");
    const js = stripTypeScriptTypes(ts, { mode: "strip" }).replace(/(from\s+["']\.\/\w+)\.ts(["'])/g, "$1.js$2");
    writeFileSync(join(out, `${name}.js`), js);
  }
}

const write = (out, rel, text) => {
  const file = join(out, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
};

export function build({ out = OUT } = {}) {
  buildRig();
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  // what the browser loads
  for (const f of ["style.css", "app.js", "peak.js", "ui.js", "scenes.js", "tour.js"]) cpSync(join(SITE, f), join(out, f));
  cpSync(join(SITE, "assets"), join(out, "assets"), { recursive: true });
  cpSync(join(SITE, "peak"), join(out, "peak"), { recursive: true });

  const ctx = context();
  const fileOf = (path) => `${path.replace(/^\//, "")}index.html`;
  const pages = [
    ...LANGS.map((l) => ({ path: PATHS[l].home, file: fileOf(PATHS[l].home), lang: l, html: homePage(l, ctx) })),
    ...LANGS.map((l) => ({ path: PATHS[l].how, file: fileOf(PATHS[l].how), lang: l, html: howPage(l, ctx) })),
    ...LANGS.map((l) => ({ path: PATHS[l].privacy, file: fileOf(PATHS[l].privacy), lang: l, html: privacyPage(l, ctx) })),
    { path: PATHS.changelog, file: "changelog/index.html", lang: "en", html: changelogPage(ctx) },
    { path: "/404.html", file: "404.html", lang: "en", html: notFoundPage(ctx) },
  ];
  const files = { "sitemap.xml": sitemap(ctx), "robots.txt": robots(), "llms.txt": llms(ctx), "llms-full.txt": llmsFull(ctx), "changelog.xml": changelogFeed(ctx) };
  for (const p of pages) write(out, p.file, p.html);
  for (const [name, text] of Object.entries(files)) write(out, name, text);

  check({ ctx, pages, files, out });
  return { out, ctx, pages, files };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const r = build();
    console.log(`site built in ${r.out}: version ${r.ctx.version} (${r.ctx.date}), ${r.pages.length} pages, ${Object.keys(r.files).length} files; all checks passed`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
