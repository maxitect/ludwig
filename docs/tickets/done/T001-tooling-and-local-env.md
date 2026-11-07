---
id: T001
title: Tooling, scripts, env validation and local Postgres
milestone: M0
epic: E1
depends_on: []
migrations: false
requires_human: false
spec: ["SPEC §7.1", "SPEC §7.5", "SPEC §7.6", "PLAN §3 M0", "PLAN §5.2"]
skills: ["/zod4"]
---

# T001: Tooling, scripts, env validation and local Postgres

## Context

This is the first ticket. It sets up the local toolchain that every later ticket's verification depends on: Postgres in Docker, validated env vars, Vitest, Playwright and the `package.json` scripts. See PLAN §3 M0 and SPEC §7.5–7.6.

## Scope

**In**

- `compose.yaml` with a `db` service:
  - `postgres:17`;
  - user, password and database `ludwig`;
  - port `5432:5432`;
  - a named volume;
  - a `pg_isready` healthcheck.
- `.env.example` listing the variables in SPEC §7.5 with local values. `.env*` stays git-ignored, except `!.env.example`.
- The repo root already has a `.env.local`: local Docker URLs plus a generated `BETTER_AUTH_SECRET`. Keep it and don't regenerate the secret. Only add any variables that `.env.example` has and it lacks.
- `.gitignore` additions: `.verification/`, `/test-results/`, `/playwright-report/`, `!.env.example`.
- `src/env.ts`:
  - Zod 4 validation of `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BETTER_AUTH_SECRET` (at least 32 characters) and `BETTER_AUTH_URL` (URL);
  - optional `VERCEL_ENV`, `VERCEL_URL`;
  - imports `server-only`;
  - throws a readable error listing every invalid key.
- Vitest:
  - `vitest.config.ts` with a node environment;
  - `@/*` path alias from `tsconfig`;
  - `src/**/*.test.ts` and `scripts/**/*.test.ts`.
- Playwright:
  - `playwright.config.ts`, with `baseURL` from `PLAYWRIGHT_BASE_URL`, falling back to `http://localhost:3000`;
  - `e2e/` test directory with chromium only.
- `package.json` scripts from SPEC §7.6:
  - **Working:** `typecheck`, `test`, `test:e2e`.
  - **Stubs**, each `echo "<script>: not implemented until <ticket>" && exit 0`: `db:generate`, `db:migrate`, `db:studio` (T003), `db:seed` and `puzzles:verify` (T016), `puzzles:gen-gears` (T036).
- Dev dependencies: `vitest`, `@playwright/test`, `server-only`, `zod`. Pin `zod` to the latest 4.x.

**Out**

- The Drizzle client and auth (T003).
- CI (T002).
- Any UI.

## Notes

- Use pnpm and match `packageManager` in `package.json`. Run `pnpm exec playwright install chromium` and note it in the report.
- `src/env.ts` is server-only. Client code never imports it.
- The README section "Local setup" gets 5–8 lines: `docker compose up -d`, copy `.env.example` to `.env.local`, then `pnpm dev`. Edit only that section of the README.
- The per-ticket database convention (`ludwig_<id>`) is in INSTRUCTIONS §3. For this ticket, use `ludwig_t001` against the same container.

## Acceptance criteria

- [ ] **AC1**: Postgres 17 starts and becomes healthy from `compose.yaml`.
  - _Verify (cli):_ `docker compose up -d && docker compose ps` shows `db` as `healthy`. `psql postgres://ludwig:ludwig@localhost:5432/ludwig -c "select version()"` prints `PostgreSQL 17.x`.
- [ ] **AC2**: A per-ticket database can be created and reached.
  - _Verify (db):_ `createdb -h localhost -U ludwig ludwig_t001`, then `psql "$DATABASE_URL" -c "select current_database()"` returns `ludwig_t001`.
- [ ] **AC3**: `src/env.ts` accepts a valid environment.
  - _Verify (unit):_ `src/env.test.ts` parses a full valid object and the test passes.
- [ ] **AC4**: `src/env.ts` rejects invalid values and names each offending key.
  - _Verify (unit):_ cases in `src/env.test.ts` for a missing `DATABASE_URL`, a 10-character `BETTER_AUTH_SECRET` and a non-URL `BETTER_AUTH_URL` each throw. The message contains the key name.
- [ ] **AC5**: Vitest runs and finds tests.
  - _Verify (cli):_ `pnpm test` exits 0 and lists `src/env.test.ts`.
- [ ] **AC6**: Playwright runs against the dev server.
  - _Verify (cli):_ start `pnpm dev --port 3001` in the background. Then `PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm test:e2e` runs `e2e/smoke.spec.ts`, which loads `/` and asserts HTTP 200, and exits 0.
- [ ] **AC7**: Every SPEC §7.6 script exists, and each stub names its implementing ticket.
  - _Verify (cli):_ `pnpm db:seed` prints `db:seed: not implemented until T016` and exits 0. `node -e "const s=require('./package.json').scripts;console.log(['db:generate','db:migrate','db:studio','db:seed','puzzles:verify','puzzles:gen-gears','typecheck','test','test:e2e'].every(k=>s[k]))"` prints `true`.
- [ ] **AC8**: Verification and test artefacts are git-ignored, and `.env.example` is tracked.
  - _Verify (cli):_ `mkdir -p .verification/x && touch .verification/x/a.png && git status --porcelain .verification` prints nothing. `git check-ignore .env.example` exits 1.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
