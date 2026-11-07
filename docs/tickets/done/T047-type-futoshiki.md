---
id: T047
title: "Puzzle type: futoshiki"
milestone: M4
epic: E8
depends_on: [T046]
migrations: true
requires_human: false
spec: ["SPEC §2.3", "SPEC §7.4.4 (futoshiki)", "PLAN §3 M4", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T047: Puzzle type: futoshiki

## Context

Futoshiki is a 5×5 Latin square with inequality signs between cells (SPEC §2.3, from the Radio Times special). It is a "Cell grids" type that reuses `CellInput` and the sudoku notes UI from T046, and adds an inequality overlay. As with sudoku, no solution is stored.

## Scope

**In**

- `src/puzzles/futoshiki/`, built per `/new-puzzle-type`.
- Tables per SPEC §7.4.4: `futoshiki_puzzles` (size), `futoshiki_givens`, `futoshiki_inequalities` (enums `ineq_direction` and `ineq_relation`), `futoshiki_attempts`, `futoshiki_attempt_cells` and `futoshiki_attempt_notes`.
- An inequality overlay drawn between cells.
- A solution-counting solver.
- 5 original puzzles.

**Out**

- Sizes other than those stored per puzzle. The UI must handle a `size` of 4–7, but the content is 5×5.

## Notes

- Use the existing `pgEnum` declarations for `ineq_direction` and `ineq_relation` if T046 or other work already created them. Don't duplicate enums.
- Digit and coordinate checks must reference the puzzle's `size`. A CHECK can't do a cross-table lookup, so validate `digit <= size` in `check.ts` and `contentSchema`, and use a static `CHECK (digit BETWEEN 1 AND 9)` in the DB.

## Acceptance criteria

- [ ] **AC1**: The tables, enums and subtype FK exist as specified.
  - _Verify (db):_ `\dT+ ineq_relation` lists `lt` and `gt`. An inequality with relation `'eq'` fails, and a wrong-type subtype insert fails (in a transaction, along with a valid insert).
- [ ] **AC2**: The inequality primary key prevents duplicate constraints on the same cell edge.
  - _Verify (db):_ inserting two rows with the same `(puzzle_id, row, col, direction)` fails.
- [ ] **AC3**: Solution counting and `check` behave correctly.
  - _Verify (unit):_ fixtures for a unique puzzle, a puzzle with an inequality removed so it has 2+ solutions, and a contradictory puzzle. `check` rejects a completion that violates one inequality and names the cells.
- [ ] **AC4**: Uniqueness holds and the payload doesn't leak.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on 5 content files.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC5**: Signed in, a full solve records entries and completion.
  - _Verify (browser + db):_ solve one puzzle, reload mid-way and confirm persistence. `futoshiki_attempt_cells` has rows and `completed_at` is set.
- [ ] **AC6**: The solve can be completed with the keyboard only, and the inequality signs carry an accessible label (e.g. "less than").
  - _Verify (browser):_ a keyboard-only solve. `browser_snapshot` shows the labels.
- [ ] **AC7**: Both themes render correctly at 1280px and 390px, and the inequality glyphs stay legible.
  - _Verify (browser):_ screenshots `.verification/T047/ac7-*.png`.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
