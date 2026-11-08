// Local preview of the landing page: builds site/peak/, then serves site/ on http://localhost:4173.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import "./build-site.mjs";

const site = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png" };

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.endsWith("/")) path += "index.html";
  const file = normalize(join(site, path));
  if (!file.startsWith(site)) return res.writeHead(403).end();
  let body;
  try {
    body = await readFile(file);
  } catch {
    return res.writeHead(404).end("not found");
  }
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
  res.end(body);
}).listen(4173, () => console.log("site on http://localhost:4173"));
