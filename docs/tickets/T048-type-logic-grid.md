---
id: T048
title: "Puzzle type: logic grid (+ false-statement variant)"
milestone: M4
epic: E8
depends_on: [T021]
migrations: true
requires_human: false
spec: ["SPEC §1.2 (S1E1)", "SPEC §2.3", "SPEC §7.4.4 (logic-grid)", "PLAN §3 M4", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T048: Puzzle type: logic grid (+ false-statement variant)

## Context

This is the classic logic grid from S1E1 (SPEC §1.2), including the variant where exactly one clue is false. The variant flag is derived, not stored: "any clue `is_false`" (SPEC §7.4.4). It is a "Cell grids" type that adds the tri-state yes/no/blank mark grid.

## Scope

**In**

- `src/puzzles/logic-grid/`, built per `/new-puzzle-type`.
- Tables per SPEC §7.4.4:
  - `logic_grid_puzzles`, `logic_grid_categories`, `logic_grid_items` (surrogate `id` plus `unique(puzzle_id, id)`), `logic_grid_clues` (with `is_false` **(S)**);
  - `logic_grid_solution_links` **(S)**, whose composite FKs keep both items in the same puzzle;
  - `logic_grid_attempts` and `logic_grid_attempt_marks` (enum `grid_mark`).
- A staircase grid UI: click or keys cycle a cell through blank, ✕, ●. A clue list where clues can be struck through.
- For the variant: an answer input to flag the false clue.
- A solver that counts solutions, and in the variant identifies exactly one false clue.
- 5 original puzzles, at least 1 of them the false-statement variant.

**Out**

- Automatic cross-out propagation. That is a v1.1 nicety; don't build it.

## Acceptance criteria

- [ ] **AC1**: The tables and composite FKs prevent cross-puzzle links.
  - _Verify (db):_ inserting a `logic_grid_solution_links` row whose `item_b_id` belongs to another puzzle fails, while a same-puzzle link succeeds (in a transaction).
- [ ] **AC2**: The variant is derived.
  - _Verify (code):_ there is no `has_false_clue` or similar column in `tables.ts`.
  - _Verify (unit):_ `derive.test.ts` asserts the variant is true exactly when a clue has `is_false`.
- [ ] **AC3**: The solver proves uniqueness. In the variant, exactly one clue choice yields exactly one consistent solution.
  - _Verify (unit):_ fixtures cover both classic and variant puzzles, plus one ambiguous puzzle of each.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on the content.
- [ ] **AC4**: The payload leaks neither the links nor `is_false`.
  - _Verify (unit):_ the payload leak test passes for a variant fixture.
- [ ] **AC5**: `check` validates the full matching and, for the variant, the flagged false clue. Wrong submissions report which category pairs are wrong.
  - _Verify (unit):_ `check.test.ts`.
- [ ] **AC6**: Signed in, marks persist and completion is recorded.
  - _Verify (browser + db):_ mark cells, reload and confirm persistence. `logic_grid_attempt_marks` rows show `yes`/`no`, and `completed_at` is set after solving.
- [ ] **AC7**: The grid is keyboard-operable (arrows plus Space to cycle) and each cell has an accessible name like "Sarah × Fire door: yes".
  - _Verify (browser):_ a keyboard-only partial solve, plus a `browser_snapshot`.
- [ ] **AC8**: Both themes render at 1280px and 390px. At 390px the grid scrolls inside its own container, not the page.
  - _Verify (browser):_ screenshots, plus a page `scrollWidth <= 390`.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
