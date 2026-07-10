import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  motion,
  useInView,
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import HeroScene from "@/components/HeroScene";
import {
  type BlogPost,
  useGetRecentBlogPosts,
  useSendMessage,
} from "@workspace/api-client-react";

const ROLES = [
  "AI/ML Engineer",
  "Agentic AI Engineer",
  "AI Observability Engineer",
  "LFX Mentee @ CNCF",
];

const SKILLS = [
  { group: "Observability & AI Observability", items: ["Jaeger", "OpenTelemetry", "Distributed Tracing", "GenAI Semantic Conventions", "W3C Trace Context", "Trace Instrumentation"] },
  { group: "Agentic AI", items: ["MCP", "Agent Client Protocol", "Google ADK", "LangGraph", "LangChain", "Multi-Agent Orchestration", "AI Skills Frameworks", "Tool Calling"] },
  { group: "LLMs & Deep Learning", items: ["Transformers", "Tokenization", "LLM Inference", "Embeddings", "RAG", "ChromaDB", "Vector Databases", "Prompt Engineering"] },
  { group: "Languages", items: ["Python", "Go"] },
  { group: "AI Dev Tooling", items: ["Claude Code", "Codex", "Antigravity", "Git", "Docker", "Linux"] },
];

const EDUCATION = [
  { school: "Jabalpur Engineering College", degree: "B.Tech, Information Technology", meta: "Expected April 2027" },
  { school: "Chitransh K.D. Memorial H.S. School", degree: "Class XII", meta: "2023 · 79%" },
  { school: "Model H.S. School", degree: "Class X", meta: "2021 · 91%" },
];

const EXPERIENCE = {
  org: "Jaeger",
  badge: "LFX Mentee · CNCF Graduated Project",
  stack: "Go · TypeScript/React · MCP",
  year: "Jun 2026 – Present",
  mentors: "Mentors: Yuri Shkuro (Jaeger creator) & Jonah Kowall",
  context:
    "Selected for CNCF's LFX Mentorship to build the Jaeger AI Self-Service Skills Framework (issue #8440), Phase 2 of Jaeger's AI-powered trace analysis initiative, enabling AI agents to discover and use diagnostic playbooks over MCP.",
  repo: "https://github.com/jaegertracing/jaeger",
  prs: [
    {
      id: "PR #8849",
      title: "read_skill MCP Tool",
      desc: "Shipped a merged PR implementing progressive disclosure — root skills catalog → sub-skill → references on demand — so agents load diagnostic expertise incrementally instead of all at once.",
      link: "https://github.com/jaegertracing/jaeger/pull/8849",
    },
    {
      id: "PR #8942",
      title: "AI Observability Instrumentation",
      desc: "Added GenAI semantic-convention span attributes (gen_ai.operation.name, gen_ai.agent.name, gen_ai.conversation.id) and propagated W3C traceparent through the agent protocol so gateway and sidecar spans join into one distributed trace of the AI conversation.",
      link: "https://github.com/jaegertracing/jaeger/pull/8942",
    },
    {
      id: "jaeger-ui",
      title: "Tool-Call Rendering & Markdown Chat",
      desc: "Contributed 2 merged jaeger-ui PRs: expandable tool-call rendering blocks and Markdown rendering for AI agent chat responses.",
      link: "https://github.com/jaegertracing/jaeger-ui",
    },
    {
      id: "In Progress",
      title: "skills_dir Operator Extensibility",
      desc: "Currently building a filesystem overlay over built-in skills so operators can add their own diagnostic playbooks without rebuilding Jaeger.",
      link: "https://github.com/jaegertracing/jaeger/issues/8440",
    },
  ],
};

const PROJECTS = [
  {
    name: "CodeSight AI",
    tagline: "Agentic GitHub Codebase Intelligence",
    desc: "A full-stack agentic AI app for exploring unfamiliar GitHub repos in natural language: clones and ingests a public repo, chunks source with language/symbol-aware splitting, and indexes it in ChromaDB with sentence-transformer embeddings. Integrates an MCP adapter (CodeWiki) with graceful fallback, generates Mermaid architecture and sequence diagrams rendered in the UI, and ships a Dockerized FastAPI + Next.js stack with pytest coverage over ingestion, chunking, and retrieval.",
    stack: ["Python", "FastAPI", "LangGraph", "LangChain", "RAG", "MCP", "ChromaDB", "Next.js", "Docker"],
    github: "https://github.com/SoumyaRaikwar/CodeSight_AI",
    featured: true,
  },
];

