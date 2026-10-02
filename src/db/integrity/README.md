# DB integrity harness

- `pnpm test` first runs `global-setup.ts`, which creates `<db>_test` and migrates it. The `db` client in every test points at it.
- Add `src/db/integrity/<concern>.test.ts`. Use the helpers in `harness.ts`:
  - `pgError` / `pgErrorCode` run a callback in a transaction that is always rolled back and return the Postgres error.
  - `forceDeferred(tx)` runs `SET CONSTRAINTS ALL IMMEDIATE`, since rollbacks never reach COMMIT.
  - `createFixtureSubtype(tx)` creates `zz_fixture_puzzles` (types `fx`, `other`) inside the transaction.
  - `createTestUser(prefix)` signs up through Better Auth; call `deleteTestUsers` in `afterAll`.
- Per-type tests create their own `zz_*` fixtures inside the transaction. Never commit rows.
