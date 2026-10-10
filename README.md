# soumyaraikwar.co.in

Personal site of Soumya Raikwar. A React + three.js front end, an Express API for the contact form (Gmail SMTP or Resend) and cached GitHub data, in one pnpm workspace.

- Live: https://soumyaraikwar.co.in
- API: https://api.soumyaraikwar.co.in (also reachable as `/api/*` on the site through a Vercel rewrite)
- Runs for $0: Vercel Hobby + Render free + Neon free. No LLM calls anywhere.

## Layout

```
artifacts/portfolio          Vite + React 19 + TypeScript + Tailwind 4 (the site)
  src/content/profile.json   single source of truth for every fact on the site
  src/content/blog/*.md      blog posts (Markdown + frontmatter, built into the bundle)
  src/content/traces/hero.json  the trace the 3D hero renders
  src/content/prs-snapshot.json offline fallback for the PR list
  src/components/three/      TracePoster (SVG) and the Hero stage (text, HUD)
  src/components/world/      World (scroll → store, tooltips, buoy labels) and WorldCanvas (the three.js river scene)
  public/fonts               self-hosted Bricolage Grotesque, Schibsted Grotesk, Commit Mono
artifacts/api-server         Express 5 API: /api/contact, /api/github/prs, /api/github/contributions
lib/api-spec/openapi.yaml    API contract; `pnpm codegen` regenerates the two packages below
lib/api-zod                  zod validators (server)
lib/api-client-react         typed fetch + react-query hooks (client)
lib/db                       Drizzle schema (contact messages) — optional
tools/og                     HTML templates + script that renders og.png and the PNG icons
```

## Design

Palette C "Graphite Copper" from the research doc, dark primary with a paper light theme. Copper is the wire carrying telemetry, steel cyan is the signal. Type: Bricolage Grotesque (display), Schibsted Grotesk (body), Commit Mono (identifiers and numbers). Depth comes from 1px borders. Everything respects `prefers-reduced-motion`.

The home page is one continuous three.js world (`src/components/world/`) fixed behind the HTML. A procedural laptop sits on a riverbank; it opens as you scroll and the camera flies into its screen, which shows the trace of one Jaeger AI chat turn (`src/content/traces/hero.json`, rows coloured by hashing the service name the way Jaeger does; hover a row for its span, click to jump to the work it stands for). Past the hero a paper boat casts off and drifts downstream; the camera follows it, and every page section is a copper buoy on the river (hover for its name, click to go there). The river opens into a lake for the contact section. The same trace is rendered as an inline SVG first, so the page is readable before WebGL loads, and that SVG stays for reduced-motion, no-WebGL and data-saver visitors. WebGL loads only after the first scroll/pointer/key or 3.5 s after load, stops when the tab is hidden, and drops DPR on slow devices.

Every route is prerendered to static HTML at build time (`scripts/prerender.mjs`, after a Vite SSR build) and hydrated on the client, so text paints before any JavaScript runs.

## Editing content

| What | Where |
|---|---|
| Name, hero line, links (incl. the resume Drive link), numbers, about, narrative, skills, certs | `artifacts/portfolio/src/content/profile.json` |
| Add a blog post | add `artifacts/portfolio/src/content/blog/<slug>.md` with frontmatter (`title`, `date`, `excerpt`, `tags`, optional `cover`, `canonical`) and add the URL to `public/sitemap.xml` |
| Replace the hero trace | overwrite `src/content/traces/hero.json` (spans need `id`, `parent`, `service`, `op`, `start`, `duration`; `project` links a span to a narrative item by id; `critical: true` highlights it on the laptop screen) |
| River path, laptop look, camera framing, buoy names | `src/components/world/WorldCanvas.tsx` (constants and `RIVER` at the top), `src/lib/worldStore.ts` (`SECTION_TITLES`) |
| Refresh the offline PR snapshot | run the one-liner in "Scripts" below |
| Change a colour or font | `src/styles/tokens.css` |
| Photo | drop it in `public/` and replace the placeholder panel in `src/pages/Home.tsx` (`About`) |

## Local development

