import { useEffect } from "react";

export const SITE = "https://soumyaraikwar.co.in";

export interface Seo {
  title: string;
  description: string;
  path: string;
  image?: string;
  canonical?: string;
}

export const ROUTE_SEO: Record<string, Seo> = {
  "/": {
    title: "Soumya Raikwar — I build, evaluate and trace AI agents",
    description:
      "Software engineer working on agentic AI, LLM agent evaluation and AI observability. LFX Mentee at the CNCF on Jaeger: MCP skills framework, ACP gateway, self-tracing agents. Go, Python, open source.",
    path: "/",
  },
  "/work": {
    title: "Work — pull requests in Jaeger, OpenTelemetry and more · Soumya Raikwar",
    description: "Every pull request I have opened in Jaeger, OpenTelemetry and other open-source projects, with how long each took to merge.",
    path: "/work",
  },
  "/writing": {
    title: "Writing · Soumya Raikwar",
    description: "LinkedIn articles and blog posts on agentic AI, MCP, evals and observability.",
    path: "/writing",
  },
  "/blog": {
    title: "Blog · Soumya Raikwar",
    description: "Notes on agent evaluation, MCP tool design, and tracing AI agents with Jaeger and OpenTelemetry.",
    path: "/blog",
  },
};

function setMeta(selector: string, attr: "content" | "href", value: string) {
  const el = document.head.querySelector<HTMLElement>(selector);
  if (el) el.setAttribute(attr, value);
}

export function useSeo(opts: Seo) {
  useEffect(() => {
    document.title = opts.title;
    setMeta('meta[name="description"]', "content", opts.description);
    setMeta('meta[property="og:title"]', "content", opts.title);
    setMeta('meta[name="twitter:title"]', "content", opts.title);
    setMeta('meta[property="og:description"]', "content", opts.description);
    setMeta('meta[name="twitter:description"]', "content", opts.description);
    setMeta('meta[property="og:url"]', "content", `${SITE}${opts.path}`);
    setMeta('link[rel="canonical"]', "href", opts.canonical ?? `${SITE}${opts.path}`);
    if (opts.image) {
      const img = opts.image.startsWith("http") ? opts.image : `${SITE}${opts.image}`;
      setMeta('meta[property="og:image"]', "content", img);
      setMeta('meta[name="twitter:image"]', "content", img);
    }
  }, [opts.title, opts.description, opts.path, opts.image, opts.canonical]);
}
