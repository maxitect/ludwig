---
id: T027
title: Retro enumerator and uniqueness verifier
milestone: M2
epic: E6
depends_on: [T026]
migrations: false
requires_human: false
spec: ["SPEC §5.1 (Authoring script)", "SPEC §4.6", "SPEC §8.1"]
skills: []
---

# T027: Retro enumerator and uniqueness verifier

## Context

Every Mode A puzzle needs exactly one surviving last move, and every Mode B chain must be unique step by step. This ticket enumerates the candidates and wires the check into `pnpm puzzles:verify` (SPEC §5.1).

## Scope

**In**

- `enumerateRetro(position)` in `engine.ts`. It returns every retro move that passes `applyRetro`, plus the extra legality rules from SPEC §5.1: at most 8 pawns, no pawn on the back rank, bishop-colour feasibility, and plausible piece counts.
- `verifyReverseChess(content)`:
  - **Mode A:** exactly one survivor, and it equals the authored ply.
  - **Mode B:** at each of the `ply_count` steps, the authored ply is the unique survivor that keeps the chain consistent with the authored goal.
- Registration in `scripts/verify-puzzles.ts`.
- A printed reminder to do the manual legality (reachability) review, as SPEC §5.1 requires.

**Out**

- Full retrograde reachability analysis (explicitly out of scope in the spec), and content (T032).

## Notes

- **Mode B uniqueness.** Accept a step only if the authored ply is the single survivor that is consistent with the remaining authored plies and the goal. Document the rule you implement in the report. If the spec wording turns out to be ambiguous, raise it under "Deviations"; don't decide it silently.

## Acceptance criteria

- [ ] **AC1**: Hand-computed enumeration count.
  - _Verify (unit):_ for `k7/8/1K6/8/8/8/8/R7 b - - 1 1`, `enumerateRetro` returns exactly **47** candidates:
    - **9 quiet moves:** Rb1–Rh1 to a1 (7), plus Ka5–b6 and Ka6–b6 (2);
    - **28 rook uncaptures on a1:** 7 origins × {q, r, b, n}, since a pawn is illegal on rank 1;
    - **10 king uncaptures on b6:** 2 origins × {q, r, b, n, p}.

    The test asserts the quiet set exactly. If your count differs, explain the difference square by square in the report and escalate. Don't edit the fixture to match.
- [ ] **AC2**: Excluded candidates stay excluded.
  - _Verify (unit):_ none of the 47 candidates has origin a2–a7 for the rook, or b5, b7, c5, c6, c7 or a7 for the king.
- [ ] **AC3**: A non-unique Mode A puzzle fails verification.
  - _Verify (cli):_ the `dev-rook-check` fixture from T025 makes `pnpm puzzles:verify` exit non-zero, with a message naming the slug and the survivor count.
- [ ] **AC4**: A unique Mode A puzzle passes.
  - _Verify (cli):_ author one dev fixture with exactly one survivor. Include its full survivor enumeration (length 1) in the report. `pnpm puzzles:verify` exits 0 once AC3's fixture is removed or fixed.
- [ ] **AC5**: An authored answer that differs from the unique survivor fails.
  - _Verify (unit):_ the AC4 fixture with a deliberately wrong authored ply fails, with the message `authored ply does not match unique survivor`.
- [ ] **AC6**: The Mode B chain is checked.
  - _Verify (unit):_ a 2-ply dev chain passes. Swapping the order of its plies fails at step 1.
- [ ] **AC7**: The legality rules are applied.
  - _Verify (unit):_ a candidate that would create a 9th white pawn, and one that would put a pawn on rank 8, are both excluded from enumeration.
- [ ] **AC8**: The manual-review reminder is printed.
  - _Verify (cli):_ `pnpm puzzles:verify` output contains a "manual legality review" line for each reverse-chess slug.
- [ ] **AC9**: Performance.
  - _Verify (unit):_ enumerating `r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1` completes in under 200 ms in Vitest (assert with `performance.now()`).
- [ ] **AC10**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
