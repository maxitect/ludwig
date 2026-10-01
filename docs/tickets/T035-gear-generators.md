---
id: T035
title: Gear generator and Fix the Diagram generator
milestone: M3
epic: E7
depends_on: [T034]
migrations: false
requires_human: false
spec: ["SPEC §5.2.2 (Fix the Diagram)", "SPEC §5.2.3", "SPEC §8.1 (Gears)"]
skills: []
---

# T035: Gear generator and Fix the Diagram generator

## Context

This is seeded, deterministic generation of unique-solution diagrams and of Fix the Diagram variants with exactly one repair (SPEC §5.2.3). Daily diagrams (T036) and parts of the curated content (T044) come from it.

## Scope

**In**

- `src/puzzles/gears/generate.ts`:
  - `mulberry32(seed)`, which belongs in `src/puzzles/_shared/` if it isn't there already;
  - `generateDiagram(seed, difficulty)`;
  - `generateFixVariant(seed, difficulty, K)`;
  - `repairsOf(diagram, K)`.
- Difficulty presets, kept as data in `src/puzzles/gears/presets.ts`:
  - number of gears (6–12);
  - `h` (45 or 30);
  - teeth pool;
  - `m_in` and `m_out` ranges.

  These are tunable after the T037 playtest.
- Output matching the gears `contentSchema` (T033), so it can be seeded directly.
- `generate.test.ts`.

**Out**

- The script and DB writes (T036).

## Acceptance criteria

- [ ] **AC1**: Determinism.
  - _Verify (unit):_ `generateDiagram('2026-11-01', 'medium')` called twice deep-equals itself. A different seed produces a different diagram.
- [ ] **AC2**: Every generated diagram is unique (property test).
  - _Verify (unit):_ for 10,000 seeds (`'s0'…'s9999'`) across all difficulties, `solveAll(diagram).length === 1`. The authored solution in the output equals that single entry.
- [ ] **AC3**: Every generated mesh is bipartite and plausible.
  - _Verify (unit):_ for the same 10,000 diagrams:
    - `spinSigns` succeeds;
    - each mesh edge joins gears whose slots are adjacent on the ring, or that are chord pairs allowed by the layout rule documented in `generate.ts`;
    - there is exactly one driver.
- [ ] **AC4**: Difficulty presets are respected.
  - _Verify (unit):_ every easy diagram has 6–7 gears and `h=45`. Every expert diagram has 11–12 gears and `h=30`, or whatever the presets file says, asserted against the presets rather than hard-coded.
- [ ] **AC5**: A Fix variant has zero solutions, and exactly one repair.
  - _Verify (unit):_ for 500 seeds and K ∈ {1, 2}:
    - `solveAll(variant).length === 0`;
    - `repairsOf(variant, K)` returns exactly one swap set;
    - applying that set gives exactly one solution, equal to the stored solution;
    - the stored swaps equal that set.
- [ ] **AC6**: Generation time.
  - _Verify (unit):_ the mean `generateDiagram` time over 1,000 seeds is under 20 ms. For `generateFixVariant` with K=2 and N ≤ 12, the median over 50 seeds is under 2 s. Report the measured numbers.
- [ ] **AC7**: The output parses as content.
  - _Verify (unit):_ 100 generated outputs pass `contentSchema.parse`, and `generator_seed` equals the input seed.
- [ ] **AC8**: Pure and deterministic.
  - _Verify (code):_ `grep -n "Math.random\|Date.now" src/puzzles/gears/generate.ts` returns nothing.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
