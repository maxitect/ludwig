---
id: T063
title: "Rota UI, hub integration and content"
milestone: M4
epic: E6
depends_on: [T062, T028, T031]
migrations: false
requires_human: false
spec: ["SPEC §5.1 Mode C (UI, check, board styling)", "SPEC §7.4.4 (rota)", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T063: Rota UI, hub integration and content

## Context

This is the playable Mode C, built on the T062 engine. The board reuses the chessboard look from T028 (paper and ink squares, A–H and 1–8), with worker tokens in place of pieces. Players "unswap" tokens, and each step is shown as a red pencil line on a visible stack (SPEC §5.1).

## Scope

**In**

- `load.ts` (workers, intended and final squares, and clue display texts, with no solution) and `check.ts`. `check` applies the submitted sequence forwards from the intended state, compares it with the final state, validates all clues, and requires the named instigator to match.
- **`solver.tsx`:**
  - Drag or tap two tokens to unswap them.
  - Undo pops a step from the swap stack.
  - The final answer adds an "Opening gambit" picker for the instigator.
  - The board squares reuse the T028 square styling. Extract a shared board-square component only if T028 hasn't already exposed one.
- **The Reverse Chess hub** (`/reverse-chess`, T031) gains a third mode card, "The Rota".
- **Content:** 5 original rota puzzles. One of them is "The Building Site", modelled on the S1E4 case with renamed workers.

**Out**

- Engine changes beyond bug fixes. If clue kinds are missing, stop and raise it.

## Acceptance criteria

- [ ] **AC1**: `puzzles:verify` runs `solve` and requires exactly one sequence per content file.
  - _Verify (cli):_ it passes on 5 files and fails on a broken copy (one clue removed).
- [ ] **AC2**: The payload omits the swaps and the instigator.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC3**: `check` accepts the unique sequence and the correct instigator. It rejects a correct sequence with the wrong instigator, and a sequence that violates one clue, naming the clue.
  - _Verify (unit)._
- [ ] **AC4**: Signed in, the swap stack persists across reloads, and completion is recorded.
  - _Verify (browser + db):_ `rota_attempt_swaps` rows are in step order, and `completed_at` is set.
- [ ] **AC5**: The hub shows three modes, and The Rota links to `/puzzles/rota`.
  - _Verify (browser)._
- [ ] **AC6**: The game is keyboard-operable: select token A, then token B, then Enter to unswap, and a shortcut to undo. The stack is announced.
  - _Verify (browser):_ `browser_snapshot`.
- [ ] **AC7**: Both themes render at 1280px and 390px, with pencil lines drawn in red and the stack legible on mobile.
  - _Verify (browser):_ screenshots.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
