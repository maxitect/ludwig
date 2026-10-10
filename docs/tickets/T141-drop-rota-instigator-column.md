---
id: T141
title: Drop the rota_attempts.instigator_worker_id column
milestone: M4
epic: E6
depends_on: [T132]
migrations: true
requires_human: false
spec: ["SPEC §7.4.4 (rota)", "SPEC §7.7", "PLAN §5.1"]
skills: []
---

# T141: Drop the rota_attempts.instigator_worker_id column

## Context

This is step (b) of dropping the unused attempt instigator. In step (a), T132 removed the column from `src/puzzles/rota/tables.ts` and left it in the database, so the deploy that was live kept working (SPEC §7.7). This ticket drops the column and its FK.

## Scope

**In**

- Run `pnpm db:generate --name=drop_rota_attempt_instigator`. The schema already lacks the column, so the migration drops `rota_attempts_instigator_fk`, then `instigator_worker_id`.
- Update SPEC §7.4.4 so it no longer mentions the leftover column.

**Out**

- `rota_solutions.instigator_worker_id` and its trigger. They stay.

## Notes

- **Start only once T132 is in production.** Check that the production deployment's commit contains T132 (`vercel ls --prod`, then `vercel inspect`). The old deploy then no longer names the column, and the drop is backward-compatible.
- If another migration merges first, delete this one and regenerate it after rebasing.

## Acceptance criteria

- [ ] **AC1**: The column is gone.
  - _Verify (db):_ `psql "$DATABASE_URL" -c "\d rota_attempts"` shows no `instigator_worker_id` and no `rota_attempts_instigator_fk`.
- [ ] **AC2**: The migration contains only the drop.
  - _Verify (code):_ the new `drizzle/*_drop_rota_attempt_instigator/migration.sql` has exactly the two `ALTER TABLE "rota_attempts" DROP …` statements.
- [ ] **AC3**: Rota still saves, reloads and completes.
  - _Verify (browser + db):_ solve a rota puzzle signed in. `rota_attempt_swaps` has rows and `completed_at` is set.
- [ ] **AC4**: The migration applies on the PR's preview branch.
  - _Verify (deploy):_ the preview build is Ready, and Neon MCP `run_sql` on `preview/<branch>` shows the column gone.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
