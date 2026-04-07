import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useInView, AnimatePresence } from "framer-motion";
import HeroScene from "@/components/HeroScene";
import {
  useGetRecentBlogPosts,
  useSendMessage,
} from "@workspace/api-client-react";

const ROLES = ["Golang Backend Engineer", "ML Practitioner", "Agentic AI Builder", "Open Source Contributor"];

const SKILLS = [
  { group: "Languages", items: ["Go", "Python"] },
  { group: "AI / Agentic", items: ["LangChain", "LangGraph", "RAG", "MCP", "ChromaDB", "Agentic RAG"] },
  { group: "ML / Data", items: ["scikit-learn", "Pandas", "NumPy", "Sentence Transformers"] },
  { group: "Backend / DevOps", items: ["FastAPI", "Gin", "Docker", "Kubernetes", "Kubeflow", "AWS"] },
  { group: "Observability", items: ["OpenTelemetry", "Jaeger", "Prometheus", "Elasticsearch"] },
];

const EXPERIENCE = [
  {
    org: "Jaeger",
    badge: "CNCF Graduated",
    stack: "Go · React/TypeScript",
    year: "2026",
    prs: [
      {
        id: "PR #7611",
        title: "AWS SigV4 IAM Authentication",
        desc: "Implemented AWS SigV4 IAM authentication for Elasticsearch/OpenSearch storage by integrating AWS SDK v2 request signing and role-based credential handling into Jaeger's storage layer.",
        link: "https://github.com/jaegertracing/jaeger/pull/7611",
      },
      {
        id: "PR #7628",
        title: "Custom HTTP Header Support",
        desc: "Added custom HTTP header support for Elasticsearch/OpenSearch storage so teams can use bearer tokens, API keys, or proxy-based authentication in enterprise deployments.",
        link: "https://github.com/jaegertracing/jaeger/pull/7628",
      },
    ],
  },
  {
    org: "OpenTelemetry",
    badge: "CNCF Graduated",
    stack: "Go",
    year: "2026",
    prs: [
      {
        id: "PR #46096",
        title: "Prometheus Remote Write Exporter Fix",
        desc: "Added a disable_scope_info option to the Prometheus Remote Write exporter and fixed scope-label translation for more accurate production metrics.",
        link: "https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/46096",
      },
      {
        id: "PR #14713",
        title: "Metadata Schema Resolution Fix",
        desc: "Fixed metadata schema resolution in mdatagen so custom extensions are preserved during code generation instead of being silently dropped.",
        link: "https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/14713",
      },
    ],
  },
];

const PROJECTS = [
  {
    name: "CodeSight AI",
    tagline: "Agentic GitHub Codebase Intelligence",
    desc: "An AI assistant for GitHub repositories that helps users understand unfamiliar codebases faster — answers questions, surfaces relevant code, and generates diagrams from natural language.",
    stack: ["Python", "FastAPI", "LangGraph", "RAG", "MCP", "ChromaDB", "Next.js", "Docker"],
    github: "https://github.com/SoumyaRaikwar",
    featured: true,
  },
];

const CERTIFICATIONS = [
  { name: "Intro to MCP", org: "Anthropic", date: "Mar 2026" },
  { name: "MCP: Advanced Topics", org: "Anthropic", date: "Mar 2026" },
  { name: "Machine Learning A-Z: AI, Python & R", org: "Udemy", date: "" },
];

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="section-line" />
        <span className="text-xs uppercase tracking-widest font-body" style={{ color: "hsl(var(--primary))" }}>
          {label}
        </span>
      </div>
      <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight" style={{ color: "hsl(var(--foreground))" }}>
        {title}
      </h2>
    </div>
  );
}

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay }}
    >
      {children}
    </motion.div>
  );
}

