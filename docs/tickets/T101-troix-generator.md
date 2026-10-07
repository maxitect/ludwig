---
id: T101
title: "Troix generator"
milestone: M6
epic: E11
depends_on: [T100, T088]
migrations: false
requires_human: false
spec: ["SPEC §2.4 (troix)", "docs/research/generators.md (from T099)", "PLAN §3 M6 (Generators)"]
skills: ["/zod4"]
---

# T101: Troix generator

## Context

T099 recommends a deterministic generator for this type (`docs/research/generators.md`, section 3, effort S). T100 builds the shared pipeline. **Read the research document and the T100 report first.** Where this ticket conflicts with them, they win, and the conflict is noted in the report.

## Scope

**In**

- A generator for `troix` in the T100 pipeline (`src/puzzles/_shared/generate/`), registered version 1, seeded by `mulberry32(hashSeed(...))`: a random filled grid satisfying the quotas and the no-three-in-a-row rule (built by backtracking with the seeded PRNG), then givens removed while `countSolutions === 1`.
- A technique grader for the type, using the T100 grader interface. Publication needs `countSolutions === 1` and a grade, so no puzzle needs trial and error. Techniques: forced cells: a run of two alike forces its neighbours, a line at quota forces the rest, and the three-in-a-row gap rule. Difficulty 1 to 5 by the hardest rule needed and the given count.
- `pnpm puzzles:gen troix --seed <text> --difficulty <1-5>` writes `content/troix/<slug>.ts` with the `generated` provenance export (T100).
- Sizes: 6×6 and 9×9.
- 5 generated content files across difficulties 1 to 5, alongside any hand-written ones.
- Generation time and acceptance rate per difficulty over 50 seeds, in the report.

**Out**

- The hand-written content of the type, and any change to its `countSolutions` other than performance fixes the generator needs.
- Daily puzzles (T111).

## Notes

KrazyDad's binary cousin Binox adds unique rows and columns ([blog](https://blog.krazydad.com/2018/04/30/binox-puzzles-are-here/)); our rules do not, so do not add it.

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
