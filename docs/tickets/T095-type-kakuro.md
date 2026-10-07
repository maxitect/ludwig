---
id: T095
title: "Puzzle type: kakuro"
milestone: M6
epic: E11
depends_on: [T021]
migrations: true
requires_human: false
spec: ["SPEC §2.4 (kakuro)", "SPEC §7.4.4 (kakuro)", "SPEC §10 (decision 6)", "PLAN §3 M6"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T095: Puzzle type: kakuro

## Context

Kakuro (cross-sums) is a long-running KrazyDad series (SPEC §1.1) and gives the Numbers category a second type alongside napkin maths. The solution digits are stored and the clues are derived from them, the same way crossword numbering is derived from the grid (SPEC §2.4, §7.4.4).

## Scope

**In**

- **`src/puzzles/kakuro/`**, built per `/new-puzzle-type`. Tables: `kakuro_puzzles`, `kakuro_cells` **(S)**, `kakuro_attempts` and `kakuro_attempt_cells`, as in SPEC §7.4.4.
- **`derive.ts`:** the runs and their clue sums from the white cells.
- **`engine.ts`:** `countSolutions`, pruning with precomputed digit-combination tables per (sum, length).
- **`verify`:**
  - every white cell is in both an across and a down run;
  - every run is 2–9 cells long with no repeated digit;
  - exactly one solution.
- **Solver UI:** `CellInput` on the white cells. Black cells show split clue triangles. A run that is complete but wrong is marked. An optional combinations hint lists the digit sets a run's sum allows; it is computed in the client from the clue, so it reveals nothing.
- **Content:** 5 original puzzles from 6×6 to 10×10.

**Out**

- Krypto-kakuro (letters for digits).

## Acceptance criteria

- [ ] **AC1**: The tables and CHECKs exist.
  - _Verify (db):_ digit 0 is rejected.
- [ ] **AC2**: Derivation and counting are correct.
  - _Verify (unit):_ clue derivation for a fixture grid. Counting fixtures for a unique puzzle, a two-solution puzzle (a 2×2 block with interchangeable digits) and a contradictory one.
- [ ] **AC3**: `verify` rejects a single-cell run and a run with a repeated digit.
  - _Verify (unit)._
- [ ] **AC4**: The payload carries the white cells and the clues, never the digits.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on 5 files.
- [ ] **AC5**: Signed in, entries persist across a reload, and a full solve completes.
  - _Verify (browser + db)._
- [ ] **AC6**: The puzzle can be solved by keyboard alone, and focusing a cell announces its across and down sums. Both themes render correctly at 1280px and 390px.
  - _Verify (browser):_ screenshots `.verification/T095/ac6-*.png`.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
