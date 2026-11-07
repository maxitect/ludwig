---
id: T017
title: Attempts data access and checkAnswer/saveState/hint actions
milestone: M1
epic: E4
depends_on: [T016, T008]
migrations: false
requires_human: false
spec: ["SPEC §4.2", "SPEC §4.3", "SPEC §7.3", "SPEC §7.4.3", "SPEC §7.4.5"]
skills: [/zod4]
---

# T017: Attempts data access and puzzle Server Actions

## Context

This is the generic, type-agnostic server path every solver uses: load a puzzle, start or resume an attempt, autosave state, check the answer, and record hints and completion. Everything type-specific is dispatched through the registry from T016.

## Scope

**In**

- **`src/lib/data/puzzles.ts`** (`server-only`): `getPuzzleForPlay(typeKey, slug)`. It reads the supertype columns (no **(S)** columns) and dispatches to `module.load`. It returns `null` if the puzzle doesn't exist or isn't published.
- **`src/lib/data/attempts.ts`** (`server-only`):
  - `getOrCreateAttempt(userId, puzzleId)`. It relies on the `attempts_fill_type_key` trigger and never passes `type_key`.
  - `replaceAttemptState(attemptId, state)`, which delegates to the module's attempt writer: delete and insert the `<type>_attempt*` rows in one transaction.
  - `recordHint(attemptId, kind, row?, col?)`.
  - `completeAttempt(attemptId, durationMs)`.
- **`src/lib/actions/puzzles.ts`** (thin Server Actions, per CLAUDE.md Architecture):
  - `saveState(puzzleId, state)`
  - `checkAnswer(puzzleId, answer, { mode: "full" | "cell", row?, col? })`
  - `revealCell(puzzleId, row, col)`

  Each one:
  1. requires `getCurrentUser()`;
  2. validates its input with the module's `answerSchema` or `attemptSchema`;
  3. calls data access;
  4. returns a typed result.

  `checkAnswer` with `mode: "cell"` and `revealCell` each insert an `attempt_hints` row. A correct full check sets `completed_at` and `duration_ms` once; it never overwrites an existing `completed_at`.
- Vitest integration tests against the local database, using the `__fixture` type from T016.

**Out**

- Signed-out `localStorage` persistence and merge (T020).
- The solve-page UI (T018).
- Type-specific checkers (per-type tickets).

## Notes

- `durationMs` comes from the client timer. Clamp it to `[0, now − started_at]` on the server.
- No action ever returns solution rows. A failed check returns only `{ correct: false, cellsWrong? }`, as defined by each module.

## Acceptance criteria

- [ ] **AC1**: `getOrCreateAttempt` creates exactly one attempt per (user, puzzle), and the trigger fills `type_key`.
  - _Verify (unit + db):_ `src/lib/data/attempts.test.ts` calls it twice for the same pair and expects one row. Then `psql "$DATABASE_URL" -c "select type_key from attempts where id = '<id>'"` returns the puzzle's type.
- [ ] **AC2**: `saveState` replaces the attempt-state rows rather than appending to them.
  - _Verify (unit + db):_ The test saves state A, then state B with fewer rows. `select count(*) from __fixture_attempt_rows where attempt_id = '<id>'` equals B's count, and the contents match B.
- [ ] **AC3**: Hint actions insert `attempt_hints` rows, and the hint count is derived, not stored.
  - _Verify (unit + db):_ The test calls `checkAnswer(…, { mode: "cell" })` twice and `revealCell` once. `select kind, count(*) from attempt_hints where attempt_id = '<id>' group by kind` returns `check_cell = 2` and `reveal_cell = 1`. `grep -rn "hints_used" src/` matches nothing.
- [ ] **AC4**: A correct full check completes the attempt once, and a later check doesn't change `completed_at`.
  - _Verify (unit + db):_ The test checks correctly twice. `select completed_at, duration_ms from attempts where id = '<id>'` is unchanged after the second call.
- [ ] **AC5**: An unauthenticated call to any of the three actions is rejected and writes nothing.
  - _Verify (unit + browser):_
    - The test calls each action with no session mocked at the `getCurrentUser` boundary, expects it to throw, and asserts that the `attempts` and `attempt_hints` counts are unchanged.
    - In the browser, a signed-out request to a page that invokes `saveState` fails, and `psql` shows no new attempt rows.
- [ ] **AC6**: Invalid input is rejected by the Zod schema before any database access.
  - _Verify (unit):_ The test passes a malformed answer and expects a validation error result. A spy on the data-access functions shows zero calls.
- [ ] **AC7**: `getPuzzleForPlay` never returns solution data, and returns `null` for unpublished puzzles.
  - _Verify (unit):_ The test parses the fixture result with `payloadSchema.strict()` and expects it to pass. A fixture with `published_at = null` returns `null`.
- [ ] **AC8**: The server-side duration is clamped.
  - _Verify (unit):_ The test completes with `durationMs = 10_000_000_000` and asserts the stored `duration_ms ≤ now − started_at`.
- [ ] **AC9**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
