// Tests of the words the site does not say: Preview and the test builds (ADR-0101). Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { HIDDEN_WORDS, changelog, parseChangelog, publicEntries } from "./facts.mjs";
import { build } from "../build-site.mjs";
import { check } from "./checks.mjs";

test("the words are Preview and the test builds, as words, in any case", () => {
  for (const t of ["A Preview build", "preview", "the Test builds... link", "test build", "shared early as test builds"]) assert.match(t, HIDDEN_WORDS, t);
  for (const t of ["a preliminary look", "previews", "a prevue", "builds the site", "tested the build"]) assert.doesNotMatch(t, HIDDEN_WORDS, t);
});

test("a line of the changelog that names them is left out; an entry left with no line is left out; the others are as they were", () => {
  const text = ["## 0.9.0 (2026-01-01)", "- **Kept.** A plain line.", "- A line about Preview builds.", "", "## 0.8.0 (2026-01-02)", "- Only about test builds.", "", "## 0.7.0 (2026-01-03)", "- Another plain line."].join("\n");
  const all = parseChangelog(text);
  assert.equal(all.length, 3);
  const shown = publicEntries(all);
  assert.deepEqual(shown.map((e) => [e.version, e.items]), [["0.9.0", ["**Kept.** A plain line."]], ["0.7.0", ["Another plain line."]]]);
  assert.equal(all[0].items.length, 2, "the parsed entries are not changed");
});

test("the real changelog as the site shows it has none of the words", () => {
  for (const e of changelog()) for (const it of e.items) assert.doesNotMatch(it, HIDDEN_WORDS, `${e.version}: ${it.slice(0, 60)}`);
});

test("the build says none of them in a page or in a generated file, and refuses a page or a file that does", () => {
  const b = build({ out: join(mkdtempSync(join(tmpdir(), "sb-hid-")), "_site") });
  const run = (mutate) => { const c = { ctx: { ...b.ctx }, pages: b.pages.map((p) => ({ ...p })), files: { ...b.files }, out: b.out }; mutate(c); return () => check(c); };
  assert.doesNotThrow(run(() => {}));
  assert.throws(run((c) => { const p = c.pages.find((x) => x.path === "/"); p.html = p.html.replace("</main>", "<p>Try the Preview build.</p></main>"); }), /the page says "Preview"/);
  assert.throws(run((c) => { c.files["llms-full.txt"] += "\nThe Test builds... link."; }), /llms-full\.txt: says "Test builds"/);
  assert.throws(run((c) => { c.files["changelog.xml"] += "<!-- shared early as test builds -->"; }), /changelog\.xml: says "test builds"/);
  // a script or an address that contains the word is not page text
  assert.doesNotThrow(run((c) => { const p = c.pages.find((x) => x.path === "/"); p.html = p.html.replace("</body>", "<script>var preview = 1;</script></body>"); }));
});
