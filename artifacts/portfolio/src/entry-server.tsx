import { renderToString } from "react-dom/server";
import App from "./App";
import { posts, postSeo } from "./lib/blog";
import { ROUTE_SEO, type Seo } from "./lib/seo";

export const routes: string[] = [...Object.keys(ROUTE_SEO), ...posts.map((p) => `/blog/${p.slug}`)];

export function seoFor(path: string): Seo {
  if (ROUTE_SEO[path]) return ROUTE_SEO[path];
  const m = path.match(/^\/blog\/([^/]+)$/);
  if (m) return postSeo(m[1]);
  return ROUTE_SEO["/"];
}

export function render(path: string): string {
  return renderToString(<App ssrPath={path} />);
}
