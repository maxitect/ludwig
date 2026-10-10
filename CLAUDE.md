@AGENTS.md

# CLAUDE.md

Guidance for Claude Code in this repository. Domain-specific rules live in `.claude/rules/`. Each one loads automatically when you touch matching files.

## Project Overview

Ludwig is a non-commercial fan site: a puzzle-solving web app styled after the BBC One drama _Ludwig_. Its two flagship puzzles come from the show, **Reverse Chess** (retrograde analysis, S1E4) and **The Gear Puzzle** (S2E2). Around them sits a library of word, logic, spatial and cipher puzzles.

- `docs/SPEC.md` is the source of truth for **what** we build: puzzle rules, design system and data model. Read the relevant section before starting work.
- `docs/PLAN.md` covers **how and in what order**: milestones, definition of done and risks.
- If the code needs to diverge from the spec, update the spec in the same PR.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React Server Components, Turbopack), React 19, TypeScript 5 (strict)
- **Database:** PostgreSQL. Docker locally, Neon in production, Drizzle ORM 1.0 RC with drizzle-kit (exact versions pinned)
- **Auth:** Better Auth with email and password and database sessions. There is no email verification.
- **Validation:** Zod 4, plus `drizzle-orm/zod` for generated table schemas
- **Styling:** Tailwind CSS 4 (CSS-first `@theme`) and shadcn/ui, heavily restyled
- **Puzzles:** chess.js, react-chessboard v5, motion
- **Testing:** Vitest (engines, checkers, DB integrity) and Playwright (end-to-end against previews)
- **Hosting:** Vercel with the Neon Marketplace integration. Each preview gets its own Neon branch.
- **Package manager:** pnpm

## Commands

```bash
pnpm dev              # Dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest
pnpm test:e2e         # Playwright

docker compose up -d  # Local Postgres 17
pnpm db:generate      # drizzle-kit generate (schema → migration)
pnpm db:migrate       # Apply migrations (uses DATABASE_URL_UNPOOLED)
pnpm db:seed          # Upsert lookups + content/ into the DB
pnpm db:studio        # Drizzle Studio
pnpm puzzles:verify   # Schema-parse, derive and uniqueness-check every content file
pnpm perf:lighthouse  # Lighthouse over the fixed URL list against `pnpm start --port 3069` (build first)
```

Some scripts are added during M0 and M1 (see `docs/PLAN.md`). If one is missing, add it to `package.json` as part of the ticket that needs it.

- After any schema change, run `pnpm db:generate`, then `pnpm db:migrate`, then `pnpm test`.
- After any content change, run `pnpm puzzles:verify`.

## Platform tools (Vercel and Neon)

The Vercel and Neon MCP plugins and CLIs (`vercel`, `neonctl`) are installed and authenticated. **Use them**: go to the source rather than guessing about deployments or the hosted database, and don't ask the user for logs or dashboard checks you can do yourself.

- **Vercel:** build logs (`vercel inspect <url> --logs`), runtime logs (Vercel MCP `get_runtime_logs`), deployment state, env var names, and protected previews (`vercel curl --yes --deployment <url> <path> -- <curl args>`, or a `get_access_to_vercel_url` share link for a browser).
- **Neon:** branches and read-only SQL on any branch (Neon MCP `run_sql`/`list_branches`, or `neonctl --project-id bold-term-80947033`). Each preview deployment has its own branch, `preview/<git-branch>`; `main` is production.
- **Approval needed:** writes or schema changes on production `main`, destructive Neon operations, and Vercel setting changes all need the user's approval first. Never print or decrypt secrets.

IDs, the full rules and which method to verify with are in `docs/tickets/INSTRUCTIONS.md` §3.1.

## Next.js 16

This is not the Next.js in your training data. Read the guide in `node_modules/next/dist/docs/` before writing framework code.

- **Middleware is now Proxy.** It lives in `src/proxy.ts` and only does optimistic cookie checks.
- **Cache Components.** Anything that reads the session sits behind `<Suspense>`. Session-independent data uses `use cache` with `cacheTag`.
- **Server Components by default.** Use `"use client"` only for interactivity, browser APIs or hooks.

## Type & Schema System

Use the shallowest layer that exists. Never retype what can be derived.

