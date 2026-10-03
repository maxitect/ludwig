---
name: new-puzzle-type
description: Scaffold a new puzzle type end to end (tables, Zod schemas, load, check, derive, solver, registry, content, tests) following the class-table-inheritance and folder contract. Use when adding any puzzle type from docs/SPEC.md section 2.3.
---

# New Puzzle Type

Builds one puzzle type in `src/puzzles/<type>/`, following `.claude/rules/puzzles.md` and `.claude/rules/database.md`. Copy the most similar existing type and adapt it rather than starting from nothing.

## 0. Read first

- The type's row in `docs/SPEC.md` section 2.3 and its tables in section 7.4.4.
- An existing type with a similar shape: `anagram` for scalar answers, `crossword` for cell grids.

If the spec has no tables for this type yet, design them, add them to section 7.4.4, and confirm with the user before writing code.

## 1. Tables (`tables.ts`)

1. **Subtype table** `<type>_puzzles`:
   - `puzzleId` is both the PK and an FK;
   - `typeKey` is `text().generatedAlwaysAs(sql\`'<type>'\`)`;
   - composite `foreignKey` `(puzzleId, typeKey)` → `puzzles (id, typeKey)`, `onDelete: "cascade"`.
2. **Child tables** keyed by `(puzzleId, position)` or `(puzzleId, row, col)`. They hold atomic columns only, with no json and no arrays.
3. **Solution data:** an **(S)** column on the entity it describes, or a `<type>_solution*` table. Never store anything `derive.ts` can compute.
4. **Attempt subtype** `<type>_attempts`, keyed by `attemptId` with a generated `typeKey` and a composite FK to `attempts (id, typeKey)`. Add `<type>_attempt_*` children for multi-row state. When an attempt child references a puzzle child row (crossword's `(puzzle_id, row, col)`, a gear or rota worker id), give that FK no cascade: `db:seed` deletes the content rows a file no longer has, and a cascade would silently wipe players' saved progress instead of failing the seed.
5. Use enums for fixed name-only sets, and `CHECK` only for numeric domains.
6. Re-export from `src/db/schema/index.ts`, and add relations in `src/db/relations.ts`.
7. Add a `puzzle_types` row (key, category, name, description, `subtype_table`, sort) in `content/lookups.ts`.
8. Run `pnpm db:generate`. If you added a redundant column, use `/db-trigger` for its fill trigger and record it in spec section 7.4.5.

## 2. Schemas (`schema.ts`)

Compose these from `createSelectSchema` / `createInsertSchema` (`drizzle-orm/zod`). Don't write them by hand.

- `payloadSchema` is built from select schemas with every **(S)** column `.omit()`-ted, plus nested arrays of child rows.
- `answerSchema` is what the client submits.
- `contentSchema` is the shape of a `content/` file, built from insert schemas.
- `attemptSchema` is the saved-progress shape, built from the attempt insert schemas.
- Export the `z.infer` types. Use `/zod4` for syntax.

## 3. Server and pure code

- **`load.ts`** (`server-only`): one RQBv2 query that names its columns, with no **(S)**, and returns a `payloadSchema` value. If the payload is derived from the solution (anagram's tiles), it may call `loadSolution`, but no **(S)** value may reach the result.
- **`load-solution.ts`** (`server-only`): the solution rows only.
- **`derive.ts`** (pure): every value the spec says is derived, e.g. tiles, numbering or ciphertext.
- **`check.ts`** (pure): `check(payload, solution, answer)` returns `{ correct }`.
  - Grid types also export `checkCell(payload, solution, row, col, value) → { correct }` and `revealCell(solution, row, col) → value | null`, and put them on the module. The `checkAnswer` (cell mode) and `revealCell` actions call them and return only that one cell's result. A type without them gets `invalid` from both actions.
- **`engine.ts`** (pure, optional): a solver or generator. Use a seeded PRNG only.
- Write `module.ts` and register it in `src/puzzles/registry.ts`. It is a `PuzzleTypeModule`: `{ schema, meta, load, loadSolution, check, optional checkCell and revealCell, upsertContent, replaceAttemptState, loadAttemptState, clearAttemptState, verify? }`. `loadAttemptState` reads back what `replaceAttemptState` wrote (null when nothing is saved), and `clearAttemptState` deletes it so a reset survives a reload. `upsertContent` must update in place (upsert on natural keys, delete only rows removed from the content, keep content row ids stable) and never write attempt tables; any attempt FK to a content row must not cascade, so removing a referenced row fails the seed.
- The module has **no `Solver`**. `db:seed` and `puzzles:verify` import the registry under `--conditions react-server`, where radix (`ui/Button`) and react-chessboard throw. Register the solver in `src/puzzles/solvers.ts` instead (`null` until the type has one). Only the solve page imports that map.

## 4. Solver UI (`solver.tsx`)

- `"use client"`. It receives the payload and saved attempt state as props, reports state changes through `onStateChange` (the chrome autosaves them with `saveState`) and registers its answer reader with `registerCheck`. Grid types also receive `checkCell` and `revealCell` callbacks from the chrome. Type its props with `SolverProps` from `src/puzzles/solver-types.ts`, never from the registry. It may import `ui/*` and `ChessBoard` freely, because no script reaches it.
- Add it to the solver map in `src/puzzles/solvers.ts`.
- Reuse `src/puzzles/_shared/` parts such as `CellInput`. Extract a new shared part only if a second type needs it.
- Follow `.claude/rules/design-system.md`: tokens only, hand-font entries, keyboard-operable, reduced motion respected.

## 5. Content

- Add at least the number of curated files PLAN.md's launch target sets for this type, at `content/<type>/<slug>.ts`, each exporting `{ meta, content }` typed by `contentSchema`.
- The content must be original, and every file must have exactly one solution (word ladder excepted).

## 6. Tests (all required)

- **`check.test.ts`:** the correct answer passes, and single-cell or single-field perturbations fail.
- **`derive.test.ts` / `engine.test.ts`:** hand-computed fixtures.
- **Payload leak test:** `payloadSchema.strict()` on a real `load.ts` result contains no solution field.
- **DB integrity:** a subtype row for the wrong `type_key` fails, a puzzle without the subtype fails at commit, and any new trigger or composite FK is covered.
- Add the type to `scripts/verify-puzzles.ts` uniqueness checks.

## 7. Done

Run `pnpm db:migrate && pnpm db:seed && pnpm puzzles:verify && pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Then solve one puzzle by hand on the dev server, both signed in and signed out.
