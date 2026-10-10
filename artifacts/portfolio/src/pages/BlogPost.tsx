import { lazy, Suspense } from "react";
import { Link } from "wouter";
import { getPost, postSeo } from "@/lib/blog";
import { formatDate } from "@/lib/format";
import { useSeo } from "@/lib/seo";
import NotFound from "./NotFound";

const Markdown = lazy(() => import("@/components/Markdown"));

export default function BlogPost({ slug }: { slug: string }) {
  const post = getPost(slug);
  useSeo(postSeo(slug));
  if (!post) return <NotFound />;

  return (
    <article className="pt-16">
      <header className="border-b border-line">
        <div className="wrap max-w-[820px] py-16 md:py-20">
          <Link href="/blog" className="font-mono text-[12px] text-muted">← blog</Link>
          <p className="eyebrow mt-8">{formatDate(post.date)} · {post.readingMinutes} min read</p>
          <h1 className="mt-4 text-[2.2rem] md:text-[3rem]">{post.title}</h1>
          {post.subtitle && <p className="mt-3 text-[18px] text-muted">{post.subtitle}</p>}
          <ul className="mt-5 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <li key={t} className="tag">{t}</li>
            ))}
          </ul>
          {post.canonical && (
            <p className="mt-6 font-mono text-[12px] text-muted">
              first published on{" "}
              <a href={post.canonical} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                LinkedIn{post.linkedinTitle ? ` as “${post.linkedinTitle}”` : ""} ↗
              </a>
            </p>
          )}
        </div>
      </header>
      {post.cover && (
        <div className="wrap max-w-[820px] pt-10">
          <img src={post.cover} alt="" width={1040} height={586} fetchPriority="high" decoding="async" className="border border-line" />
        </div>
      )}
      <div className="wrap max-w-[820px] py-10 md:py-14">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-[3px] bg-surface" />}>
          <Markdown source={post.body} />
        </Suspense>
      </div>
    </article>
  );
}