1. **Drizzle tables.** These are `src/db/schema/*.ts` and `src/puzzles/<type>/tables.ts`, and are the source of truth for every row shape. For plain row types use `typeof table.$inferSelect` / `$inferInsert`.
2. **Generated Zod schemas.** Use `createSelectSchema` / `createInsertSchema` / `createUpdateSchema` from `drizzle-orm/zod`.
3. **Composed schemas:**
   - each puzzle type's `schema.ts` (`payloadSchema`, `answerSchema`, `contentSchema`, `attemptSchema`);
   - form schemas.

   These are built by `.pick()` / `.omit()` / `.extend()` on layer 2. Use `.extend()` only for fields that are not columns, e.g. `password` on sign-up.

4. **Custom types** are a last resort, and must derive from layers 1–3. Ask before adding a new standalone type.

Never use `any`. Use the `/zod4` skill for Zod syntax: `z.email()`, not `z.string().email()`.

## Architecture

- **Actions** (`src/lib/actions/`) are thin Server Actions. Each one, in order:
  1. authenticates with `getCurrentUser()`;
  2. validates its input with a Zod schema;
  3. calls data access;
  4. revalidates or redirects.

  Actions contain no business logic.

- **Data access** (`src/lib/data/`) is `import "server-only"`. It holds all reads and writes. Reads are a single RQBv2 relational query that selects only the columns used.
- **Puzzle logic** lives in `src/puzzles/<type>/`. Engines, checkers and derivations are pure functions with no React, DB or Next imports. See `.claude/rules/puzzles.md`.
- **Errors.** Don't swallow a failed query into an empty state. Surface the error and render an error state in place of the UI that depends on it.
- **Auth is checked twice.** `proxy.ts` is optimistic UX only. Every action and every protected data-access function authorises again. See `.claude/rules/auth.md`.

## Hard Rules

- **Solutions never reach the client.** Columns marked **(S)** in `docs/SPEC.md` section 7.4.4 are only read by `load-solution.ts` and `check.ts`.
- **The database is strict 3NF and the database enforces it:**
  - no `jsonb` or arrays;
  - no polymorphic FKs;
  - derived values are not stored;
  - redundancy is kept consistent only by FKs and triggers.

  See `.claude/rules/database.md`.

- **Every puzzle has exactly one solution,** proven by `puzzles:verify`. The word ladder is the only exception.
- **Use design tokens only:**
  - no ad-hoc colours, radii or fonts;
  - no rounded corners anywhere;
  - no `#fff`.

  See `.claude/rules/design-system.md`.

## Code Quality

- No comments unless the why is non-obvious. Complex reusable functions may have a short docstring.
- Don't abstract speculatively. Extract a shared solver part only when a second type needs it.
- Every ticket finishes with `pnpm typecheck && pnpm lint && pnpm test && pnpm build` passing.

**File placement:**

- **`src/puzzles/<type>/`:** everything for one puzzle type. Shared pure engines (`visibility.ts`) and shared solver parts (`CellInput`) go in `src/puzzles/_shared/`.
- **`src/components/ui/`:** restyled shadcn components. Add new ones with `pnpm dlx shadcn@latest add <component>`, then restyle them in place.
- **`src/components/brand/`:** Wordmark, Credit, InkSplat, Walker, Grain, SolvedStamp, BulletHole.
- **`src/config/`:** constants and option maps used in more than one file.
- **`src/lib/`:** wrappers around external systems (auth, db) only. Plain helpers go in `src/utils/`.
- **`scripts/dev/`:** agent and developer tooling that neither the build nor CI runs (ticket scripts, preflight, one-off generators and reports). CI and Vercel skip pushes that touch only this folder, docs and markdown. Scripts the build or CI runs (`seed.ts`, `verify-puzzles.ts`) stay in `scripts/`.
- **`content/<type>/<slug>.ts`:** curated puzzles, typed by `contentSchema`. Content is code; never insert puzzle content into the DB by hand.

## Available Skills

| Skill              | When to use                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `/zod4`            | Zod 4 syntax and patterns                                                                   |
| `/db-trigger`      | PostgreSQL trigger functions and custom Drizzle migrations                                  |
| `/new-puzzle-type` | Scaffolding a new puzzle type: tables, schemas, load, check, derive, solver, content, tests |
