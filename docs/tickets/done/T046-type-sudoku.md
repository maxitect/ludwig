---
id: T046
title: "Puzzle type: sudoku (+ end-to-end flow 5, keyboard-only)"
milestone: M4
epic: E8
depends_on: [T021]
migrations: true
requires_human: false
spec: ["SPEC §2.3", "SPEC §7.4.4 (sudoku)", "SPEC §8.2 (flow 5)", "PLAN §3 M4", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T046: Puzzle type: sudoku (+ end-to-end flow 5, keyboard-only)

## Context

Sudoku is a "Cell grids" type (PLAN §3 M4). It stores only the givens. The solution is never stored: any valid completion is correct, because uniqueness is proven at authoring time (SPEC §7.4.1 rule 1). It reuses `CellInput` from T021 and adds pencil-mark notes.

## Scope

**In**

- `src/puzzles/sudoku/`, built per `/new-puzzle-type`.
- Tables: `sudoku_puzzles`, `sudoku_givens`, `sudoku_attempts`, `sudoku_attempt_cells`, `sudoku_attempt_notes`. `digit` has a `CHECK` of 1–9, and row/col have a `CHECK` of 0–8 (SPEC §7.4.4).
- `engine.ts`: a solver that counts solutions up to 2 and is used by `puzzles:verify`.
- A notes mode (a toggle plus a keyboard shortcut) in the solver.
- Mirrored-digit decorative background (SPEC §6.3), as a static class only.
- 5 original puzzles across difficulties 1–5.
- Playwright end-to-end flow 5: a keyboard-only sudoku solve (SPEC §8.2).

**Out**

- A runtime puzzle generator. Content is curated.
- Futoshiki (T047), which will reuse the notes UI.

## Acceptance criteria

- [ ] **AC1**: The tables exist with the subtype pattern and checks.
  - _Verify (db):_ `\d sudoku_puzzles` shows a generated `type_key` and the composite FK to `puzzles(id, type_key)`.
  - _Verify (db):_ in a transaction, inserting a `sudoku_givens` row with digit 0 fails on the CHECK, a `sudoku_puzzles` row for a puzzle of another type fails on the FK, and a valid insert succeeds.
- [ ] **AC2**: No solution is stored anywhere.
  - _Verify (code):_ `grep -rn "solution" src/puzzles/sudoku/tables.ts` returns nothing.
- [ ] **AC3**: The solver proves uniqueness. `puzzles:verify` fails a puzzle with 0 or ≥ 2 solutions.
  - _Verify (unit):_ `engine.test.ts` has fixtures for a unique puzzle (count = 1), a puzzle with one given removed so it has 2+ solutions (count = 2), and a contradictory puzzle (count = 0).
  - _Verify (cli):_ `pnpm puzzles:verify` passes on the 5 content files.
- [ ] **AC4**: `check` accepts any valid completion that respects the givens, and rejects a single-cell perturbation, reporting the wrong cells.
  - _Verify (unit):_ `check.test.ts`.
- [ ] **AC5**: The payload contains only the givens.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC6**: Signed in, digits and notes persist and completion is recorded.
  - _Verify (browser):_ enter digits and notes, reload, and confirm both persist.
  - _Verify (db):_ `sudoku_attempt_cells` and `sudoku_attempt_notes` rows exist for the attempt, and `completed_at` is set after a full solve.
- [ ] **AC7**: End-to-end flow 5 passes. The Playwright test `e2e/sudoku-keyboard.spec.ts` solves a seeded sudoku using keyboard events only (no clicks after page load) and asserts the Solved state.
  - _Verify (cli):_ `pnpm test:e2e e2e/sudoku-keyboard.spec.ts` passes.
- [ ] **AC8**: Both themes render correctly at 1280px and 390px, given cells are visually distinct from entered ones (hand font, crayon), and notes are legible at 390px.
  - _Verify (browser):_ screenshots `.verification/T046/ac8-*.png`.
- [ ] **AC9**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
