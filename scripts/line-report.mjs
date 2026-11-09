// Prints the repetition report for the scripted lines (LN-8): where the pools are too small for how often they are used.
// Usage: node scripts/line-report.mjs [vi|en|ja]
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { lineReport, formatReport } = await import(pathToFileURL(resolve(here, "../app/src/lib/linereport.ts")).href);
const lang = process.argv[2] ?? "vi";
console.log(formatReport(lineReport(), lang));
console.log("\nThe uses per week are guesses (USES_PER_WEEK in app/src/lib/linereport.ts); replace them with what you observe.");
