// Writes docs/plans/sticker-tags-proposed.md, the page Vinh skims (ADR-0077, Q9). Run it after the stickers, the vocabulary, the
// rules or the overrides change:  node scripts/site/tags-report.mjs
// The build refuses a proposal that is out of date, so the page always says what the rules do now.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./facts.mjs";
import { loadStickers } from "./stickers.mjs";
import { buildCatalog, catalogProblems, proposalMarkdown } from "./catalog.mjs";

export const PROPOSAL_FILE = join(ROOT, "docs", "plans", "sticker-tags-proposed.md");

if (process.argv[1] && process.argv[1].endsWith("tags-report.mjs")) {
  const set = loadStickers();
  const catalog = buildCatalog(set);
  const problems = catalogProblems(set, catalog);
  writeFileSync(PROPOSAL_FILE, proposalMarkdown(set, catalog));
  console.log(`written ${PROPOSAL_FILE}: ${catalog.stickers.length} stickers${problems.length ? `, ${problems.length} problem(s):\n  - ${problems.join("\n  - ")}` : ""}`);
}
