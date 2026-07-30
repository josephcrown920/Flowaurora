# Flows

An AI-powered cinematic storyboard and video workflow tool. Filmmakers drop in a logline, an AI Director proposes a shot list, and they iterate toward a finished storyboard — complete with AI-generated frame images and a node-based canvas for visual workflow composition.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/flows run dev` — run the frontend (served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — set via Replit AI Integrations (OpenAI)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 + React Flow (`@xyflow/react`)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- AI: OpenAI via Replit AI Integrations (`@workspace/integrations-openai-ai-server`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (projects, characters, shots, shot_characters)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — auto-generated Zod validators (do not edit)
- `artifacts/api-server/src/routes/` — Express route handlers (characters, projects, shots, director, generate)
- `artifacts/flows/src/` — React frontend (App.tsx router, pages/, components/)

## Architecture decisions

- OpenAPI-first: the spec in `lib/api-spec/openapi.yaml` drives both frontend hooks (Orval → React Query) and backend validation (Orval → Zod). Never hand-write these.
- `zod/v4` is required in `lib/api-zod/src/generated/api.ts` (changed from plain `zod` which lacks `.int()`).
- The `lib/api-zod/src/index.ts` barrel exports only Zod schemas from `./generated/api` plus explicit TS type re-exports from `./generated/types` — avoids name collisions (e.g. `ProposeShotsResponse` exists in both).
- Shot character assignments are stored in a join table (`shot_characters`) — always hydrate `characterIds` after inserts/updates.
- AI image generation returns base64 data URLs stored directly in `imageUrl`/`referenceImageUrl` columns.

## Product

- **Projects** — storyboard projects with title, logline, style preset, and status
- **Storyboard view** — filmstrip grid of shots with image generation per shot
- **AI Director** — proposes a full shot list from a logline using GPT
- **Characters library** — reusable characters with AI-generated reference portraits
- **Canvas editor** — React Flow node canvas for visual video workflow composition

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before using updated hooks.
- `lib/api-zod`'s generated file must import from `zod/v4`, not plain `zod` (Orval generates `zod.int()` which only exists in v4).
- `pnpm --filter @workspace/db run push-force` if push fails with column conflicts.
- Do not run `pnpm dev` at workspace root — artifacts run via managed workflows.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
