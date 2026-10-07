---
id: T085
title: "Puzzle type: chess problem (forward mate in N)"
milestone: M6
epic: E11
depends_on: [T025, T028, T018, T071]
migrations: true
requires_human: false
spec: ["SPEC §1.2.1", "SPEC §2.4 (chess-problem)", "SPEC §7.4.4 (chess-problem)", "SPEC §10 (decision 6)", "PLAN §3 M6"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T085: Puzzle type: chess problem (forward mate in N)

## Context

Alan Connor's chess problem in the Radio Times special works forwards: "If you make move A, Black will make move B — and you will win with move C" (SPEC §1.2.1). It is a new `chess-problem` type, mate in 1 or 2, that reuses the Reverse Chess board and enums (SPEC §2.4, §7.4.4).

## Scope

**In**

- **`src/puzzles/chess-problem/`**, built per `/new-puzzle-type`. Tables: `chess_problem_puzzles`, `chess_problem_pieces`, `chess_problem_attempts` and `chess_problem_attempt_plies`. Reuse the existing `chess_file`, `chess_piece` and `chess_colour` enums.
- **`engine.ts`** (chess.js, pure):
  - `keyMoves(position, n)`: the White moves that force mate in `n`;
  - `defence(position, n)`: Black's reply, chosen as in SPEC §2.4;
  - `checkLine(position, n, plies)`: whether a submitted line ends in mate within `2n − 1` plies, starting with a key move.
- **`verify`:** the position is legal, there is no mate in fewer moves, and exactly one key move exists.
- **Solver UI:** the T028 board. The player moves White, the engine's Black reply is shown with a short delay and labelled "B", and the final move is labelled "C". Reset and undo work. The Reverse Chess notation setting applies to the move list.
- **Content:** 5 original problems: 2 mate in 1 and 3 mate in 2.

**Out**

- Mate in 3 or more. N is capped at 2 for the `check` time budget (SPEC §2.4).
- Helpmates, selfmates and studies.
- A card on the `/reverse-chess` hub.

## Notes

- **Engine fixture (test only, never content).** This is Connor's problem from the special:
  - FEN: `5rk1/1Q3ppp/8/8/2B2b2/5PqP/6P1/4R2K w - - 0 1`, mate in 2.
  - The only key move is `Qxf7+`. The defence is `Rxf7`, which is forced, and the mate is `Re8#`; the bishop on c4 pins the rook. This was checked with chess.js while the ticket was written.
- `check` runs in a server action. Measure the worst case on the content and fixtures, and record it in the report.

## Acceptance criteria

- [ ] **AC1**: The tables exist with the subtype pattern, and `mate_in` outside 1–2 fails.
  - _Verify (db):_ `\d chess_problem_puzzles`, plus a failing insert with `mate_in = 3`.
- [ ] **AC2**: No solution is stored.
  - _Verify (code):_ `grep -rn "solution" src/puzzles/chess-problem/tables.ts` returns nothing.
- [ ] **AC3**: The engine finds keys and checks lines correctly.
  - _Verify (unit):_ the Connor fixture gives exactly `["Qxf7+"]`. A cooked fixture with two keys gives two, and `verify` rejects it. A position with a shorter mate is rejected. `checkLine` accepts `Qxf7+ Rxf7 Re8#`, rejects a line that starts with a non-key move, and rejects a line that doesn't end in mate.
- [ ] **AC4**: `check` stays fast.
  - _Verify (unit):_ the worst mate-in-2 content or fixture position checks in under 200 ms locally. The measured figure is in the report.
- [ ] **AC5**: The payload carries no key move or line.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC6**: Signed in, a full solve records plies and completion. A wrong first move shows a "that doesn't force mate" message and doesn't complete the puzzle.
  - _Verify (browser + db):_ `chess_problem_attempt_plies` has rows and `completed_at` is set.
- [ ] **AC7**: The problem can be solved by keyboard alone, and Black's reply is announced to screen readers.
  - _Verify (browser):_ a keyboard-only solve. `browser_snapshot` shows the live region.
- [ ] **AC8**: Both themes render correctly at 1280px and 390px.
  - _Verify (browser):_ screenshots `.verification/T085/ac8-*.png`.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
