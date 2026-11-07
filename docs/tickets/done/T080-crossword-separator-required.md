---
id: T080
title: Require a separator on every non-last crossword segment
milestone: M4
epic: E8
depends_on: [T074]
migrations: true
requires_human: false
spec: ["SPEC §7.4.1", "SPEC §7.4.4 (crossword)"]
skills: ["/db-trigger"]
---

# T080: Require a separator on every non-last crossword segment

## Context

T074 added `crossword_clue_segments.separator` as nullable, so builds from before T074 could still seed. That leaves a word break stored two ways: `'word'` (what the seed writes now) and `NULL` on a segment that isn't the last. This ticket removes the `NULL` form, so each break has one encoding and the database enforces it (SPEC §7.4.1).

## Scope

**In**

- A custom migration that backfills every non-last segment whose `separator` is `NULL` to `'word'`.
- Extend the T074 constraint trigger (`trg_crossword_clue_segments_last_has_no_separator` and its function) so that a non-last segment must have a separator and the last must not. Recheck both the OLD and NEW clue on update and delete, as the T074 fix does.
- `deriveEnumeration` and `load.ts` stop treating `NULL` as a word break, if they rely on it.
- Integrity tests for insert, update, delete and moving a segment between clues.
- SPEC §7.4.4 crossword row updated in the same PR.

**Out**

- Apostrophes or other punctuation (still out of scope, as in T074).
- Content changes. No current answer is hyphenated.

## Notes

- Backward compatibility (PLAN §5.1): the previous deploy is T074 or later, and its seed already writes `'word'` for every non-last segment, so it stays valid. A Vercel rollback reuses an existing build and doesn't re-run the seed.
- Run the backfill before the trigger change in the same migration, or the trigger rejects existing rows at commit.
- Since the trigger is deferred, the seed's delete-and-reinsert of segments must still commit cleanly; verify with `pnpm db:seed` twice.

## Acceptance criteria

- [ ] **AC1**: No non-last segment has a `NULL` separator after migrating.
  - _Verify (db):_ after `pnpm db:migrate && pnpm db:seed`, a query counting non-last segments with `separator is null` returns 0.
- [ ] **AC2**: A non-last segment without a separator is rejected, and the last segment still can't carry one.
  - _Verify (db):_ inside `BEGIN; … ROLLBACK;`, inserting a two-segment clue with `NULL` on the first segment fails, a separator on the last fails, and a valid clue succeeds. Moving a segment to another clue that would break either rule fails.
- [ ] **AC3**: Enumerations still render.
  - _Verify (unit):_ `derive.test.ts` covers "(4,3)", "(5-4)" and "(3,4-5)".
- [ ] **AC4**: The seed is idempotent.
  - _Verify (cli):_ `pnpm db:seed` run twice exits 0 both times.
- [ ] **AC5**: The preview has the backfilled data and the new trigger.
  - _Verify (deploy):_ Neon MCP `run_sql` on `preview/ticket/T080-…` shows 0 non-last `NULL` separators.
- [ ] **AC6**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
