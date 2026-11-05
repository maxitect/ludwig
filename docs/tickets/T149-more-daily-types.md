---
id: T149
title: Generate daily puzzles for more grid types
milestone: M6
epic: E11
depends_on: [T111]
migrations: false
requires_human: false
preview: false
spec: ["SPEC §2", "SPEC §7.4"]
skills: []
---

# T149: Generate daily puzzles for more grid types

## Context

T111 made `daily_puzzles`, `pnpm puzzles:gen-daily` and the `/api/cron/daily-puzzles` cron generic, but `src/config/daily-types.ts` lists only sudoku. The generators for the other grid types already exist.

## Scope

**In**

- Measure generation time per puzzle for each type with a generator, at the difficulties a daily would use.
- Register the fastest types that fit: at most three new ones, so that a full year of every registered type stays inside the cron's 300 s limit with a safe margin.
- Whatever per-type wiring the daily flow needs to show those dailies to players. Follow how sudoku does it.

**Out**

- New generators, or speeding up existing ones.
- Gear dailies, which have their own table.

## Notes

- The cron runs on Hobby with a 300 s limit, and a year of sudoku takes about 100 s. Assume production is slower than local, and record the measured numbers in the report.
- The cron only has to fill the first year once. Later runs add one date per type, but the first run after this merge must also finish in time. If it can't, spread the backfill over runs.
- `puzzles:verify` re-checks each daily and already takes about 50 s with 366 rows. Keep CI's `db` job within its budget.
- Each generated puzzle must pass the same uniqueness proof as sudoku dailies.

## Acceptance criteria

- [ ] **AC1**: At least one new type generates dailies, each with exactly one solution.
  - _Verify (cli):_ `pnpm puzzles:gen-daily` then `pnpm puzzles:verify` pass on a fresh database.
- [ ] **AC2**: Generating a full year for every registered type stays inside the cron limit.
  - _Verify (cli):_ timed run recorded in the report, under 200 s locally.
- [ ] **AC3**: A new type's daily can be played to completion, and future dates stay hidden.
  - _Verify (browser):_ solve today's daily, and tomorrow's URL returns 404.
- [ ] **AC4**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
