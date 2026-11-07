---
id: T100
title: "Deterministic generator pipeline, plus sudoku and futoshiki generators"
milestone: M6
epic: E11
depends_on: [T099, T046, T047]
migrations: false
requires_human: false
spec: ["SPEC §2.3 (authoring rule)", "SPEC §4.6", "SPEC §7.4.4 (sudoku, futoshiki)", "PLAN §3 M6 (Generators)", "docs/research/generators.md (from T099)"]
skills: ["/zod4"]
---

# T100: Deterministic generator pipeline, plus sudoku and futoshiki generators

## Context

T099 recommends how to generate grid puzzles. This ticket builds the shared pipeline and the first two generators, for the types where generation is best understood: sudoku and futoshiki. **Read `docs/research/generators.md` first. Where it conflicts with this ticket, it wins**, and the conflict is noted in the report.

## Scope

**In**

- **A shared pipeline** in `src/puzzles/_shared/generate/`, pure with no DB or Next imports:
  - seeding from `hashSeed(seed)` with `mulberry32` (`_shared/prng.ts`), so the same seed and generator version always give the same puzzle;
  - a version-pinned registry of generators per type, as `engines` is in spot-difference;
  - uniqueness proven with the type's own `countSolutions`;
  - a logical-technique grader that publishes only puzzles solvable without trial and error, and maps the hardest technique used to difficulty 1–5. Techniques are per type: for sudoku at least singles, pairs, pointing and box/line, X-wing and XY-wing; for futoshiki, inequality chains and Latin-square singles.
- **Generators:**
  - sudoku: a full grid from the seed, then clues removed while uniqueness holds and the target difficulty is met. 180° symmetry by default.
  - futoshiki: a Latin square from the seed, then signs and givens added or removed while uniqueness holds and the target difficulty is met.
- **CLI:** `pnpm puzzles:gen <type> --seed <text> --difficulty <1-5> [--slug <slug>]`. It writes `content/<type>/<slug>.ts`, recording the provenance as a typed export beside `meta` and `content`, `export const generated = { generator, version, seed }`, which `puzzles:verify` reads and `db:seed` ignores. The difficulty is `meta.difficulty`, not repeated, and `meta.sourceNote` stays human prose (a parseable line there would be an encoded text column, against `.claude/rules/database.md`). The file then goes through `puzzles:verify` like any other.
- **Regeneration check:** when a content file exports `generated`, `puzzles:verify` regenerates the puzzle from it and `meta.difficulty` and fails on any difference. This catches an edited, supposedly frozen generator (research section 5.5).
- **Regrade the existing sudoku and futoshiki:** run the grader over every sudoku and futoshiki content file already on `main`, hand-written or generated, and set each `meta.difficulty` to the grader's value wherever they differ. List every puzzle in the report with its old and new difficulty and the hardest technique it needs. A hand-written puzzle the grader cannot finish without trial and error stays published, gets difficulty 5, and is flagged in the report for the user to keep, rewrite or replace. The T099 prototype found the hand-written "difficulty 5" sudoku solvable by singles alone and the "difficulty 2" one not (research section 4.3), so expect changes. Hand-written puzzles are graded but not gated by the grader; only generated ones are gated. Check `content/weekly.ts` still reads sensibly after the regrade (no week left with only one difficulty).
- **Yield:** record accepted candidates per candidate, per difficulty, in the report. Difficulty 5 is expected to be the thinnest tier (research section 5.3).
- **SPEC §2.3 and §4.6:** T099 already updated the authoring rule and §4.6 (committed generated files, materialised dailies). Edit them only if the implementation diverges.
- **Content:** 5 generated sudoku and 5 generated futoshiki, across difficulties 1–5, added alongside the hand-written ones.

**Out**

- Generators for the other types (T101 to T110) and daily seeded grid puzzles (T111).
- Changing the solvers' existing `countSolutions`, except for performance fixes the generators need. Those must keep the existing tests green.

## Acceptance criteria

- [ ] **AC1**: Generation is deterministic and version-pinned.
  - _Verify (unit):_ the same seed, version and difficulty give an identical puzzle; a different seed gives a different one; an unknown version throws.
- [ ] **AC2**: Every generated puzzle is unique and solvable without trial and error.
  - _Verify (unit):_ a property test over 200 seeds per type. Every output has `countSolutions === 1`, and the grader solves it using techniques only.
- [ ] **AC3**: The grader's difficulty is consistent.
  - _Verify (unit):_ fixture puzzles that need only singles grade 1, and one that needs an X-wing grades at least 4.
- [ ] **AC4**: The CLI writes content files that pass verification and seed.
  - _Verify (cli):_ `pnpm puzzles:gen sudoku --seed test --difficulty 2 --slug gen-test` writes a file, `pnpm puzzles:verify` passes, and the file is then deleted.
- [ ] **AC5**: The 10 generated content files verify and seed, and verification regenerates them.
  - _Verify (cli):_ `pnpm puzzles:verify && pnpm db:seed` exit 0; editing one value in a generated file's `content` makes `puzzles:verify` fail with a regeneration mismatch naming that file.
- [ ] **AC6**: Existing sudoku and futoshiki are regraded.
  - _Verify (cli):_ a `pnpm puzzles:grade sudoku futoshiki` (or equivalent) run prints every puzzle's grade; every content file's `meta.difficulty` equals its grade, except flagged trial-and-error puzzles at 5. The report lists old and new difficulty per puzzle.
- [ ] **AC7**: Generation time is recorded.
  - _Verify (cli):_ the report records the median and worst time per difficulty over 50 seeds for each type.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
