# Prompt for Claude Code — Soumya Raikwar portfolio

Paste everything below the line into Claude Code, in a folder that contains `soumya-portfolio-research.md` and the resume PDF. Fill the two `<< >>` fields first.

---

You are building a personal site for **Soumya Raikwar**, a software engineer working on agentic AI, LLM agent evaluation and AI observability (Go, Python, CNCF open source, LFX Mentee on Jaeger). The site is a full app, not a static page, but it must cost $0 to run: no LLM calls from the server, no paid services. Treat this as an award-level build. Work in phases and stop for my approval at the end of Phase 1 and Phase 2 before writing app code.

Decisions already made:
- Palette: **<< C Graphite Copper | A Paper Trace | B Ledger Grey | D Oxide Brass >>** from Part 5 of the research doc. Ship both light and dark; this is the primary.
- Type: **<< pairing 1–4 >>** from Part 5.
- No photo yet. Use a copper "SR" monogram as the only identity mark; leave a clearly marked slot in About for a photo later.
- Domain: soumyaraikwar.co.in, hosted on Vercel Hobby.

## Read first
- `soumya-portfolio-research.md` — content pack (Part 2), references and anti-patterns (Part 3), 3D concepts (Part 4), palette and type with hex and contrast (Part 5), stack with pinned versions and repo structure (Part 6). This is the single source of truth. Do not invent facts, PR numbers, metrics or quotes. Anything marked [NEEDS INPUT] becomes a visible `TODO:` in code and a line in the final checklist, never invented content.
- The resume PDF, for exact wording.

## Hard rules
- **No**: space/cosmos/astronaut/starfield, floating particles as decoration, glassmorphism cards, bento grid as default, purple or indigo anywhere, gradients as backgrounds, cream + serif + terracotta, single neon accent on black, typing animation, magnetic cursor, loader over 1 s, scroll-jacking, 3D desk/room, 3D skill balls, 3D Earth contact form, emoji section markers, "leverage / cutting-edge / passionate" copy.
- **Yes**: one hero object with weight, scroll-driven camera with fixed beats, projects as objects, HTML content rendered before WebGL, poster fallback, two accents max, 1px borders for depth (surface/ground ~1.1:1), mono only for identifiers and code, `tabular-nums` on numbers.
- Every animation respects `prefers-reduced-motion`. Reduced-motion and low-end users get the WebP poster and a fully usable site.
- Lighthouse mobile targets: Performance ≥ 85 on the home page (3D), ≥ 95 on blog pages; Accessibility, Best Practices, SEO ≥ 95.
- Hero budget: < 1.5 MB first visit; JS ≈ 350 kB gz loaded after the poster paints.

## Phase 1 — Design direction (no code)
1. Re-read Parts 3–5 of the research doc and write a one-page creative direction: a mood sentence, the chosen palette with tokens, the chosen type with sizes, and the five signature moments:
   - Hero: a **3D trace waterfall** built from a real trace (`content/traces/hero.json`): `InstancedMesh` of span bars, x = start, width = duration, y = depth, z = service lane, coloured by hashing the service name the way Jaeger does. Camera moves down the critical path on scroll. Clicking a span opens the project it stands for.
   - Work section: GitHub merged PRs as span-like rows with latency-style bars (PR open → merged duration).
   - About: a place, not a paragraph. Propose how.
   - Writing: LinkedIn articles republished as MDX posts with `canonical` pointing to LinkedIn, plus a cards list of posts.
   - Contact: plain. Email with copy button, GitHub, LinkedIn, resume PDF, and (if the MCP server ships) the `/api/mcp` URL with a one-line "add me to Claude" instruction.
2. Produce the trace for the hero: instrument a tiny Node script (or the MCP route once it exists) with OpenTelemetry, run one request, export the spans as JSON. If that is not possible yet, hand-write a plausible 25–40 span trace with realistic service names (gateway, agent-sidecar, read_skill, jaeger-query, clickhouse) and mark it `TODO: replace with real trace`.
3. Make a quick palette + type board as a single HTML page and screenshot it at desktop and phone width.
Stop. Wait for approval.

## Phase 2 — Architecture and wireframe
1. Scaffold plan using the stack in Part 6 exactly (Next.js ≥ 16.4.1, R3F 9.8, drei 10.7, GSAP 3.15 + ScrollTrigger, Lenis 1.3, Content Collections 0.15, @octokit/graphql 9, mcp-handler 2.3 + @modelcontextprotocol/server 2.3 (optional), gltf-transform 4.5). No AI SDK, no Anthropic key, no Redis. The MCP TypeScript SDK is v2. Pin every version.
2. Data model: `content/profile.json` schema (identity, roles, experience, PRs, projects, skills, education, certs, links, writing). One source feeds the pages and the MCP tools.
3. Page map and grey-box wireframe (ASCII or a plain HTML page): Home (hero, numbers, featured Jaeger narrative in the fixed order, CodeSight, skills, blog teasers, contact), /work (live PRs + contribution calendar), /blog, /blog/[slug], /writing (LinkedIn posts), /api/mcp (optional), /api/revalidate.
4. MCP server design (optional, must be zero cost): read-only tools `get_profile`, `list_merged_prs`, `get_skills`, `search_blog`; in-memory IP rate limit; origin check; no secrets touched. Instrument it with OpenTelemetry and show recent spans on `/trace`.
5. `.env.example` and the accounts I must create (GitHub fine-grained PAT read-only public, Vercel). Nothing else.
Stop. Wait for approval.

## Phase 3 — Build
Order: scaffold and tokens → content/profile.json and MDX blog with 1 placeholder post → static pages with real copy → GitHub data with `'use cache'` + `cacheLife('hours')` + `cacheTag('github')` → MCP route with OTel (optional) → hero 3D (poster first, canvas lazy on intersection, `frameloop="demand"` where possible, `PerformanceMonitor` tiering, pause when off-screen) → scroll choreography → light/dark → SEO (title, description, OG image generated from the palette, favicon from the monogram, sitemap, robots) → README (how to edit profile.json, add a post, add a PR manually, change a token, deploy, rotate keys).
Commit after each step with clear messages. Never put keys in `NEXT_PUBLIC_*`.

## Phase 4 — QA
Headless-browser screenshots of every page at 390, 768, 1280 and 1920 px in both themes; Lighthouse on home and one blog page; if the MCP route exists, test `/api/mcp` with the MCP Inspector and list the tools; test reduced-motion; confirm no horizontal scroll. Fix everything below target. Finish with a checklist: done, TODOs from [NEEDS INPUT], and what you need from me.

## Tone of all copy
Plain, specific, first person. Short sentences. Numbers where they exist (7 merged PRs, 0/5 → 5/5, 3 sidecars). Name the withdrawn conclusions in the evals section; they show rigor. No adjectives about myself.
