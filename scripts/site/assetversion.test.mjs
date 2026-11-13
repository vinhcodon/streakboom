// Tests of the version in the addresses of the stylesheet, the scripts and the search indexes (ADR-0087). Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";
import { VERSION_LENGTH, versionOf, versionScripts, withVersion } from "./assetversion.mjs";

const tmp = () => mkdtempSync(join(tmpdir(), "sb-av-"));
const folder = (css = "a{}") => {
  const d = tmp();
  mkdirSync(join(d, "peak"));
  writeFileSync(join(d, "style.css"), css);
  writeFileSync(join(d, "app.js"), 'import { t } from "./ui.js";\nimport("./late.js");\n');
  writeFileSync(join(d, "ui.js"), "export const t = 1;");
  writeFileSync(join(d, "peak", "engine.js"), 'import { K } from "./keys.js";');
  writeFileSync(join(d, "stickers.js"), "const u = `/assets/stickers/search-${kind}.json`;");
  return d;
};

test("the version is of the content: same files, same version; any change of a stylesheet, a script or an index, another", () => {
  const a = versionOf(folder(), ["x"]);
  assert.match(a, new RegExp(`^[0-9a-f]{${VERSION_LENGTH}}$`));
  assert.equal(versionOf(folder(), ["x"]), a);
  assert.notEqual(versionOf(folder("b{}"), ["x"]), a, "a changed stylesheet");
  assert.notEqual(versionOf(folder(), ["y"]), a, "a changed index");
  const d = folder();
  writeFileSync(join(d, "peak", "engine.js"), "export {};");
  assert.notEqual(versionOf(d, ["x"]), a, "a changed script in a sub folder");
});

test("the scripts load each other, and the search index, with the version", () => {
  const d = folder();
  versionScripts(d, "abc123");
  assert.equal(readFileSync(join(d, "app.js"), "utf8"), 'import { t } from "./ui.js?v=abc123";\nimport("./late.js?v=abc123");\n');
  assert.equal(readFileSync(join(d, "peak", "engine.js"), "utf8"), 'import { K } from "./keys.js?v=abc123";');
  assert.match(readFileSync(join(d, "stickers.js"), "utf8"), /search-\$\{kind\}\.json\?v=abc123`/);
});

test("the build refuses a stickers.js whose index address it cannot find", () => {
  const d = folder();
  writeFileSync(join(d, "stickers.js"), "const u = '/somewhere-else.json';");
  assert.throws(() => versionScripts(d, "abc123"), /address of the search index was not found/);
});

test("withVersion adds the version, or nothing when the build has none", () => {
  assert.equal(withVersion("/style.css", { assetVersion: "abc" }), "/style.css?v=abc");
  assert.equal(withVersion("/style.css", {}), "/style.css");
});

test("the built pages carry one version everywhere, and the checks refuse a page or an import without it", () => {
  const out = join(tmp(), "_site");
  const b = build({ out });
  const v = b.ctx.assetVersion;
  assert.match(v, /^[0-9a-f]{10}$/);
  const run = (mutate) => { const c = { ctx: { ...b.ctx }, pages: b.pages.map((p) => ({ ...p })), files: { ...b.files }, out: b.out }; mutate(c); return () => check(c); };
  assert.doesNotThrow(run(() => {}));
  for (const p of b.pages) assert.ok(p.html.includes(`href="/style.css?v=${v}"`), p.path);
  assert.ok(b.pages.find((p) => p.path === "/stickers/").html.includes(`src="/stickers.js?v=${v}"`));
  assert.throws(run((c) => { const p = c.pages.find((x) => x.path === "/"); p.html = p.html.replace(`/style.css?v=${v}`, "/style.css"); }), /the stylesheet has no version/);
  assert.throws(run((c) => { const p = c.pages.find((x) => x.path === "/stickers/"); p.html = p.html.replace(`/stickers.js?v=${v}`, "/stickers.js"); }), /the script \/stickers\.js has no version/);
  const f = join(out, "app.js");
  const s = readFileSync(f, "utf8");
  writeFileSync(f, s.replace(`./ui.js?v=${v}`, "./ui.js"));
  assert.throws(run(() => {}), /the import \.\/ui\.js has no version/);
  writeFileSync(f, s);
});