const CERTIFICATIONS = [
  { name: "Intro to MCP", org: "Anthropic", date: "Mar 2026", link: "https://verify.skilljar.com/c/5okmhiui26xw" },
  { name: "MCP: Advanced Topics", org: "Anthropic", date: "Mar 2026", link: "https://verify.skilljar.com/c/iw8e9oxp4xfh" },
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
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 24,
    mass: 0.25,
  });
  const sceneY = useTransform(smoothProgress, [0, 0.3], [0, 42]);
  const contentY = useTransform(smoothProgress, [0, 0.22], [0, -70]);
  const contentOpacity = useTransform(smoothProgress, [0, 0.22], [1, 0.35]);
  const scrollHintOpacity = useTransform(smoothProgress, [0, 0.16], [1, 0]);

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
      {/* 3D Canvas — real-textured solar system backdrop */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y: sceneY }}>
        <HeroScene mouseX={mouse.x} mouseY={mouse.y} />
      </motion.div>

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
      <motion.div
        className="relative z-10 max-w-6xl mx-auto px-6 py-32 w-full"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <p className="text-xs uppercase tracking-widest font-body" style={{ color: "hsl(var(--primary))" }}>
              Bhopal, India &nbsp;·&nbsp; Available for opportunities
            </p>
            <span className="tag-pill">LFX Mentee · CNCF</span>
          </div>

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
            Final-year B.Tech IT student focused on agentic AI, RAG, and AI observability —
            making AI agents both intelligent and traceable. LFX Mentee with CNCF, building the AI
            Self-Service Skills Framework for Jaeger, with merged PRs reviewed by its original creator.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-primary px-7 py-3 text-sm font-body font-medium tracking-wide cursor-pointer"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(22 12% 6%)",
                borderRadius: "2px",
              }}
            >
              View Work
            </button>
            <button
              onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-secondary px-7 py-3 text-sm font-body font-medium tracking-wide cursor-pointer"
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

      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-12 right-8 flex flex-col items-center gap-2"
        style={{ opacity: scrollHintOpacity }}
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

const STATS = [
  { value: "4", label: "Merged PRs to Jaeger", sub: "core + jaeger-ui" },
  { value: "2026", label: "LFX Mentee", sub: "CNCF · Term 2" },
  { value: "2", label: "Mentors", sub: "Yuri Shkuro & Jonah Kowall" },
  { value: "2", label: "Anthropic Certifications", sub: "MCP · Intro & Advanced" },
];

