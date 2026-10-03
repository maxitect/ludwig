---
paths:
  - "src/puzzles/**"
  - "content/**"
  - "scripts/**"
---

# Puzzle Rules

Specs: `docs/SPEC.md` section 4 (framework), section 5 (Reverse Chess and Gears) and section 7.4.4 (tables per type).

## Folder contract

Every type in `src/puzzles/<type>/` has the same shape. Use `/new-puzzle-type` to scaffold one.

| File               | Role                                                                                               | May import               |
| ------------------ | -------------------------------------------------------------------------------------------------- | ------------------------ |
| `tables.ts`        | Drizzle tables: subtype, children, **(S)** solution, attempt state                                 | drizzle                  |
| `schema.ts`        | `payloadSchema`, `answerSchema`, `contentSchema`, `attemptSchema`, composed from `drizzle-orm/zod` | zod, tables              |
| `load.ts`          | `server-only`. One RQBv2 query that builds the payload DTO. Never selects **(S)**                  | db, schema, derive, load-solution |
| `load-solution.ts` | `server-only`. Solution rows for checking                                                          | db                       |
| `check.ts`         | Pure `check(payload, solution, answer)`                                                            | schema types, derive     |
| `derive.ts`        | Pure derivations used instead of stored values                                                     | schema types             |
| `engine.ts`        | Pure simulation, generation and solving (flagship and generated types only)                        | schema types             |
| `solver.tsx`       | `"use client"` UI                                                                                  | components, schema types |

- Register every type's server module in `src/puzzles/registry.ts`. A `PuzzleTypeModule` is `{ schema, meta, load, loadSolution, check, checkCell?, revealCell?, upsertContent, replaceAttemptState, loadAttemptState, clearAttemptState, verify? }`. Grid types add the per-cell hooks (SPEC §4.1). `loadAttemptState` reads back what `replaceAttemptState` wrote, and `clearAttemptState` deletes it.
- `upsertContent` updates a puzzle's content in place: upsert on natural keys, delete only rows missing from the content, and never delete the subtype row of an existing puzzle. Content row ids (gears, rota workers and clues) stay stable across re-seeds, and `db:seed` never writes a `*_attempt*` table. Rows that `*_attempt*` tables reference must keep an FK without cascade, so a content change that removes them fails the seed for that puzzle. Child tables with no id and no attempt reference may be deleted and re-inserted (this also avoids transient unique violations when rows swap values).
- **Solvers are not part of the module.** The scripts (`db:seed`, `puzzles:verify`) import the registry under `--conditions react-server`, where radix and react-chessboard crash. Register each solver in `src/puzzles/solvers.ts` (`null` until the type has one), which only the solve page imports. Solver props types live in `src/puzzles/solver-types.ts`. `registry-imports.test.ts` guards this.
- **Engine-internal types.** A pure engine may declare its own internal types (for example spot the difference `Change`, `SceneObject`, `Kind`, `Colour`) when no table or schema covers them. The user approved this on 2026-10-03, so they need no sign-off. Anything that crosses the engine boundary (payload, answer, content, attempt state) still derives from the type's `schema.ts`.
- A `load.ts` may call `loadSolution` when the payload is derived from the solution (anagram's tiles), provided it never returns an **(S)** value. The payload leak test (`payloadSchema.strict()` on a real `load` result) must prove it.
- Shared pure code goes in `src/puzzles/_shared/`.

## Purity

- `engine.ts`, `check.ts` and `derive.ts` import no React, Next or DB code.
- They must be deterministic. Randomness comes only from a seeded PRNG (mulberry32) with an explicit seed.
- Write their Vitest tests first, using hand-computed fixtures.

## Correctness

- **Exactly one solution per puzzle,** proven by `pnpm puzzles:verify`. Word ladder is the only exception: any valid ladder of `rung_count` rungs is accepted.
- **Author with Mr Todd's principle:** start from the solution and work backwards, layering in false paths.
- **Solutions never reach the client:**
  - no **(S)** field in any payload;
  - checking happens only in the `checkAnswer` Server Action;
  - each type has a test asserting `payloadSchema.strict()` rejects solution fields.
- **Saved progress** is written as normalised rows in `<type>_attempt*` tables, replaced in one transaction. Signed-out progress lives in `localStorage` and merges on sign-up.

## Content

- Each curated puzzle is a file in `content/<type>/<slug>.ts` exporting `{ meta, content }`, typed by `contentSchema`.
- Never insert content into the DB by hand. `pnpm db:seed` writes the supertype, subtype and children in one transaction.
- All clues and positions must be original. Don't copy Guardian clues or published retro problems.

## Flagship specifics

- **Reverse Chess:**
  - FEN is derived from piece rows for `chess.js`; it is never stored.
  - The verifier enumerates every retro move and needs exactly one survivor.
  - Full reachability isn't computed, so each curated position needs a manual legality review.
- **Gears:**
  - All arithmetic is integer, in teeth and slots.
  - The mesh graph must be bipartite.
  - Uniqueness is searched over `lcm(teeth) × 8`.
  - Fix the Diagram must have exactly one repair.
  - Keep tuning parameters in content, not in code.
