---
id: T058
title: "Shared visibility.ts engine"
milestone: M4
epic: E8
depends_on: [T016]
migrations: false
requires_human: false
spec: ["SPEC §4.1 (_shared)", "SPEC §5.2.2 (occlusion rule)", "SPEC §2.3 (sightlines, cctv-maze)", "PLAN §3 M4 (Spatial group)"]
skills: []
---

# T058: Shared visibility.ts engine

## Context

`sightlines` (T059), `cctv-maze` (T060) and the optional gear occlusion rule (SPEC §5.2.2) all need grid line of sight with view cones and obstacles. This is a **pure engine ticket**: no UI, no DB and no Next imports (`.claude/rules/puzzles.md` §Purity).

## Scope

**In**

- `src/puzzles/_shared/visibility.ts` exporting pure functions:
  - `lineOfSight(grid, from, to)` returns a boolean, with obstacles blocking. Cell-centre to cell-centre rays use a deterministic supercover or Bresenham variant; pick one and document the corner-touch rule in a docstring.
  - `inCone(observer, target)` checks a target against an observer's `compass8` facing and `fov_deg`, with an optional `range_cells`.
  - `visibleCells(grid, observer)` returns the set of visible cells.
  - `segmentHitsDisc(a, b, centre, radius)` is the continuous-geometry helper for gear occlusion.
- Input types derived from the T059/T060 table select schemas where those exist. Until they do, use minimal structural parameter types inferred from usage. Don't add standalone custom types without confirming (CLAUDE.md).
- `visibility.test.ts` with hand-computed fixtures.

**Out**

- Any puzzle type, UI or DB tables.

## Acceptance criteria

- [ ] **AC1**: The engine is pure.
  - _Verify (code):_ `grep -nE "from \"(react|next|@/db|drizzle)" src/puzzles/_shared/visibility.ts` returns nothing.
- [ ] **AC2**: `lineOfSight` handles the core cases: an open ray, a ray blocked by a single obstacle, the documented corner-touch rule (a diagonal squeezing between two diagonal obstacles), an adjacent cell, and the same cell.
  - _Verify (unit):_ at least 8 named fixtures.
- [ ] **AC3**: `inCone` is correct for all 8 facings at `fov_deg` 90 and 45, including the boundary angle (inclusive) and out-of-range cells when `range_cells` is set.
  - _Verify (unit):_ a table-driven test.
- [ ] **AC4**: `visibleCells` combines the cone and line of sight.
  - _Verify (unit):_ two hand-drawn 7×7 fixtures, each with an ASCII map of the expected visible cells in the test file.
- [ ] **AC5**: `segmentHitsDisc` handles a tangent (counted as a hit, i.e. inclusive), a miss, a hit and an endpoint inside the disc.
  - _Verify (unit)._
- [ ] **AC6**: The functions are deterministic and allocation-light: `visibleCells` on a 30×30 grid with 20 observers runs in under 50ms in Vitest.
  - _Verify (unit):_ a timing assertion with a generous bound.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
