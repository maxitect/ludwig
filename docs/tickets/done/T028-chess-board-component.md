---
id: T028
title: Chess board component (react-chessboard v5, cburnett, arrow, tray)
milestone: M2
epic: E6
depends_on: [T010, T025]
migrations: false
requires_human: false
spec: ["SPEC §5.1 (Board styling)", "SPEC §6.2", "SPEC §6.5", "SPEC §10 (decision 2)"]
skills: []
---

# T028: Chess board component

## Context

This is the board used by Modes A and B, Rota (T063) and the landing page (T067). It is isolated behind our own props so that react-chessboard is an implementation detail (PLAN §7 risk).

## Scope

**In**

- `src/puzzles/_shared/chess-board/`, containing:
  - `<ChessBoard position onRetroDrop arrows highlights orientation interactive />`;
  - the cburnett SVG pieces, restyled per SPEC §5.1 (white sculptural pieces with a long `shadow`);
  - a backwards red arrow overlay;
  - `<UncaptureTray>`, which offers a piece type of the opposite colour, or none.
- Installing `react-chessboard`.
- The cburnett attribution string, exported from `src/config/` for the footer (T015 renders it).

**Out**

- Puzzle logic, checking and the move list (T029/T030).

## Notes

- **react-chessboard v5 API.** v5 takes a single `options` prop: `<Chessboard options={{ position, onPieceDrop, pieces, squareStyles, arrows, boardOrientation, allowDragging }} />`.
  - `onPieceDrop` receives `{ piece, sourceSquare, targetSquare }` and returns a boolean.
  - Custom pieces are a map of render functions.
  - Read the package README in `node_modules/react-chessboard` before you start, because v4 examples online won't work.
- **Square colours.** The board squares use the `paper` and `ink` tokens, with no library default colours.
- **Arrows.** Draw them in our own SVG overlay if the library's arrows can't be restyled to a hand-drawn red stroke.

## Acceptance criteria

- [ ] **AC1**: The board renders a position from piece rows.
  - _Verify (browser):_ the kitchen-sink section "Chess board" shows `4k3/5N2/8/8/8/8/8/4K3`, with the pieces on e8, f7 and e1 (snapshot shows aria labels per square).
- [ ] **AC2**: Brand styling in both themes.
  - _Verify (browser):_ take screenshots of the kitchen-sink board in Paper and Ink themes at 1280px and 390px.
    - Light squares are `paper` and dark squares are `ink`.
    - The pieces are white with a long shadow.
    - Square corners are not rounded.

    Store them in `.verification/T028/`.
- [ ] **AC3**: A backwards drag reports a retro drop.
  - _Verify (browser):_ drag the knight from f7 to g5. The kitchen-sink demo logs `{from:'g5',to:'f7'}` to a visible `<output>`. This is forward-move semantics, as in T026.
- [ ] **AC4**: The uncapture tray.
  - _Verify (browser):_ after AC3, the tray offers q, r, b, n, p and "none" for the opposite colour. Choosing `p` shows a black pawn on f7 in the preview.
- [ ] **AC5**: The red backwards arrow.
  - _Verify (browser):_ passing `arrows=[{from:'g5',to:'f7'}]` renders the arrow with its head at g5, in `ludwig-red`, confirmed by a screenshot.
- [ ] **AC6**: Keyboard operation.
  - _Verify (browser):_ Tab to the board, move to f7 with the arrow keys, press Enter, move to g5 and press Enter. This yields the same output as AC3. Focus rings use `grid-blue`.
- [ ] **AC7**: Reduced motion.
  - _Verify (browser):_ with `browser_emulate_media` set to `reducedMotion: 'reduce'`, piece movement has no transition. Check that the computed `transition-duration` is `0s`.
- [ ] **AC8**: The console is clean.
  - _Verify (browser):_ `browser_console_messages` shows no errors or warnings on the kitchen-sink page.
- [ ] **AC9**: Attribution is exported.
  - _Verify (code):_ `grep -rn "cburnett" src/config/` shows an attribution string that includes the licence name.
- [ ] **AC10**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
