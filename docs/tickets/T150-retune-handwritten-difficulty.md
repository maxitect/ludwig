---
id: T150
title: Make hand-written puzzles agree with the difficulty grader
milestone: M6
epic: E11
depends_on: [T100]
migrations: false
requires_human: false
preview: false
spec: ["SPEC §2", "PLAN §5.4"]
skills: []
---

# T150: Make hand-written puzzles agree with the difficulty grader

## Context

`puzzles:grade` rates many hand-written files differently from their stated difficulty, and exits 1 for those types. Reports name sudoku, star battle, Troix, Circle9, railroad, norinori, reflections, kakuro and fillomino files. Three fillomino files can't be solved by the grader at all, and two Troix files (`straight-and-narrow`, `the-third-symbol`) need trial and error.

## Scope

**In**

- Run `puzzles:grade` for every graded type and list every disagreement in the report.
- Where the file grades, set its stated difficulty to the grade.
- Where the grader can't solve the file, replace the puzzle's grid with generated content under the same slug, unless it has production attempts, in which case keep the grid and record it.

**Out**

- Changing any grader or generator.

## Notes

- Never run `puzzles:grade --write` on the five killer and XV sudoku files: `puzzles:grade sudoku` only uses the classic ladder. Handle them by hand or leave them, and say which.
- Volumes may order by difficulty, so check `volumePosition` still reads sensibly after changes.
- Check production attempts read-only on Neon `main` before changing a grid. The seed fails with a named error if a removed cell is referenced by an attempt (T072).

## Acceptance criteria

- [ ] **AC1**: `puzzles:grade` exits 0 for every graded type except files the report lists with a reason.
  - _Verify (cli):_ output recorded in the report.
- [ ] **AC2**: Every changed puzzle still has exactly one solution.
  - _Verify (cli):_ `pnpm puzzles:verify` passes.
- [ ] **AC3**: The seed applies the changes in place on a database that has attempts.
  - _Verify (db):_ `pnpm db:seed` twice, the second reporting no changes.
- [ ] **AC4**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
