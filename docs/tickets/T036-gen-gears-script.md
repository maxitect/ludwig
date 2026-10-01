---
id: T036
title: puzzles:gen-gears script and daily diagrams
milestone: M3
epic: E7
depends_on: [T035]
migrations: false
requires_human: false
spec: ["SPEC §5.2.3 (step 5)", "SPEC §4.6", "SPEC §7.6"]
skills: []
---

# T036: `puzzles:gen-gears` script and daily diagrams

## Context

Daily diagrams are generated from a date seed and materialised through the same seeding path as curated content, so checking stays server-side (SPEC §4.6, §5.2.3).

## Scope

**In**

- `scripts/generate-gears.ts`, run as `pnpm puzzles:gen-gears --from YYYY-MM-DD --days N [--difficulty-cycle easy,medium,hard,expert]`:
  - it generates with `seed = date`;
  - upserts each puzzle with slug `daily-YYYY-MM-DD`, through the seed module's per-puzzle transaction;
  - and upserts the `gear_daily(date, puzzle_id)` row.
- Reusing the seeding function from T016. No second write path.
- Making `pnpm puzzles:verify` cover generated rows already in the DB (re-solve and compare).

**Out**

- The hub UI (T043).

## Notes

- "Today" is resolved in `Europe/London` everywhere: the script and the hub (T043).

## Acceptance criteria

- [ ] **AC1**: Generating 7 days creates 7 puzzles.
  - _Verify (cli + db):_ `pnpm puzzles:gen-gears --from 2026-11-01 --days 7` exits 0. Then `SELECT count(*) FROM gear_daily WHERE date BETWEEN '2026-11-01' AND '2026-11-07'` returns `7`, and every linked `puzzles.slug` is `daily-<date>`.
- [ ] **AC2**: The script is idempotent.
  - _Verify (cli + db):_ re-running the same command leaves the counts in `puzzles`, `gear_puzzle_gears` and `gear_daily` unchanged. Compare the counts before and after.
- [ ] **AC3**: The output is deterministic.
  - _Verify (db):_ drop the 7 rows, regenerate, and confirm that `SELECT teeth, start_slot, initial_offset FROM gear_puzzle_gears … ORDER BY …` for `daily-2026-11-03` is identical to a saved snapshot.
- [ ] **AC4**: Each daily puzzle is complete and valid.
  - _Verify (db):_ every generated puzzle has exactly one driver, at least 6 gears, one `gear_solutions` row and `generator_seed = '<date>'`.
- [ ] **AC5**: The verifier re-solves the generated rows.
  - _Verify (cli):_ `pnpm puzzles:verify` reports the 7 daily slugs as unique. Hand-editing one gear's `initial_offset` in the DB, inside a transaction, makes the verifier fail for that slug. Roll back afterwards.
- [ ] **AC6**: Bad arguments are rejected.
  - _Verify (cli):_ `--from 2026-13-01` and `--days 0` each exit non-zero, with a usage message.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
