---
id: T077
title: Connect with an explicit sslmode=verify-full
milestone: M5
epic: E1
depends_on: []
migrations: false
requires_human: false
spec: ["SPEC §7.1"]
skills: []
---

# T077: Connect with an explicit sslmode=verify-full

## Context

Production and preview runtime logs show `pg`'s SSL-mode deprecation warning: `sslmode=require` is currently treated as `verify-full`, and will switch to libpq semantics in the next major. The user approved moving to `verify-full`. The Neon Vercel integration owns `DATABASE_URL` and `DATABASE_URL_UNPOOLED`, and injects a different value per preview branch, so editing env vars would not cover previews and could be overwritten. Do it in code instead.

## Scope

**In**

- Normalise the connection string's `sslmode` to `verify-full` wherever the app or scripts open a connection: `src/db/index.ts`, `drizzle.config.ts`, and any script that builds its own client. Leave URLs without `sslmode` (local Docker, no SSL) unchanged.
- One small helper in `src/utils/` (it's a plain function), with a unit test.

**Out**

- Any Vercel or Neon setting or env var change.

## Acceptance criteria

- [ ] **AC1**: The helper rewrites `sslmode=require` (and `prefer`, `verify-ca`) to `verify-full`, keeps other params, and leaves a URL with no `sslmode` unchanged.
  - _Verify (unit):_ the helper test passes.
- [ ] **AC2**: Local dev, migrate, seed and tests still work against Docker Postgres.
  - _Verify (cli):_ `pnpm db:migrate && pnpm db:seed && pnpm test` exit 0.
- [ ] **AC3**: The preview runs with no SSL-mode warning.
  - _Verify (deploy):_ the preview build log shows migrations applied and the seed ran; Vercel MCP `get_runtime_logs` for the preview, after loading `/puzzles` and a solve page, has no `sslmode` / "SECURITY WARNING" line.
- [ ] **AC4**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
