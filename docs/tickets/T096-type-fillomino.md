---
id: T096
title: "Puzzle type: fillomino"
milestone: M6
epic: E11
depends_on: [T021]
migrations: true
requires_human: false
spec: ["SPEC §2.4 (fillomino)", "SPEC §7.4.4 (fillomino)", "SPEC §10 (decision 6)", "PLAN §3 M6"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T096: Puzzle type: fillomino

## Context

Fillomino is one of KrazyDad's lab formats (SPEC §1.1). Fill the grid with digits so that every area of n equal digits has exactly n cells, and areas of the same size never touch along an edge (SPEC §2.4). No solution is stored.

## Scope

**In**

- **`src/puzzles/fillomino/`**, built per `/new-puzzle-type`. Tables: `fillomino_puzzles`, `fillomino_givens`, `fillomino_attempts` and `fillomino_attempt_cells`, as in SPEC §7.4.4.
- **`engine.ts`:** `areas(grid)` (flood fill) and `countSolutions`, a backtracking search that grows areas from the givens, capped at 2.
- **`check.ts`:** returns `cellsWrong` for areas that are too big, too small, or touching an area of the same size.
- **Solver UI:**
  - `CellInput` digits;
  - thick borders drawn automatically between cells with different digits, so the areas show as they form;
  - an area of the wrong size is marked.
- **Content:** 5 original puzzles from 6×6 to 10×10.
- **Preview:** add `src/puzzles/<type>/preview.tsx` (T129) and register it in `src/puzzles/previews.ts`. Typecheck fails until you do.

**Out**

- Digits above 9.

## Notes

- Fillomino search can blow up on sparse givens. Record the worst verify time over the content in the report. If any puzzle takes more than 5 s, add givens rather than optimising speculatively.

## Acceptance criteria

- [ ] **AC1**: The tables and CHECKs exist.
  - _Verify (db):_ a 13-wide puzzle and digit 0 are rejected.
- [ ] **AC2**: `areas` and counting are correct.
  - _Verify (unit):_ unique, two-solution and contradictory fixtures. `check` rejects two touching areas of size 3 and names their cells.
- [ ] **AC3**: The payload carries only the givens.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on 5 files.
- [ ] **AC4**: Signed in, entries persist across a reload, and a full solve completes.
  - _Verify (browser + db)._
- [ ] **AC5**: The puzzle can be solved by keyboard alone. Both themes render correctly at 1280px and 390px, and the area borders stay legible.
  - _Verify (browser):_ screenshots `.verification/T096/ac5-*.png`.
- [ ] **AC6**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
