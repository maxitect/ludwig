---
id: T153
title: "The Desk: a signed-in home page that picks up where you left off"
milestone: M8
epic: E4
depends_on: [T023, T067]
migrations: true
requires_human: false
preview: false
spec: ["SPEC §3", "SPEC §4.3", "SPEC §7.4.3", "SPEC §7.4.6"]
skills: ["/db-trigger"]
---

# T153: The Desk: a signed-in home page that picks up where you left off

## Context

The signed-in Desk was cut from v1 on 2026-10-07 (T138, PLAN §3 M7). User feedback after launch asks for it: a home page that shows the puzzles you are in the middle of, today's dailies and this week's pair, and more of your stats than the Casebook table. Today `/` is the title-sequence landing for everyone.

Favourite types and "New" markers are T154, the charts dashboard is T160, recommendations are T161 and email digests are T157. This ticket lays the page out and leaves room for those.

**Shelf order (user decision, 2026-11-07):** unfinished puzzles first, so a player can resume at once; favourites second (T154 fills that slot), for quick access; then today's dailies and this week's pair; then recommendations (T161); then stats and charts (T160). Nothing may be inserted above the first two.

## Scope

**In**

- **Routing.** `/` renders the Desk for a signed-in user and the landing for everyone else. The session read sits behind `<Suspense>` (Cache Components), with the landing as the fallback-free static path: resolve the user first in a server component and branch, so a signed-out visitor still gets the fully static landing. Update SPEC §3 (`/` line and the nav description) and PLAN §3 M7's post-launch note.
- **Continue where you left off.** A shelf of the user's unfinished attempts, newest activity first, at most 8, each linking to its solve page with the type name, title, difficulty and when it was last touched. An attempt counts as unfinished when it has saved state and no `completed_at`.
  - `attempts` gets `last_saved_at timestamptz not null default now()`. It is a fact, not a derived value, so it may be stored. `replaceAttemptState` sets it in the same transaction that writes the state, and `clearAttemptState` leaves it. Migration, integrity test, SPEC §7.4.3.
  - Whether an attempt has saved state is derivable (the type's `<type>_attempts` row exists). Expose it through the registry: `loadAttemptState` already returns `null` when there is none, so the data-access function lists candidate attempts from `attempts` and filters through the module, or adds a cheap `hasAttemptState(tx, attemptId)` to each module. Choose the one that is a single query per Desk load, not one per attempt, and say which.
- **Today and this week.** Today's dailies (one card per type in `src/config/daily-types.ts` plus the gear daily), with a Solved badge where solved, and the current weekly pair from `getWeeklySchedule`.
- **Stats.** Tiles only here, from the existing views (`user_solves`, `user_category_stats`, `user_streaks`): solved in total, solved this week, current and longest streak. The charts and the new views are T160.
- **Empty states** with the `Walker`: nothing in progress, no solves yet.
- **Design.** `GridPaper` background, `Credit` headers ("Your desk" over the display name), book `Card`s for shelves, both themes, 1280px and 390px.
- `src/lib/data/desk.ts` (`server-only`, `requireUser()`), one RQBv2 query per shelf, selecting only the columns shown.
- E2E: extend `flow-1-signup-solve-casebook.spec.ts` or add `desk.spec.ts`: sign up, start a sudoku and leave, open `/`, see it under "Continue"; finish it, see it gone and the solved count up.

**Out**

- Favourite types and "New" markers (T154); email (T157).
- Charts (T160) and recommendations (T161).
- Any change to the landing page itself (T156).

## Notes

- `getCurrentUser()` calls `connection()`, so the Desk is dynamic; keep the landing static by branching above the Suspense boundary, not inside a cached function.
- Signed-out progress lives in `localStorage` and merges on sign-up (T020). The Desk shows only server-side attempts.
- The nav's Casebook link stays; the Desk links to it for the full table.

## Acceptance criteria

- [ ] **AC1**: Signed out, `/` is the landing; signed in, `/` is the Desk.
  - _Verify (browser):_ anonymous `/` renders `.title-sequence`; after sign-in `/` renders the Desk heading and no `.title-sequence`. Both themes, 1280px and 390px.
- [ ] **AC2**: `attempts.last_saved_at` is updated by state writes only.
  - _Verify (db + unit):_ a `saveState` call moves `last_saved_at` forward; `checkAnswer` on a solved puzzle and `clearState` do not. An integrity test covers the column's default and `not null`.
- [ ] **AC3**: The Continue shelf is the first thing on the Desk and lists unfinished attempts with saved state, newest first, at most 8.
  - _Verify (browser + db):_ with 3 attempts (one saved and unfinished, one solved, one created with no saved state), the shelf shows exactly the first; insert 9 saved attempts and the shelf shows 8.
- [ ] **AC4**: Today's dailies and this week's pair appear with Solved badges.
  - _Verify (browser):_ solve today's troix daily; the Desk shows it with a Solved badge and the other dailies without.
- [ ] **AC5**: Stats match the Casebook.
  - _Verify (browser):_ the solved total and streaks on the Desk equal those on `/casebook` for the same user.
- [ ] **AC6**: The Desk is served only to the signed-in user and never cached across users.
  - _Verify (code + api):_ `src/lib/data/desk.ts` calls `requireUser()` and has no `use cache`; two users see their own shelves.
- [ ] **AC7**: Gates pass, and there are no console errors.
  - _Verify (cli + browser):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0; `browser_console_messages` is empty on `/` in both states.
