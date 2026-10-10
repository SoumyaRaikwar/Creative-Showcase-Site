// Static preview that behaves like Vercel: serves dist/public with directory
// indexes, proxies /api to the API server, falls back to index.html for
// unknown client routes. Usage: node tools/serve.mjs [port] [apiOrigin]
import http from "node:http";
import { createGzip } from "node:zlib";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../artifacts/portfolio/dist/public");
const port = Number(process.argv[2] ?? 3000);
const api = new URL(process.argv[3] ?? "http://localhost:8080");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".pdf": "application/pdf", ".xml": "application/xml", ".txt": "text/plain" };

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    if (url.pathname.startsWith("/api/")) {
      const proxy = http.request({ host: api.hostname, port: api.port, path: req.url, method: req.method, headers: { ...req.headers, host: api.host } }, (r) => {
        res.writeHead(r.statusCode ?? 502, r.headers);
        r.pipe(res);
      });
      proxy.on("error", () => { res.writeHead(502); res.end("api unavailable"); });
      req.pipe(proxy);
      return;
    }
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!existsSync(file)) file = path.join(root, "index.html");
    const ext = path.extname(file);
    const immutable = url.pathname.startsWith("/assets/") || url.pathname.startsWith("/fonts/");
    const type = types[ext] ?? "application/octet-stream";
    const gzip = /^(text\/|application\/(javascript|json|xml))/.test(type) && /gzip/.test(req.headers["accept-encoding"] ?? "");
    res.writeHead(200, {
      "content-type": type,
      "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
      ...(gzip ? { "content-encoding": "gzip", vary: "accept-encoding" } : {}),
    });
    const stream = createReadStream(file);
    if (gzip) stream.pipe(createGzip()).pipe(res);
    else stream.pipe(res);
  })
  .listen(port, () => console.log(`preview on http://localhost:${port} → api ${api.origin}`));
