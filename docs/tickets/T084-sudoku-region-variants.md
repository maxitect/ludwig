---
id: T084
title: "Sudoku: jigsaw and rainbow region variants"
milestone: M6
epic: E11
depends_on: [T046]
migrations: true
requires_human: false
spec: ["SPEC §1.2.1", "SPEC §2.4 (sudoku region variants)", "SPEC §7.4.4 (sudoku)", "SPEC §10 (decision 6)", "PLAN §3 M6"]
skills: ["/db-trigger", "/zod4"]
---

# T084: Sudoku: jigsaw and rainbow region variants

## Context

The Radio Times special ran a jigsaw sudoku and a rainbow sudoku (SPEC §1.2.1). Both are a classic sudoku with a different or an extra set of nine-cell units, so they extend the existing `sudoku` type with an optional region set rather than becoming new types (SPEC §2.4, §7.4.4).

## Scope

**In**

- **Tables:** `sudoku_region_sets` (enum `sudoku_region_kind`) and `sudoku_region_cells`, as in SPEC §7.4.4.
- **Trigger** (`/db-trigger`): the deferred constraint trigger `sudoku_region_sets_require_cells`, which requires 81 cells with nine per region.
- **Engine:** `src/puzzles/sudoku/engine.ts` takes its units from the puzzle. Classic uses rows, columns and boxes. Jigsaw replaces the boxes with its regions. Rainbow adds its colour groups. Solution counting, `conflictingIndexes` and `check` all use the same unit list.
- **Verify:** jigsaw regions are edge-connected, and every variant has exactly one completion.
- **Payload, `load.ts`, `schema.ts`, `contentSchema`:** an optional region set with its kind and each cell's region.
- **Solver UI:**
  - jigsaw draws thick borders between regions in place of the box borders;
  - rainbow tints each colour group, keeps the box borders, and also marks each group with a pattern or label so it isn't told apart by colour alone.
  - The region-border overlay lives in `src/puzzles/_shared/` because star battle (T087) reuses it.
- **Content:** 3 original jigsaw puzzles and 2 original rainbow puzzles.

**Out**

- Killer cages, XV and other constraint variants.
- Region sets on any other type.

## Notes

- Rainbow tints must come from design tokens. If nine distinguishable tints don't exist in the palette, add them as tokens in both themes and update SPEC §6.2 in this PR. Never use ad-hoc colours.
- Don't transcribe the Radio Times grids into `content/` (SPEC §10, decision 6). Write your own region layouts and givens, from the solution backwards.

## Acceptance criteria

- [ ] **AC1**: A region set with fewer than 81 cells, or a region without exactly nine cells, fails at commit. A full, valid set commits.
  - _Verify (db):_ three transactions.
  - _Verify (unit):_ a DB-integrity test.
- [ ] **AC2**: A classic sudoku still loads, verifies and checks exactly as before.
  - _Verify (cli):_ `pnpm test src/puzzles/sudoku` passes with the existing tests unchanged, and `pnpm puzzles:verify` passes on the 5 classic content files.
- [ ] **AC3**: The engine respects each variant's units.
  - _Verify (unit):_ for each variant, fixtures for a unique puzzle, one with a given removed (2+ solutions) and a contradictory one. One extra fixture is a grid that is valid as a classic sudoku but breaks a jigsaw region, which `check` rejects while naming the cells.
- [ ] **AC4**: `puzzles:verify` rejects a jigsaw region that isn't edge-connected.
  - _Verify (unit)._
- [ ] **AC5**: Signed in, a full solve of each variant records entries and completion.
  - _Verify (browser + db):_ `sudoku_attempt_cells` has rows and `completed_at` is set.
- [ ] **AC6**: Jigsaw borders and rainbow groups are legible in both themes at 1280px and 390px. Rainbow groups can be told apart without colour.
  - _Verify (browser):_ screenshots `.verification/T084/ac6-*.png`, including one with a greyscale filter.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
