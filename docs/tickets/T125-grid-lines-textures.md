---
id: T125
title: Single-draw grid lines, crossword numbers on phones, and textures
milestone: M5
epic: E10
depends_on: []
migrations: false
requires_human: false
spec: ["SPEC §6.3"]
skills: []
---

# T125: Single-draw grid lines, crossword numbers on phones, and textures

## Context

Grid lines alternate between black and grey, because cells have fractional widths and each cell draws its own 1px border. Background textures also stop partway down pages, and the sudoku mirrored digits read as stray glyphs. See `docs/research/look-and-feel-audit.md` §6.

## Scope

**In**

- **CellGrid lines** (`src/puzzles/_shared/cell-grid/cell-grid.tsx`, and `DigitGrid` if it shares the approach): draw every line once, so they render at one consistent weight. Use a `gap` over an ink background with integer-snapped track sizes, or one background or SVG grid. Sudoku box lines and futoshiki inequality cells stay distinct.
- **Crossword at 390px:**
  - Clue numbers on a 15×15 grid are readable (at least about 8px, positioned so they don't collide with the letter).
  - The active clue row keeps the page gutter instead of bleeding to the right edge.
- **Mirrored digits** (`globals.css` `mirrored-digits`, `src/puzzles/sudoku/solver.tsx`): the decoration either fills a deliberate area behind the grid, framed and clipped cleanly, or is removed from the solve page. It is never a lone column or clipped tops.
- **`.grid-paper`:**
  - It fills the whole page height wherever it is used (Casebook, Settings, the landing desk).
  - In Ink the crosses are toned down so they don't fight form text.

**Out**

- On-screen keyboard and solve-mode layouts (T113–T116).
- The solved-footer grid (T122).

## Acceptance criteria

- [ ] **AC1**: Grid lines render at one weight.
  - _Verify (browser):_ Zoomed screenshots of a sudoku, a futoshiki and a 15×15 crossword at 1280px and 390px in both themes show uniform line colour. `browser_evaluate` sampling of pixel colours along an interior line returns one value (allowing for grain).
- [ ] **AC2**: Crossword clue numbers are readable at 390px.
  - _Verify (browser):_ The computed `font-size` of a clue number is at least 8px. A screenshot shows the number and letter not overlapping.
- [ ] **AC3**: The mirrored digits look deliberate, or are gone.
  - _Verify (browser):_ Sudoku screenshots in both themes.
- [ ] **AC4**: Grid paper reaches the bottom of the page.
  - _Verify (browser):_ Full-page screenshots of `/casebook` and `/settings` in both themes. The texture continues to the footer.
- [ ] **AC5**: Gates pass, and existing CellGrid tests are updated, not deleted.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
