---
id: T132
title: Stop naming rota_attempts.instigator_worker_id in the Drizzle schema
milestone: M4
epic: E6
depends_on: [T063]
migrations: false
requires_human: false
spec: ["SPEC §7.4.4 (rota)", "SPEC §7.7", "PLAN §5.1"]
skills: []
---

# T132: Stop naming rota_attempts.instigator_worker_id in the Drizzle schema

## Context

Since T063 the instigator is not part of the rota answer: `check` reveals it as the epilogue. `rota_attempts.instigator_worker_id` is no longer written or read (SPEC §7.4.4). The user decided (2026-10-07) to drop it. They then decided (2026-10-10) to drop it in two steps. This ticket is step (a); T141 is step (b), the migration.

## Scope

**In**

- Remove the column and its FK from `src/puzzles/rota/tables.ts`, with **no migration**. The nullable column stays in the database.
- Update SPEC §7.4.4: the column is out of the schema, and T141 drops it from the database.
- Remove any leftover reference in schemas, attempt-state code and tests.

**Out**

- Dropping the column from the database: that is T141, which starts only once this ticket is in production.
- `rota_solutions.instigator_worker_id` and its trigger. They stay: the instigator is authored and shown in the epilogue.

## Notes

- Why two steps (SPEC §7.7, PLAN §5.1): Drizzle's insert names every column it doesn't generate and sends `default` for the missing ones. The code on `main` therefore sends `insert into "rota_attempts" ("attempt_id", "puzzle_id", "instigator_worker_id") values ($1, default, default)`. That insert fails if the column is dropped while the old deploy is still serving.
- Once this ticket is live, no deployed code names the column, so T141 can drop it safely.
- Don't run `pnpm db:generate` on this branch. It would generate T141's drop migration.

## Acceptance criteria

- [ ] **AC1**: The schema no longer defines the column, and the database still has it, nullable.
  - _Verify (db + code):_ `psql "$DATABASE_URL" -c "\d rota_attempts"` shows `instigator_worker_id uuid` nullable. `src/puzzles/rota/tables.ts` defines no attempt instigator column, and `drizzle/` gains no migration.
- [ ] **AC2**: No code references it.
  - _Verify (code):_ `grep -rn "instigator" src/puzzles/rota/` finds only the solution column, its trigger, `check`'s epilogue and their tests.
- [ ] **AC3**: Rota still saves, reloads and completes with the column present. The insert no longer names it.
  - _Verify (browser + db):_ solve a rota puzzle signed in. `rota_attempt_swaps` has rows, `completed_at` is set, and the new attempts' `instigator_worker_id` is null.
- [ ] **AC4**: The preview deploys with no migration, and the column is still on the preview branch.
  - _Verify (deploy):_ the preview build is Ready, and Neon MCP `run_sql` on `preview/<branch>` shows `instigator_worker_id` still on `rota_attempts`.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
