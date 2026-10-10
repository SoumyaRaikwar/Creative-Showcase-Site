// Prerender every route to static HTML after the client and SSR builds.
// Output: dist/public/index.html, dist/public/<route>/index.html
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const publicDir = path.join(dist, "public");
let template = readFileSync(path.join(publicDir, "index.html"), "utf8");

// Inline the (small) stylesheet so the first paint needs no extra request.
template = template.replace(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/, (_m, href) => {
  const css = readFileSync(path.join(publicDir, href), "utf8");
  return `<style>${css}</style>`;
});
const { render, routes, seoFor } = await import(path.join(dist, "server/entry-server.js"));

const SITE = "https://soumyaraikwar.co.in";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function setHead(html, seo) {
  const url = `${SITE}${seo.path === "/" ? "/" : seo.path}`;
  const image = seo.image ? (seo.image.startsWith("http") ? seo.image : `${SITE}${seo.image}`) : `${SITE}/og.png`;
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(seo.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(seo.description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(seo.canonical ?? url)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(seo.title)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(seo.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(seo.description)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(seo.description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(url)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(image)}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${esc(image)}$2`);
}

for (const route of routes) {
  // React.lazy pages (and the lazy Markdown renderer inside them) resolve after
  // a pass has started loading them; render until two passes agree.
  let html = "";
  let stable = 0;
  for (let i = 0; i < 8 && stable < 2; i++) {
    const out = render(route);
    stable = out === html ? stable + 1 : 0;
    html = out;
    await new Promise((r) => setTimeout(r, 150));
  }
  if (/aria-busy="true"|animate-pulse/.test(html)) console.warn(`warning: ${route} still shows a loading state`);
  const page = setHead(template, seoFor(route)).replace('<div id="root"></div>', `<div id="root" data-route="${esc(route)}">${html}</div>`);
  const file = route === "/" ? "index.html" : path.join(route.replace(/^\//, ""), "index.html");
  mkdirSync(path.dirname(path.join(publicDir, file)), { recursive: true });
  writeFileSync(path.join(publicDir, file), page);
  console.log(`prerendered ${route} → ${file} (${(page.length / 1024).toFixed(1)} kB)`);
}
