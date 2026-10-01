---
id: T020
title: Signed-out progress in localStorage and merge on sign-up
milestone: M1
epic: E4
depends_on: [T019]
migrations: false
requires_human: false
spec: ["SPEC §4.3", "SPEC §7.3"]
skills: [/zod4]
---

# T020: Signed-out progress and merge

## Context

Puzzle pages are public. Signed-out players' progress lives in `localStorage` and moves into their account when they sign up or sign in (SPEC §4.3). This ticket adds that layer to the solve chrome generically, for every registered type.

## Scope

**In**

- **A client progress store keyed by `ludwig:progress:<puzzleId>`:**
  - It holds `{ typeKey, state, startedAt, completedAt?, durationMs? }`.
  - `state` is validated with the module's `attemptSchema` on read.
  - Invalid or corrupt entries are discarded silently.
  - Every `localStorage` access is wrapped in `try/catch`.
- **Solve chrome:** when there is no session, autosave and resume use the store instead of `saveState`, and Check runs through the existing `checkAnswer` action. Checking is allowed signed out, but nothing is persisted on the server.
- **Merge:** a `mergeLocalProgress(entries)` Server Action, called once after sign-up or sign-in. For each entry:
  - it validates the entry;
  - creates the attempt if it is missing;
  - writes the state only if the server has no state yet (the server wins on conflict);
  - carries `completed_at` and the duration over if the local entry is complete and the server attempt isn't.

  On success it clears the merged keys from the store.

**Out**

- Any change to type-specific solvers beyond what the chrome passes them.

## Notes

- The signed-out `checkAnswer` path must not create attempt rows. Extend T017's action with an explicit unauthenticated branch that only checks; keep the authenticated branch unchanged.
- Merge is capped at 200 entries per call, to bound the payload.

## Acceptance criteria

- [ ] **AC1**: Signed out, partial progress survives a reload, and the database is untouched.
  - _Verify (browser + db):_ Signed out, place 3 tiles on an anagram and reload; the tiles are restored. `select count(*) from attempts` is unchanged before and after.
- [ ] **AC2**: Signed out, a correct Check shows the solved state locally and writes nothing to the database.
  - _Verify (browser + db):_ Solve the anagram signed out. The `SolvedStamp` shows, and the `attempts` and `attempt_hints` counts are unchanged.
- [ ] **AC3**: Signing up merges local progress, both completed and partial, into the new account and clears it from the store.
  - _Verify (browser + db):_
    - Signed out, complete anagram A and partially do anagram B. Then sign up `T020-1@test.local`.
    - `psql "$DATABASE_URL" -c "select p.slug, a.completed_at is not null from attempts a join puzzles p on p.id = a.puzzle_id join \"user\" u on u.id = a.user_id where u.email = 'T020-1@test.local'"` shows A as `t` and B as `f`.
    - `browser_evaluate` shows no `ludwig:progress:*` keys remain.
- [ ] **AC4**: The server wins on conflict.
  - _Verify (unit):_ `src/lib/actions/merge.test.ts` creates a server attempt with state S, merges a local entry with state L, and asserts that the stored state is still S.
- [ ] **AC5**: A corrupt `localStorage` entry is ignored without errors.
  - _Verify (browser):_ `browser_evaluate` sets `localStorage["ludwig:progress:<id>"] = "{bad"`, then reload the puzzle. It loads fresh, and `browser_console_messages` shows no uncaught errors.
- [ ] **AC6**: With `localStorage` unavailable, the page still works.
  - _Verify (browser):_ Before load, use `browser_evaluate` to override `Storage.prototype.getItem` and `setItem` so they throw. The puzzle is still playable and checkable.
- [ ] **AC7**: The merge action validates its input and rejects more than 200 entries.
  - _Verify (unit):_ `merge.test.ts` sends 201 entries and expects a validation error with no database writes.
- [ ] **AC8**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
