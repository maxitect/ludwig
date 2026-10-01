---
id: T005
title: Generic triggers and the DB-integrity test harness
milestone: M0
epic: E1
depends_on: [T004]
migrations: true
requires_human: false
spec: ["SPEC §7.4.2", "SPEC §7.4.5", "SPEC §8.1 Database integrity", ".claude/rules/database.md"]
skills: ["/db-trigger"]
---

# T005: Generic triggers and the DB-integrity test harness

## Context

This adds the two cross-cutting triggers from SPEC §7.4.2 and §7.4.5, plus the reusable Vitest harness that every later schema ticket extends with its own integrity tests.

## Scope

**In**

- Custom migration `puzzles_require_subtype`: a deferred constraint trigger `trg_puzzles_require_subtype`, exactly as in the `/db-trigger` skill.
- Custom migration `attempts_fill_type_key`: a `BEFORE INSERT OR UPDATE OF puzzle_id` trigger on `attempts`.
- The integrity harness:
  - a Vitest setup that creates `<DATABASE_URL db>_test`;
  - migrates it once per run;
  - gives each test a transaction that is rolled back;
  - provides a helper that forces deferred checks with `SET CONSTRAINTS ALL IMMEDIATE`;
  - provides helpers to create a throwaway user through the auth API, or a minimal user row via the adapter only if the auth API isn't reachable from Vitest. Note which one you used.
- Integrity tests in `src/db/integrity/core.test.ts`.

**Out**

- Per-type triggers, such as the gear driver trigger in T033.

## Notes

- **Deferred checks.** Rolled-back transactions never reach COMMIT, so deferred constraint triggers must be forced with `SET CONSTRAINTS ALL IMMEDIATE` (or the named trigger) inside the test.
- **Fixture subtype.** No real subtype table exists yet, so the tests create one inside their transaction, e.g. `public.zz_fixture_puzzles` with the generated `type_key` and composite FK, plus a matching `puzzle_types` row. The rollback removes them.
- **Documentation.** Add a short `src/db/integrity/README.md` (10 lines at most) explaining how later tickets add their tests to the harness.

## Acceptance criteria

- [ ] **AC1**: Both trigger functions exist with `search_path=''`, and both triggers are attached.
  - _Verify (db):_ `select proname, proconfig from pg_proc where proname like 'trg_%'` shows both functions with `{search_path=""}`. `select tgname, tgdeferrable, tginitdeferred from pg_trigger where tgname like 'trg_%'` shows `trg_puzzles_require_subtype | t | t` and `trg_attempts_fill_type_key | f | f`.
- [ ] **AC2**: A puzzle with its subtype row in the same transaction commits.
  - _Verify (db):_ in psql, inside a transaction, create the fixture subtype table and type row, insert a puzzle and its subtype row, then run `SET CONSTRAINTS ALL IMMEDIATE`. There is no error. `ROLLBACK`.
- [ ] **AC3**: A puzzle without a subtype row is rejected.
  - _Verify (db):_ the same as AC2 but without the subtype row. `SET CONSTRAINTS ALL IMMEDIATE` raises `puzzle … has no row in zz_fixture_puzzles` with SQLSTATE `23000`.
- [ ] **AC4**: A subtype row for the wrong type is rejected.
  - _Verify (db):_ insert a puzzle with a different `type_key`, then a `zz_fixture_puzzles` row for it. It fails with `foreign_key_violation`.
- [ ] **AC5**: A puzzle's type can't change while its subtype exists.
  - _Verify (db):_ `UPDATE puzzles SET type_key='other'` on the AC2 puzzle fails with `foreign_key_violation`.
- [ ] **AC6**: The attempt `type_key` is filled automatically.
  - _Verify (db):_ insert an attempt with only `user_id` and `puzzle_id`. `select type_key from attempts` equals the puzzle's `type_key`.
- [ ] **AC7**: An explicitly wrong `type_key` is overwritten or rejected; it can never persist.
  - _Verify (db):_ insert an attempt with `type_key='other'`. The stored row has the puzzle's real `type_key`, because the trigger overwrites it, or the insert fails with `foreign_key_violation`. Report which behaviour applies.
- [ ] **AC8**: The harness runs the integrity tests in isolation and leaves no residue.
  - _Verify (unit):_ `pnpm test src/db/integrity` passes. Afterwards, `psql <test db> -c "select count(*) from puzzles"` returns 0 and `\dt zz_*` returns no relations.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
