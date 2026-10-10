---
id: T087
title: "Puzzle type: star battle"
milestone: M6
epic: E11
depends_on: [T084]
migrations: true
requires_human: false
spec: ["SPEC §2.4 (star-battle)", "SPEC §7.4.4 (star-battle)", "SPEC §10 (decision 6)", "PLAN §3 M6"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T087: Puzzle type: star battle

## Context

Star battle is one of the Radio Times grid puzzles: place K stars in every row, column and region, with no two stars touching (SPEC §2.4). It reuses the region-border overlay built for jigsaw sudoku in T084. No solution is stored.

## Scope

**In**

- **`src/puzzles/star-battle/`**, built per `/new-puzzle-type`. Tables: `star_battle_puzzles`, `star_battle_region_cells`, `star_battle_attempts` and `star_battle_attempt_marks` (enum `star_mark`), as in SPEC §7.4.4.
- **`engine.ts`:** `countSolutions` (backtracking row by row, pruning on column, region and adjacency counts) and `conflictingIndexes`.
- **`verify`:** `size²` cells, `size` edge-connected regions, and exactly one solution.
- **Solver UI:**
  - the shared region-border overlay;
  - tap to cycle empty, dot, star;
  - keyboard: arrows, `s` for a star, `.` for a dot;
  - a star that touches another or overfills a unit is marked.
- **Content:** 5 original puzzles: 2 at 1 star (6×6 to 8×8) and 3 at 2 stars (8×8 to 10×10).
- **Preview:** add `src/puzzles/<type>/preview.tsx` (T129) and register it in `src/puzzles/previews.ts`. Typecheck fails until you do.

**Out**

- Shapes other than squares.

## Acceptance criteria

- [ ] **AC1**: The tables and CHECKs exist. `stars = 3` and `size = 11` are rejected.
  - _Verify (db)._
- [ ] **AC2**: Solution counting is correct.
  - _Verify (unit):_ fixtures for a unique puzzle, a two-solution puzzle and a contradictory one, for both K = 1 and K = 2.
- [ ] **AC3**: `verify` rejects a puzzle with a disconnected region or the wrong number of regions.
  - _Verify (unit)._
- [ ] **AC4**: `check` rejects diagonally touching stars and names both cells.
  - _Verify (unit)._
- [ ] **AC5**: The payload carries only the regions.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on 5 files.
- [ ] **AC6**: Signed in, marks persist across a reload, and a full solve completes.
  - _Verify (browser + db)._
- [ ] **AC7**: The puzzle can be solved by keyboard alone. Both themes render correctly at 1280px and 390px.
  - _Verify (browser):_ screenshots `.verification/T087/ac7-*.png`.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
