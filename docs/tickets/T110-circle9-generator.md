---
id: T110
title: "Circle9 generator"
milestone: M6
epic: E11
depends_on: [T100, T089]
migrations: false
requires_human: false
spec: ["SPEC §2.4 (circle9)", "docs/research/generators.md (from T099)", "PLAN §3 M6 (Generators)"]
skills: ["/zod4"]
---

# T110: Circle9 generator

## Context

T099 recommends a deterministic generator for this type (`docs/research/generators.md`, section 3, effort M). T100 builds the shared pipeline. **Read the research document and the T100 report first.** Where this ticket conflicts with them, they win, and the conflict is noted in the report.

## Scope

**In**

- A generator for `circle9` in the T100 pipeline (`src/puzzles/_shared/generate/`), registered version 1, seeded by `mulberry32(hashSeed(...))`: a solved sudoku fixes the circled cells, the other cells are filled with seeded decoy digits, and decoys are changed until `countSolutions === 1`.
- A technique grader for the type, using the T100 grader interface. Publication needs `countSolutions === 1` and a grade, so no puzzle needs trial and error. Techniques: exact-cover forcing: a digit that has one candidate cell in a row, column or box. Difficulty by the hardest rule needed.
- `pnpm puzzles:gen circle9 --seed <text> --difficulty <1-5>` writes `content/circle9/<slug>.ts` with the `generated` provenance export (T100).
- Sizes: 9×9.
- 5 generated content files across difficulties 1 to 5, alongside any hand-written ones.
- Generation time and acceptance rate per difficulty over 50 seeds, in the report.

**Out**

- The hand-written content of the type, and any change to its `countSolutions` other than performance fixes the generator needs.
- Daily puzzles (T111).

## Notes

Uses the T100 sudoku solved-grid generator and the T089 engine. Digits may repeat in the grid (SPEC §2.4).

## Acceptance criteria

- [ ] **AC1**: Generation is deterministic and version-pinned.
  - _Verify (unit):_ the same seed, version and difficulty give an identical puzzle; a different seed gives a different one; an unknown version throws.
- [ ] **AC2**: Every generated puzzle is unique and solvable without trial and error.
  - _Verify (unit):_ a property test over 100 seeds per difficulty: `countSolutions === 1` and the grader solves it with techniques only.
- [ ] **AC3**: The grader is consistent.
  - _Verify (unit):_ hand-computed fixtures that need only the simplest technique grade 1, and one that needs the hardest implemented technique grades 4 or more.
- [ ] **AC4**: The generated content files verify and seed.
  - _Verify (cli):_ `pnpm puzzles:verify && pnpm db:seed` exit 0, and `puzzles:verify` regenerates each file from its provenance and finds no difference.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
