---
id: T093
title: "Sudoku: killer and XV constraint variants"
milestone: M6
epic: E11
depends_on: [T084]
migrations: true
requires_human: false
spec: ["SPEC §2.4 (sudoku constraint variants)", "SPEC §7.4.4 (sudoku)", "SPEC §10 (decision 6)", "PLAN §3 M6"]
skills: ["/db-trigger", "/zod4"]
---

# T093: Sudoku: killer and XV constraint variants

## Context

Killer and XV sudoku are KrazyDad staples (SPEC §1.1). Like T084's region variants, they extend the `sudoku` type rather than becoming new types: killer adds summed cages, and XV adds X and V marks with the negative rule (SPEC §2.4, §7.4.4). They can be combined with each other and with the region variants.

## Scope

**In**

- **Tables:**
  - killer: `sudoku_cages` and `sudoku_cage_cells`;
  - XV: `sudoku_xv_sets` and `sudoku_xv_marks`, with the enum `xv_mark` and the existing `ineq_direction`.
- **Trigger** (`/db-trigger`): the deferred constraint trigger `sudoku_cages_require_cells`.
- **Engine:** cage-sum and XV constraints in solution counting, `conflictingIndexes` and `check`. Cages prune on the remaining sum. XV applies the negative rule only when the puzzle has an XV set.
- **Verify:** cages are edge-connected and their sums are reachable, marks lie inside the grid, and the puzzle has exactly one completion.
- **Solver UI:**
  - dashed cage outlines, each with its sum in the corner, drawn on the T084 region overlay;
  - X and V glyphs on the cell edges, positioned like the futoshiki signs;
  - a cage over its sum, or a broken XV pair, is marked.
- **Content:** 3 original killer puzzles (at least one with no givens) and 2 original XV puzzles.
- **Preview:** extend `src/puzzles/sudoku/preview.tsx` (T129) to draw cage outlines with their sums and the X and V marks from the payload.

**Out**

- Other constraint variants (arrows, thermometers, sandwiches).

## Acceptance criteria

- [ ] **AC1**: A cage with no cells fails at commit. A sum outside 1–45 fails, and an XV mark with no XV set fails on the FK.
  - _Verify (db)._
  - _Verify (unit):_ a DB-integrity test.
- [ ] **AC2**: Classic, jigsaw and rainbow puzzles are unaffected.
  - _Verify (cli):_ the existing sudoku tests pass unchanged, and `pnpm puzzles:verify` passes.
- [ ] **AC3**: The engine respects cages and the XV negative rule.
  - _Verify (unit):_ unique, two-solution and contradictory fixtures for killer and for XV. One extra fixture is a grid that is valid except for two unmarked adjacent cells summing to 10, which `check` rejects while naming both cells.
- [ ] **AC4**: The payload carries the cages, sums and marks, and no solution.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on the 5 new files.
- [ ] **AC5**: Signed in, a full solve of each variant records entries and completion.
  - _Verify (browser + db)._
- [ ] **AC6**: Cage sums and X and V glyphs stay legible in both themes at 1280px and 390px, and are announced to screen readers.
  - _Verify (browser):_ screenshots `.verification/T093/ac6-*.png`, plus `browser_snapshot`.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
