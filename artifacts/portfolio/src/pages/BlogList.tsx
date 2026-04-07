import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListBlogPosts, useGetBlogTags } from "@workspace/api-client-react";
import type { BlogPost } from "@workspace/api-client-react";

export default function BlogList() {
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListBlogPosts({ page, limit: 9, tag: selectedTag });
  const { data: tagsData } = useGetBlogTags();

  const posts: BlogPost[] = data?.posts ?? [];
  const totalPages = data?.totalPages ?? 1;
  const tags: string[] = tagsData?.tags ?? [];

  return (
    <div style={{ background: "hsl(var(--background))", minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="pt-32 pb-16 border-b"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/">
            <span
              className="text-xs uppercase tracking-widest font-body cursor-pointer transition-colors duration-200 flex items-center gap-2 mb-8 w-fit"
              style={{ color: "hsl(var(--muted-foreground))" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--foreground))")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Portfolio
            </span>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="section-line" />
            <span className="text-xs uppercase tracking-widest font-body" style={{ color: "hsl(var(--primary))" }}>
              Writing
            </span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            All Posts
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Tag filters */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => { setSelectedTag(undefined); setPage(1); }}
              className="tag-pill cursor-pointer transition-all duration-200"
              style={!selectedTag ? {
                background: "hsl(var(--primary) / 0.15)",
                borderColor: "hsl(var(--primary))",
                color: "hsl(var(--primary))",
              } : {}}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => { setSelectedTag(tag === selectedTag ? undefined : tag); setPage(1); }}
                className="tag-pill cursor-pointer transition-all duration-200"
                style={selectedTag === tag ? {
                  background: "hsl(var(--primary) / 0.15)",
                  borderColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary))",
                } : {}}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Posts grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded" style={{ background: "hsl(var(--card))" }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-2xl font-medium mb-2" style={{ color: "hsl(var(--foreground))" }}>No posts yet</p>
            <p className="font-body text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Check back soon — writing is in progress.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
              >
                <Link href={`/blog/${post.slug}`}>
                  <div
                    className="p-6 border h-full flex flex-col cursor-pointer transition-all duration-300 hover-lift"
                    style={{
                      borderColor: "hsl(var(--border))",
                      background: "hsl(var(--card))",
                      borderRadius: "2px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
                  >
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag-pill">{tag}</span>
                      ))}
                    </div>
                    <h2 className="font-display text-lg font-semibold leading-snug mb-3 flex-1" style={{ color: "hsl(var(--foreground))" }}>
                      {post.title}
                    </h2>
                    <p className="text-sm font-body leading-relaxed mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {post.excerpt.slice(0, 110)}…
                    </p>
                    <time className="text-xs font-body" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </time>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 text-sm font-body border transition-colors duration-200 disabled:opacity-40 cursor-pointer"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: "2px" }}
            >
              Previous
            </button>
            <span className="text-sm font-body" style={{ color: "hsl(var(--muted-foreground))" }}>
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 text-sm font-body border transition-colors duration-200 disabled:opacity-40 cursor-pointer"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: "2px" }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
