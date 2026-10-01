---
id: T030
title: Mode B "Unwind" plus descriptive notation
milestone: M2
epic: E6
depends_on: [T029]
migrations: false
requires_human: false
spec: ["SPEC §5.1 (Mode B)", "SPEC §7.4.3 (user_settings.chess_notation)"]
skills: []
---

# T030: Mode B "Unwind" plus descriptive notation

## Context

Mode B asks the player to take back N half-moves to reach a stated goal. The descriptive-notation toggle ("N–Q1") is the nod to the Henry scene (SPEC §1.3, §5.1).

## Scope

**In**

- The solver for `mode='unwind'`: a chain built one retro move at a time, with a visible retro move list, step undo, and Check (which flags the first invalid step).
- `check.ts` for Mode B.
- `derive.ts`: `toAlgebraic(ply, position)` and `toDescriptive(ply, position)`.
- A notation toggle in the solver. It persists to `user_settings.chess_notation` when signed in and to `localStorage` when signed out.
- One 2-ply dev content file that passes `puzzles:verify`.

**Out**

- The settings page UI (T065).

## Notes

- **Descriptive notation** names squares from the moving side's perspective, with files named after the pieces that started on them (QR, QN, QB, Q, K, KB, KN, KR).
- **Output format** is `N-Q1`, `PxP`, `O-O` and `P-K8=Q`.
- **Disambiguation:** use the minimal form, e.g. `R(KR1)-Q1`. Document the rules you implement in `derive.ts` as a docstring.

## Acceptance criteria

- [ ] **AC1**: Hand-computed descriptive notation.
  - _Verify (unit):_ `derive.test.ts`:
    - White `Nf3→Ng1` (forward `g1→f3`) gives `N-KB3`.
    - Black's forward `b8→c6` gives `N-QB3`.
    - Black's forward `g8→f6` gives `N-KB3`.
    - White `e1→g1` castle gives `O-O`.
    - White `e7→e8=Q` gives `P-K8=Q`.
    - Black's forward `Ng8→e7`, with the knight landing on e7 from Black's view, gives `N-K2`.
- [ ] **AC2**: Algebraic notation.
  - _Verify (unit):_ the same plies in algebraic are `Nf3`, `Nc6`, `Nf6`, `O-O`, `e8=Q` and `Ne7`.
- [ ] **AC3**: The chain is validated incrementally.
  - _Verify (browser):_ on the 2-ply fixture, the first retro move is shown in the list. A second move that is invalid against the new prior position is still allowed until Check is pressed, and then step 2 is flagged.
- [ ] **AC4**: A correct chain solves.
  - _Verify (browser + db):_ signed in as `T030-1`, enter both plies and press Check. The stamp appears. `attempts.completed_at` is set, and `reverse_chess_attempt_plies` has 2 rows.
- [ ] **AC5**: Step undo.
  - _Verify (browser):_ undo removes the last ply and restores the board to the previous prior position.
- [ ] **AC6**: The notation toggle persists when signed in.
  - _Verify (browser + db):_ toggling to descriptive changes the list to the `N-KB3` style. `SELECT chess_notation FROM user_settings WHERE user_id=…` returns `descriptive`. After a reload, it is still descriptive.
- [ ] **AC7**: The notation toggle persists when signed out.
  - _Verify (browser):_ in a fresh context, toggle the notation and reload. The choice persists through `localStorage`, and no `user_settings` row is created.
- [ ] **AC8**: Keyboard use, reduced motion and visuals.
  - _Verify (browser):_
    - the whole chain can be entered by keyboard;
    - with `reducedMotion: 'reduce'` there are no piece transitions;
    - screenshots in both themes at 1280px and 390px;
    - the console is clean.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
