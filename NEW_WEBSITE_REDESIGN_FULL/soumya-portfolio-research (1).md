# Soumya Raikwar — Portfolio Research & Content Pack

Research date: 10 Oct 2026. Package versions were checked against npm the same day.
Items marked **[NEEDS INPUT]** are for you to answer before the build.

---

## Part 1 — What the site is

Not a static page. Four things in one:

1. **A 3D, scroll-driven site** whose visuals come from your domain (traces, spans, agent-to-tool calls), not from a space theme.
2. **Live data**: merged PRs from jaegertracing/jaeger and jaeger-ui, contribution calendar, pulled from GitHub on a cache.
3. **A blog** written in Markdown in the repo (evals, MCP, observability notes).
4. **A public MCP server** (optional, zero cost: it only serves JSON, no model runs on your side) so anyone can point their own Claude or Cursor at `soumyaraikwar.co.in/api/mcp` and ask about you.

No AI chat on the site: it would cost API money. The MCP server gives the same effect for free because the visitor's own agent pays for the model.

---

## Part 2 — Content pack (from your resume, verified against your notes)

### Identity
- **Name:** Soumya Raikwar
- **Title:** Software Engineer · Agentic AI, LLM Agent Evaluation and AI Observability
- **Role tags:** Go · Python · CNCF Open Source · MCP
- **Location:** Bhopal, Madhya Pradesh, India
- **Email:** somuraik@gmail.com
- **Phone:** +91 9303402547 *(confirm you want it public; recommend email-only)*
- **GitHub:** github.com/SoumyaRaikwar
- **LinkedIn:** linkedin.com/in/soumya-raikwar-5660772a3
- **Domain:** soumyaraikwar.co.in (owned)
- **Photo:** none yet. Placeholder now; see Part 7.

### Hero copy options
1. I build, evaluate and trace AI agents.
2. I make AI agents observable. Then I measure whether they actually work.
3. LFX Mentee at CNCF. Built Jaeger's MCP skills framework. Found out why agents skip the tools you give them.

### Headline numbers (all true, all defensible)
- **20 merged PRs** to Jaeger (jaeger + jaeger-ui; exact split to be confirmed from GitHub in Phase 0). The resume names the 7 headline ones.
- **0/5 → 5/5** skill discovery across two agent harnesses after rewriting tool descriptions
- **3 agent sidecars** run on one framework: Gemini (Google ADK), Claude, Goose
- **1** CNCF LFX Mentorship, positive end-of-term evaluation

