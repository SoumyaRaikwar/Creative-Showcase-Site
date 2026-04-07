import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetBlogPost } from "@workspace/api-client-react";
import type { BlogPost as ApiBlogPost } from "@workspace/api-client-react";
import ReactMarkdown from "react-markdown";

interface Props {
  slug: string;
}

export default function BlogPost({ slug }: Props) {
  const { data: postData, isLoading, isError } = useGetBlogPost(slug, {
    query: { queryKey: ["blog", slug] },
  });
  const post: ApiBlogPost | undefined = postData;

  if (isLoading) {
    return (
      <div style={{ background: "hsl(var(--background))", minHeight: "100vh" }} className="flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "hsl(var(--border))", borderTopColor: "hsl(var(--primary))" }} />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div style={{ background: "hsl(var(--background))", minHeight: "100vh" }} className="flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Post Not Found</h1>
          <Link href="/blog">
            <span className="text-sm font-body cursor-pointer" style={{ color: "hsl(var(--primary))" }}>
              Back to all posts
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "hsl(var(--background))", minHeight: "100vh" }}>
      {/* Header */}
      <div className="pt-32 pb-16 border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/blog">
            <span
              className="text-xs uppercase tracking-widest font-body cursor-pointer transition-colors duration-200 flex items-center gap-2 mb-8 w-fit"
              style={{ color: "hsl(var(--muted-foreground))" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--foreground))")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              All Posts
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.map((tag) => (
                <span key={tag} className="tag-pill">{tag}</span>
              ))}
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-6" style={{ color: "hsl(var(--foreground))" }}>
              {post.title}
            </h1>

            <p className="font-body text-lg leading-relaxed mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
              {post.excerpt}
            </p>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-semibold" style={{ background: "hsl(var(--primary))", color: "hsl(22 12% 6%)" }}>
                S
              </div>
              <div>
                <p className="text-sm font-body font-medium" style={{ color: "hsl(var(--foreground))" }}>Soumya Raikwar</p>
                <time className="text-xs font-body" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </time>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
        >
          <div
            className="prose prose-invert max-w-none"
            style={{
              "--tw-prose-body": "hsl(var(--muted-foreground))",
              "--tw-prose-headings": "hsl(var(--foreground))",
              "--tw-prose-lead": "hsl(var(--muted-foreground))",
              "--tw-prose-links": "hsl(var(--primary))",
              "--tw-prose-bold": "hsl(var(--foreground))",
              "--tw-prose-counters": "hsl(var(--muted-foreground))",
              "--tw-prose-bullets": "hsl(var(--primary))",
              "--tw-prose-hr": "hsl(var(--border))",
              "--tw-prose-quotes": "hsl(var(--foreground))",
              "--tw-prose-quote-borders": "hsl(var(--primary))",
              "--tw-prose-captions": "hsl(var(--muted-foreground))",
              "--tw-prose-code": "hsl(var(--foreground))",
              "--tw-prose-pre-code": "hsl(var(--foreground))",
              "--tw-prose-pre-bg": "hsl(var(--card))",
              "--tw-prose-th-borders": "hsl(var(--border))",
              "--tw-prose-td-borders": "hsl(var(--border))",
              fontFamily: "DM Sans, sans-serif",
              lineHeight: "1.8",
            } as React.CSSProperties}
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ fontFamily: "Playfair Display, serif", color: "hsl(var(--foreground))" }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontFamily: "Playfair Display, serif", color: "hsl(var(--foreground))" }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontFamily: "Playfair Display, serif", color: "hsl(var(--foreground))" }}>{children}</h3>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-");
                  if (isBlock) {
                    return (
                      <code
                        style={{
                          display: "block",
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "2px",
                          padding: "16px",
                          fontSize: "13px",
                          fontFamily: "JetBrains Mono, Menlo, monospace",
                          color: "hsl(var(--foreground))",
                          overflowX: "auto",
                          whiteSpace: "pre",
                        }}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      style={{
                        background: "hsl(var(--muted))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "2px",
                        padding: "2px 6px",
                        fontSize: "13px",
                        fontFamily: "JetBrains Mono, Menlo, monospace",
                        color: "hsl(var(--primary))",
                      }}
                    >
                      {children}
                    </code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote
                    style={{
                      borderLeft: "3px solid hsl(var(--primary))",
                      paddingLeft: "16px",
                      marginLeft: "0",
                      color: "hsl(var(--foreground))",
                      fontStyle: "italic",
                    }}
                  >
                    {children}
                  </blockquote>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </motion.div>

        {/* Back link */}
        <div className="mt-16 pt-8 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <Link href="/blog">
            <span
              className="text-sm font-body cursor-pointer transition-colors duration-200 flex items-center gap-2 w-fit"
              style={{ color: "hsl(var(--muted-foreground))" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--primary))")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              More posts
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
