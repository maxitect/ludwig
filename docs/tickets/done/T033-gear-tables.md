---
id: T033
title: Gear tables, driver constraint trigger, gear_daily
milestone: M3
epic: E7
depends_on: [T016]
migrations: true
requires_human: false
spec: ["SPEC §5.2.2", "SPEC §7.4.2", "SPEC §7.4.4 (gears)", "SPEC §7.4.5"]
skills: ["/new-puzzle-type", "/db-trigger", "/zod4"]
---

# T033: Gear tables, driver constraint trigger, `gear_daily`

## Context

This is the storage for the Gear Puzzle. Every reference within a diagram uses composite FKs, so a mesh, killer or swap can never point at another puzzle's gear (SPEC §7.4.4).

## Scope

**In**

- `src/puzzles/gears/tables.ts`, containing exactly the gears tables in SPEC §7.4.4:
  - `gear_puzzles`, `gear_puzzle_gears`, `gear_meshes`
  - `gear_solutions` **(S)**, `gear_solution_swaps` **(S)**
  - `gear_daily`, `gear_attempts`, `gear_attempt_swaps`
- A unique `(puzzle_id, id)` on `gear_puzzle_gears`, as the composite FK target.
- The partial unique index "one driver per puzzle".
- The constraint trigger `trg_gear_puzzles_require_driver`, deferred, which requires exactly one driver at commit.
- A fill trigger for `gear_attempts.puzzle_id` (SPEC §7.4.5).
- `schema.ts`, `load.ts` and `load-solution.ts`.
- A registry entry with a placeholder `Solver`, and a `puzzle_types` row.

**Out**

- The engine (T034) and UI (T037+).

## Acceptance criteria

- [ ] **AC1**: The subtype is pinned.
  - _Verify (db):_ `\d gear_puzzles` shows a generated `type_key` of `'gears'` and a composite FK to `puzzles(id, type_key)`, `on delete cascade`.
- [ ] **AC2**: Tooth counts are constrained.
  - _Verify (db):_ inserting a gear with `teeth=10` fails the CHECK. 8, 12, 16 and 24 succeed (test inside a rolled-back transaction).
- [ ] **AC3**: At most one driver.
  - _Verify (db):_ a second `is_driver=true` gear for the same puzzle fails with a unique-index violation.
- [ ] **AC4**: At least one driver is enforced at commit, not per statement.
  - _Verify (db):_
    1. Insert a puzzle, its subtype and 3 gears with no driver in one transaction, then `COMMIT`. This raises the trigger error, with `ERRCODE` `integrity_constraint_violation`.
    2. The same sequence where the driver is inserted **last**, before `COMMIT`, succeeds. This proves the check is deferred.
- [ ] **AC5**: Meshes can't cross puzzles.
  - _Verify (db):_ a `gear_meshes` row linking a gear of puzzle P1 to a gear of puzzle P2 fails with an FK violation. A row with `gear_a_id > gear_b_id` fails the CHECK.
- [ ] **AC6**: The killer must belong to the same puzzle.
  - _Verify (db):_ a `gear_solutions.killer_gear_id` that belongs to another puzzle fails with an FK violation. The convergence must be between 1 and 8 (try `9`, which fails).
- [ ] **AC7**: Attempt `puzzle_id` is filled by the trigger and can't drift.
  - _Verify (db):_
    1. Insert `gear_attempts(attempt_id, crank)` without `puzzle_id`. The row reads back with `puzzle_id` equal to `attempts.puzzle_id`.
    2. An explicit mismatched `puzzle_id` fails with the composite FK violation.
- [ ] **AC8**: Atomic columns only.
  - _Verify (code):_ `grep -nE "jsonb|json\(|\.array\(" src/puzzles/gears/tables.ts` returns nothing. Spin sign is not stored: `grep -n "spin\|sign" tables.ts` returns nothing.
- [ ] **AC9**: The payload contains no solution.
  - _Verify (unit):_ a payload-leak test parses the `load.ts` output with `payloadSchema.strict()`. It has no `crank`, `convergence`, `killer` or solution swaps.
- [ ] **AC10**: Integrity tests exist for every constraint above.
  - _Verify (unit):_ `pnpm test src/puzzles/gears` runs DB-integrity tests that cover AC2–AC7, and all pass.
- [ ] **AC11**: Gates pass.
  - _Verify (cli):_ `pnpm db:migrate && pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
