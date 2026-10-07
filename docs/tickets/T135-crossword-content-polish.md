---
id: T135
title: Crossword content polish (fill, repeated roots, symmetry)
milestone: M5
epic: E8
depends_on: [T080]
migrations: false
requires_human: false
spec: ["SPEC §2.3 (crossword)", "SPEC §4.6"]
skills: []
---

# T135: Crossword content polish (fill, repeated roots, symmetry)

## Context

Editorial issues in the crossword content were deferred to one content pass (user, 2026-10-04), to run before the accessibility audit (T068) (user, 2026-10-07).

## Scope

**In**

- Paper Round: replace 12d SERE (crosswordese). The crossings are locked, so refill the area around it.
- Second Draft: replace 30d ROTE (borderline).
- Remove repeated roots within a grid: UNIT/UNITY, EATS/EATEN, TEA/TEAPOT.
- Make the quick grids rotationally symmetric, as the cryptic ones are, refilling as needed.
- Every changed clue stays original and fair, and slugs stay the same (`content/weekly.ts` references them).

**Out**

- New crosswords.

## Notes

- Removing a filled cell or clue that attempt data references fails the seed with a named error (T072). Before changing a grid shape, query production read-only (Neon MCP `run_sql` on `main`) for attempt cells on that puzzle, and list the affected puzzles in the report. If a published puzzle has attempts that a refill would break, stop and escalate rather than delete attempts.
- `puzzles:verify` must pass after every file change.

## Acceptance criteria

- [ ] **AC1**: The listed entries are gone.
  - _Verify (code):_ grep the crossword content for SERE, ROTE and each repeated pair and find none of them in the same grid.
- [ ] **AC2**: Every quick grid is rotationally symmetric.
  - _Verify (unit):_ a test asserts 180° symmetry of the cell set for every crossword content file.
- [ ] **AC3**: Content verifies and seeds.
  - _Verify (cli):_ `pnpm puzzles:verify` passes and `pnpm db:seed` exits 0.
- [ ] **AC4**: The preview seeds the changed grids.
  - _Verify (deploy):_ the preview build is Ready and `vercel curl` on each changed solve page returns 200.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
