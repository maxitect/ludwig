---
id: T148
title: Extend the weekly schedule through June 2027 with the newer puzzle types
milestone: M5
epic: E10
depends_on: [T064]
migrations: false
requires_human: false
preview: false
spec: ["SPEC §4 (This Week)"]
skills: []
---

# T148: Extend the weekly schedule through June 2027 with the newer puzzle types

## Context

`content/weekly.ts` runs out on the week of 2026-12-28, and only ever pairs crosswords and anagrams apart from spot-the-difference slots. This Week goes empty after that date, and most of the library never appears on it.

## Scope

**In**

- Add weekly slots from 2027-01-04 through 2027-06-28 to `content/weekly.ts`.
- Rotate across the published puzzle types, using the types the schedule has never featured, such as knights and knaves, odd one out, napkin maths, generated sudoku and futoshiki, and the M6 grid types.

**Out**

- Rewriting past or current weeks. Spot-the-difference slots belong to T146, so leave existing weeks alone.
- New puzzle content.

## Notes

- Each week keeps two different types with no repeat inside a week, as `puzzles:verify` requires.
- Space repeats of the same puzzle at least 12 weeks apart. Don't schedule a daily, because dailies have their own dates.
- T146 edits existing slots in this file at the same time, so rebase carefully and keep both sides.

## Acceptance criteria

- [ ] **AC1**: Every week from 2027-01-04 through 2027-06-28 has two slots of different types.
  - _Verify (cli):_ `pnpm puzzles:verify` passes, and a one-off script over `weekly` prints 26 new weeks with no gap.
- [ ] **AC2**: At least 10 puzzle types appear across the new weeks, and no puzzle repeats within 12 weeks.
  - _Verify (cli):_ the same script prints the type count and the shortest repeat gap.
- [ ] **AC3**: The seed loads the new slots.
  - _Verify (db):_ after `pnpm db:seed`, `weekly` rows exist for 2027-06-28.
- [ ] **AC4**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
