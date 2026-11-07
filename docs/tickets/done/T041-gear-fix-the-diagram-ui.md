---
id: T041
title: Fix the Diagram UI
milestone: M3
epic: E7
depends_on: [T040, T035]
migrations: false
requires_human: false
spec: ["SPEC §5.2.1", "SPEC §5.2.2 (Fix the Diagram)", "SPEC §5.2.4"]
skills: []
---

# T041: Fix the Diagram UI

## Context

This recreates the episode's twist: the printed diagram has no solution until the player swaps up to K pairs of starting slots (SPEC §5.2.1). It applies to puzzles with `max_adjustments > 0`.

## Scope

**In**

- **Swap mode.** Tap gear X, then gear Y, to swap their starting slots. Tapping a swapped pair again undoes the swap. A counter shows "Adjustments: n/K".
- The board, crank and scrubber all re-render from the adjusted diagram, through the engine.
- Persistence in `gear_attempt_swaps`.
- `check.ts` extended: correct iff the swap set equals `gear_solution_swaps` **and** `(c, f, g)` matches.
- An intro note for the variant that quotes "100% solvable if we adjust a couple of the starting positions".

**Out**

- Content (T044).

## Acceptance criteria

- [ ] **AC1**: Swap-set equality in the check.
  - _Verify (unit):_ for the solution swaps `{(C,E)}`, submitting `{(E,C)}` is correct (order-insensitive), `{(C,D)}` is incorrect, and `{}` is incorrect.
- [ ] **AC2**: The diagram can't be won until it is fixed.
  - _Verify (browser):_ on a T035-generated K=1 variant, with no swaps, scrubbing through markers 1–8 at several cranks never shows exactly one seer. The live region confirms it.
- [ ] **AC3**: The swap counter and limit.
  - _Verify (browser):_ with K=1, the first swap shows "Adjustments: 1/1". Selecting a further pair is blocked, with an explanation. Undoing the swap returns the counter to 0/1.
- [ ] **AC4**: The repair plus the accusation solves the puzzle.
  - _Verify (browser + db):_ signed in as `T041-1`:
    1. Apply the stored repair swap, set the stored crank and convergence, and accuse the stored killer.
    2. The stamp appears.
    3. `gear_attempt_swaps` contains exactly the repaired pair.
- [ ] **AC5**: Swaps can't cross puzzles.
  - _Verify (db):_ inserting a `gear_attempt_swaps` row that references a gear from another puzzle fails with an FK violation.
- [ ] **AC6**: Swaps persist.
  - _Verify (browser):_ apply a swap and reload. The swap and the counter are restored.
- [ ] **AC7**: Keyboard swapping.
  - _Verify (browser):_ select two gears with the arrow keys and Enter, and undo with Backspace on the selected pair.
- [ ] **AC8**: Visuals and console.
  - _Verify (browser):_ swapped gears are visibly marked (an ink outline plus a pencil line between their original slots). Screenshots in both themes at 1280px and 390px. The console is clean.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
