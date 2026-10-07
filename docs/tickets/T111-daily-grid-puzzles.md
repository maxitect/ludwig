---
id: T111
title: "Daily seeded grid puzzles"
milestone: M6
epic: E11
depends_on: [T100]
migrations: true
requires_human: false
spec: ["SPEC §4.6", "SPEC §5.2.3 (daily diagrams)", "SPEC §7.4.4", "docs/research/generators.md (from T099)", "PLAN §3 M6 (Generators)"]
skills: ["/db-trigger", "/zod4"]
---

# T111: Daily seeded grid puzzles

## Context

T099 recommends daily seeded puzzles for grid types, like `gear_daily` (`docs/research/generators.md`, section 5.7), starting with sudoku. Generation takes milliseconds, so the work is plumbing. **Read the research document and the T100 report first.**

## Scope

**In**

- A generic daily table: one row per (type key, date) pointing to a puzzle, with a composite FK `(puzzle_id, type_key)` → `puzzles (id, type_key)` so a puzzle of another type is rejected, and the generator version stored in the row. Strict 3NF (`.claude/rules/database.md`); add the `type_key` redundancy to SPEC §7.4.5 with its composite FK and integrity test.
- `pnpm puzzles:gen-daily --type sudoku --from YYYY-MM-DD --days N`, using the T100 registry: `seed = date`, difficulty cycled by days since 1970-01-01, slug `daily-<type>-<date>`, `published_at` at the start of that date in `Europe/London`, a date with a row skipped, written through the per-puzzle transaction `db:seed` uses (`upsertPuzzle`).
- `db:seed` never removes a puzzle linked in the daily table.
- A cron route that keeps a year of sudoku dailies, as T078 does for gears, and `puzzles:verify` re-solves and regenerates every daily row.
- Sudoku only. Other types follow by registering their generator.

**Out**

- The `/puzzles/<type>` daily UI beyond what an unlisted-by-volume puzzle already gets.
- Daily gears, which keep `gear_daily` (migrating them is a separate decision).

## Notes

Daily puzzles belong to no volume. The generator version in the row is for audit and for `puzzles:verify`, because a published daily never changes.

## Acceptance criteria

- [ ] **AC1**: The daily table enforces its invariants.
  - _Verify (db):_ integrity tests: a row pointing to a puzzle of another type is rejected, and a duplicate (type, date) is rejected.
- [ ] **AC2**: Daily generation is reproducible and idempotent.
  - _Verify (cli):_ running the script twice for the same range writes each date once, and the same date regenerates the same puzzle from its stored version.
- [ ] **AC3**: Future dailies are hidden and the seed keeps them.
  - _Verify (db):_ a future daily has a future `published_at` and is not listed; `pnpm db:seed` removes no daily row.
- [ ] **AC4**: The cron route keeps a year ahead.
  - _Verify (deploy):_ `vercel curl --yes --deployment <preview-url> /api/cron/daily-puzzles -- -H "Authorization: Bearer $CRON_SECRET"` returns 200, and a second call writes nothing new.
- [ ] **AC5**: Gates pass, and every new table has a migration and an integrity test.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