function StatsStrip() {
  return (
    <section className="border-t border-b" style={{ borderColor: "hsl(var(--border))" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {STATS.map((s, i) => (
            <FadeInSection key={s.label} delay={i * 0.06}>
              <div
                className="py-8 px-6 border-r last:border-r-0"
                style={{ borderColor: "hsl(var(--border) / 0.6)" }}
              >
                <p className="font-mono text-3xl md:text-4xl font-semibold mb-1" style={{ color: "hsl(var(--primary))" }}>
                  {s.value}
                </p>
                <p className="text-sm font-body" style={{ color: "hsl(var(--foreground))" }}>{s.label}</p>
                <p className="text-xs font-body mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{s.sub}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
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
              I'm a final-year B.Tech IT student at Jabalpur Engineering College, graduating
              April 2027, focused on agentic AI, retrieval-augmented generation, and AI
              observability — making AI agents both intelligent and traceable.
            </p>
            <p className="font-body leading-loose" style={{ color: "hsl(var(--muted-foreground))" }}>
              I'm an LFX Mentee with the Cloud Native Computing Foundation, building the AI
              Self-Service Skills Framework for Jaeger under the mentorship of Yuri Shkuro
              (Jaeger's creator) and Jonah Kowall. I've shipped merged PRs to Jaeger's core and
              its UI, reviewed by the project's original creator.
            </p>
            <p className="font-body leading-loose" style={{ color: "hsl(var(--muted-foreground))" }}>
              Outside of Jaeger, I build agentic AI tools — applications where LLMs don't just
              generate text but reason over context, call tools, and produce structured outputs.
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
                <a
                  key={c.name}
                  href={c.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between py-2 border-b transition-all duration-200 hover:pl-1"
                  style={{ borderColor: "hsl(var(--border) / 0.4)" }}
                >
                  <div>
                    <p className="text-sm font-body font-medium" style={{ color: "hsl(var(--foreground))" }}>{c.name}</p>
                    <p className="text-xs font-body mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{c.org}</p>
                  </div>
                  {c.date && <span className="text-xs font-body" style={{ color: "hsl(var(--muted-foreground))" }}>{c.date}</span>}
                </a>
              ))}
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

function EducationSection() {
  return (
    <section id="education" className="py-28" style={{ background: "hsl(var(--card))" }}>
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection>
          <SectionHeader label="Education" title="Academic Background" />
        </FadeInSection>

        <div className="grid md:grid-cols-3 gap-6">
          {EDUCATION.map((e, i) => (
            <FadeInSection key={e.school} delay={i * 0.08}>
              <div
                className="panel-hover p-6 border h-full"
                style={{
                  borderColor: "hsl(var(--border))",
                  background: "hsl(var(--background))",
                  borderRadius: "2px",
                }}
              >
                <p className="text-xs uppercase tracking-widest font-body mb-3" style={{ color: "hsl(var(--primary))" }}>
                  {e.meta}
                </p>
                <h3 className="font-display text-xl font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>
                  {e.degree}
                </h3>
                <p className="text-sm font-body" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {e.school}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienceSection() {
  const org = EXPERIENCE;
  return (
    <section id="experience" className="py-28 max-w-6xl mx-auto px-6">
      <FadeInSection>
        <SectionHeader label="Experience" title="Open Source Contributions" />
      </FadeInSection>

      <FadeInSection delay={0.1}>
        <div className="grid md:grid-cols-[240px_1fr] gap-8">
          {/* Org info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--primary))" }} />
              <a
                href={org.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-2xl font-semibold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {org.org}
              </a>
            </div>
            <div className="text-xs uppercase tracking-widest font-body mb-1" style={{ color: "hsl(var(--primary))" }}>
              {org.badge}
            </div>
            <div className="text-xs font-body mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{org.stack}</div>
            <div className="text-xs font-body mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>{org.year}</div>
            <p className="text-xs font-body italic leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
              {org.mentors}
            </p>
          </div>

          {/* PRs */}
          <div className="space-y-5">
            <p className="text-sm font-body leading-relaxed mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              {org.context}
            </p>
            {org.prs.map((pr) => (
              <a
                key={pr.id}
                href={pr.link}
                target="_blank"
                rel="noopener noreferrer"
                className="panel-hover block p-5 border group"
                style={{
                  background: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "2px",
                }}
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
    </section>
  );
}

function ProjectsSection() {
  return (
    <section id="projects" className="py-28" style={{ background: "hsl(var(--card))" }}>
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection>
          <SectionHeader label="Projects" title="Things I've Built" />
        </FadeInSection>

        {PROJECTS.map((p, i) => (
          <FadeInSection key={p.name} delay={i * 0.1}>
            <div
              className="panel-hover p-8 md:p-12 border mb-6 group"
              style={{
                borderColor: "hsl(var(--border))",
                borderRadius: "2px",
                background: "hsl(var(--background))",
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
      </div>
    </section>
  );
}

function BlogSection() {
  const { data: posts, isLoading } = useGetRecentBlogPosts();
  type BlogPreview = Pick<BlogPost, "title" | "excerpt" | "tags" | "publishedAt"> & {
    slug?: string;
  };

  const placeholders: BlogPreview[] = [
    { title: "Building the Jaeger AI Self-Service Skills Framework", excerpt: "Progressive disclosure over MCP: how the read_skill tool lets agents load diagnostic expertise incrementally.", tags: ["MCP", "Jaeger", "CNCF"], publishedAt: "2026-06-20" },
    { title: "Tracing AI Agent Conversations as Distributed Traces", excerpt: "Instrumenting GenAI semantic conventions and W3C traceparent propagation across the agent protocol stack.", tags: ["OpenTelemetry", "AI Observability"], publishedAt: "2026-05-10" },
    { title: "MCP in Practice: Building Agentic Tools", excerpt: "A practical guide to the Model Context Protocol and building MCP servers that integrate with Claude.", tags: ["AI", "MCP", "Python"], publishedAt: "2026-03-25" },
  ];

  const displayPosts: BlogPreview[] =
    Array.isArray(posts) ? posts : placeholders;

  return (
    <section id="blog" className="py-28 max-w-6xl mx-auto px-6">
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
          {displayPosts.slice(0, 3).map((post, i) => (
            <FadeInSection key={post.slug ?? i} delay={i * 0.08}>
              <Link href={post.slug ? `/blog/${post.slug}` : "/blog"}>
                <div
                  className="panel-hover p-6 border h-full flex flex-col cursor-pointer"
                  style={{
                    borderColor: "hsl(var(--border))",
                    background: "hsl(var(--card))",
                    borderRadius: "2px",
                  }}
                >
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {post.tags?.slice(0, 2).map((tag) => (
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
    <section id="contact" className="py-28" style={{ background: "hsl(var(--card))" }}>
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16">
        <FadeInSection>
          <SectionHeader label="Contact" title="Let's work together" />
          <p className="font-body leading-loose mb-8" style={{ color: "hsl(var(--muted-foreground))" }}>
            I'm currently open to AI/ML engineering internships, full-time roles, and interesting
            open-source collaborations. If you're building agentic systems, RAG pipelines, or
            observability tooling, I'd love to hear about it.
          </p>
          <div className="space-y-4">
            {[
              { label: "Email", value: "somuraik@gmail.com", href: "mailto:somuraik@gmail.com" },
              { label: "Phone", value: "+91 93034 02547", href: "tel:+919303402547" },
              { label: "GitHub", value: "github.com/SoumyaRaikwar", href: "https://github.com/SoumyaRaikwar" },
              { label: "LinkedIn", value: "linkedin.com/in/soumya-raikwar", href: "https://www.linkedin.com/in/soumya-raikwar" },
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
            { label: "LinkedIn", href: "https://www.linkedin.com/in/soumya-raikwar" },
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
      <EducationSection />
      <ExperienceSection />
      <ProjectsSection />
      <BlogSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
