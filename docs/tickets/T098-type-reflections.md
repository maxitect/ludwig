---
id: T098
title: "Puzzle type: reflections (mirrors and beams)"
milestone: M6
epic: E11
depends_on: [T021]
migrations: true
requires_human: false
spec: ["SPEC §2.4 (reflections)", "SPEC §7.4.4 (reflections)", "SPEC §1.2 (S1E3, S2E3)", "PLAN §3 M6"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T098: Puzzle type: reflections (mirrors and beams)

## Context

A mirror-and-beam puzzle in the spirit of the show's sightline and CCTV puzzles (S1E3, S2E3): put a diagonal mirror in every slot so each lettered pair of edge ports is joined by a beam (SPEC §2.4). It is a generic genre, not a copy of KrazyDad's "Mirror Mirror", which is a different, triangle-shape puzzle. Beams bounce, which the cone model in `visibility.ts` doesn't cover, so this type has its own tracer. No solution is stored.

## Scope

**In**

- **`src/puzzles/reflections/`**, built per `/new-puzzle-type`. Tables:
  - `reflections_puzzles`;
  - `reflections_fixed_mirrors` (enum `mirror_kind`);
  - `reflections_slots`;
  - `reflections_ports`;
  - `reflections_attempts`;
  - `reflections_attempt_mirrors`.

  All as in SPEC §7.4.4.
- **`engine.ts`:** `trace(puzzle, mirrors, port)`, which returns the beam's path and exit port, and `countSolutions`, an enumeration over slot assignments with pruning by tracing the lettered beams, capped at 2.
- **`verify`:** every label appears exactly twice, no slot shares a cell with a fixed mirror, ports lie on real edges, and there is exactly one solution.
- **Solver UI:**
  - ports drawn as small CCTV cameras with letters;
  - tap a slot to cycle `/`, `\` and empty;
  - hovering or focusing a port draws its live beam in red pencil, ending at the port it currently reaches;
  - a satisfied pair turns ink;
  - keyboard: arrows to move, `/` and `\` to place.
- **Content:** 5 original puzzles from 5×5 to 8×8, with up to 16 slots each.
- **Preview:** add `src/puzzles/<type>/preview.tsx` (T129) and register it in `src/puzzles/previews.ts`. Typecheck fails until you do.

**Out**

- One-sided mirrors, beam splitters and coloured beams.

## Acceptance criteria

- [ ] **AC1**: The tables, enum and CHECKs exist.
  - _Verify (db):_ a `ne` side and a lowercase label are rejected.
- [ ] **AC2**: Tracing is correct.
  - _Verify (unit):_ fixtures for a straight pass, a single reflection off each mirror kind, a beam that loops back to its own entry side, and a beam through a fixed mirror then a placed one.
- [ ] **AC3**: Counting and `verify` are correct.
  - _Verify (unit):_ unique, two-solution and contradictory fixtures. `verify` rejects a label used three times.
- [ ] **AC4**: The payload carries the grid, fixed mirrors, slots and ports, with no slot assignments.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on 5 files.
- [ ] **AC5**: Signed in, mirrors persist across a reload, and a full solve completes.
  - _Verify (browser + db)._
- [ ] **AC6**: The puzzle can be solved by keyboard alone, and focusing a port announces where its beam currently exits. Both themes render correctly at 1280px and 390px. The beam animation respects reduced motion.
  - _Verify (browser):_ screenshots `.verification/T098/ac6-*.png`.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
