---
id: T097
title: "Puzzle type: norinori"
milestone: M6
epic: E11
depends_on: [T084]
migrations: true
requires_human: false
spec: ["SPEC §2.4 (norinori)", "SPEC §7.4.4 (norinori)", "SPEC §10 (decision 6)", "PLAN §3 M6"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T097: Puzzle type: norinori

## Context

Norinori is one of KrazyDad's lab formats (SPEC §1.1). Shade two cells per region so that the shaded cells form dominoes that never touch along an edge (SPEC §2.4). It reuses T084's region-border overlay. No solution is stored.

## Scope

**In**

- **`src/puzzles/norinori/`**, built per `/new-puzzle-type`. Tables: `norinori_puzzles`, `norinori_region_cells`, `norinori_attempts` and `norinori_attempt_marks` (enum `norinori_mark`), as in SPEC §7.4.4.
- **`engine.ts`:** `countSolutions`, a region-by-region search with domino and adjacency pruning, capped at 2.
- **`verify`:** full coverage, edge-connected regions of at least two cells, and exactly one solution.
- **Solver UI:**
  - the shared region-border overlay;
  - tap to cycle shade, dot and blank;
  - the same keyboard model as star battle (T087), whichever lands first owns it;
  - shaded cells that break the domino rule are marked.
- **Content:** 5 original puzzles from 6×6 to 10×10.

**Out**

- Variants with numbered regions.

## Acceptance criteria

- [ ] **AC1**: The tables, CHECKs and enum exist.
  - _Verify (db)._
- [ ] **AC2**: Counting is correct.
  - _Verify (unit):_ unique, two-solution and contradictory fixtures. `check` rejects an L-shaped tromino of shaded cells and two dominoes touching along an edge, naming the cells.
- [ ] **AC3**: `verify` rejects a one-cell region and a disconnected region.
  - _Verify (unit)._
- [ ] **AC4**: The payload carries only the regions.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on 5 files.
- [ ] **AC5**: Signed in, marks persist across a reload, and a full solve completes.
  - _Verify (browser + db)._
- [ ] **AC6**: The puzzle can be solved by keyboard alone. Both themes render correctly at 1280px and 390px.
  - _Verify (browser):_ screenshots `.verification/T097/ac6-*.png`.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
