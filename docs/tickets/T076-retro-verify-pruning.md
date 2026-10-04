---
id: T076
title: Prune the Mode B goal-chain search in the Reverse Chess verifier
milestone: M2
epic: E6
depends_on: [T030]
migrations: false
requires_human: false
spec: ["SPEC §5.1 (Mode B)"]
skills: []
---

# T076: Prune the Mode B goal-chain search in the Reverse Chess verifier

## Context

`goalChains` in `src/puzzles/reverse-chess/verify.ts` walks every chain of N retro moves and calls `applyRetro` (including the chess.js replay) on each. The T030 reviewer measured about 1.2 s at depth 2 on a middlegame position (42 retro moves at depth 1). Depth 3 takes minutes and depth 4 or more is infeasible. T032 needs Mode B puzzles up to about N = 6 to verify in CI in seconds.

## Scope

**In**

- Make `goalChains` fast enough for N ≤ 6 on realistic T032 positions while keeping it exact: it must still find every chain that `check` would accept, so the uniqueness proof stays sound.
- Candidate techniques, all exact. Pick by measurement:
  - **Goal lower bounds per goal kind:** e.g. for `piece_on_square`, the minimum number of retro moves the piece needs to reach the square (by piece movement, with the side to move alternating); prune when it exceeds the remaining depth. `piece_count` bounds by the uncaptures still needed, and `castling_right` by whether king and rook can still return.
  - **Transposition memo:** cache `(retroKey(position), remaining)` → no solution, so a position reached by two move orders is searched once.
  - **Cheap pre-filter:** reject retro moves by the cheap engine checks before the full `applyRetro` replay, as long as the result is identical.
- A Vitest property test: on a fixed set of positions and goals, the pruned search returns the same chain set as the current exhaustive one at depths 1–3.
- A timing test or benchmark script with one N = 6 middlegame-like fixture.

**Out**

- Changing what `check` accepts, or the SPEC §5.1 rules.
- Writing T032's curated content.

## Notes

- `stepRetro` and `enumerateRetro` must keep agreeing (the T030 reviewer's probe in `.verification/T030/review/` compared them on 44 positions; a similar probe is a good regression test).
- Bounds must be admissible (never overestimate), or the uniqueness proof breaks.

## Acceptance criteria

- [ ] **AC1**: The pruned search returns exactly the exhaustive chain set.
  - _Verify (unit):_ the equivalence test passes on at least 20 position/goal pairs at depths 1–3, including en passant, castling, uncapture and unpromotion cases.
- [ ] **AC2**: Deep verification is fast.
  - _Verify (unit or cli):_ an N = 6 Mode B fixture with at least 20 pieces verifies in under 5 s on a dev machine; report the measured time and the depth-2/depth-3 timings before and after.
- [ ] **AC3**: Uniqueness failures still report correctly.
  - _Verify (unit):_ a fixture with two goal-reaching chains still fails with "expected exactly 1 chain …", and a wrong authored chain still fails with the mismatch error.
- [ ] **AC4**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
