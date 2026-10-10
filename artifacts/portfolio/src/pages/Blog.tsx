import { useState } from "react";
import { Link } from "wouter";
import { Section, SectionHead } from "@/components/Section";
import { allTags, posts } from "@/lib/blog";
import { formatDate } from "@/lib/format";
import { useReveal } from "@/hooks/useReveal";
import { useSeo, ROUTE_SEO } from "@/lib/seo";

export default function Blog() {
  useSeo(ROUTE_SEO["/blog"]);
  const [tag, setTag] = useState<string | null>(null);
  useReveal([tag]);
  const shown = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;

  return (
    <div className="pt-16">
      <Section>
        <SectionHead eyebrow="Blog" title="Short notes, written in Markdown." lede="Posts live in this site's repository. No CMS, no database." />
        {allTags.length > 1 && (
          <div className="reveal mb-8 flex flex-wrap gap-1.5" role="group" aria-label="Filter by tag">
            <button type="button" className="btn h-8 px-3 text-[13px]" onClick={() => setTag(null)} aria-pressed={tag === null} style={tag === null ? { borderColor: "var(--accent)" } : undefined}>
              All
            </button>
            {allTags.map((t) => (
              <button key={t} type="button" className="btn h-8 px-3 text-[13px]" onClick={() => setTag(t)} aria-pressed={tag === t} style={tag === t ? { borderColor: "var(--accent)" } : undefined}>
                {t}
              </button>
            ))}
          </div>
        )}
        <ul className="divide-y divide-line border-y border-line">
          {shown.map((p) => (
            <li key={p.slug} className="reveal">
              <Link href={`/blog/${p.slug}`} className="group grid gap-2 py-6 md:grid-cols-[160px_minmax(0,1fr)] md:gap-8">
                <p className="font-mono text-[12px] text-muted tnum">
                  {formatDate(p.date)}
                  <br />
                  {p.readingMinutes} min read
                </p>
                <div>
                  <h2 className="text-[1.5rem] group-hover:text-accent">{p.title}</h2>
                  {p.subtitle && <p className="mt-1 text-[15px] text-muted">{p.subtitle}</p>}
                  <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-text">{p.excerpt}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <li key={t} className="tag">{t}</li>
                    ))}
                  </ul>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {shown.length === 0 && <p className="py-10 text-center text-muted">Nothing under that tag yet.</p>}
      </Section>
    </div>
  );
}
