---
id: T161
title: "Recommended for you: a simple recommendation shelf on the Desk"
milestone: M8
epic: E4
depends_on: [T154, T160]
migrations: true
requires_human: false
preview: false
spec: ["SPEC §3", "SPEC §7.4.1"]
skills: []
---

# T161: Recommended for you: a simple recommendation shelf on the Desk

## Context

The user asked for a simple recommendation engine: track what players play and suggest puzzles they will probably like. Everything needed is already recorded in `attempts`, `attempt_hints`, `user_favourite_types` (T154) and the views from T160. No new tracking and no stored scores: the shelf is a derived ranking computed at read time.

## Scope

**In**

- **Scoring**, a pure function in `src/lib/recommend.ts` (no DB or React imports, unit-tested) that takes the user's per-type stats, favourites, solved puzzle ids, and the published catalogue, and returns the top 6 unsolved published puzzles by score. Signals, each with a named weight in one place. Positive:
  - favourite type: strong;
  - type played before, weighted by solves, with a bonus when the player's median time there is short (they are good at it);
  - difficulty one step above the player's median solved difficulty in that type, or difficulty 2 for an unplayed type;
  - same category as the player's most-played category, for types they have not tried (discovery);
  - recency: a type played in the last 14 days scores higher;
  - **comeback rate**: the number of distinct London days the player returned to a type after the day they first tried it, divided by the days since that first try, so a type they keep coming back to outranks one they tried once;
  - returns after a solve: a type they solved and then started another of counts as a stronger return than a plain revisit.

  Negative, each with its own named weight:
  - unfinished attempts of the type (count), and the abandonment ratio (unfinished divided by started);
  - an unfinished attempt older than 7 days (they bounced off it);
  - hints per solve well above the player's own average for that type's category (they struggle there);
  - median solve time more than twice the median of the player's other types at the same difficulty;
  - a type tried exactly once, long ago (over 30 days), and never returned to;
  - a type whose last activity is over 60 days old, unless it is a favourite.

  Resets are not recorded anywhere (`clearState` deletes rows), so they cannot be a signal; say so in the scorer's docstring. Every signal is computed from the existing tables and views; nothing new is tracked.

  Exclusions and ordering: dailies and weekly pairs are excluded (they have their own shelves), and a deterministic tie-break on slug keeps the shelf stable between loads.
- **Data access** `getRecommendations()` in `src/lib/data/desk.ts` or `recommendations.ts` (`server-only`, `requireUser()`), one query for the stats and one for the candidate puzzles (published, not solved, not daily, not weekly), then the pure scorer.
- **Shelf** on the Desk: "Recommended for you", 6 cards with the thumbnail (`PuzzleThumbnail`), type, title, difficulty and a one-line reason ("Because you favourited Troix", "A step up from your sudokus", "Something new in Logic"). Reasons come from the scorer's top signal, so the shelf explains itself.
- **Cold start.** With no attempts and no favourites, the shelf shows one easy puzzle from each of the six most-played types across all users (from `user_solves`, aggregated), labelled "Popular starts".
- `user_type_activity` view: per user and type, first attempt day, last activity day, distinct active days, attempts started, attempts completed, attempts unfinished, and returns after a solve, all in `Europe/London`. Migration and integrity test. The scorer reads this view and T160's `user_type_stats`.
- Unit tests on the scorer with hand-built fixtures for each positive and negative signal and the cold start.

**Out**

- Collaborative filtering, embeddings or any model.
- Storing scores, impressions or clicks.
- Recommendations by email.

## Notes

- Keep it readable: a reader should be able to predict the shelf from the weights. If a weight needs tuning, change the constant and the test.
- The catalogue read is cached (`cacheTag("puzzles")`); the per-user part is not.

## Acceptance criteria

- [ ] **AC1**: The scorer is pure and each signal is tested.
  - _Verify (unit):_ `src/lib/recommend.test.ts` has one test per positive and negative signal, the exclusion rules, the tie-break and the cold start; a `db` test asserts `user_type_activity` against seeded attempts.
- [ ] **AC1b**: Negative signals move a type down.
  - _Verify (unit + browser):_ a type with three unfinished attempts ranks below an untried type of the same category; a type returned to on five days ranks above one tried once.
- [ ] **AC2**: The shelf never shows a solved, daily, weekly or unpublished puzzle.
  - _Verify (browser + db):_ solve a recommended puzzle; it disappears on reload; no daily slug appears.
- [ ] **AC3**: Reasons match the top signal.
  - _Verify (browser):_ favourite a type with no solves; the shelf shows a puzzle of it with the favourite reason.
- [ ] **AC4**: A new user gets the cold-start shelf.
  - _Verify (browser):_ a fresh sign-up sees six "Popular starts" at difficulty 1 or 2.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
