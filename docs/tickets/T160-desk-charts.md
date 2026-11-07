---
id: T160
title: "Desk charts: a stats dashboard in the house style, built with D3"
milestone: M8
epic: E4
depends_on: [T153]
migrations: true
requires_human: false
preview: true
spec: ["SPEC §3", "SPEC §6", "SPEC §7.4.1", "SPEC §7.4.6"]
skills: ["dataviz"]
---

# T160: Desk charts: a stats dashboard in the house style, built with D3

## Context

The user wants the Desk (T153) to be a proper dashboard, "super flashy", the kind of profile page a streaming service would ship, with charts rather than a table, and is happy to add a charting library for it. The brand is clinical paper and ink with one red accent and hard edges (SPEC §6, `.claude/rules/design-system.md`), so flashy means dense, animated and interactive, not gradients and glow. Every number stays derived from `attempts` and `attempt_hints` through SQL views (SPEC §7.4.1).

No human sign-off is in this ticket. The implementer renders the dashboard in a browser, judges it against the checklist below, and the user reviews it on the deployed preview and sends feedback as usual.

## Scope

**In**

- **Library.** D3 v7 modules only (`d3-scale`, `d3-shape`, `d3-array`, `d3-interpolate`, `d3-transition` and `d3-selection` where needed), rendered as SVG in client components. No Plotly or ECharts (their default styling fights the brand and they are heavy), and no three.js: nothing here is three-dimensional. Add the packages with pinned versions and note the bundle cost in the report; load the dashboard chunk lazily so the Desk's first shelves do not wait for it.
- **Views.** `user_daily_solves` (user, London day, solves, total duration), `user_type_stats` (user, type, solves, median and best duration, average hints, last solved) and `user_difficulty_stats` (user, difficulty, solves, median duration). Migration, Drizzle `pgView` declarations and integrity tests in the `db` project. No stored counters.
- **Charts**, hard strokes in `ink`, `ludwig-red` for the highlighted series, `grid-blue` for grid lines, no filters or blur (load `/dataviz` before drawing):
  - **Activity.** A 26-week heat grid of solves per day in the crossword-cell motif (ink-filled squares for busy days, empty cells for none), the current streak outlined in red, a hover and focus tooltip with the day and count.
  - **Solves over time.** A step line of cumulative solves by week with the weekly-pair weeks ticked, and a hover crosshair reading the count.
  - **By category.** Horizontal bars of solved out of published per category, median time as the label, a click filtering the type breakdown below it.
  - **Types.** A small-multiples strip, one tile per type played: solves, best time, a spark bar of the last ten solve times.
  - **Speed.** Median time by difficulty drawn as the five difficulty squares from the solve chrome, scaled by time.
  - **Stat tiles.** Total solved, solved this week, current and longest streak, favourite category, fastest solve (title and time), with the numbers counting up on first paint.
- **Motion.** Bars grow, lines draw and tiles count up on first paint (D3 transitions or CSS, about 500 ms, staggered), honouring `prefers-reduced-motion` and the user's `reduce_motion` setting (static, fully drawn). Update `.claude/rules/design-system.md` so D3 transitions are allowed on the Desk charts alongside `motion` on gears and the stamp.
- **Accessibility.** Each chart has a visually hidden table of its data, every interactive mark is keyboard-reachable with the tooltip as its accessible name, and colour is never the only signal.
- **Empty state.** Fewer than 3 solves shows the tiles and a `Walker` with "Solve a few more and the charts fill in".
- The Casebook keeps its table; the Desk links to it.
- **Self-assessment checklist**, applied in the browser and recorded with screenshots in the report, both themes, 1280px and 390px: the dashboard reads at a glance (the biggest number is the one that matters today); something moves on arrival; every chart answers one question; nothing is a default grey chart; hover reveals detail; the phone layout stacks without horizontal scroll; `axe` is clean.

**Out**

- Comparisons with other players, leaderboards.
- Export or sharing.
- The recommendation shelf (T161).

## Notes

- Keep each chart under about 400 SVG nodes; the heat grid is 182 cells.
- Weeks and days are `Europe/London` in SQL, as `user_streaks` does.
- `preview: true` so the user can review it deployed.

## Acceptance criteria

- [ ] **AC1**: The views exist and nothing stores a stat.
  - _Verify (db + code):_ `\dv` lists the three new views; the T023 AC1 "no stored counter" query still returns 0 rows.
- [ ] **AC2**: The views match hand-computed fixtures.
  - _Verify (unit):_ a `db` test seeds solves across days, types and difficulties and asserts each view's rows.
- [ ] **AC3**: Every chart renders from the views, is interactive and reads without colour.
  - _Verify (browser):_ each chart's hidden table matches the numbers drawn (sample two); hovering and focusing a mark shows its tooltip; `axe` reports no violations on `/` signed in.
- [ ] **AC4**: Motion respects the settings.
  - _Verify (browser):_ with `reducedMotion: 'reduce'` and with `reduce_motion` on, `getAnimations({ subtree: true })` on the dashboard is empty and the charts are fully drawn.
- [ ] **AC5**: The dashboard chunk loads lazily and stays small.
  - _Verify (cli):_ the build output shows the Desk charts in their own chunk; its gzipped size is recorded and under 60 KB.
- [ ] **AC6**: The brand checklist holds.
  - _Verify (code):_ `grep -nE "#[0-9a-fA-F]{3,6}|rounded-|bg-white|gradient|blur|filter" src/components/desk` returns nothing except hard-stop grid patterns.
- [ ] **AC7**: The self-assessment is done and recorded.
  - _Verify (browser):_ the checklist above is in the report with a screenshot per item, and the preview URL is in the PR for the user's review.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
