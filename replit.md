# XBrainPro — Neura City

A 3D multiplayer city game. Players walk around a shared city, see each other move in real time, and interact with AI-driven features. Live at xbrainpro.com.

## Artifacts & Dev workflows

- `xbrainpro-web` — marketing/web frontend (Vite, port 20677, served at `/`)
- `xbrainpro-mobile` — Expo game, also web-exported to `/play` (port 25192, served at `/xbrainpro-mobile/`)
- `api-server` — Express API + WebSocket `/ws` + serves web build & `/play` in prod (port 8080, served at `/api`)
- Dev runs all three as separate workflows (API Server, Web, Mobile Game). Prod is ONE Express service on Railway (web uses relative `/api`).

## Run & Operate

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema to the **dev** database
- `DATABASE_URL="$SUPABASE_DB_URL" pnpm exec drizzle-kit push --config ./drizzle.config.ts` (from `lib/db`) — push schema to **prod** (Supabase)
- Required secrets: `GITHUB_TOKEN`, `HOSTINGER_API_TOKEN`, `OPENROUTER_API_KEY`, `RAILWAY_API_TOKEN`, `SUPABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Dev `DATABASE_URL` is runtime-managed.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

- User speaks Banglish — always respond in Banglish, simple non-technical explanations (novice user).
- After EVERY completed task: push all changes to GitHub (repo farhanayanemon-hub/xbrainpro-app), verify Railway deploy at xbrainpro.com, then give the user a migration prompt (a ready-to-paste text describing the project state + next roadmap) so they can continue in a new Replit account if credits run out.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
