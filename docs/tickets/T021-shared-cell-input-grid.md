---
id: T021
title: Shared CellInput grid
milestone: M1
epic: E5
depends_on: [T018]
migrations: false
requires_human: false
spec: ["SPEC §6.3", "SPEC §6.4", "PLAN §3 M1", "PLAN §3 M4"]
skills: []
---

# T021: Shared `CellInput` grid

## Context

This is the cell-grid input reused by crossword, sudoku, futoshiki, logic grid, word search and the spatial types (PLAN §3 M4, "Cell grids"). It is built once, generic over cell content, before its first consumer, the crossword (T022).

## Scope

**In** (all in `src/puzzles/_shared/cell-grid/`):

- A `CellGrid` component.
- Props:
  - `rows` and `cols`;
  - `cells`: playable cells keyed by `(row, col)`; any coordinate missing from `cells` is a block;
  - `value(row, col)` and `onChange(row, col, value)`;
  - `accept`: a validator such as a single A–Z letter or a digit 1–9;
  - `direction`: `across`/`down`, toggled by clicking the active cell again;
  - an optional `highlight` set;
  - an optional cell `annotation` slot (clue numbers, inequality glyphs).
- **Keyboard:**
  - arrow keys move;
  - Tab and Shift+Tab move between entries, or words when a word map is passed;
  - Backspace clears and steps back;
  - typing advances in the current direction;
  - Space toggles direction.
- **Rendering:**
  - entered values use the hand font in `crayon`, with a ±2° rotation seeded by cell index so SSR output is stable (`.claude/rules/design-system.md`);
  - blocks are filled with ink.
- **Accessibility:** a `role="grid"` with rows and gridcells, `aria-label`s that include coordinates and annotations, and a roving tabindex.
- **Touch:** tapping a cell opens the native keyboard through a hidden input. No custom on-screen keyboard.

**Out**

- Crossword clue lists and word maps (T022).
- Sudoku notes (T046).

## Notes

- Keep it generic. No crossword-specific concepts beyond an optional `words` map for Tab navigation.

## Acceptance criteria

- [ ] **AC1**: The grid renders missing coordinates as ink blocks, and they can't be focused.
  - _Verify (unit):_ `cell-grid.test.tsx` renders a 3×3 grid with one block. That block has no tabindex and the ink fill class, and there are 8 focusable gridcells.
- [ ] **AC2**: Keyboard navigation and entry follow the scope rules.
  - _Verify (unit):_ Tests with `user-event` cover: typing "ab" fills two cells across; Space switches to down; arrows skip blocks; Backspace clears the current cell then steps back; Tab jumps to the next word when `words` is supplied.
- [ ] **AC3**: The `accept` validator blocks invalid characters.
  - _Verify (unit):_ With a digit validator, typing "a" leaves the cell empty and typing "5" sets it.
- [ ] **AC4**: The rotation is deterministic, so there is no hydration mismatch.
  - _Verify (unit + browser):_
    - The test renders twice and gets identical `transform` values per cell.
    - In the browser, render a test page that uses `CellGrid` with prefilled values; `browser_console_messages` has no hydration warnings.
- [ ] **AC5**: The ARIA structure is correct.
  - _Verify (browser):_ The `browser_snapshot` of the test page shows a `grid` role with `row`/`gridcell` children, and each cell's accessible name includes its row and column.
- [ ] **AC6**: Touch entry works.
  - _Verify (browser):_ At a 390px viewport with touch emulation, `browser_click` a cell; the hidden input receives focus (`document.activeElement` is the input). Typing fills the cell.
- [ ] **AC7**: The grid looks correct in both themes.
  - _Verify (browser):_ Screenshots of the test grid with blocks, entries, a highlight and annotations, in Paper and Ink at 1280px and 390px, under `.verification/T021/`.
- [ ] **AC8**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
