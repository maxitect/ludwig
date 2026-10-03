# Tickets

The execution protocol is in [`INSTRUCTIONS.md`](./INSTRUCTIONS.md) and the ticket format is in [`_TEMPLATE.md`](./_TEMPLATE.md). Reports go in `reports/<id>.md`.

The orchestrator updates the status column below: `todo` → `in-progress` → `review` → `done` (or `blocked`). A ticket can start once everything in its **Depends on** column is `done`. **Mig** marks tickets that create migrations; serialise those (INSTRUCTIONS §1). **Human** marks tickets that need the user to act.

## M0: Foundations and risk spikes

| ID | Title | Depends on | Mig | Human | Status |
|---|---|---|---|---|---|
| [T001](./T001-tooling-and-local-env.md) | Tooling, scripts, env validation and local Postgres | — | | | done |
| [T002](./T002-ci-pipeline.md) | GitHub Actions CI pipeline | T001 | | | done |
| [T003](./T003-spike-drizzle-better-auth.md) | Spike S1: Drizzle 1.0 RC + Better Auth + auth schema | T001 | ✔ | | done |
| [T004](./T004-core-schema.md) | Core schema: lookups, puzzles supertype, volumes, weekly, attempts, hints, settings | T003 | ✔ | | done |
| [T005](./T005-generic-triggers-and-integrity-harness.md) | Generic triggers and the DB-integrity test harness | T004 | ✔ | | done |
| [T006](./T006-spike-cache-components.md) | Spike S2: Cache Components decision | T003 | | | done |
| [T007](./T007-design-tokens-fonts-textures.md) | Design tokens, themes, fonts and textures | T001 | | | done |
| [T008](./T008-auth-pages-proxy-rate-limit.md) | Auth pages, actions, `proxy.ts`, `getCurrentUser` and rate limiting | T003, T007 | | | done |
| [T009](./T009-spike-vercel-neon.md) | Spike S3: Vercel + Neon deployment | T005, T008 | | | done |

## M1: Design system and puzzle framework

| ID | Title | Depends on | Mig | Human | Status |
|---|---|---|---|---|---|
| [T010](./T010-brand-components.md) | Brand components | T007 | | | done |
| [T011](./T011-shadcn-group-a.md) | shadcn restyle A: button, input, label, card, badge, separator, skeleton | T007 | | | done |
| [T012](./T012-shadcn-group-b.md) | shadcn restyle B: dialog, alert-dialog, sheet, dropdown-menu, tooltip, sonner | T011 | | | done |
| [T013](./T013-shadcn-group-c.md) | shadcn restyle C: tabs, toggle-group, slider, progress, form | T011 | | | done |
| [T014](./T014-kitchen-sink.md) | `/dev/kitchen-sink` route | T010, T012, T013 | | | done |
| [T015](./T015-app-shell.md) | App shell: layout, nav, footer, theme switching, landing placeholder | T008, T010, T011 | | | done |
| [T016](./T016-registry-and-content-pipeline.md) | Puzzle registry, type contract, content pipeline (seed + verify) | T005 | | | done |
| [T017](./T017-attempts-actions-data-access.md) | Attempts data access and `checkAnswer`/`saveState`/hint actions | T016, T008 | | | done |
| [T018](./T018-solve-page-chrome-and-routes.md) | Collection, category and solve routes, plus solve-page chrome | T015, T017 | | | done |
| [T019](./T019-type-anagram.md) | Puzzle type: anagram (pilot) | T018 | ✔ | | done |
| [T020](./T020-local-progress-merge.md) | Signed-out progress in `localStorage` and merge on sign-up | T019 | | | done |
| [T021](./T021-shared-cell-input-grid.md) | Shared `CellInput` grid | T018 | | | done |
| [T022](./T022-type-crossword-quick.md) | Puzzle type: crossword (quick style) | T019, T021 | ✔ | | done |
| [T023](./T023-casebook-v1.md) | Casebook v1 (stats views, progress page) | T019 | ✔ | | done |
| [T024](./T024-e2e-flows-1-2.md) | Playwright end-to-end flows 1 and 2 | T002, T009, T020, T022, T023 | | | done |
| [T071](./T071-split-solver-registry.md) | Split client solvers out of the server puzzle registry | T019 | | | done |
| [T072](./T072-seed-update-in-place.md) | Seed updates content in place and never touches attempt data | T016, T022 | | | done |

## M2: Reverse Chess

| ID | Title | Depends on | Mig | Human | Status |
|---|---|---|---|---|---|
| [T025](./T025-reverse-chess-tables-fen.md) | Reverse Chess tables and FEN derivation | T016 | ✔ | | done |
| [T026](./T026-retro-move-engine.md) | Retro-move engine | T025 | | | done |
| [T027](./T027-retro-verifier.md) | Retro enumerator and uniqueness verifier | T026 | | | done |
| [T028](./T028-chess-board-component.md) | Chess board component (react-chessboard v5, cburnett, arrow, tray) | T010, T025 | | | done |
| [T029](./T029-reverse-chess-mode-a.md) | Mode A "The Last Move": UI and check | T026, T028, T018, T071 | | | review |
| [T030](./T030-reverse-chess-mode-b-notation.md) | Mode B "Unwind" plus descriptive notation | T029 | | | todo |
| [T031](./T031-reverse-chess-hub.md) | `/reverse-chess` hub | T029 | | | todo |
| [T032](./T032-reverse-chess-content-e2e.md) | Reverse Chess content ×10 and end-to-end flow 3 | T027, T030, T031 | | | todo |

