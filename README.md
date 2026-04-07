# Creative Showcase Site

Live: https://soumyaraikwar.co.in

Personal portfolio monorepo with:
- a Vite + React frontend (`artifacts/portfolio`)
- an Express API (`artifacts/api-server`)
- shared API schemas/client packages and DB schema (`lib/*`)

## Live URLs

- Frontend: `https://soumyaraikwar.co.in`
- API: `https://api.soumyaraikwar.co.in`

## Tech Stack

- Monorepo: `pnpm` workspaces
- Frontend: React, Vite, TypeScript, Tailwind, Framer Motion, Three.js
- API: Express 5, TypeScript, Zod
- DB: PostgreSQL (Neon) + Drizzle ORM
- Email: Resend (with Gmail fallback in code)

## Repository Structure

- `artifacts/portfolio` - portfolio frontend app
- `artifacts/api-server` - backend API service
- `lib/db` - Drizzle schema and DB wiring
- `lib/api-spec` - OpenAPI source
- `lib/api-zod` - generated Zod validators/types
- `lib/api-client-react` - generated frontend API hooks/client

## Prerequisites

- Node.js 20+ (project has been run with Node 20/24)
- `pnpm` 10+
- PostgreSQL connection string (for API/DB operations)

## Local Setup

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install --frozen-lockfile
```

## Environment Variables

### Frontend build (`artifacts/portfolio`)

- `PORT` (required by `vite.config.ts`)
- `BASE_PATH` (required by `vite.config.ts`, use `/` for root domain)

### API (`artifacts/api-server`)

- `PORT`
- `DATABASE_URL`
- `RESEND_API_KEY` (recommended)
- `RESEND_FROM_EMAIL`
- `NOTIFY_EMAIL`

Optional Gmail fallback:
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

## Common Commands

```bash
# Full workspace checks
pnpm run typecheck
pnpm run build

# Frontend
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/portfolio run dev
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/portfolio run build

# API
PORT=8080 pnpm --filter @workspace/api-server run dev
PORT=8080 pnpm --filter @workspace/api-server run start

# DB schema push
DATABASE_URL="postgresql://..." pnpm --filter @workspace/db run push
```

## Deployment

- Frontend: Vercel
- API: Render
- DB: Neon
- Domain: GoDaddy DNS

Frontend rewrites `/api/*` to the API service via `vercel.json`.

## CI

GitHub Actions workflow in `.github/workflows/ci.yml` runs on pull requests and pushes to `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm --filter @workspace/api-server run typecheck`
3. `pnpm --filter @workspace/api-server run build`
4. `pnpm --filter @workspace/portfolio run typecheck`
5. `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/portfolio run build`

## Contribution / PR Flow

1. Create an issue.
2. Create a branch from `main`.
3. Commit focused changes.
4. Open PR and link issue (`Closes #<issue_number>`).
5. Merge after CI passes.
