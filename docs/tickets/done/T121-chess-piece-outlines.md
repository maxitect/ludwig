---
id: T121
title: Chess pieces outlined in the opposite colour in both themes
milestone: M5
epic: E10
depends_on: [T120]
migrations: false
requires_human: false
spec: ["SPEC §5.1", "SPEC §6.5"]
skills: []
---

# T121: Chess pieces outlined in the opposite colour in both themes

## Context

In `src/puzzles/_shared/chess-board/pieces.tsx`, `PIECE_COLOURS` gives white pieces `outline: none`. Black pieces get `var(--piece-black-outline, none)`, which is only defined in Ink. The result:

- In Paper, white pieces on light squares and black pieces on dark squares are invisible apart from their shadow.
- In Ink, black pieces get a paper stroke and look like white pieces.
- The uncapture tray icons are blank in Paper.

See `docs/research/look-and-feel-audit.md` §2.

## Scope

**In**

- **Outlines:** white pieces get an `ink` outline and black pieces a `paper` outline, in both themes, as cburnett draws them. Delete `--piece-black-outline` from `globals.css`.
- **Uncapture tray** (`uncapture-tray.tsx`): the glyphs use the same treatment and are legible in both themes.
- **Side-to-move indicator** (`src/puzzles/reverse-chess/last-move.tsx`, and the same box in unwind): it must not read as a checked checkbox in Ink. Draw it as a small piece-coloured swatch with a visible border, or as a king glyph.
- **Coordinate labels** (`chess-board.tsx`): the file and rank labels stay readable on top of pieces. Place them in a corner the glyph doesn't cover, or give them a contrasting backing.
- **Shadow cost:** `SHADOW_FILTER` stacks 8 `drop-shadow` filters per piece. Replace it with an equivalent long cast that costs at most 2 filter passes, or with a shadow drawn in the SVG. Keep the look of SPEC §5.1 ("long blue-grey drop shadow").

**Out**

- Board square colours. They stay paper and ink in both themes (T120 decision).
- The landing page's decorative pieces (`title-sequence`). Fix them only if they share `PieceGlyph`.

## Notes

- The rota board and the kitchen-sink board use the same `PieceGlyph`. Check both.
- The audit screenshot `s-revchess-paper-d.png` shows the b8 knight and the a7/c7/g7 pawns disappearing.

## Acceptance criteria

- [ ] **AC1**: Every piece is clearly visible on both square colours in both themes.
  - _Verify (browser):_ Open a reverse chess "last move" puzzle and an unwind puzzle in Paper and Ink at 1280px and 390px. In screenshots, white pieces on light squares and black pieces on dark squares show a full outline. `browser_evaluate` confirms that white piece paths have an ink stroke and black piece paths a paper stroke.
- [ ] **AC2**: Black and white pieces are distinguishable at a glance in Ink.
  - _Verify (browser):_ The Ink screenshot of the starting position shows rank 8 dark-bodied and rank 1 light-bodied.
- [ ] **AC3**: The uncapture tray glyphs are legible in both themes.
  - _Verify (browser):_ Screenshot the "Piece the move captured" tray in Paper and Ink.
- [ ] **AC4**: The side-to-move indicator does not look like a checkbox state.
  - _Verify (browser):_ Screenshots with white and with black to move, in both themes.
- [ ] **AC5**: All eight file labels and all eight rank labels are readable with the starting position on the board.
  - _Verify (browser):_ Screenshot in both themes.
- [ ] **AC6**: Each piece applies at most 2 filter passes.
  - _Verify (browser):_ `browser_evaluate` on a piece's svg returns a computed `filter` with at most 2 functions.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
