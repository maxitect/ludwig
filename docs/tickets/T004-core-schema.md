---
id: T004
title: "Core schema: lookups, puzzles supertype, volumes, weekly, attempts, hints, settings"
milestone: M0
epic: E1
depends_on: [T003]
migrations: true
requires_human: false
spec: ["SPEC §7.4.1", "SPEC §7.4.2", "SPEC §7.4.3", "SPEC §7.4.6", ".claude/rules/database.md"]
skills: ["/zod4"]
---

# T004: Core schema

## Context

This lands every non-type-specific table from SPEC §7.4.3. The supertype and subtype integrity triggers come in T005. Per-type tables arrive with each puzzle-type ticket.

## Scope

**In**

- `src/db/schema/core.ts`:
  - enums `theme`, `chess_notation`, `book_cover`, `weekly_slot` and `hint_kind`;
  - tables `puzzle_categories`, `puzzle_types`, `user_settings`, `volumes`, `puzzles` and `weekly_puzzles`.
- `src/db/schema/progress.ts`: `attempts` and `attempt_hints`.
- Every PK, unique constraint, FK and CHECK listed in SPEC §7.4.3, including:
  - `puzzles` `unique (type_key, slug)` and `unique (id, type_key)`;
  - `attempts` `unique (user_id, puzzle_id)` and `unique (id, puzzle_id, type_key)`;
  - the composite FK `attempts (puzzle_id, type_key)` → `puzzles (id, type_key)`;
  - `difficulty` CHECK 1–5.
- `attempts.type_key` declared `.notNull().default(sql\`NULL\`)`. It is trigger-filled in T005; see `.claude/rules/database.md`.
- Relations for all of the above in `src/db/relations.ts`.
- A generated migration.

**Out**

- The triggers `trg_puzzles_require_subtype` and `trg_attempts_fill_type_key`, and the integrity harness (T005).
- Lookup data, which is seeded from `content/lookups.ts` in T016.
- Any per-type table.

## Notes

- `user_settings.user_id` references Better Auth's `user.id` (uuid) with `ON DELETE CASCADE`. `attempts.user_id` does the same.
- `attempt_hints.row` and `col` are nullable `smallint` with `CHECK (>= 0)`. `kind` uses the `hint_kind` enum.
- Until T005 lands, inserting into `attempts` without `type_key` fails the NOT NULL check. That's expected, and AC6 asserts it.

## Acceptance criteria

- [ ] **AC1**: All core tables and enums exist after migrating a fresh database.
  - _Verify (db):_ on a fresh `ludwig_t004`, `pnpm db:migrate`. Then `\dt public.*` lists `puzzle_categories`, `puzzle_types`, `user_settings`, `volumes`, `puzzles`, `weekly_puzzles`, `attempts` and `attempt_hints`. `\dT` lists `theme`, `chess_notation`, `book_cover`, `weekly_slot` and `hint_kind`.
- [ ] **AC2**: There are no `jsonb`, `json` or array columns anywhere.
  - _Verify (db):_ `select table_name,column_name from information_schema.columns where table_schema='public' and data_type in ('jsonb','json','ARRAY')` returns 0 rows.
- [ ] **AC3**: Difficulty is constrained to 1–5.
  - _Verify (db):_ in `BEGIN … ROLLBACK`, insert a category and a type, then a puzzle with `difficulty=6`. It fails with `check_violation`. The same insert with `difficulty=3` succeeds.
- [ ] **AC4**: Slugs are unique per type, not globally.
  - _Verify (db):_ in `BEGIN … ROLLBACK`, two puzzles with the same slug and different `type_key` succeed. A second puzzle with the same `(type_key, slug)` fails with `unique_violation`.
- [ ] **AC5**: Each week has at most one puzzle per slot, and a puzzle can't fill both slots of the same week.
  - _Verify (db):_ in `BEGIN … ROLLBACK`, inserting `(week, 'first', p1)` then `(week, 'first', p2)` fails, and `(week, 'second', p1)` also fails, on `unique (week_start, puzzle_id)`.
- [ ] **AC6**: An attempt's `type_key` must match its puzzle through the composite FK.
  - _Verify (db):_ in `BEGIN … ROLLBACK`, with a puzzle of type `a` and a user created through the auth API:
    - inserting an attempt with an explicit `type_key='b'` fails with `foreign_key_violation`;
    - with `type_key='a'` it succeeds;
    - with no `type_key` it fails with `not_null_violation`, which is expected until T005.
- [ ] **AC7**: Deleting a user cascades to their settings and attempts.
  - _Verify (db):_ create a user through `/api/auth/sign-up/email`, insert `user_settings` and an attempt for them, then delete from `"user"`. The counts for that user in `user_settings` and `attempts` are 0.
- [ ] **AC8**: Insert and select schemas are derivable for every core table.
  - _Verify (unit):_ `src/db/schema/core.test.ts` builds `createInsertSchema` for each core table, and rejects `difficulty: 6` on `puzzles`.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
