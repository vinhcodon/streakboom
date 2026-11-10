// The line factory (LN-4, ADR-0043). YOU run this, never the app. It asks Gemini (with the key you stored in Settings, read
// from the Windows Credential Manager at this moment; the key is never printed, saved or put in a file) for candidate lines
// for one trigger, throws away the ones the character must never say, and writes the survivors to a review file. Nothing
// reaches the app until you pick lines and have them added to app/src/lib/lines.ts.
//
// Usage (from the repository root, in your own terminal):
//   node scripts/line-factory.mjs <trigger> [--lang vi|en|ja] [--n 30] [--tier 2] [--band lonely] [--model <name>] [--dry]
// Examples:
//   node scripts/line-factory.mjs click --lang vi --n 30
//   node scripts/line-factory.mjs idle --lang vi --band bored --n 20 --dry     (prints the request, calls nothing)
//
// What is sent to Google: the character notes, the situation, and the lines already in the repository for that trigger.
// Nothing about you or your screen. The free tier of Gemini may be used by Google to improve its products; these lines are
// already public in the repository.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const lib = (f) => import(pathToFileURL(resolve(root, "app/src/lib", f)).href);
const { buildPrompt, parseCandidates, filterCandidates, toSnippet, existingLines } = await lib("linefactory.ts");
const { LINES } = await lib("lines.ts");

const args = process.argv.slice(2);
const trigger = args[0];
const opt = (name, dflt) => {
  const i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : dflt;
};
if (!trigger || trigger.startsWith("--")) {
  console.error("Usage: node scripts/line-factory.mjs <trigger> [--lang vi|en|ja] [--n 30] [--tier 2] [--band lonely] [--model name] [--dry]");
  process.exit(2);
}
const lang = opt("lang", "vi");
const count = Number(opt("n", "30"));
const tier = opt("tier") ? Number(opt("tier")) : undefined;
const band = opt("band");
const model = opt("model", "gemini-flash-lite-latest");
const dry = args.includes("--dry");

const voice = readFileSync(resolve(root, "app/src-tauri/persona/voice.md"), "utf8");
const existing = existingLines(LINES, lang, trigger);
const prompt = buildPrompt({ lang, trigger, count, existing, tier, band, voice });

if (dry) {
  console.log(prompt);
  console.log(`\n(dry run: ${existing.length} existing lines for ${lang}/${trigger}; nothing was sent)`);
  process.exit(0);
}

/** Read the Gemini key from the Windows Credential Manager (service streakboom, user gemini-api-key). Never printed. */
function readKey() {
  const ps = `
$sig = @'
using System; using System.Runtime.InteropServices;
public class Cred {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] public struct CREDENTIAL { public int Flags; public int Type; public string TargetName; public string Comment; public long LastWritten; public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist; public int AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName; }
  [DllImport("advapi32.dll", CharSet=CharSet.Unicode, SetLastError=true)] public static extern bool CredRead(string target, int type, int flags, out IntPtr cred);
  [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr cred);
  public static string Read(string target) { IntPtr p; if (!CredRead(target, 1, 0, out p)) return null; var c = (CREDENTIAL)Marshal.PtrToStructure(p, typeof(CREDENTIAL)); string s = Marshal.PtrToStringUni(c.CredentialBlob, c.CredentialBlobSize / 2); CredFree(p); return s; }
}
'@
Add-Type -TypeDefinition $sig
foreach ($t in @('gemini-api-key.streakboom','streakboom/gemini-api-key','gemini-api-key')) { $v = [Cred]::Read($t); if ($v) { [Console]::Out.Write($v); exit 0 } }
exit 3`;
  try {
    return execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

const key = readKey();
if (!key) {
  console.error("No Gemini key found in the Windows Credential Manager. Connect Gemini in Settings, Brain first (the key stays out of this script and the chat).");
  process.exit(3);
}

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-goog-api-key": key },
  body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 1.0, maxOutputTokens: 2048 } }),
});
if (!res.ok) {
  console.error(`Gemini answered ${res.status}. ${(await res.text()).slice(0, 300).replace(key, "[key]")}`);
  process.exit(4);
}
const body = await res.json();
const answer = (body?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("\n");
const verdicts = filterCandidates(parseCandidates(answer), lang, existing);
const kept = verdicts.filter((v) => v.ok).map((v) => v.line);
const dropped = verdicts.filter((v) => !v.ok);

const stamp = new Date().toISOString().slice(0, 10);
const outDir = resolve(root, "scripts/line-factory/out");
mkdirSync(outDir, { recursive: true });
const file = resolve(outDir, `${stamp}-${lang}-${trigger}${band ? "-" + band : ""}${tier ? "-t" + tier : ""}.txt`);
const opts = [tier ? `tiers: [${tier}]` : "", band ? `bands: ["${band}"]` : ""].filter(Boolean).join(", ");
writeFileSync(
  file,
  [
    `# Candidates for ${lang}/${trigger}${band ? " band " + band : ""}${tier ? " tier " + tier : ""} (${stamp}, ${model}).`,
    `# Delete the lines you do not want, edit the ones you do, then ask Claude to add what is left to lines.ts.`,
    `# These were written by a model: ${lang === "vi" ? "read them as the author" : "NOT read by a native speaker yet (note it in verification-debt.md)"}.`,
    "",
    ...kept,
    "",
    "# Paste-ready after editing (the batch name must be new):",
    "# " + toSnippet(lang, trigger, kept, "f" + stamp.replace(/-/g, ""), opts ? `{ ${opts} }` : "{}"),
    "",
    `# Thrown away (${dropped.length}):`,
    ...dropped.map((d) => `#  ${d.line}   <- ${d.reason}`),
    "",
  ].join("\n"),
  "utf8"
);
console.log(`${kept.length} candidates kept, ${dropped.length} thrown away. Review file:\n${file}`);
