// IndexNow (ADR-0124): after a deploy, the site tells the search engines that take part (Bing, Yandex and others; not Google) which addresses to read again.
// What is sent is public: the host, the addresses of the pages (the sitemap's list) and a key that is public by design (the same text is served at
// https://streakboom.com/<key>.txt, which is how the engines know the site's owner sent it). No visitor data, no secret. The switch and the key are
// scripts/site/catalog/indexnow.json. A failure of the ping never fails a deploy: it is a warning.
//   node scripts/site/indexnow.mjs        verifies that the key file is live, then sends the list (the Pages workflow runs it after the live check)
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ORIGIN } from "./facts.mjs";
import { pageList } from "./files.mjs";

const FILE = () => process.env.STREAKBOOM_INDEXNOW_FILE || join(dirname(fileURLToPath(import.meta.url)), "catalog", "indexnow.json");
export const loadIndexNow = () => JSON.parse(readFileSync(FILE(), "utf8"));
export const ENDPOINT = "https://api.indexnow.org/IndexNow";

/** True when the build serves the key file and the workflow pings. */
export const indexNowOn = (cfg) => Boolean(cfg?.enabled);
/** The key is 8 to 128 letters, digits and dashes by the protocol; this site uses 32 lower-case hexadecimal characters. */
export const KEY_RE = /^[a-f0-9]{32}$/;
/** What the build refuses about the switch. */
export function indexNowProblems(cfg) {
  if (!cfg || typeof cfg !== "object") return ["indexnow.json: it must be an object"];
  const problems = [];
  if (typeof cfg.enabled !== "boolean") problems.push("indexnow.json: enabled must be true or false");
  if (typeof cfg.key !== "string" || !KEY_RE.test(cfg.key)) problems.push("indexnow.json: the key must be 32 lower-case hexadecimal characters");
  return problems;
}
/** The addresses of every page of the sitemap. */
export const urlsOf = (origin = ORIGIN) => pageList().map((p) => origin + p.path);
/** The body of the request, as the protocol defines it. */
export const payloadOf = (cfg, urls, origin = ORIGIN) => ({ host: new URL(origin).host, key: cfg.key, keyLocation: `${origin}/${cfg.key}.txt`, urlList: urls });

/** Sends the list. Never throws: the result says what happened. `fetchFn` is injected for the tests. */
export async function submit({ cfg = loadIndexNow(), fetchFn = fetch, origin = ORIGIN, urls = urlsOf(origin) } = {}) {
  if (!indexNowOn(cfg)) return { sent: false, reason: "switched off in indexnow.json" };
  const bad = indexNowProblems(cfg);
  if (bad.length) return { sent: false, reason: bad.join("; ") };
  try {
    const keyUrl = `${origin}/${cfg.key}.txt`;
    const live = await fetchFn(keyUrl, { headers: { "Cache-Control": "no-cache" } });
    const text = live.ok ? (await live.text()).trim() : "";
    if (text !== cfg.key) return { sent: false, reason: `the key file is not live at ${keyUrl} (answered ${live.status}); the engines would refuse the list` };
    const res = await fetchFn(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(payloadOf(cfg, urls, origin)) });
    // 200 and 202 are accepted; 400, 403, 422 and 429 are the protocol's refusals
    return res.status === 200 || res.status === 202 ? { sent: true, status: res.status, urls: urls.length } : { sent: false, status: res.status, reason: `IndexNow answered ${res.status}` };
  } catch (e) {
    return { sent: false, reason: String(e && e.message ? e.message : e) };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = await submit();
  if (r.sent) console.log(`IndexNow: ${r.urls} addresses sent (answered ${r.status})`);
  else console.log(`::warning::IndexNow: nothing sent: ${r.reason}`);
}