### About (two paragraphs)
Final-year IT student at Jabalpur Engineering College and an LFX Mentee at the CNCF, working on Jaeger under Yuri Shkuro (Jaeger's creator) and Jonah Kowall. I built the Jaeger AI Self-Service Skills Framework: an MCP tool that lets any AI agent load expert trace-diagnosis playbooks on demand, and the plumbing that makes Jaeger trace its own agents.

I got into observability by troubleshooting a slow service while learning DevOps, and stayed because the question "why did this agent do that?" turns out to be the same question as "why is this request slow?". Outside code: swimming and writing poems.

### Featured work — the Jaeger build narrative (keep this order)
1. **`read_skill` MCP tool** — PR #8849, Go. 3-level progressive disclosure (catalog → sub-skill → references). Handler depends only on `fs.FS`, secured with `fs.ValidPath` and `os.OpenRoot`. Pure MCP, so zero sidecar changes.
2. **Agent-agnostic gateway over ACP** — PR #9296 fixed WebSocket message framing so any ACP agent connects; PR #9395 added authenticated agents via `configopaque.MapList` headers. Ran Gemini, Claude and Goose sidecars.
3. **Self-tracing** — PR #8942. OpenTelemetry GenAI span attributes + W3C `traceparent` across ACP; gateway and sidecar spans join into one trace per chat turn.
4. **Agent evaluation** — issue #9336. Agents skipped skills because they judged direct telemetry tools sufficient: a reasoning problem, not a discovery problem. Ruled out 3 routing fixes (0/5, 0/10), then 0/5 → 5/5 on both harnesses by putting disconfirming signals in the telemetry tool descriptions. Includes two withdrawn conclusions (36 runs misattributed after silent agent switching; a lazy-tool-loading false negative). Show these; they prove rigor.
5. **Trace fixtures + skill hardening** — PR #9263.
6. **Agent chat UI** — 2 jaeger-ui PRs: expandable tool-call blocks, Markdown rendering.

### Project — CodeSight AI
Agentic RAG over any public GitHub repo. LangGraph agent clones and ingests, language- and symbol-aware chunking, ChromaDB + sentence-transformer retrieval, MCP adapter tool with graceful fallback, generates Mermaid architecture and sequence diagrams, FastAPI backend, Docker Compose, pytest suites. github.com/SoumyaRaikwar/CodeSight_AI

### Skills (grouped)
- **Languages:** Go, Python
- **Agentic AI:** MCP, ACP, LangGraph, LangChain, CrewAI, Google ADK, multi-agent orchestration, tool design, skills frameworks, agent sidecars
- **Evals:** harness design, multi-agent/multi-model comparison, negative controls, graded rubrics, fixtures, tool-description and prompt optimisation, failure analysis
- **LLMs/RAG:** RAG, embeddings, ChromaDB, semantic search, prompt engineering
- **Observability:** Jaeger, OpenTelemetry, GenAI semantic conventions, distributed tracing, W3C Trace Context
- **Backend/tools:** FastAPI, REST, WebSocket, ClickHouse, Docker, Kubernetes, Git, Linux, pytest

### Education & certifications
- B.Tech IT, Jabalpur Engineering College, expected Apr 2027
- Introduction to MCP — Anthropic, Mar 2026 (verify.skilljar.com/c/5okmhiui26xw)
- MCP Advanced Topics — Anthropic **[NEEDS INPUT: date + verify link; it's in your notes but not on this resume]**

### Writing (LinkedIn)
| # | Title | Link | Use on site |
|---|---|---|---|
| 1 | My LFX Mentorship on Jaeger — cover: "Teaching AI to Read the Manual: Building an AI Skills framework for Jaeger — CNCF LFX Mentorship" (2026) | https://lnkd.in/p/dDR-srUT | Republish as first blog post with canonical → LinkedIn **[NEEDS INPUT: paste the article text]** |
| 2+ | **[NEEDS INPUT]** other posts | | |

Note on the article cover: cream ground, heavy grotesk headline, short green rule, mono eyebrow labels, `● span → skill →` footer. This is an existing visual voice; decide whether blog headers keep it while the site uses palette E.

### Photo
LinkedIn profile picture exists. **[NEEDS INPUT]** send the original file; it replaces the monogram placeholder in About.

### Mentors to name
Yuri Shkuro (Jaeger creator) and Jonah Kowall. Name them as mentors; do not quote the CNCF evaluation.

### Open questions
- **[NEEDS INPUT]** Blog launch posts (2–3). Suggested: "Why agents skip your tools", "Making Jaeger trace its own agent", "What progressive disclosure means for MCP tools". The LinkedIn article is post #1.
- No "Now / Term 3" section: not confirmed.
- CGPA: not on the site. It stays on the resume PDF.

---

## Part 3 — Reference portfolios (what the best engineers actually do)

| Site | Who | What the hero does | Borrow | Avoid |
|---|---|---|---|---|
| [bruno-simon.com](https://bruno-simon.com) | Bruno Simon | Drive a car through a Blender world; 2025 rebuild on Three.js + TSL, auto-WebGPU, MIT source ([case study](https://www.awwwards.com/brunos-portfolio-case-study.html), [repo](https://github.com/brunosimon/folio-2025)) | One verb, perf-first ("10 FPS loses visitors"), sound as feedback | The car. Most-imitated portfolio on the web |
| [henryheffernan.com](https://henryheffernan.com) | Henry Heffernan (Vercel) | 90s desk, CRT runs a working fake OS ([HN](https://hn.algolia.com/api/v1/items/31313187)) | A second usable surface, not decoration | HN asked for "a way to view without the fanfare"; no Firefox |
| [weisdevice.xyz](https://weisdevice.xyz) | Wei | Robot on an island; baked lighting, 0.76 MB model, raycasting throttled to 30fps ([Codrops](https://tympanus.net/codrops/?p=101800)) | Byte budgets, pause render loop off-screen | — |
| [itomdev.com](https://itomdev.com) | Tomasz Szmajda | Infinite corridor of doors; React 19, R3F 9, GSAP; explicitly rejects "dark neon portfolio layout" ([Codrops](https://tympanus.net/codrops/?p=115219)) | Build mechanics with simple shapes first; `compileAsync` during preload | Dropped KTX2 after colour shifts: test compression early |
| [roilagunzad.com](https://roilagunzad.com) | Roi Lagunzad | Shuttle shown in true colour only inside a stencil box; scroll-tied camera ([forum](https://discourse.threejs.org/t/after-five-years-a-new-react-three-fiber-portfolio-build/90146)) | Shader restraint = "designed piece, not tech demo" | — |
| [maximeheckel.com](https://maximeheckel.com) | Maxime Heckel (ex-Docker) | Editorial; shaders are the content (refraction, raymarched clouds, WebGPU) | Interactive essays beat decorative heroes | — |
| [ashwingupta.dev](https://ashwingupta.dev) | Ashwin Gupta (AI eng) | Scroll-driven Gantt timeline with a comet ([Awwwards](https://www.awwwards.com/sites/an-ai-portfolio-in-the-cosmos)) | Gantt-as-timeline maps directly to a trace waterfall | Cosmos theme is the most saturated template genre |
| [enjalot.github.io](https://enjalot.github.io/) | Ian Johnson (agentic platform lead) | No hero; the portfolio is the data vis | For AI/observability engineers, real data beats a floating scene | — |
| [toukoum.fr](https://toukoum.fr) | Raphaël Giraud | A chat box as the whole site; GitHub-backed answers ([repo](https://github.com/Toukoum/portfolio)) | Audience-routing prompts (recruiter / dev / friend) | No static fallback for people who won't type |
| [ciechanow.ski](https://ciechanow.ski/archives/) | Bartosz Ciechanowski | Slider-driven 3D explainers | 3D only where the third dimension carries information | — |
| [thegitcity.com](https://thegitcity.com) | — | GitHub profile → pixel city; contributions = height, repos = width, stars = brightness; Next 16 + R3F ([README](https://cdn.jsdelivr.net/gh/srizzon/git-city@main/README.md)) | Proven, readable encoding of GitHub data in 3D | — |
| [redoyanulhaque.me](https://redoyanulhaque.me) | Redoyanul Haque | Three.js + GSAP + AI chat ([repo](https://github.com/red1-for-hek/portfolio-website)) | Chat + 3D can coexist | — |

### Patterns the winners share
- Hero = **one object with weight** or **one verb**, never a particle field ([utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026)).
- **Scroll-driven camera with fixed beats** (enter, hold, exit), not free roam.
- **Projects as physical objects**; "About" as a place, not a paragraph.
- **Performance as a visible craft signal**: baked lighting, instancing, loop pausing, `PerformanceMonitor` tiering.
- **Contact stays plain.** Nobody good gimmicks the contact section.
- **HTML first, WebGL after**: the résumé renders before the canvas does.

### What is dated or template-tier in 2026 (do not do)
- The JavaScript Mastery look: 3D desktop PC hero, 3D skill balls, star background, 3D Earth contact form, navy `#050816` + violet `#804dee` ([7.1k-star repo](https://github.com/adrianhajdin/project_3D_developer_portfolio)). The `3d-portfolio` GitHub topic is 145 repos of this.
- Space / cosmos / astronaut / starfield / particles.
- Glassmorphism cards and bento grids as default; magnetic cursor; typing animation; loader over 1 s; scroll-jacking ([RemoteWorks](https://remoteworks.pro/blog/portfolio-design-trends-2026)).
- 3D room / desk clones; Spline embed as the whole hero.
- Unskippable intros; render loops that never stop; no WebGL fallback.
- Buzzword copy. A repo in your exact niche is literally titled "Premium 3D Developer Portfolio — MCP Integration Developer" ([link](https://github.com/Rohit-Jigar/3d-portfolio)). Recruiters penalise "leverage cutting-edge technologies".
- AI chat with no static fallback; free-roam world with no résumé shortcut.

---

## Part 4 — Five ways 3D can mean something on your site

1. **3D trace waterfall as the hero.** Spans as bars: x = time, y = depth, z = service. Scroll moves the camera down the critical path. Click a span → the project it represents. Build it from a **real trace of your own site** (instrument it with OTel), so the hero is live telemetry. Precedent: Ashwin Gupta's Gantt comet; Jaeger's own trace graph.
2. **Agent → tool call graph.** Replay an MCP session as a force graph with particles flowing along edges ([3d-force-graph](https://github.com/vasturiano/3d-force-graph), MIT). Precedents: Langfuse agent graph, Netflix Vizceral.
3. **Software city of your OSS work.** Repos you touched = districts, merged PRs = lit buildings ([ExplorViz paper](https://arxiv.org/abs/2411.12380), Git City encoding).
4. **Traced MCP server.** Every `/api/mcp` call is instrumented with OpenTelemetry; a `/trace` page shows the last N spans so visitors see the server trace itself. No LLM cost.
5. **Interactive explainers**: context propagation, sampling, span links, the MCP request lifecycle, slider-driven like Ciechanowski.

**Recommendation:** #1 as hero, #2 built from a real ACP session recording, #4 if the MCP server ships. Skip #3 for v1.

Guardrails from the winners: bake lighting, no runtime shadows; `InstancedMesh` for spans; pause the loop off-screen; `compileAsync` on preload; `PerformanceMonitor` tiering; HTML résumé before WebGL; one or two accents, no gradients.

---

## Part 5 — Colour and type (researched, not AI-default)

### What "AI slop" means in 2026, so we can avoid all three waves
- **Wave 1:** indigo→purple gradient, Inter + nothing else, centred hero + three rounded cards, aurora glows, glassmorphism, fake dashboard mockups ([925 Studios](https://www.925studios.co/blog/ai-slop-design-tells), [Mania Design](https://www.mania.design/blog/spot-the-slop-a-ui-designers-guide-to-fixing-ai-defaults/)).
- **Wave 2 (the "anti-slop" that became slop):** cream `#F4F1EA` + serif + terracotta; near-black + one acid-green or vermilion; broadsheet hairlines ([named with hex codes](https://dev.to/kenimo49/anthropic-rewrote-frontend-design-skill-3-ai-design-cliches-named-with-hex-codes-22m4)).
- **Wave 3:** trendy-font fatigue: Space Grotesk, Satoshi, Instrument Sans, General Sans, Geist, Playfair ([NewWebsite.ai](https://www.newwebsite.ai/blog/10-signs-a-website-was-designed-by-ai)).

What the admired dev brands do instead: tinted neutrals, off-white text (Linear `#f7f8f8`, Grafana `#ccccdc`), one or two **low-saturation instrument colours**, surface and ground only ~1.1:1 apart with 1px borders for depth ([Linear](https://open-design.ai/systems/linear-app/), [Vercel design.md](https://vercel.com/design.md), [Grafana palette](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/themes/createColors.ts)). Jaeger itself colours spans by hashing the service name: colour = identity, never decoration.

### Four palettes, all WCAG AA checked

**Recommended: C. Graphite Copper (dark)** — copper is the wire carrying telemetry, steel-cyan is the signal. Two accents avoid the "one neon on black" cliché. 3D materials: brushed copper and anodised aluminium, rim light in cyan only, no emissive neon.

| token | hex | contrast on ground |
|---|---|---|
| ground | `#15181D` | |
| surface | `#1F232A` | |
| text | `#E4E6EA` | 14.2 |
| muted | `#9AA2AD` | 6.9 |
| accent (copper) | `#DD9A5B` | 7.5 |
| secondary (steel cyan) | `#78B4C6` | 7.8 |

**A. Paper Trace (light)** — Jaeger's default UI is light. Teal spans, amber for latency, paper-grey grid. 3D: matte ceramic, soft AO, no bloom.
`ground #F3F4F0 · surface #FFFFFF · text #16211F · muted #5A6764 · accent #0B6E6A · secondary #A9481A`

**B. Ledger Grey (light-mid)** — a mid-grey ground is the most under-used move against white-page AI output. Brick for errors, steel-blue for healthy telemetry. Glass refractions look good on it.
`ground #DFE4E6 · surface #EEF1F2 · text #1A2127 · muted #505A62 · accent #A82E1C · secondary #2A6683`

**D. Oxide Brass (dark, warm)** — agents as instruments: brass dials, verdigris patina. Warm dark without cream or terracotta.
`ground #191513 · surface #24201D · text #EDE7DF · muted #A3998F · accent #E2BD6A · secondary #7DB3A7`

**E. Deep Vintage (dark, user's pick, from the Prometheus Fuels site)** — teal ground, cream text, vermilion used once, sage and brown as quiet tones.
`ground #244855 · surface #2D5566 · text #FBE9D0 (8.3) · muted #B7C9C8 (5.7) · accent #E64833 (fills, display text, critical-path span; 2.5:1 so never body text) · secondary #90AEAD (labels, large text, 4.2) · material #874F41 (3D leather/rust, dividers)`
Light theme: `ground #FBE9D0 · text #1B2F38 · muted #874F41 · secondary #244855 · accent #B5331B`. Vermilion buttons need a large/bold cream label (3.3:1). Keep serifs out so it doesn't drift toward the cream-and-terracotta cliché.

Rule for all: text on accent buttons uses the *ground* colour (dark text on these accents fails AA). Depth via 1px borders, not shadows. Sanity-check dark pairs with [APCA](https://git.apcacontrast.com/) (Lc ≥ 75).

**[NEEDS INPUT]** Pick one: C (recommended), A, B or D. The site ships with light + dark either way; this picks the primary.

### Four type pairings (none from the AI-tell lists)
1. **Bricolage Grotesque** (display) + **Schibsted Grotesk** (body) + **Commit Mono** (code). Bricolage has weight, width and optical-size axes, built by a software engineer ([repo](https://github.com/ateliertriay/bricolage)). *Recommended.*
2. **IBM Plex Sans Condensed** + **IBM Plex Sans** + **IBM Plex Mono**. One superfamily, engineering heritage.
3. **Martian Mono** (display and code; has a width axis, rare for mono, [Evil Martians](https://evilmartians.com/products/martian-mono)) + **Hanken Grotesk** body. Trace IDs and headings share a voice.
4. **Switzer** (Fontshare, free commercial) + **Server Mono** ([Blaze Type](https://blazetype.eu/case-studies/server-mono/), OFL).

Mono rules: only for identifiers, trace IDs, timestamps, code. `tabular-nums` on latency columns. Body weight one step lighter on dark. Never pure `#000` or pure `#FFF`.

---

## Part 6 — Stack (versions checked 10 Oct 2026)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16.4** App Router, TypeScript, Tailwind 4 | One React tree for DOM + canvas scroll choreography; `'use cache'` for GitHub data; every AI SDK / MCP example is a Next route handler. Start on ≥16.4.1 (security release due 14 Oct). |
| 3D | **three 0.186 + @react-three/fiber 9.8 + drei 10.7 + @react-three/postprocessing 3.1** (WebGL) | Stable, React 19.3-ready. R3F 10 / WebGPU is the 2027 upgrade. Bruno Simon already ships WebGPU, but forum reports say it can be slower for simple scenes; don't chase it for v1. |
| Motion | **GSAP 3.15 + ScrollTrigger** (free since 3.13) + **Lenis 1.3** (`lenis/react`); Motion 14 for UI only | ScrollTrigger is the scrubbed-scroll standard; Lenis honours reduced-motion by default |
| Blog | **MDX in `content/blog`** typed with **Content Collections 0.15** (the Contentlayer successor); optional **Keystatic** admin at `/keystatic` | Git-based, no service. Contentlayer is abandoned. |
| GitHub data | **@octokit/graphql 9** for contribution calendar + REST `/search/issues?q=is:pr+is:merged+author:SoumyaRaikwar+repo:jaegertracing/jaeger+repo:jaegertracing/jaeger-ui` for merged PRs; `'use cache'` + `cacheLife('hours')`; `react-activity-calendar` (SSR-capable) | 5,000 req/hr PAT budget vs ~48/day actual |
| LinkedIn | **Not via API.** Self-serve API gives name/photo/email only; scraping violates ToS. Keep `content/profile.json` as the single source of truth and link out. | |
| AI chat | **Removed** (no API budget) | The MCP server below gives visitors the same Q&A through their own agent at no cost to you |
| MCP server (optional) | **mcp-handler 2.3 + @modelcontextprotocol/server 2.3** at `/api/mcp` (Streamable HTTP, stateless, read-only); simple IP rate limit in memory or Vercel Firewall, no Redis | Zero cost. Tools: `get_profile`, `list_merged_prs`, `get_skills`, `search_blog`, `evaluate_job_fit`. Precedents: [dev-zaid/portfolio](https://github.com/dev-zaid/portfolio/pull/1), [portfolio-mcp](https://github.com/jubi-g/portfolio-mcp). MCP TS SDK is now v2. |
| Tracing | **OpenTelemetry JS** on the MCP route; render recent spans inline on a `/trace` page (no external Jaeger needed) | Optional |
| Hosting | **Vercel Hobby** + your domain (Cloudflare DNS optional) | Free tier fits; Next 16 + R3F + AI SDK can exceed Cloudflare Workers' 3 MiB free limit |
| Assets | `.glb` via **gltf-transform 4.5** (`--compress meshopt --texture-compress webp`), gltfjsx codegen, WebP poster fallback | Meshopt decoder ~8 kB gz vs Draco ~100 kB |

**Cost:** Vercel $0, GitHub API $0, no LLM. **Total: $0/month.** Domain already owned.

**Hero weight target:** JS ≈ 320–370 kB gz loaded after the poster paints; GLB 300–800 kB; **< 1.5 MB first visit, ~250 kB for reduced-motion/mobile users who get the poster only.**

### Repo structure
```
portfolio/
├─ app/
│  ├─ layout.tsx                 # fonts, Lenis provider, theme
│  ├─ page.tsx                   # hero (dynamic import, ssr:false) + sections
│  ├─ blog/[slug]/page.tsx
│  ├─ work/page.tsx              # cached GitHub PRs + calendar
│  └─ api/
│     ├─ mcp/route.ts            # createMcpHandler(...)
│     └─ revalidate/route.ts     # revalidateTag('github')
├─ components/three/             # TraceWaterfall.tsx, Effects.tsx, Poster.tsx
├─ components/motion/            # ScrollSection.tsx, Reveal.tsx
├─ components/github/            # ContributionCalendar.tsx, MergedPRs.tsx
├─ lib/                          # github.ts, profile.ts, mcp-tools.ts, otel.ts
├─ content/
│  ├─ profile.json               # single source of truth (you edit this)
│  ├─ resume.md
│  ├─ traces/hero.json           # the real trace the hero renders
│  └─ blog/*.mdx
├─ public/models/, public/hdr/
├─ scripts/optimize-models.sh
└─ .env.example                  # GITHUB_TOKEN, REVALIDATE_SECRET
```

---

## Part 7 — Your face, without a photo

You asked whether I can "code your face". Options, best first:

1. **Placeholder now (your choice).** The hero doesn't need a face: the 3D trace waterfall carries identity, and the name does the rest. A small monogram "SR" in copper on the nav. When you have a photo, it slots into About.
2. **Point-cloud portrait, later.** From one good photo: run a depth estimator (Depth Anything v2, free), turn it into a particle field in Three.js that forms your face on scroll and dissolves into spans. Pure code, ~200 lines, no 3D modelling. This is the one that fits the site best.
3. **Stylised 3D head, later.** One selfie → [Meshy](https://www.meshy.ai/pricing) (free, CC BY) or [TRELLIS.2 on Hugging Face](https://huggingface.co/microsoft/TRELLIS.2-4B) (MIT) → GLB → `gltf-transform optimize`. Quality on faces is uneven; test before committing.
4. **Avoid:** cartoon avatar generators (Ready Player Me style). Reads as a game profile, not an engineer.

Recommend 1 now, 2 when you have a photo.

### 3D asset sourcing (for props, lighting, anything that isn't data)
- Procedural in Three.js for anything that **is** data (traces, spans, graphs). Free, tiny, uses real data.
- [Poly Haven](https://polyhaven.com/license) HDRIs (CC0) for lighting; [Kenney](https://kenney.nl/support) / [Quaternius](https://quaternius.com/) (CC0) for props.
- Meshy free (CC BY, ~5 models/month) or TRELLIS.2 / Stable Fast 3D on HF Spaces for one-off objects. Tripo free is non-commercial. Luma Genie is gone.
- Spline only if you want a no-code hero; free tier watermarks exports.
- Always run AI outputs through `gltf-transform optimize`; they ship at 500K–10M faces.

---

## Part 8 — Asset and decision checklist

| Item | Status |
|---|---|
| Resume PDF | ✅ have |
| Content pack | ✅ this doc |
| Photo | ❌ later; placeholder now |
| Palette choice (A/B/C/D) | ⏳ **[NEEDS INPUT]** |
| Type pairing (1–4) | ⏳ **[NEEDS INPUT]**, recommend 1 |
| Blog launch posts (2–3) | ⏳ **[NEEDS INPUT]** |
| GitHub fine-grained PAT (read public) | ❌ create before build |
| Vercel account + domain DNS | ❌ |
| MCP Advanced Topics cert link | ⏳ **[NEEDS INPUT]** |
| LinkedIn article/post links | ⏳ **[NEEDS INPUT]** |
| ACP work links (beyond PRs #9296, #9395) | ⏳ **[NEEDS INPUT]** |
