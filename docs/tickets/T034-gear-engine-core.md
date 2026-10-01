---
id: T034
title: Gear engine core
milestone: M3
epic: E7
depends_on: [T033]
migrations: false
requires_human: false
spec: ["SPEC §5.2.2", "SPEC §8.1 (Gears)"]
skills: []
---

# T034: Gear engine core

## Context

This is the pure, integer-exact implementation of the SPEC §5.2.2 formal model. The generator (T035), the client-side live preview (T038/T039) and the server check (T040) all use it.

## Scope

**In**

- `src/puzzles/gears/engine.ts`:
  - `spinSigns(gears, meshes, driverId)`: a 2-colouring that returns the error `not_bipartite` if the graph isn't bipartite;
  - `lcmTeeth(gears)`;
  - `stateAt(diagram, crank, f) → per gear { slot, facingDeg, bearingDeg, sees }`;
  - `seeingCount(diagram, crank, f)`;
  - `solveAll(diagram) → { crank, convergence, killerId }[]`, every win over `c ∈ [0, L)` and `f ∈ 1..8`.
- `engine.test.ts`.

**Out**

- Generation (T035) and the occlusion rule. Occlusion stays behind the flag and is unimplemented until it is needed. If you want to implement it, raise it.

## Notes

- **Angle convention.** The spec doesn't fix one, so these fixtures fix it:
  - slot `s` sits at `s × 360/S` degrees;
  - tooth rotation in the `+1` direction increases the facing angle;
  - `bearing = slotAngle + 180 (mod 360)`;
  - `sees` iff `angularDistance(facing, bearing) ≤ h_g`, inclusive.
- **Integer arithmetic.** Use integers throughout. Keep facing in teeth units internally and convert to degrees only for output. Floats appear only in `facingDeg` and `bearingDeg`.

## Acceptance criteria

Fixture **F3**, used by every AC below:

- Gears:
  - A: teeth 8, slot 0, offset 0, driver
  - B: teeth 12, slot 1, offset 0
  - C: teeth 16, slot 2, offset 0
- Meshes A–B and B–C.
- `S=8`, `m_in=3`, `m_out=1`, `h=45` for every gear.

- [ ] **AC1**: Spin signs and LCM.
  - _Verify (unit):_ `spinSigns(F3)` gives `{A:+1, B:-1, C:+1}`, and `lcmTeeth(F3)` gives `48`.
- [ ] **AC2**: An odd cycle is rejected.
  - _Verify (unit):_ F3 plus a mesh A–C returns `not_bipartite`.
- [ ] **AC3**: Convergence 1 at crank 4 (hand-computed).
  - _Verify (unit):_ `stateAt(F3, 4, 1)` gives:

    | Gear | Facing | Slot | Bearing | Sees |
    |---|---|---|---|---|
    | A | 315° | 0 | 180° | false |
    | B | 150° | 1 | 225° | false |
    | C | 157.5° | 2 | 270° | false |

    `seeingCount` is 0.
- [ ] **AC4**: Convergence 2 at crank 4, with the boundary inclusive.
  - _Verify (unit):_ `stateAt(F3, 4, 2)` gives:

    | Gear | Facing | Slot | Bearing | Sees |
    |---|---|---|---|---|
    | A | 45° | 4 | 0° | true (distance exactly 45) |
    | B | 90° | 5 | 45° | true (distance exactly 45) |
    | C | 202.5° | 6 | 90° | false |

    `seeingCount` is 2.
- [ ] **AC5**: Convergences 3–5 at crank 4.
  - _Verify (unit):_
    - `f=3`: A 135° sees, B 30° doesn't, C 247.5° sees. Count 2.
    - `f=4`: count 0.
    - `f=5`: A 315° doesn't, B 270° sees (bearing 225°), C 337.5° doesn't. Count 1.
- [ ] **AC6**: `solveAll` includes the known win.
  - _Verify (unit):_ `solveAll(F3)` contains `{crank:4, convergence:5, killerId:B}`. Every entry it returns has `seeingCount === 1` when re-evaluated.
- [ ] **AC7**: `solveAll` matches an independent brute force.
  - _Verify (unit):_ a test-local naive implementation, using floating-point degrees and written from SPEC §5.2.2 without importing the engine, agrees with `solveAll` on F3 and on 200 random seeded diagrams.
- [ ] **AC8**: Crank periodicity.
  - _Verify (unit):_ for F3, `stateAt(F3, c, f)` deep-equals `stateAt(F3, c+48, f)` for all `c` in 0..47 and `f` in 1..8.
- [ ] **AC9**: Performance.
  - _Verify (unit):_ `solveAll` on a 12-gear diagram with teeth {8, 12, 16, 24} (L=48) runs in under 5 ms on average over 100 runs.
- [ ] **AC10**: The engine is pure.
  - _Verify (code):_ `grep -nE "from ['\"](react|next|@/db|drizzle|motion)" src/puzzles/gears/engine.ts` returns nothing, and `grep -n "Math.random" engine.ts` returns nothing.
- [ ] **AC11**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
