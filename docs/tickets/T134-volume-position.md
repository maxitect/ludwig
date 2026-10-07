---
id: T134
title: Order puzzles within a volume by an authored position
milestone: M5
epic: E4
depends_on: []
migrations: true
requires_human: false
spec: ["SPEC §4.5", "SPEC §4.6", "SPEC §7.4"]
skills: []
---

# T134: Order puzzles within a volume by an authored position

## Context

"Next in volume" in the solved footer (`src/components/puzzle/solve-chrome.tsx`) and the category page order a volume's puzzles by slug, which is arbitrary to the player. The user decided (2026-10-07) to fix this before launch.

## Scope

**In**

- A `volume_position` column on `puzzles`, NULL exactly when `volume_id` is NULL (CHECK), and unique on `(volume_id, volume_position)`.
- An optional `volumePosition` in content `meta`, required when the file names a volume (schema refinement). Set it in every content file that has a volume, keeping today's order unless a better order is obvious from difficulty.
- The seed writes it. Positions can swap between two puzzles, so make the unique constraint `DEFERRABLE INITIALLY DEFERRED` or write positions in a way that never collides mid-transaction; say which in the report.
- "Next in volume" and the category page's volume lists order by position.
- SPEC §4.5, §4.6 and the `puzzles` table in §7.4 updated.

**Out**

- Ordering outside volumes (hubs order by difficulty then title already).

## Notes

- PLAN §5.1: the previous deploy must keep working against the new schema. Adding a nullable column with a CHECK that holds for existing rows is safe, but the CHECK fails for existing rows with a volume until the seed fills them. Add the column and constraints so the migration succeeds before the seed runs (for example, the migration fills positions from today's slug order), and record the approach.

## Acceptance criteria

- [ ] **AC1**: The column and constraints exist.
  - _Verify (db):_ `\d puzzles` shows `volume_position`, the CHECK and the unique constraint; a puzzle with a volume and NULL position fails to insert.
- [ ] **AC2**: Content declares positions and seeds.
  - _Verify (cli):_ `pnpm puzzles:verify` passes and `pnpm db:seed` exits 0; a content file with a volume and no position fails verify with a named error.
- [ ] **AC3**: "Next in volume" follows the authored order.
  - _Verify (browser):_ solve the first puzzle of a volume and expect the link to go to position 2; the category page lists the volume in position order.
- [ ] **AC4**: The migration and seed run on the PR's preview.
  - _Verify (deploy):_ the preview build is Ready, and Neon MCP `run_sql` on `preview/<branch>` shows no puzzle with a volume and a NULL position.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