## M3: The Gear Puzzle

| ID | Title | Depends on | Mig | Human | Status |
|---|---|---|---|---|---|
| [T033](./T033-gear-tables.md) | Gear tables, driver constraint trigger, `gear_daily` | T016 | ✔ | | done |
| [T034](./T034-gear-engine-core.md) | Gear engine core | T033 | | | done |
| [T035](./T035-gear-generators.md) | Gear generator and Fix the Diagram generator | T034 | | | done |
| [T036](./T036-gen-gears-script.md) | `puzzles:gen-gears` script and daily diagrams | T035 | | | done |
| [T037](./T037-gear-board-prototype.md) | SVG gear board, prototype and parameter evaluation | T034, T018 | | | done |
| [T038](./T038-gear-crank.md) | Crank interaction (drag, keyboard, ±) | T037 | | | done |
| [T039](./T039-gear-scrubber-animation.md) | Dance scrubber, animation and sightlines | T038 | | | todo |
| [T040](./T040-gear-accuse-check.md) | Accuse flow and server check | T039 | | | todo |
| [T041](./T041-gear-fix-the-diagram-ui.md) | Fix the Diagram UI | T040, T035 | | | todo |
| [T042](./T042-gear-state-table.md) | Accessible gear state table | T039 | | | todo |
| [T043](./T043-gears-hub.md) | `/gears` hub and daily diagram | T036, T040 | | | todo |
| [T044](./T044-gear-content-e2e-perf.md) | Gear content ×12, end-to-end flow 4, performance budget | T041, T042, T043 | | | todo |

## M4: Library breadth

| ID | Title | Depends on | Mig | Human | Status |
|---|---|---|---|---|---|
| [T045](./T045-crossword-cryptic.md) | Crossword: cryptic style and content | T022 | | | todo |
| [T046](./T046-type-sudoku.md) | Puzzle type: sudoku (+ end-to-end flow 5, keyboard-only) | T021 | ✔ | | todo |
| [T047](./T047-type-futoshiki.md) | Puzzle type: futoshiki | T046 | ✔ | | todo |
| [T048](./T048-type-logic-grid.md) | Puzzle type: logic grid (+ false-statement variant) | T021 | ✔ | | todo |
| [T049](./T049-type-word-ladder.md) | Puzzle type: word ladder and the `words` dictionary | T019 | ✔ | | todo |
| [T050](./T050-type-acrostic.md) | Puzzle type: acrostic | T019 | ✔ | | todo |
| [T051](./T051-type-word-search.md) | Puzzle type: word search ("The Fob-Off") | T021 | ✔ | | todo |
| [T052](./T052-type-caesar-keyword.md) | Puzzle types: caesar and keyword (shared cipher-key panel) | T019 | ✔ | | todo |
| [T053](./T053-type-book-cipher.md) | Puzzle type: book cipher and `book_texts` | T052 | ✔ | | todo |
| [T054](./T054-type-pictogram-cipher.md) | Puzzle type: pictogram cipher and glyph set | T052 | ✔ | | todo |
| [T055](./T055-type-knights-knaves.md) | Puzzle type: knights and knaves | T019 | ✔ | | todo |
| [T056](./T056-type-odd-one-out.md) | Puzzle type: odd one out | T019 | ✔ | | todo |
| [T057](./T057-type-napkin-maths.md) | Puzzle type: napkin maths | T019 | ✔ | | todo |
| [T058](./T058-shared-visibility-engine.md) | Shared `visibility.ts` engine | T016 | | | done |
| [T059](./T059-type-sightlines.md) | Puzzle type: sightlines | T058, T021 | ✔ | | todo |
| [T060](./T060-type-cctv-maze.md) | Puzzle type: CCTV maze | T058, T021 | ✔ | | todo |
| [T061](./T061-type-spot-difference.md) | Puzzle type: spot the difference (seeded SVG scenes) | T018 | ✔ | | in-progress |
| [T062](./T062-rota-tables-engine.md) | Rota (Reverse Chess Mode C): tables, clue kinds, engine | T016 | ✔ | | done |
| [T063](./T063-rota-ui-content.md) | Rota UI, hub integration and content | T062, T028, T031 | | | todo |
| [T064](./T064-this-week.md) | This Week page and the weekly schedule | T019 | | | done |

## M5: Polish and launch

| ID | Title | Depends on | Mig | Human | Status |
|---|---|---|---|---|---|
| [T065](./T065-settings-page.md) | Settings page (theme, notation, reduced motion, display name) | T015, T030 | | | todo |
| [T066](./T066-bullet-hole-transitions.md) | Bullet-hole view transitions | T018 | | | todo |
| [T067](./T067-landing-title-sequence.md) | Title-sequence landing | T015, T028 | | | done |
| [T068](./T068-accessibility-audit.md) | Accessibility audit (axe and screen reader) | all M4 | | | todo |
| [T069](./T069-performance-pass.md) | Performance pass (Lighthouse targets) | all M4, T066, T067 | | | todo |
| [T070](./T070-production-launch.md) | Production launch on the Vercel domain | T068, T069 | | | todo |
