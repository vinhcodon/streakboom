// Local preview of the website: builds it (scripts/build-site.mjs, same as the deploy) and serves _site/ on http://localhost:4173.
// Pages are rebuilt on every page request, so an edit to site/ or the strings shows up on reload; a failed check is shown as text.
// Also serves the asset generator at /__gen (scripts/gen-assets.html), which draws the share image and icons with the real rig and
// POSTs the PNGs back to /__save/<name>, so they land in the repository.
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { OUT, build } from "./build-site.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const site = join(root, "site");
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
};

// the only files the generator may write
const SAVE = {
  "og-image.jpg": join(site, "assets", "og-image.jpg"),
  "peak-logo.png": join(site, "assets", "peak-logo.png"),
  "favicon-16.png": join(site, "assets", "favicon-16.png"),
  "favicon-32.png": join(site, "assets", "favicon-32.png"),
  "apple-touch-icon.png": join(site, "assets", "apple-touch-icon.png"),
  "peak-icon-1024.png": join(root, "assets", "peak-icon-1024.png"), // source for the app icon
};
const PAGES = { "/__gen": "gen-assets.html" };

let buildError = null;
const rebuild = () => {
  try {
    build();
    buildError = null;
  } catch (e) {
    buildError = e.message;
    console.error(e.message);
  }
};
rebuild();

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

  const isPage = path.endsWith("/") || path.endsWith(".html") || path.endsWith(".txt") || path.endsWith(".xml");
  if (isPage && !PAGES[path]) {
    rebuild();
    if (buildError) return res.writeHead(500, { "content-type": "text/plain; charset=utf-8" }).end(buildError);
  }

  let file;
  if (PAGES[path]) file = join(here, PAGES[path]);
  else {
    if (path.endsWith("/")) path += "index.html";
    file = normalize(join(OUT, path));
    if (!file.startsWith(OUT)) return res.writeHead(403).end();
  }
  let body;
  try {
    body = await readFile(file);
  } catch {
    // like GitHub Pages: the 404 page for anything that does not exist
    try {
      body = await readFile(join(OUT, "404.html"));
      return res.writeHead(404, { "content-type": types[".html"] }).end(body);
    } catch {
      return res.writeHead(404).end("not found");
    }
  }
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
  res.end(body);
}).listen(4173, () => console.log("site on http://localhost:4173"));
