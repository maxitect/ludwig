---
id: T072
title: Seed updates content in place and never touches attempt data
milestone: M1
epic: E4
depends_on: [T016, T022]
migrations: false
requires_human: false
spec: ["SPEC §4.6", "SPEC §7.4.4"]
skills: [/db-trigger]
---

# T072: Seed updates content in place

## Context

`scripts/seed.ts` deletes every subtype row of a puzzle and re-inserts it on each `db:seed`, which runs on every deploy. Attempt child tables that cascade from content rows lose players' progress: gears accusations, rota attempt swaps (rota worker rows get new ids each seed) and possibly reverse-chess plies. Crossword was patched with a deferred, non-cascading FK. The user chose to fix this in the seed itself: content is updated in place, keyed by natural keys, so content row ids stay stable and attempt tables are never written by the seed.

## Scope

**In**

- `upsertPuzzle` (and each module's `insertContent`, or a successor contract method) writes subtype and child content rows by upsert on their natural keys, deletes only the child rows that are no longer in the content file, and never deletes the subtype row of a puzzle that still exists.
- Content row ids (for example rota workers) are stable across re-seeds of unchanged content.
- The seed never deletes or updates rows in any `*_attempts` table or attempt child table. If a content change removes a row that attempt data references, the seed fails with a clear error naming the puzzle, rather than cascading.
- Audit every registered type (anagram, crossword, reverse-chess, gears, rota) and record in the report which attempt children reference content rows and how each is now protected.
- Update the registry contract docs, `.claude/rules/puzzles.md` and the `/new-puzzle-type` skill if the contract changes.

**Out**

- Changing FK definitions to deferred (the crossword one stays as is). A migration is only allowed if an FK `on delete cascade` from content to attempt data must be removed; ask the orchestrator first.

## Acceptance criteria

- [ ] **AC1**: Re-seeding unchanged content preserves attempt data for every type with attempt children.
  - _Verify (unit):_ `scripts/seed.test.ts` creates an attempt with child rows for gears, rota, reverse-chess and crossword, runs the seed twice, and asserts the attempt child rows and the content row ids are unchanged.
- [ ] **AC2**: Editing a content field (for example a clue text or a worker label) updates the row in place without touching attempts.
  - _Verify (unit):_ same test file, changed content then re-seed, asserts the new value and the unchanged attempt rows.
- [ ] **AC3**: Removing a content row referenced by attempt data fails the seed for that puzzle with a clear error, and leaves the DB unchanged.
  - _Verify (unit):_ same test file.
- [ ] **AC4**: Production-shaped re-seed is a no-op.
  - _Verify (cli + db):_ `pnpm db:seed` twice on the local DB; the second run reports 0 inserted, 0 removed, and row counts of every content and attempt table are identical.
- [ ] **AC5**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