```bash
corepack enable && corepack prepare pnpm@10 --activate
pnpm install --frozen-lockfile
cp .env.example .env            # fill in what you have; everything is optional locally

# API on :8080 (contact form + GitHub proxy)
PORT=8080 pnpm dev:api

# Site on :3000 (proxies /api to :8080)
PORT=3000 BASE_PATH=/ pnpm dev

# Production preview that serves the prerendered pages like Vercel does
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/portfolio run build && node tools/serve.mjs 3000
```

Without `GMAIL_*`/`RESEND_*` the contact endpoint logs a warning and returns 500 so the form shows its mailto fallback. Without `DATABASE_URL` messages are emailed but not stored. Without `GITHUB_TOKEN` merged PRs still work (lower rate limit, cached an hour) and the contribution calendar is hidden.

## Environment variables

See `.env.example`. Summary:

| Variable | Used by | Required |
|---|---|---|
| `PORT`, `BASE_PATH` | site build | yes (`BASE_PATH=/`) |
| `PORT` | API | yes |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | contact → Gmail SMTP | one of Gmail or Resend |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | contact → Resend | one of Gmail or Resend |
| `EMAIL_PROVIDER` | `gmail` / `resend` / `auto` | no (auto) |
| `NOTIFY_EMAIL` | where messages are delivered | no (defaults to somuraik@gmail.com) |
| `DATABASE_URL` | store messages in Postgres | no |
| `GITHUB_USER`, `GITHUB_TOKEN` | GitHub proxy | token optional, needed for the calendar |
| `CORS_ORIGINS` | API | no (defaults to the site + localhost) |

Never put a key in a `VITE_*` variable; the site has no secrets.

### Gmail App Password

Google Account → Security → 2-Step Verification → App passwords → create one for "Mail". Paste the 16 characters as `GMAIL_APP_PASSWORD` (spaces are fine, they are stripped). Rotate it from the same page; the old one stops working immediately.

### GitHub token

Fine-grained personal access token, "Public repositories (read-only)", no other permissions. Set as `GITHUB_TOKEN` on Render. Rotate: create a new one, update Render, delete the old one.

## Scripts

```bash
pnpm typecheck                      # libs + api + site
pnpm build                          # typecheck, then build everything
pnpm codegen                        # regenerate zod + react-query client from openapi.yaml
tools/og/render.sh                  # re-render og.png and icons (needs Chrome)
node tools/serve.mjs 3000           # serve dist/public with directory indexes + /api proxy (Lighthouse-friendly)
DATABASE_URL=... pnpm --filter @workspace/db run push   # apply schema (messages table)

# refresh the offline PR snapshot (merged PRs in repos you don't own)
curl -s "https://api.github.com/search/issues?q=is:pr+is:merged+author:SoumyaRaikwar+-user:SoumyaRaikwar&per_page=100" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);const prs=j.items.map(i=>{const m=i.pull_request.merged_at;return{repo:i.repository_url.split("/repos/")[1],number:i.number,title:i.title.trim(),url:i.html_url,state:"merged",createdAt:i.created_at,mergedAt:m,durationHours:Math.round((new Date(m)-new Date(i.created_at))/36e4)/10}}).sort((a,b)=>b.mergedAt.localeCompare(a.mergedAt));console.log(JSON.stringify({fetchedAt:new Date().toISOString(),prs},null,2))})' \
  > artifacts/portfolio/src/content/prs-snapshot.json
```

## Deployment

- **Site**: Vercel, project root = repository root. `vercel.json` sets the install/build commands and output directory (`artifacts/portfolio/dist/public`), rewrites `/api/*` to Render, and falls back to `index.html` for client routes.
- **API**: Render web service. Build `pnpm install --frozen-lockfile && pnpm exec tsc -b lib/db lib/api-zod && pnpm --filter @workspace/api-server run build`, start `node --enable-source-maps artifacts/api-server/dist/index.mjs`. Health check `/api/healthz`.
- **DB**: Neon Postgres (optional). The schema now contains only `messages`; the old `blog_posts` table is unused and can be dropped by hand.
- **DNS**: GoDaddy → Vercel for the apex and `www`, CNAME `api` → Render.

## CI

`.github/workflows/ci.yml` installs, builds the referenced libs, then typechecks and builds the API and the site on every PR and push to `main`.
