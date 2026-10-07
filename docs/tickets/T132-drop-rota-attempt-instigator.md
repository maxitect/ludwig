---
id: T132
title: Drop the unused rota_attempts.instigator_worker_id column
milestone: M4
epic: E6
depends_on: [T063]
migrations: true
requires_human: false
spec: ["SPEC §7.4.4 (rota)", "PLAN §5.1"]
skills: []
---

# T132: Drop the unused rota_attempts.instigator_worker_id column

## Context

Since T063 the instigator is not part of the rota answer: `check` reveals it as the epilogue. `rota_attempts.instigator_worker_id` is no longer written or read (SPEC §7.4.4 says so). The user decided (2026-10-07) to drop it.

## Scope

**In**

- Remove the column, its FK and any index from `src/puzzles/rota/tables.ts`, generate the migration and update SPEC §7.4.4.
- Remove any leftover reference in schemas, attempt-state code and tests.

**Out**

- `rota_solutions.instigator_worker_id` and its trigger. They stay: the instigator is authored and shown in the epilogue.

## Notes

- PLAN §5.1: the previous deploy runs against the new schema during the rollout. Confirm the code on `main` never names the column (no insert, select or returning). Drizzle inserts only the columns it is given, so a nullable column it never names is safe to drop in one step. If any code still names it, remove that code in this PR and record why a single step is still safe, or split into two tickets.

## Acceptance criteria

- [ ] **AC1**: The column is gone.
  - _Verify (db):_ `psql "$DATABASE_URL" -c "\d rota_attempts"` shows no `instigator_worker_id`.
- [ ] **AC2**: Nothing references it.
  - _Verify (code):_ `grep -rn "instigator" src/puzzles/rota/` finds only the solution column, its trigger, `check`'s epilogue and their tests.
- [ ] **AC3**: Rota still saves, reloads and completes.
  - _Verify (browser + db):_ solve a rota puzzle signed in; `rota_attempt_swaps` has rows and `completed_at` is set.
- [ ] **AC4**: The migration applies on the PR's preview branch.
  - _Verify (deploy):_ Neon MCP `run_sql` on `preview/<branch>` shows the column gone, and the preview build is Ready.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
