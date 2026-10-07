---
id: T082
title: "Gear train (Gear Puzzle Mode B): tables, engine, uniqueness search"
milestone: M4
epic: E7
depends_on: [T016, T034]
migrations: true
requires_human: false
spec: ["SPEC §1.3 (classic gear puzzle)", "SPEC §2.3", "SPEC §5.2.5", "SPEC §7.4.4 (gear-train)", "SPEC §7.4.5", "PLAN §3 M4 (Mechanism group)"]
skills: ["/new-puzzle-type", "/db-trigger", "/zod4"]
---

# T082: Gear train (Gear Puzzle Mode B): tables, engine, uniqueness search

## Context

Mode B is the classic gear puzzle the detectives play in S2E2: connect a fixed driver to a fixed target with cogs from an inventory, so the target turns the required way (SPEC §5.2.5). It is its own `gear-train` type, like the Rota is for Reverse Chess. This ticket covers the data and the pure engine only. The UI, hub and content are T083.

## Scope

**In**

- **`src/puzzles/gear-train/tables.ts`**: `gear_train_puzzles`, `gear_train_fixed_cogs` (enum `gear_train_role`), `gear_train_bolts`, `gear_train_inventory`, `gear_train_solution_cogs` **(S)**, `gear_train_attempts` and `gear_train_attempt_cogs`, as in SPEC §7.4.4.
- **Triggers** (`/db-trigger`):
  - the deferred constraint trigger `gear_train_requires_fixed_cogs` (both the driver and the target exist at commit);
  - `gear_train_attempts_fill_puzzle_id` and `gear_train_attempt_cogs_fill_puzzle_id`, as listed in SPEC §7.4.5.
- **Shared spin signs.** Move `spinSigns` from `src/puzzles/gears/engine.ts` to `src/puzzles/_shared/` and import it from both types. Gears behaviour and tests stay unchanged.
- **`engine.ts`**: `meshes`, `collisions`, `trainOf` (spin signs, jam and reachability), `validate` (rules 1 to 7 of SPEC §5.2.5, returning the first broken rule) and `solve` (a depth-first search over induced paths from the driver, capped at 2 results).
- **`schema.ts`**, a `load.ts` that returns the payload with no solution, `load-solution.ts`, `check.ts`, a `verify` hook that requires `solve` to return exactly the stored placement, and the registry entry.

**Out**

- The solver UI, hub section and content (T083).
- Compound cogs and speed goals (SPEC §5.2.5 leaves them out of v1).

## Notes

- `teeth` is limited to 8, 16 and 24 so every pitch radius is a whole number of pegs, keeping mesh and collision tests in integer squared distances.
- Collect the placements in a valid answer as a set keyed by `(row, col)`; the same size placed in a different order is the same answer.

## Acceptance criteria

- [ ] **AC1**: A puzzle without both fixed cogs fails at commit; with both it commits.
  - _Verify (db):_ two transactions.
  - _Verify (unit):_ a DB-integrity test.
- [ ] **AC2**: Solution and attempt cogs can only use a size from that puzzle's inventory.
  - _Verify (db):_ inserting a `gear_train_solution_cogs` row with a size missing from the inventory fails; an inventory size succeeds.
- [ ] **AC3**: Every redundant column is listed in SPEC §7.4.5, with a fill trigger and a test.
  - _Verify (unit):_ the fill triggers populate `puzzle_id`, and an explicit mismatch is rejected by the FK.
- [ ] **AC4**: Geometry is exact.
  - _Verify (unit):_ fixtures for an axis-aligned mesh, a 3-4-5 diagonal mesh (16 and 24 teeth), a collision one peg short, a bolt on a cog's rim, and a disc off the board.
- [ ] **AC5**: `validate` names the right rule for one failing fixture per rule (1 to 7), including a jam (an odd cycle) and an unneeded cog on a parallel branch.
  - _Verify (unit)._
- [ ] **AC6**: `solve` returns exactly one placement for a planted fixture, two for the same fixture with a bolt removed, and none for a contradictory one.
  - _Verify (unit)._
- [ ] **AC7**: The payload carries no solution, and `check` accepts the stored placement and rejects a valid-looking placement with a decoy cog swapped in.
  - _Verify (unit):_ the payload leak test and `check` tests.
- [ ] **AC8**: Gears are unaffected by the `spinSigns` move.
  - _Verify (cli):_ `pnpm test src/puzzles/gears` passes.
- [ ] **AC9**: The engine is pure.
  - _Verify (code):_ the engine file has no React, Next or DB imports.
- [ ] **AC10**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
