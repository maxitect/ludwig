---
id: T043
title: /gears hub and daily diagram
milestone: M3
epic: E7
depends_on: [T036, T040]
migrations: false
requires_human: false
spec: ["SPEC §3", "SPEC §5.2", "SPEC §1.3"]
skills: []
---

# T043: `/gears` hub and daily diagram

## Context

This is the flagship landing for the Gear Puzzle. It shows today's generated diagram prominently, the curated diagrams below it, and the Fix the Diagram variants as their own section.

## Scope

**In**

- The `/gears` page:
  - a credits header ("THE / **GEAR PUZZLE**") with the subtitle _(definitely not "Slidey Circles")_;
  - an intro quoting John (SPEC §5.2.4 copy);
  - a "Today's diagram" card that resolves `gear_daily` for today in `Europe/London`;
  - curated diagrams (`generator_seed IS NULL`) grouped by difficulty;
  - a "Fix the Diagram" section (`max_adjustments > 0`);
  - solved marks for signed-in users.
- An empty state when no daily row exists for today: the walker plus copy. Never an error.

**Out**

- Content (T044) and the archive of past dailies (not in v1).

## Acceptance criteria

- [ ] **AC1**: Today's daily is resolved in the London timezone.
  - _Verify (db + browser):_ generate dailies for today and tomorrow. The card links to `daily-<today in Europe/London>`.
  - _Verify (unit):_ the date helper returns the London date for `2026-10-25T00:30:00Z`, the day BST ends.
- [ ] **AC2**: The empty state.
  - _Verify (db + browser):_ delete today's `gear_daily` row in a transaction (or use a fresh DB with no dailies). The hub shows the walker empty state, with HTTP 200 and no console errors.
- [ ] **AC3**: Sections are filtered correctly.
  - _Verify (db + browser):_ the curated item count equals `SELECT count(*) FROM gear_puzzles g JOIN puzzles p ON p.id=g.puzzle_id WHERE g.generator_seed IS NULL AND g.max_adjustments=0 AND p.published_at IS NOT NULL`. The Fix section count equals the same query with `max_adjustments>0`.
- [ ] **AC4**: Solved marks.
  - _Verify (browser):_ after solving one diagram (follow T040 AC2), its card shows a solved mark when signed in. There are none when signed out.
- [ ] **AC5**: Session reads don't block the static shell.
  - _Verify (next):_ route info shows a static shell, with the solved marks and today's card streamed behind `<Suspense>`. If the T006 decision disabled Cache Components, note that and skip this AC.
- [ ] **AC6**: Brand, keyboard and visuals.
  - _Verify (browser):_
    - the credits pattern and the subtitle are present;
    - every card is focusable with a visible ring;
    - screenshots in both themes at 1280px and 390px;
    - with reduced motion, the decorative gears don't spin;
    - the console is clean.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
