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
- **CLI:** `pnpm puzzles:gen <type> --seed <text> --difficulty <1-5> [--slug <slug>]`. It writes `content/<type>/<slug>.ts`, recording the provenance in `meta.sourceNote` as one parseable line, `generator <type>@<version> seed=<text> difficulty=<n>` (the field the gear content already uses), and the file then goes through `puzzles:verify` like any other.
- **Regeneration check:** when a content file's `sourceNote` carries that line, `puzzles:verify` regenerates the puzzle from it and fails on any difference. This catches an edited, supposedly frozen generator (research section 5.5).
- **Grader audit of hand-written content:** run the grader over the existing hand-written sudoku and futoshiki and list the results in the report. Where the grader and `meta.difficulty` differ by two or more, update `meta.difficulty`. The T099 prototype found the hand-written "difficulty 5" sudoku solvable by singles alone and the "difficulty 2" one not (research section 4.3), so expect changes. Hand-written puzzles are not gated by the grader, only generated ones.
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
- [ ] **AC5**: The 10 generated content files verify and seed.
  - _Verify (cli):_ `pnpm puzzles:verify && pnpm db:seed` exit 0.
- [ ] **AC6**: Generation time is recorded.
  - _Verify (cli):_ the report records the median and worst time per difficulty over 50 seeds for each type.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
