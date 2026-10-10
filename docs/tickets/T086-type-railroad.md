---
id: T086
title: "Puzzle type: railroad"
milestone: M6
epic: E11
depends_on: [T021]
migrations: true
requires_human: false
spec: ["SPEC §2.4 (railroad)", "SPEC §7.4.4 (railroad)", "SPEC §10 (decision 6)", "PLAN §3 M6"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T086: Puzzle type: railroad

## Context

Railroad (also called train tracks) is one of the Radio Times grid puzzles. You lay a single track from the green light to the red light so that the row and column counts match (SPEC §2.4). It goes in the Spatial category. No solution is stored.

## Scope

**In**

- **`src/puzzles/railroad/`**, built per `/new-puzzle-type`. Tables: `railroad_puzzles`, `railroad_row_counts`, `railroad_col_counts`, `railroad_given_pieces` (enum `track_piece`), `railroad_attempts`, `railroad_attempt_pieces` and `railroad_attempt_crosses`, as in SPEC §7.4.4.
- **`engine.ts`:**
  - `trace(puzzle, pieces)`: follows the track from the entry and reports whether it reaches the exit, plus any break, branch or stray piece;
  - `countSolutions(puzzle, limit)`: a backtracking search that prunes on the counts and on connectivity.
- **`check.ts`:** accepts any layout that satisfies every rule in SPEC §2.4 and keeps the given pieces; returns `cellsWrong`.
- **Solver UI:**
  - drag across cells to lay track, with pieces inferred from the path;
  - tap a cell to cycle its piece, cross or blank;
  - keyboard: move the cursor with the arrows, choose a piece with keys, `x` for a cross;
  - row and column counts turn complete or over;
  - the track-piece glyphs are ink-line SVG.
- **Content:** 5 original puzzles from 6×6 to 8×8.
- **Preview:** add `src/puzzles/<type>/preview.tsx` (T129) and register it in `src/puzzles/previews.ts`. Typecheck fails until you do.

**Out**

- Hex grids and multi-train variants.

## Notes

- Entry and exit sides use `compass8` restricted to `n`, `e`, `s` and `w` by a CHECK. Check that each end lies on its named edge in `contentSchema` and `check`, not in the DB.
- Counts are clues, not derived data, because the solution isn't stored. That keeps the tables in 3NF.
- Write the puzzles from the solution backwards (Mr Todd's principle). Don't copy the Radio Times or KrazyDad grids (SPEC §10, decision 6).

## Acceptance criteria

- [ ] **AC1**: The tables, enums and CHECKs exist, and a `diagonal` side or a 12-row puzzle is rejected.
  - _Verify (db):_ `\d railroad_puzzles`, plus failing inserts.
- [ ] **AC2**: The engine traces and counts correctly.
  - _Verify (unit):_ fixtures for a unique puzzle (count 1), the same puzzle with a count removed (2+), a contradictory one (0), a track with a loop, a branch, and a stray piece off the path.
- [ ] **AC3**: `check` accepts a valid layout and rejects one that matches every count but contains a separate loop, naming the cells.
  - _Verify (unit)._
- [ ] **AC4**: The payload carries only the counts, the ends and the given pieces.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on 5 files.
- [ ] **AC5**: Signed in, a drag-laid solve persists across a reload and completes.
  - _Verify (browser + db):_ `railroad_attempt_pieces` has rows and `completed_at` is set.
- [ ] **AC6**: The puzzle can be solved by keyboard alone.
  - _Verify (browser)._
- [ ] **AC7**: Both themes render correctly at 1280px and 390px, and the entry and exit lights are distinguishable without colour.
  - _Verify (browser):_ screenshots `.verification/T086/ac7-*.png`.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
