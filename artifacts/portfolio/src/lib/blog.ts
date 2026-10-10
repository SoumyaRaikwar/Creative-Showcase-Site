import type { Seo } from "./seo";
export interface Post {
  slug: string;
  title: string;
  subtitle?: string;
  date: string;
  excerpt: string;
  tags: string[];
  cover?: string;
  canonical?: string;
  linkedinTitle?: string;
  body: string;
  readingMinutes: number;
}

const files = import.meta.glob("@/content/blog/*.md", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

function parseValue(v: string): string | string[] {
  const t = v.trim();
  if (t.startsWith("[") && t.endsWith("]")) {
    return t
      .slice(1, -1)
      .split(",")
      .map((x) => x.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return t.replace(/^["']|["']$/g, "");
}

function parseFrontmatter(src: string): { meta: Record<string, string | string[]>; body: string } {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: src };
  const meta: Record<string, string | string[]> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = parseValue(line.slice(idx + 1));
  }
  return { meta, body: src.slice(m[0].length) };
}

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export const posts: Post[] = Object.entries(files)
  .map(([path, src]) => {
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    const { meta, body } = parseFrontmatter(src);
    const words = body.split(/\s+/).filter(Boolean).length;
    return {
      slug,
      title: str(meta.title) ?? slug,
      subtitle: str(meta.subtitle),
      date: str(meta.date) ?? "1970-01-01",
      excerpt: str(meta.excerpt) ?? "",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      cover: str(meta.cover),
      canonical: str(meta.canonical),
      linkedinTitle: str(meta.linkedinTitle),
      body,
      readingMinutes: Math.max(1, Math.round(words / 220)),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export const allTags: string[] = Array.from(new Set(posts.flatMap((p) => p.tags))).sort();

export function postSeo(slug: string): Seo {
  const post = getPost(slug);
  return {
    title: post ? `${post.title} · Soumya Raikwar` : "Not found · Soumya Raikwar",
    description: post?.excerpt ?? "",
    path: `/blog/${slug}`,
    image: post?.cover,
    canonical: post?.canonical,
  };
}
