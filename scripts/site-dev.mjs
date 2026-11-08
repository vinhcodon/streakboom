// Local preview of the landing page: builds site/peak/, then serves site/ on http://localhost:4173.
// Also serves the asset generator at /__gen (scripts/gen-assets.html), which draws the share image and
// icons with the real rig and POSTs the PNGs back to /__save/<name>, so they land in the repo.
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import "./build-site.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const site = join(root, "site");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };

// the only files the generator may write
const SAVE = {
  "og-image.jpg": join(site, "assets", "og-image.jpg"),
  "favicon-16.png": join(site, "assets", "favicon-16.png"),
  "favicon-32.png": join(site, "assets", "favicon-32.png"),
  "apple-touch-icon.png": join(site, "assets", "apple-touch-icon.png"),
  "peak-icon-1024.png": join(root, "assets", "peak-icon-1024.png"), // source for the app icon
};
const PAGES = { "/__gen": "gen-assets.html" };

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  let path = decodeURIComponent(url.pathname);

  if (req.method === "POST" && path.startsWith("/__save/")) {
    const target = SAVE[path.slice(8)];
    if (!target) return res.writeHead(400).end("unknown name");
    const chunks = [];
    for await (const c of req) chunks.push(c);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.concat(chunks));
    return res.writeHead(200).end("saved");
  }

  let file;
  if (PAGES[path]) file = join(here, PAGES[path]);
  else {
    if (path.endsWith("/")) path += "index.html";
    file = normalize(join(site, path));
    if (!file.startsWith(site)) return res.writeHead(403).end();
  }
  let body;
  try {
    body = await readFile(file);
  } catch {
    return res.writeHead(404).end("not found");
  }
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
  res.end(body);
}).listen(4173, () => console.log("site on http://localhost:4173"));
