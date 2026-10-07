---
id: T089
title: "Puzzle type: Circle9"
milestone: M6
epic: E11
depends_on: [T046]
migrations: true
requires_human: false
spec: ["SPEC §2.4 (circle9)", "SPEC §7.4.4 (circle9)", "SPEC §10 (decision 6)", "PLAN §3 M6"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T089: Puzzle type: Circle9

## Context

Circle9 ("This is not a Sudoku!") is in the Radio Times special. On a sparse 9×9 grid of digits, the player circles one of each digit 1–9, with one circle per row, column and box (SPEC §2.4). It reuses the sudoku grid layout from T046. No solution is stored.

## Scope

**In**

- **`src/puzzles/circle9/`**, built per `/new-puzzle-type`. Tables: `circle9_puzzles`, `circle9_numbers`, `circle9_attempts` and `circle9_attempt_circles`, as in SPEC §7.4.4.
- **`engine.ts`:** `countSolutions`, an exact-cover search over rows, columns, boxes and digits.
- **`check.ts`:** rejects a circle on an empty cell, and returns `cellsWrong` for clashing circles.
- **Solver UI:** the sudoku grid with box borders. Tap or press Space to circle a number, drawn as a red pencil ring. Clashing circles are marked.
- **Content:** 5 original puzzles.

**Out**

- Other sizes.

## Notes

- Name the type "Circle9" in the UI to match the special. Credit the format to James Dewar (circle9puzzle.com) in the type description in `content/lookups.ts`. The puzzles are our own (SPEC §10, decision 6).

## Acceptance criteria

- [ ] **AC1**: The tables and CHECKs exist.
  - _Verify (db):_ digit 0 and row 9 are rejected.
- [ ] **AC2**: Solution counting is correct.
  - _Verify (unit):_ fixtures for a unique puzzle, one with an extra decoy number that creates a second solution, and a contradictory one.
- [ ] **AC3**: `check` rejects nine valid-looking circles that repeat a digit, and rejects a circle on an empty cell.
  - _Verify (unit)._
- [ ] **AC4**: The payload carries only the numbers.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on 5 files.
- [ ] **AC5**: Signed in, circles persist across a reload, and a full solve completes.
  - _Verify (browser + db)._
- [ ] **AC6**: The puzzle can be solved by keyboard alone, and a circled cell is announced as circled. Both themes render correctly at 1280px and 390px.
  - _Verify (browser):_ screenshots `.verification/T089/ac6-*.png`.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
