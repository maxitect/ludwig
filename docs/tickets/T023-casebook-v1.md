---
id: T023
title: Casebook v1 (stats views, progress page)
milestone: M1
epic: E4
depends_on: [T019]
migrations: true
requires_human: false
spec: ["SPEC §3", "SPEC §7.4.1", "SPEC §7.4.6", "SPEC §8.2"]
skills: []
---

# T023: Casebook v1

## Context

This is the signed-in progress page: what you've solved, your times, your streaks and per-category stats. Every stat is derived from `attempts` and `attempt_hints` through SQL views. Nothing is stored or counted in app code (SPEC §7.4.1, rule 1; SPEC §7.4.6, Stats).

## Scope

**In**

- **A migration creating views:**
  - `user_solves`: one row per completed attempt, with user, puzzle, type, category, `completed_at`, `duration_ms`, and the hint count derived from `attempt_hints`.
  - `user_category_stats`: per user and category, the number solved, the median and best `duration_ms`, and the average hints.
  - `user_streaks`: per user, the current and longest streak of consecutive calendar days (`Europe/London`) with at least one solve. Use the gaps-and-islands technique.
- Drizzle `pgView` declarations for the views, so queries are typed.
- **`/casebook`:**
  - requires a session (`getCurrentUser()`; `proxy.ts` already does the optimistic redirect);
  - a `Credit` header;
  - streak tiles;
  - a per-category stats table;
  - a recent-solves list linking back to each puzzle;
  - a `GridPaper` background;
  - an empty state with `Walker`.
- `src/lib/data/casebook.ts` (`server-only`), which reads only from the views.

**Out**

- Charts and visualisations (later).
- Settings (T065).

## Notes

- If the days are computed in the view, use `(completed_at at time zone 'Europe/London')::date`. Don't compute timezones in app code.

## Acceptance criteria

- [ ] **AC1**: The views exist, and there are no stored counter or stat columns anywhere.
  - _Verify (db + code):_
    - `psql "$DATABASE_URL" -c "\dv"` lists the three views.
    - `select column_name from information_schema.columns where table_schema = 'public' and table_name not in (select table_name from information_schema.views) and column_name ~ '(count|streak|total|hints_used|solved)'` returns 0 rows.
- [ ] **AC2**: `user_solves` derives the hint count correctly.
  - _Verify (db):_ For a test attempt with 2 `attempt_hints` rows, `select hints from user_solves where attempt_id = '<id>'` returns `2`.
- [ ] **AC3**: Streaks are computed correctly, including the day boundary at London midnight.
  - _Verify (unit):_ `src/lib/data/casebook.test.ts` inserts completed attempts for a test user on days D-3, D-2, D-1, D and D-6 (one at 23:30 UTC in BST, which is the next London day). It asserts the current streak is 4 and the longest is 4.
- [ ] **AC4**: Per-category stats match a hand-computed set.
  - _Verify (unit):_ The test seeds 3 solves in one category with known durations, and asserts the count, median and best from `user_category_stats`.
- [ ] **AC5**: `/casebook` redirects signed-out users, and renders the stats for signed-in users.
  - _Verify (api + browser):_
    - `curl -s -o /dev/null -w "%{http_code} %{redirect_url}" http://localhost:3023/casebook` prints a 307 to `/sign-in`.
    - Sign up `T023-1@test.local`, solve 2 anagrams and open `/casebook`. The snapshot shows 2 solves, a streak of 1 and the anagram category stats.
- [ ] **AC6**: The data access only reads the views.
  - _Verify (code):_ `grep -nE "from\\((attempts|attempt_hints)\\)|attempts\\.|attemptHints\\." src/lib/data/casebook.ts` matches nothing.
- [ ] **AC7**: The Casebook passes the brand checklist, including its empty state.
  - _Verify (browser):_ Screenshots with and without solves in Paper and Ink at 1280px and 390px, under `.verification/T023/`.
- [ ] **AC8**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