function HeroSection() {
  const [roleIdx, setRoleIdx] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => setRoleIdx((i) => (i + 1) % ROLES.length), 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "hsl(var(--background))" }}>
      {/* 3D Canvas — full background */}
      <div className="absolute inset-0 pointer-events-none">
        <HeroScene mouseX={mouse.x} mouseY={mouse.y} />
      </div>

      {/* Gradient vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 80% at 70% 50%, transparent 30%, hsl(22 12% 6% / 0.7) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to right, hsl(22 12% 6%) 0%, hsl(22 12% 6% / 0.4) 55%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="text-xs uppercase tracking-widest mb-6 font-body" style={{ color: "hsl(var(--primary))" }}>
            Bhopal, India &nbsp;·&nbsp; Available for opportunities
          </p>

          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-semibold leading-none mb-6" style={{ color: "hsl(var(--foreground))" }}>
            Soumya<br />
            <span className="text-gradient-amber">Raikwar</span>
          </h1>

          {/* Animated role */}
          <div className="h-8 mb-10 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={roleIdx}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-xl md:text-2xl font-body font-light"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {ROLES[roleIdx]}
              </motion.p>
            </AnimatePresence>
          </div>

          <p className="max-w-xl text-base font-body leading-relaxed mb-10" style={{ color: "hsl(30 10% 55%)" }}>
            B.Tech IT student (2027) building Go and Python systems across backend engineering,
            machine learning, and agentic AI — with active contributions to CNCF graduated projects.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })}
              className="px-7 py-3 text-sm font-body font-medium tracking-wide transition-all duration-300 cursor-pointer"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(22 12% 6%)",
                borderRadius: "2px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              View Work
            </button>
            <button
              onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
              className="px-7 py-3 text-sm font-body font-medium tracking-wide transition-all duration-300 cursor-pointer"
              style={{
                background: "transparent",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "hsl(var(--primary))";
                e.currentTarget.style.color = "hsl(var(--primary))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "hsl(var(--border))";
                e.currentTarget.style.color = "hsl(var(--foreground))";
              }}
            >
              Get in Touch
            </button>
          </div>
        </motion.div>

      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-12 right-8 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <span className="text-xs uppercase tracking-widest font-body" style={{ color: "hsl(var(--muted-foreground))", writingMode: "vertical-rl" }}>
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          className="w-px h-8"
          style={{ background: "hsl(var(--primary))" }}
        />
      </motion.div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="py-28 max-w-6xl mx-auto px-6">
      <FadeInSection>
        <SectionHeader label="About" title="Who I Am" />
      </FadeInSection>

      <div className="grid md:grid-cols-2 gap-16 items-start">
        <FadeInSection delay={0.1}>
          <div className="space-y-5">
            <p className="text-lg font-body leading-loose" style={{ color: "hsl(var(--foreground))" }}>
              I'm a B.Tech IT student at Jabalpur Engineering College, graduating in 2027. I build
              distributed systems in Go and Python, design ML pipelines, and architect agentic AI
              workflows that reason, retrieve, and act.
            </p>
            <p className="font-body leading-loose" style={{ color: "hsl(var(--muted-foreground))" }}>
              My open-source work spans two CNCF graduated projects — Jaeger and OpenTelemetry —
              where I've shipped production-grade changes that teams at scale depend on. I'm
              comfortable reading and contributing to complex infrastructure codebases.
            </p>
            <p className="font-body leading-loose" style={{ color: "hsl(var(--muted-foreground))" }}>
              Outside of systems work, I build agentic AI tools — applications where LLMs don't
              just generate text but reason over context, call tools, and produce structured outputs.
              CodeSight AI is my flagship project in this space.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={0.2}>
          <div className="space-y-6">
            {SKILLS.map((group) => (
              <div key={group.group}>
                <p className="text-xs uppercase tracking-widest font-body mb-3" style={{ color: "hsl(var(--primary))" }}>
                  {group.group}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((skill) => (
                    <span key={skill} className="tag-pill">{skill}</span>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
              <p className="text-xs uppercase tracking-widest font-body mb-3" style={{ color: "hsl(var(--primary))" }}>
                Certifications
              </p>
              {CERTIFICATIONS.map((c) => (
                <div key={c.name} className="flex items-start justify-between py-2 border-b" style={{ borderColor: "hsl(var(--border) / 0.4)" }}>
                  <div>
                    <p className="text-sm font-body font-medium" style={{ color: "hsl(var(--foreground))" }}>{c.name}</p>
                    <p className="text-xs font-body mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{c.org}</p>
                  </div>
                  {c.date && <span className="text-xs font-body" style={{ color: "hsl(var(--muted-foreground))" }}>{c.date}</span>}
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

function ExperienceSection() {
  return (
    <section id="experience" className="py-28" style={{ background: "hsl(var(--card))" }}>
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection>
          <SectionHeader label="Experience" title="Open Source Contributions" />
        </FadeInSection>

        <div className="space-y-16">
          {EXPERIENCE.map((org, oi) => (
            <FadeInSection key={org.org} delay={oi * 0.1}>
              <div className="grid md:grid-cols-[240px_1fr] gap-8">
                {/* Org info */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--primary))" }} />
                    <h3 className="font-display text-2xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                      {org.org}
                    </h3>
                  </div>
                  <div className="text-xs uppercase tracking-widest font-body mb-1" style={{ color: "hsl(var(--primary))" }}>
                    {org.badge}
                  </div>
                  <div className="text-xs font-body mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{org.stack}</div>
                  <div className="text-xs font-body" style={{ color: "hsl(var(--muted-foreground))" }}>{org.year}</div>
                </div>

                {/* PRs */}
                <div className="space-y-5">
                  {org.prs.map((pr) => (
                    <a
                      key={pr.id}
                      href={pr.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-5 border transition-all duration-300 group"
                      style={{
                        background: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "2px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary))")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <span className="font-display text-lg font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          {pr.title}
                        </span>
                        <span className="text-xs font-body font-medium shrink-0" style={{ color: "hsl(var(--primary))" }}>
                          {pr.id}
                        </span>
                      </div>
                      <p className="text-sm font-body leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {pr.desc}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section id="projects" className="py-28 max-w-6xl mx-auto px-6">
      <FadeInSection>
        <SectionHeader label="Projects" title="Things I've Built" />
      </FadeInSection>

      {PROJECTS.map((p, i) => (
        <FadeInSection key={p.name} delay={i * 0.1}>
          <div
            className="p-8 md:p-12 border transition-all duration-300 mb-6 group"
            style={{
              borderColor: "hsl(var(--border))",
              borderRadius: "2px",
              background: "hsl(var(--card))",
            }}
          >
            <div className="flex items-start justify-between gap-6 mb-4">
              <div>
                {p.featured && (
                  <span className="text-xs uppercase tracking-widest font-body" style={{ color: "hsl(var(--primary))" }}>
                    Featured Project
                  </span>
                )}
                <h3 className="font-display text-3xl md:text-4xl font-semibold mt-1" style={{ color: "hsl(var(--foreground))" }}>
                  {p.name}
                </h3>
                <p className="font-body mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{p.tagline}</p>
              </div>
              <a
                href={p.github}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-2 border transition-all duration-200"
                style={{ borderColor: "hsl(var(--border))", borderRadius: "2px" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary))")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
                aria-label="View on GitHub"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--foreground))" }}>
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
            </div>

            <p className="font-body leading-loose mb-6 max-w-2xl" style={{ color: "hsl(var(--muted-foreground))" }}>
              {p.desc}
            </p>

            <div className="flex flex-wrap gap-2">
              {p.stack.map((t) => (
                <span key={t} className="tag-pill">{t}</span>
              ))}
            </div>
          </div>
        </FadeInSection>
      ))}
    </section>
  );
}

function BlogSection() {
  const { data: posts, isLoading } = useGetRecentBlogPosts();

  const placeholders = [
    { title: "Building Agentic RAG Systems with LangGraph", excerpt: "A deep dive into constructing multi-step retrieval-augmented generation pipelines.", tags: ["AI", "LangGraph", "RAG"], publishedAt: "2026-03-15" },
    { title: "Contributing AWS SigV4 Auth to Jaeger", excerpt: "How I implemented IAM authentication for Jaeger's Elasticsearch/OpenSearch storage backend.", tags: ["Go", "CNCF", "AWS"], publishedAt: "2026-02-28" },
    { title: "MCP in Practice: Building Agentic Tools", excerpt: "A practical guide to the Model Context Protocol and building MCP servers that integrate with Claude.", tags: ["AI", "MCP", "Python"], publishedAt: "2026-03-25" },
  ];

  const displayPosts = posts ?? placeholders;

  return (
    <section id="blog" className="py-28" style={{ background: "hsl(var(--card))" }}>
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection>
          <div className="flex items-end justify-between mb-12">
            <SectionHeader label="Writing" title="Recent Posts" />
            <Link href="/blog">
              <span
                className="text-sm font-body tracking-wide pb-0.5 cursor-pointer transition-colors duration-200"
                style={{ color: "hsl(var(--primary))", borderBottom: "1px solid hsl(var(--primary) / 0.4)" }}
              >
                All posts
              </span>
            </Link>
          </div>
        </FadeInSection>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded" style={{ background: "hsl(var(--muted))" }} />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {displayPosts.slice(0, 3).map((post: any, i: number) => (
              <FadeInSection key={post.slug ?? i} delay={i * 0.08}>
                <Link href={post.slug ? `/blog/${post.slug}` : "/blog"}>
                  <div
                    className="p-6 border h-full flex flex-col cursor-pointer transition-all duration-300 hover-lift"
                    style={{
                      borderColor: "hsl(var(--border))",
                      background: "hsl(var(--background))",
                      borderRadius: "2px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
                  >
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.tags?.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="tag-pill">{tag}</span>
                      ))}
                    </div>
                    <h3 className="font-display text-lg font-semibold leading-snug mb-3 flex-1" style={{ color: "hsl(var(--foreground))" }}>
                      {post.title}
                    </h3>
                    <p className="text-sm font-body leading-relaxed mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {post.excerpt?.slice(0, 100)}…
                    </p>
                    <time className="text-xs font-body" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </time>
                  </div>
                </Link>
              </FadeInSection>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "" });
  const [sent, setSent] = useState(false);

  const mutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        setSent(true);
        setForm({ name: "", email: "", subject: "", body: "" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ data: form });
  };

  const inputStyle = {
    width: "100%",
    background: "hsl(var(--muted))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "2px",
    padding: "12px 14px",
    fontSize: "14px",
    fontFamily: "DM Sans, sans-serif",
    color: "hsl(var(--foreground))",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <section id="contact" className="py-28 max-w-6xl mx-auto px-6">
      <div className="grid md:grid-cols-2 gap-16">
        <FadeInSection>
          <SectionHeader label="Contact" title="Let's work together" />
          <p className="font-body leading-loose mb-8" style={{ color: "hsl(var(--muted-foreground))" }}>
            I'm currently open to internship opportunities, full-time roles, and interesting open-source collaborations.
            If you're building something that pushes the edges of backend infrastructure or AI systems, I'd love to hear about it.
          </p>
          <div className="space-y-4">
            {[
              { label: "Email", value: "somuraik@gmail.com", href: "mailto:somuraik@gmail.com" },
              { label: "GitHub", value: "github.com/SoumyaRaikwar", href: "https://github.com/SoumyaRaikwar" },
              { label: "LinkedIn", value: "linkedin.com/in/soumya-raikwar", href: "https://linkedin.com/in/soumya-raikwar" },
              { label: "Location", value: "Bhopal, India", href: null },
            ].map((link) => (
              <div key={link.label} className="flex items-center gap-4">
                <span className="text-xs uppercase tracking-widest font-body w-20 shrink-0" style={{ color: "hsl(var(--primary))" }}>
                  {link.label}
                </span>
                {link.href ? (
                  <a href={link.href} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-body transition-colors duration-200"
                    style={{ color: "hsl(var(--foreground))" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--primary))")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--foreground))")}
                  >
                    {link.value}
                  </a>
                ) : (
                  <span className="text-sm font-body" style={{ color: "hsl(var(--foreground))" }}>{link.value}</span>
                )}
              </div>
            ))}
          </div>
        </FadeInSection>

        <FadeInSection delay={0.1}>
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full py-12 text-center"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "hsl(var(--primary) / 0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--primary))" }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-display text-2xl font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>Message Sent</h3>
              <p className="font-body text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>I'll get back to you as soon as possible.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm font-body cursor-pointer"
                style={{ color: "hsl(var(--primary))" }}
              >
                Send another message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest font-body block mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary))")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest font-body block mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary))")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest font-body block mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Subject</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary))")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest font-body block mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Message</label>
                <textarea
                  required
                  rows={6}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary))")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
                />
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full py-3.5 text-sm font-body font-medium tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-60"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(22 12% 6%)",
                  borderRadius: "2px",
                }}
                onMouseEnter={(e) => !mutation.isPending && (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = mutation.isPending ? "0.6" : "1")}
              >
                {mutation.isPending ? "Sending..." : "Send Message"}
              </button>
              {mutation.isError && (
                <p className="text-sm font-body text-center" style={{ color: "hsl(var(--destructive))" }}>
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          )}
        </FadeInSection>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 border-t" style={{ borderColor: "hsl(var(--border))" }}>
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-display font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          SR<span style={{ color: "hsl(var(--primary))" }}>.</span>
        </span>
        <p className="text-xs font-body" style={{ color: "hsl(var(--muted-foreground))" }}>
          Soumya Raikwar &nbsp;·&nbsp; Bhopal, India &nbsp;·&nbsp; {new Date().getFullYear()}
        </p>
        <div className="flex items-center gap-5">
          {[
            { label: "GitHub", href: "https://github.com/SoumyaRaikwar" },
            { label: "LinkedIn", href: "https://linkedin.com/in/soumya-raikwar" },
            { label: "Email", href: "mailto:somuraik@gmail.com" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-body transition-colors duration-200"
              style={{ color: "hsl(var(--muted-foreground))" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--foreground))")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="grain">
      <HeroSection />
      <AboutSection />
      <ExperienceSection />
      <ProjectsSection />
      <BlogSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
