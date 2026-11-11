// Checks that the project documents agree with each other and with the code (ADR-0033: part of every release).
//   node scripts/audit-docs.mjs
// Exit code 1 when something is wrong. It reads tracked files only and never writes. It does not read `site/`, which has its
// own owner (it only reports the names it finds there, so the website session can be told).
//
// Checks: (1) every relative link in the markdown files points at a file; (2) every ADR file is in the decision index; (3) every
// file in docs/handoff, docs/plans and docs/hypotheses is in the README of its folder; (4) the version in the README status line
// and the "as of" lines of the specs match tauri.conf.json, package.json and Cargo.toml; (5) the newest CHANGELOG entry is the
// current version; (6) no retired name appears (see RETIRED below); (7) test counts quoted in the README and spec/04 match the
// counts the tests report if you pass them (--js 155 --rust 53); (8) no health claim word in the README and the texts the app
// shows (ADR-0057).

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, normalize } from "node:path";

const root = join(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
process.chdir(root);
const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};

/** Names that must not appear any more (a display name that was changed). The website is reported, not failed. */
const RETIRED = ["Vinh Nguyen"];
/** Files that may mention a retired name because they are about the change itself (the history and the notes to other sessions). */
const RETIRED_OK = ["docs/engineering-log.md", "docs/handoff/", "docs/decisions/0033", "scripts/audit-docs.mjs"];

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
const text = (f) => readFileSync(f, "utf8");
const mds = files.filter((f) => f.endsWith(".md") && !f.startsWith("site/"));
const problems = [];
const bad = (m) => problems.push(m);

// 1. relative links
for (const f of mds) {
  const t = text(f).replace(/```[\s\S]*?```/g, "");
  for (const m of t.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|#)/.test(u)) continue;
    const path = u.split("#")[0];
    if (!path) continue;
    if (!existsSync(normalize(join(dirname(f), path)))) bad(`broken link in ${f}: ${u}`);
  }
}

// 2. ADR index
const index = text("docs/decisions/README.md");
for (const f of files.filter((f) => /^docs\/decisions\/0\d+.*\.md$/.test(f))) {
  if (!index.includes(basename(f))) bad(`ADR not in docs/decisions/README.md: ${f}`);
}

// 3. folder indexes
for (const d of ["docs/handoff", "docs/plans", "docs/hypotheses"]) {
  const r = text(`${d}/README.md`);
  for (const f of files.filter((f) => f.startsWith(`${d}/`) && f.endsWith(".md") && !f.endsWith("README.md"))) {
    if (!r.includes(basename(f))) bad(`not in ${d}/README.md: ${f}`);
  }
}

// 4. versions
const conf = JSON.parse(text("app/src-tauri/tauri.conf.json")).version;
const pkg = JSON.parse(text("app/package.json")).version;
const cargo = /^version = "([^"]+)"/m.exec(text("app/src-tauri/Cargo.toml"))?.[1];
const lock = /name = "streakboom"\r?\nversion = "([^"]+)"/.exec(text("app/src-tauri/Cargo.lock"))?.[1];
for (const [n, v] of [["package.json", pkg], ["Cargo.toml", cargo], ["Cargo.lock", lock]]) if (v !== conf) bad(`${n} says ${v}, tauri.conf.json says ${conf}`);
const readmeV = /first official release line \(v([\d.]+)\)/.exec(text("README.md"))?.[1];
if (readmeV !== conf) bad(`README status line says v${readmeV}, the app is ${conf}`);
for (const [f, rx] of [["spec/03-naive-pet-design.md", /exists in the ([\d.]+) code/], ["spec/04-technical-design.md", /as of ([\d.]+)\./]]) {
  const v = rx.exec(text(f))?.[1];
  if (v !== conf) bad(`${f} says ${v}, the app is ${conf}`);
}

// 5. changelog
const top = /^## ([\d.]+) \(/m.exec(text("CHANGELOG.md"))?.[1];
if (top !== conf) bad(`CHANGELOG.md newest entry is ${top}, the app is ${conf}`);

// 6. retired names
for (const f of files.filter((f) => !/\.(png|jpg|ico|icns|lock|json)$/.test(f) || f === "LICENSE")) {
  if (f.startsWith("site/") || RETIRED_OK.some((p) => f.startsWith(p))) continue;
  const t = text(f);
  for (const n of RETIRED) if (t.includes(n)) bad(`retired name "${n}" in ${f}`);
}
const inSite = [];
for (const f of files.filter((f) => f.startsWith("site/") && /\.(html|js|css|json|md|txt)$/.test(f))) {
  for (const n of RETIRED) if (text(f).includes(n)) inSite.push(`${f} ("${n}")`);
}

// 7. test counts, when given
const js = arg("--js");
const rust = arg("--rust");
if (js && !text("README.md").includes(`${js} tests`)) bad(`README.md does not say "${js} tests" (Node)`);
if (js && !text("spec/04-technical-design.md").includes(`${js} tests`)) bad(`spec/04 does not say "${js} tests" (Node)`);
if (rust && !text("README.md").includes(`${rust} tests`)) bad(`README.md does not say "${rust} tests" (Rust)`);
if (rust && !text("spec/04-technical-design.md").includes(`${rust} tests`)) bad(`spec/04 does not say "${rust} tests" (Rust)`);

// 8. no health claim (ADR-0057; spec 12 section 7): the README and the texts the app shows never say that Peak heals, treats
// or reduces a condition. A line that denies such a claim ("makes no claim to...") is allowed. The website is reported only.
const CLAIMS = [/\bheal(s|ed|ing)?\b/i, /\btherap(y|ies|eutic)\b/i, /clinically/i, /\banxiety\b/i, /\bdepression\b/i, /\bADHD\b/, /reduc\w+ (your )?(stress|loneliness)/i, /chữa lành/i, /trị liệu/i, /trầm cảm/i, /lo âu/i, /癒/, /うつ/, /治療/];
const DENIES = /no claim|not a health|never claims/i;
const claimsIn = (f) =>
  text(f)
    .split("\n")
    .filter((l) => !DENIES.test(l) && CLAIMS.some((re) => re.test(l)))
    .map((l) => l.trim().slice(0, 80));
for (const f of ["README.md", "app/src/lib/ui.ts", "app/src/lib/lines.ts", "app/src/lib/memlines.ts"]) {
  for (const l of claimsIn(f)) bad(`a health claim word in ${f}: "${l}"`);
}
const claimsInSite = [];
for (const f of files.filter((f) => f.startsWith("site/") && /\.(html|mjs|js|json|md|txt)$/.test(f))) {
  if (claimsIn(f).length) claimsInSite.push(f);
}

console.log(`version ${conf}; ${mds.length} markdown files checked.`);
if (claimsInSite.length) console.log(`Tell the website session: health claim words (ADR-0057) in ${claimsInSite.join(", ")}`);
if (inSite.length) console.log(`Tell the website session (site/ is not checked or edited here): retired names in ${inSite.join(", ")}`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log("  - " + p);
  process.exit(1);
}
console.log("no problems.");
