---
id: T026
title: Retro-move engine
milestone: M2
epic: E6
depends_on: [T025]
migrations: false
requires_human: false
spec: ["SPEC §5.1 (Mode A engine)", "SPEC §8.1"]
skills: []
---

# T026: Retro-move engine

## Context

This is the pure core of Reverse Chess. It takes a position and a retro move, builds the prior position, validates it, and replays the move forward with `chess.js` to confirm it reproduces the given position (SPEC §5.1). T027's verifier and the Mode A and B checkers depend on it.

## Scope

**In**

- `src/puzzles/reverse-chess/engine.ts`, with:
  - `applyRetro(position, retro) → { ok: true, prior } | { ok: false, reason }`
  - `validatePrior(prior)`
  - `replayMatches(prior, retro, position)`
- `engine.test.ts`.

**Out**

- Enumeration and uniqueness (T027), and the UI.

## Notes

- **Retro move semantics.** `from` and `to` use forward-move meaning: the piece travelled `from → to`, and now stands on `to`. Optional fields: `uncapture` (a piece type of the side that did *not* move, placed back on `to`), `unpromote` (the piece on `to` reverts to a pawn on `from`), and `special` (`en_passant` or `castle`).
- **Rejection reasons** are a string-literal union exported from `engine.ts`:
  - `no_piece_on_to`
  - `wrong_side`
  - `origin_occupied`
  - `non_moving_side_in_check`
  - `illegal_uncapture` (a king, or a pawn on rank 1 or 8)
  - `illegal_unpromote`
  - `replay_mismatch`
  - `invalid_fen`
- **Comparison.** `replayMatches` compares piece placement, side to move, castling and en passant. It ignores the halfmove and fullmove counters.
- **chess.js 1.4.**
  - `new Chess(fen)` throws on invalid FENs, so wrap it and map the error to `invalid_fen`.
  - It does not reject a position where the side *not* to move is in check. Test that explicitly: flip the turn and use `isCheck()`.
  - `move()` throws on an illegal move in v1, rather than returning `null`.

## Acceptance criteria

Each fixture below is a named Vitest case.

- [ ] **AC1**: A quiet move is applied and replayed.
  - _Verify (unit):_ position `k7/8/1K6/8/8/8/8/R7 b - - 1 1` with retro `{from:'h1',to:'a1'}` gives a prior with placement `k7/8/1K6/8/8/8/8/7R` and `w` to move. `replayMatches` returns true.
- [ ] **AC2**: A prior position with the side not to move in check is rejected.
  - _Verify (unit):_ the same position with retro `{from:'a2',to:'a1'}` returns `{ ok:false, reason:'non_moving_side_in_check' }`, because the rook on a2 already checks the king on a8 with White to move.
- [ ] **AC3**: Uncapture.
  - _Verify (unit):_ `4k3/5N2/8/8/8/8/8/4K3 b - - 0 1` with `{from:'g5',to:'f7',uncapture:'p'}` gives the prior placement `4k3/5p2/8/6N1/8/8/8/4K3`, `w`.
- [ ] **AC4**: Unpromotion.
  - _Verify (unit):_ `4Q3/8/8/8/8/8/8/k3K3 b - - 0 1` with `{from:'e7',to:'e8',unpromote:true}` gives `8/4P3/8/8/8/8/8/k3K3`, `w`.
- [ ] **AC5**: Castling un-move.
  - _Verify (unit):_ `4k3/8/8/8/8/8/8/5RK1 b - - 1 1` with `{from:'e1',to:'g1',special:'castle'}` gives the prior placement `4k3/8/8/8/8/8/8/4K2R`, castling `K`, `w`.
- [ ] **AC6**: En passant un-move.
  - _Verify (unit):_ `4k3/8/3P4/8/8/8/8/4K3 b - - 0 1` with `{from:'e5',to:'d6',special:'en_passant'}` gives the prior `4k3/8/8/3pP3/8/8/8/4K3 w - d6`, with the black pawn restored on d5.
- [ ] **AC7**: Illegal uncaptures and unpromotions are rejected.
  - _Verify (unit):_
    - an uncapture of `'k'` returns `illegal_uncapture`;
    - an uncapture of `'p'` onto rank 1 or 8 returns `illegal_uncapture`;
    - an unpromote where `to` is not on the back rank returns `illegal_unpromote`.
- [ ] **AC8**: Structural rejections.
  - _Verify (unit):_
    - an empty `to` returns `no_piece_on_to`;
    - moving a piece of the side to move returns `wrong_side`;
    - an occupied `from` returns `origin_occupied`.
- [ ] **AC9**: The engine is pure.
  - _Verify (code):_ `grep -nE "from ['\"](react|next|@/db|drizzle)" src/puzzles/reverse-chess/engine.ts` returns nothing.
- [ ] **AC10**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
