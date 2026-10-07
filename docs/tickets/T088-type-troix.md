---
id: T088
title: "Puzzle type: Troix"
milestone: M6
epic: E11
depends_on: [T021]
migrations: true
requires_human: false
spec: ["SPEC §2.4 (troix)", "SPEC §7.4.4 (troix)", "SPEC §10 (decision 6)", "PLAN §3 M6"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T088: Puzzle type: Troix

## Context

Troix is the Radio Times special's three-symbol take on binairo. Fill a 6×6 or 9×9 grid with X, O and I so that each line has equal counts of each symbol and never three alike in a row (SPEC §2.4). It reuses `CellInput`. No solution is stored.

## Scope

**In**

- **`src/puzzles/troix/`**, built per `/new-puzzle-type`. Tables: `troix_puzzles`, `troix_givens` (enum `troix_symbol`), `troix_attempts` and `troix_attempt_cells`, as in SPEC §7.4.4.
- **`engine.ts`:** `countSolutions` and `conflictingIndexes`.
- **`check.ts`:** returns `cellsWrong`.
- **Solver UI:** `CellInput`, where a tap cycles X, O, I and blank, and the keys `x`, `o`, `i` and Backspace work. A run of three, or a line over its quota, is marked. The symbols are drawn in the hand font, not as letters in the body font.
- **Content:** 5 original puzzles: 2 at 6×6 and 3 at 9×9.

**Out**

- A two-symbol binairo. Add it only if a second type needs it.

## Acceptance criteria

- [ ] **AC1**: The tables, enum and the CHECK `size IN (6, 9)` exist, and size 7 is rejected.
  - _Verify (db)._
- [ ] **AC2**: Solution counting is correct.
  - _Verify (unit):_ fixtures for a unique puzzle, a two-solution puzzle and a contradictory one.
- [ ] **AC3**: `check` rejects a vertical run of three, and a row that is valid except for holding four Xs in a 9-wide grid, naming the cells.
  - _Verify (unit)._
- [ ] **AC4**: The payload carries only the givens.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on 5 files.
- [ ] **AC5**: Signed in, entries persist across a reload, and a full solve completes.
  - _Verify (browser + db)._
- [ ] **AC6**: The puzzle can be solved by keyboard alone. Both themes render correctly at 1280px and 390px, and the three symbols are distinguishable at 390px.
  - _Verify (browser):_ screenshots `.verification/T088/ac6-*.png`.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
