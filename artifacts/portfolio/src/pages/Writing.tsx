import { Link } from "wouter";
import { Section, SectionHead } from "@/components/Section";
import { profile } from "@/lib/profile";
import { posts } from "@/lib/blog";
import { formatDate } from "@/lib/format";
import { useReveal } from "@/hooks/useReveal";
import { useSeo, ROUTE_SEO } from "@/lib/seo";

export default function Writing() {
  useSeo(ROUTE_SEO["/writing"]);
  useReveal();
  return (
    <div className="pt-16">
      <Section>
        <SectionHead eyebrow="Writing" title="Articles and posts." lede="Long-form pieces live on LinkedIn for now; shorter notes go on the blog here." />
        <div className="grid gap-px border border-line bg-line md:grid-cols-2">
          {profile.writing.map((w) => (
            <article key={w.url} className="reveal bg-ground p-5">
              <a href={w.url} target="_blank" rel="noreferrer" className="group block">
                <img src={w.cover} alt={`Cover: ${w.title}`} width={1040} height={586} className="border border-line" />
                <p className="eyebrow mt-5">LinkedIn · {w.year}</p>
                <h2 className="mt-3 text-[1.4rem] group-hover:text-accent">{w.title}</h2>
                <p className="mt-2 text-[15px] text-muted">{w.subtitle}</p>
              </a>
              <p className="mt-4 flex flex-wrap gap-4 font-mono text-[12px]">
                <a href={w.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">read on LinkedIn ↗</a>
                {w.slug && (
                  <Link href={`/blog/${w.slug}`} className="underline underline-offset-4">
                    summary on the blog
                  </Link>
                )}
              </p>
            </article>
          ))}
          <div className="reveal bg-ground p-5">
            <p className="eyebrow">Blog</p>
            <ul className="mt-3 divide-y divide-line">
              {posts.map((p) => (
                <li key={p.slug} className="py-3">
                  <Link href={`/blog/${p.slug}`} className="group block">
                    <h2 className="text-[1.15rem] group-hover:text-accent">{p.title}</h2>
                    <p className="mt-1 text-[14px] text-muted">{p.excerpt}</p>
                    <p className="mt-2 font-mono text-[11.5px] text-faint">
                      {formatDate(p.date)} · {p.readingMinutes} min · {p.tags.join(", ")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}
