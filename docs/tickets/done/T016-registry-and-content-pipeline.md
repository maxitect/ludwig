---
id: T016
title: Puzzle registry, type contract, content pipeline (seed + verify)
milestone: M1
epic: E4
depends_on: [T005]
migrations: false
requires_human: false
spec: ["SPEC §4.1", "SPEC §4.6", "SPEC §7.2", "SPEC §7.4.2", "SPEC §7.4.6", "PLAN §5.4"]
skills: [/zod4]
---

# T016: Registry, type contract and content pipeline

## Context

This is the framework skeleton every puzzle type plugs into. It covers the per-type folder contract (`.claude/rules/puzzles.md`), the registry, and the content-as-code pipeline. It ships no puzzle type of its own; T019 is the first consumer.

## Scope

**In**

- **`src/puzzles/registry.ts`:**
  - Exports a typed `PuzzleTypeModule` contract: `{ schema, load, loadSolution, check, Solver, meta }`, with its types derived from each module's `schema.ts` and not hand-declared.
  - Exports a `registry` keyed by `type_key`, plus `getPuzzleModule(typeKey)`, which throws on an unknown key.
- **`content/lookups.ts`:** every `puzzle_categories` row, and a `puzzle_types` row for each type in SPEC §2.3 (key, category, name, description, `subtype_table`, sort), plus `volumes` rows.
- **`scripts/seed.ts`** (`pnpm db:seed`):
  1. Upserts the lookups and volumes.
  2. Discovers `content/<type>/*.ts`, validates each file with the registered `contentSchema`, and upserts by `(type_key, slug)`.
  3. Writes the supertype, subtype and every child row in **one transaction per puzzle**. Child rows are replaced, not merged.
  4. Deletes `puzzles` rows of a registered type whose slug no longer exists in `content/`. Cascades remove their subtype and children.
  5. Prints a per-type summary (inserted, updated, removed).
- **`scripts/verify-puzzles.ts`** (`pnpm puzzles:verify`): for every content file, parse it with `contentSchema`, then run the module's optional `verify(content)` hook (uniqueness and solvability), and exit non-zero on any failure. It is a no-op success when no types are registered.
- **Test fixture type:** a minimal `__fixture` puzzle type (tables, schema, content) that exists only in the test DB setup, used to prove the seed and verify pipeline in Vitest. It is excluded from the production registry and migrations.
- `package.json` scripts: `db:seed` and `puzzles:verify`.

**Out**

- The attempt actions (T017).
- Any real puzzle type (T019 onwards).
- Gear generation (T036).

## Notes

- Stale-row deletion only touches types present in the registry, so seeding with a partial registry never wipes other types.
- If the `__fixture` type needs tables, create them in the Vitest global setup with raw SQL. Don't add migrations for it.
- `puzzle_types` rows for types that aren't implemented yet are fine. The subtype trigger only fires when a puzzle row is inserted.

## Acceptance criteria

- [ ] **AC1**: Seeding a fresh database inserts every category, puzzle type and volume from `content/lookups.ts`.
  - _Verify (cli + db):_ Run `pnpm db:migrate && pnpm db:seed`. Then `psql "$DATABASE_URL" -c "select count(*) from puzzle_types"` equals the number of types in SPEC §2.3, and `select count(*) from puzzle_categories` equals the categories in `content/lookups.ts`.
- [ ] **AC2**: Seeding is idempotent.
  - _Verify (cli + db):_ Run `pnpm db:seed` a second time. It reports 0 inserted and 0 removed, and the row counts from AC1 are unchanged.
- [ ] **AC3**: Each puzzle is written atomically. A content file whose child rows violate a constraint leaves no partial rows.
  - _Verify (unit):_ `scripts/seed.test.ts` seeds an invalid `__fixture` puzzle (for example a duplicate child key), expects that file to fail, and asserts that `select count(*) from puzzles where slug = '<bad>'` is 0 while the other fixtures are inserted.
- [ ] **AC4**: Removing a content file deletes its puzzle and cascades on the next seed.
  - _Verify (unit):_ `scripts/seed.test.ts` seeds two fixtures, re-seeds with one, and asserts that one puzzle row remains and the removed puzzle's subtype rows are gone.
- [ ] **AC5**: `getPuzzleModule` throws on an unknown type, and the registry type is derived rather than declared by hand.
  - _Verify (unit + code):_ `src/puzzles/registry.test.ts` expects `getPuzzleModule("nope")` to throw. `grep -n "any" src/puzzles/registry.ts` matches nothing.
- [ ] **AC6**: `puzzles:verify` fails with a clear message on a content file that doesn't parse, and passes on valid content.
  - _Verify (cli):_ With a deliberately broken `__fixture` content file, `pnpm puzzles:verify` exits 1 and names the file and the failing path. With it restored, the command exits 0.
- [ ] **AC7**: The `__fixture` type is not in the production registry and not in any migration.
  - _Verify (code):_ `grep -rn "__fixture" src/puzzles/registry.ts drizzle/` matches nothing.
- [ ] **AC8**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
