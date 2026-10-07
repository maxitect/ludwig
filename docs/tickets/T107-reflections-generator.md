---
id: T107
title: "Reflections generator"
milestone: M6
epic: E11
depends_on: [T100, T098]
migrations: false
requires_human: false
spec: ["SPEC §2.4 (reflections)", "docs/research/generators.md (from T099)", "PLAN §3 M6 (Generators)"]
skills: ["/zod4"]
---

# T107: Reflections generator

## Context

T099 recommends a deterministic generator for this type (`docs/research/generators.md`, section 3, effort M). T100 builds the shared pipeline. **Read the research document and the T100 report first.** Where this ticket conflicts with them, they win, and the conflict is noted in the report.

## Scope

**In**

- A generator for `reflections` in the T100 pipeline (`src/puzzles/_shared/generate/`), registered version 1, seeded by `mulberry32(hashSeed(...))`: random fixed and slot mirrors, trace beams from random edge ports, label the port pairs the traces join, then remove labels and slots while `countSolutions === 1`.
- A technique grader for the type, using the T100 grader interface. Publication needs `countSolutions === 1` and a grade, so no puzzle needs trial and error. Techniques: single-slot forcing from a labelled beam, then slot interactions along a beam. Difficulty by the hardest rule needed.
- `pnpm puzzles:gen reflections --seed <text> --difficulty <1-5>` writes `content/reflections/<slug>.ts` with the parseable provenance line in `meta.sourceNote`.
- Sizes: 4×4 to 10×10.
- 5 generated content files across difficulties 1 to 5, alongside any hand-written ones.
- Generation time and acceptance rate per difficulty over 50 seeds, in the report.

**Out**

- The hand-written content of the type, and any change to its `countSolutions` other than performance fixes the generator needs.
- Daily puzzles (T111).

## Notes

Each label appears on exactly two ports and unlabelled ports are unconstrained (SPEC §2.4). Mirror puzzles are a KrazyDad lab format ([labs](https://krazydad.com/labs/)).

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
