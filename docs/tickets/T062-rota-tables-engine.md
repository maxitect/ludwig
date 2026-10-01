---
id: T062
title: "Rota (Reverse Chess Mode C): tables, clue kinds, engine"
milestone: M4
epic: E6
depends_on: [T016]
migrations: true
requires_human: false
spec: ["SPEC §1.3 (S1E4 case)", "SPEC §5.1 Mode C", "SPEC §7.4.4 (rota)", "SPEC §7.4.2 (subtype pattern)", "PLAN §3 M4 (Case group)"]
skills: ["/new-puzzle-type", "/db-trigger", "/zod4"]
---

# T062: Rota (Reverse Chess Mode C): tables, clue kinds, engine

## Context

Mode C reconstructs the swap chain on an 8×8 site grid (SPEC §5.1). It is its own `rota` type (SPEC §2.3). Clues are typed predicates: `rota_clues` is a supertype, and each kind with parameters has a subtype table pinned by a generated `kind` column (SPEC §7.4.4). This applies the §7.4.2 pattern one level down. This ticket covers the data and the pure engine only. The UI is T063.

## Scope

**In**

- **`src/puzzles/rota/tables.ts`**:
  - `rota_puzzles`, `rota_workers`, `rota_worker_squares` (enum `rota_phase`), `rota_clues` (enum `rota_clue_kind`);
  - clue subtypes `rota_clue_unpowered_square`, `rota_clue_never_in_rank` and `rota_clue_max_swaps`;
  - `rota_solution_swaps` **(S)**, `rota_solutions` **(S)** and `rota_attempts` / `rota_attempt_swaps`.
- **Clue kinds:**
  - The v1 enum values are `unpowered_square`, `adjacent_only`, `never_in_rank` and `max_swaps`.
  - `adjacent_only` has no parameters, so it has no subtype table.
  - Each subtype has `kind … GENERATED ALWAYS AS ('<kind>') STORED` and a composite FK `(clue_id, kind)` → `rota_clues (id, kind)`.
- **Same-puzzle integrity.** Worker references in clues, swaps and solutions use composite FKs `(puzzle_id, worker_id)` → `rota_workers (puzzle_id, id)`. This means `puzzle_id` is carried on those child tables.
  - This is not redundancy where `puzzle_id` is part of the child's own key, e.g. `rota_solution_swaps (puzzle_id, step)` or `rota_clues.puzzle_id`; the same pattern as `gear_meshes`.
  - It is redundant only on rows keyed by something else, e.g. `rota_clue_never_in_rank` keyed by `clue_id`, where `puzzle_id` follows from `clue_id`. There it is a controlled redundancy: add it to SPEC §7.4.5, with a composite FK `(clue_id, puzzle_id)` → `rota_clues (id, puzzle_id)` and a fill trigger (`/db-trigger`).
  - If it is part of the natural key, say so in the report.
- **The `trg_rota_clues_require_subtype`** deferred constraint trigger, which requires a subtype row for every kind except `adjacent_only`.
- **`engine.ts`**: `applySwaps`, `validateClues` (one evaluator per kind) and a breadth-first `solve` that counts swap sequences reaching the final state under all clues (capped at 2). Also `openingGambit(sequence)`.
- **Registry entry** and `schema.ts`. A `load.ts` stub may return a payload, but the solver UI is T063.

**Out**

- The solver UI, content and the hub (T063).

## Acceptance criteria

- [ ] **AC1**: A clue subtype row can only attach to a clue of the matching kind.
  - _Verify (db):_ inserting a `rota_clue_max_swaps` row for an `unpowered_square` clue fails; the matching kind succeeds.
- [ ] **AC2**: A parameterised clue without its subtype row fails at commit, while `adjacent_only` clues commit without one.
  - _Verify (db):_ two transactions.
  - _Verify (unit):_ a DB-integrity test.
- [ ] **AC3**: Cross-puzzle worker references are impossible in swaps, solutions and clues.
  - _Verify (db):_ a swap that references a worker from another puzzle fails.
- [ ] **AC4**: Every redundant column introduced is listed in SPEC §7.4.5, with a fill trigger and a test.
  - _Verify (code):_ the diff of `docs/SPEC.md` §7.4.5 plus the trigger migration file. The report states any columns judged to be natural keys.
- [ ] **AC5**: `applySwaps` and `validateClues` are correct per kind.
  - _Verify (unit):_ a fixture modelled on the S1E4 chain (Marty, Gary, Ojay, Stefan, Zara; SPEC §1.3), with one passing and one failing case per kind.
- [ ] **AC6**: `solve` returns exactly one sequence for the S1E4-style fixture, two for an under-constrained fixture (clue removed) and zero for a contradictory one. `openingGambit` returns the first swap and its instigator.
  - _Verify (unit)._
- [ ] **AC7**: The engine is pure.
  - _Verify (code):_ the engine file has no React, Next or DB imports.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
