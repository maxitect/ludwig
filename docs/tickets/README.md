# Tickets

The execution protocol is in [`INSTRUCTIONS.md`](./INSTRUCTIONS.md) and the ticket format is in [`_TEMPLATE.md`](./_TEMPLATE.md). Reports go in `reports/<id>.md`.

The orchestrator updates the status column below: `todo` → `in-progress` → `review` → `done` (or `blocked`). A ticket can start once everything in its **Depends on** column is `done`. **Mig** marks tickets that create migrations; serialise those (`/orchestrate` skill). **Human** marks tickets that need the user to act.

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
| [T073](./T073-seed-clears-omitted-meta.md) | Seed clears optional meta fields that a content file omits | T072 | | | done |
| [T075](./T075-flush-pending-save.md) | Flush the pending autosave on check, navigation and page hide | T030 | | | done |
| [T079](./T079-seed-confirm-removal.md) | Confirm before the seed removes a puzzle that has attempts | T073 | | | done |

## M2: Reverse Chess

| ID | Title | Depends on | Mig | Human | Status |
|---|---|---|---|---|---|
| [T025](./T025-reverse-chess-tables-fen.md) | Reverse Chess tables and FEN derivation | T016 | ✔ | | done |
| [T026](./T026-retro-move-engine.md) | Retro-move engine | T025 | | | done |
| [T027](./T027-retro-verifier.md) | Retro enumerator and uniqueness verifier | T026 | | | done |
| [T028](./T028-chess-board-component.md) | Chess board component (react-chessboard v5, cburnett, arrow, tray) | T010, T025 | | | done |
| [T029](./T029-reverse-chess-mode-a.md) | Mode A "The Last Move": UI and check | T026, T028, T018, T071 | | | done |
| [T030](./T030-reverse-chess-mode-b-notation.md) | Mode B "Unwind" plus descriptive notation | T029 | ✔ | | done |
| [T031](./T031-reverse-chess-hub.md) | `/reverse-chess` hub | T029 | | | done |
| [T076](./T076-retro-verify-pruning.md) | Prune the Mode B goal-chain search in the verifier | T030 | | | done |
| [T032](./T032-reverse-chess-content-e2e.md) | Reverse Chess content ×10 and end-to-end flow 3 | T027, T030, T031, T073, T076 | | | done |
| [T081](./T081-reverse-chess-proof-game.md) | Reverse Chess: Proof Game (unwind to the starting position) | T032, T076 | ✔ | | done |

## M3: The Gear Puzzle

| ID | Title | Depends on | Mig | Human | Status |
|---|---|---|---|---|---|
| [T033](./T033-gear-tables.md) | Gear tables, driver constraint trigger, `gear_daily` | T016 | ✔ | | done |
| [T034](./T034-gear-engine-core.md) | Gear engine core | T033 | | | done |
| [T035](./T035-gear-generators.md) | Gear generator and Fix the Diagram generator | T034 | | | done |
| [T036](./T036-gen-gears-script.md) | `puzzles:gen-gears` script and daily diagrams | T035 | | | done |
| [T037](./T037-gear-board-prototype.md) | SVG gear board, prototype and parameter evaluation | T034, T018 | | | done |
| [T038](./T038-gear-crank.md) | Crank interaction (drag, keyboard, ±) | T037 | | | done |
| [T039](./T039-gear-scrubber-animation.md) | Dance scrubber, animation and sightlines | T038 | | | done |
| [T040](./T040-gear-accuse-check.md) | Accuse flow and server check | T039 | | | done |
| [T041](./T041-gear-fix-the-diagram-ui.md) | Fix the Diagram UI | T040, T035 | | | done |
| [T042](./T042-gear-state-table.md) | Accessible gear state table | T039 | | | done |
| [T043](./T043-gears-hub.md) | `/gears` hub and daily diagram | T036, T040 | | | done |
| [T044](./T044-gear-content-e2e-perf.md) | Gear content ×12, end-to-end flow 4, performance budget | T041, T042, T043 | | | done |
| [T078](./T078-daily-gears-production.md) | Keep a year of daily gear diagrams generated in production (Vercel cron) | T036 | | | done |
| [T119](./T119-gear-perf-guard.md) | Guard the gear performance budget in CI and cap generated diagrams to it | T044, T078 | | | done |

## M4: Library breadth

| ID | Title | Depends on | Mig | Human | Status |
|---|---|---|---|---|---|
| [T045](./T045-crossword-cryptic.md) | Crossword: cryptic style and content | T022 | | | done |
| [T046](./T046-type-sudoku.md) | Puzzle type: sudoku (+ end-to-end flow 5, keyboard-only) | T021 | ✔ | | done |
| [T047](./T047-type-futoshiki.md) | Puzzle type: futoshiki | T046 | ✔ | | done |
| [T048](./T048-type-logic-grid.md) | Puzzle type: logic grid (+ false-statement variant) | T021 | ✔ | | done |
| [T049](./T049-type-word-ladder.md) | Puzzle type: word ladder and the `words` dictionary | T019 | ✔ | | done |
| [T050](./T050-type-acrostic.md) | Puzzle type: acrostic | T019 | ✔ | | done |
| [T051](./T051-type-word-search.md) | Puzzle type: word search ("The Fob-Off") | T021 | ✔ | | done |
| [T052](./T052-type-caesar-keyword.md) | Puzzle types: caesar and keyword (shared cipher-key panel) | T019 | ✔ | | done |
| [T053](./T053-type-book-cipher.md) | Puzzle type: book cipher and `book_texts` | T052 | ✔ | | done |
| [T054](./T054-type-pictogram-cipher.md) | Puzzle type: pictogram cipher and glyph set | T052 | ✔ | | done |
| [T055](./T055-type-knights-knaves.md) | Puzzle type: knights and knaves | T019 | ✔ | | done |
| [T056](./T056-type-odd-one-out.md) | Puzzle type: odd one out | T019 | ✔ | | done |
| [T057](./T057-type-napkin-maths.md) | Puzzle type: napkin maths | T019 | ✔ | | done |
| [T058](./T058-shared-visibility-engine.md) | Shared `visibility.ts` engine | T016 | | | done |
| [T059](./T059-type-sightlines.md) | Puzzle type: sightlines | T058, T021 | ✔ | | done |
| [T060](./T060-type-cctv-maze.md) | Puzzle type: CCTV maze | T058, T021 | ✔ | | done |
| [T061](./T061-type-spot-difference.md) | Puzzle type: spot the difference (seeded SVG scenes) | T018 | ✔ | | done |
| [T062](./T062-rota-tables-engine.md) | Rota (Reverse Chess Mode D): tables, clue kinds, engine | T016 | ✔ | | done |
| [T063](./T063-rota-ui-content.md) | Rota UI, hub integration and content | T062, T028, T031 | | | done |
| [T074](./T074-crossword-enumeration-separators.md) | Crossword enumeration separators (hyphen or word break) | T045 | ✔ | | done |
| [T080](./T080-crossword-separator-required.md) | Require a separator on every non-last crossword segment | T074 | ✔ | | done |
| [T082](./T082-gear-train-tables-engine.md) | Gear train (Gear Puzzle Mode B): tables, engine, uniqueness search | T016, T034 | ✔ | | done |
| [T083](./T083-gear-train-ui-content.md) | Gear train UI, gears hub integration and content | T082, T043 | | | done |
| [T064](./T064-this-week.md) | This Week page and the weekly schedule | T019 | | | done |
| [T132](./T132-drop-rota-attempt-instigator.md) | Stop naming `rota_attempts.instigator_worker_id` in the Drizzle schema | T063 | | | review |
| [T141](./T141-drop-rota-instigator-column.md) | Drop the `rota_attempts.instigator_worker_id` column (after T132 is in production) | T132 | ✔ | | todo |
| [T133](./T133-reverse-chess-ply-count-trigger.md) | Enforce `reverse_chess_puzzles.ply_count` for every mode with a trigger | T081 | ✔ | | todo |

## M5: Polish and launch

| ID | Title | Depends on | Mig | Human | Status |
|---|---|---|---|---|---|
| [T065](./T065-settings-page.md) | Settings page (theme, notation, reduced motion, display name) | T015, T030 | | | done |
| [T066](./T066-bullet-hole-transitions.md) | Bullet-hole view transitions | T018 | | | done |
| [T067](./T067-landing-title-sequence.md) | Title-sequence landing | T015, T028 | | | done |
| [T068](./T068-accessibility-audit.md) | Accessibility audit (axe and screen reader) | all M4, T112–T117, T120–T138 | | ✔ | todo |
| [T069](./T069-performance-pass.md) | Performance pass (Lighthouse targets) | all M4, T066, T067, T113–T116, T120–T138 | | | todo |
| [T070](./T070-production-launch.md) | Production launch on the Vercel domain | T068, T069 | | | todo |
| [T077](./T077-pg-sslmode.md) | Connect with an explicit `sslmode=verify-full` | — | | | done |
| [T112](./T112-pwa-baseline.md) | PWA baseline (manifest, icons, viewport, safe areas, install hint) | T015 | | | done |
| [T113](./T113-solve-mode-layout.md) | Solve mode, the full-height phone layout for the solve page | T018, T112 | | | done |
| [T114](./T114-puzzle-keyboard.md) | Shared on-screen `PuzzleKeyboard`, `CellGrid` keyboard mode and the device-keyboard setting | T113 | | | done |
| [T115](./T115-crossword-on-phones.md) | Crossword on phones (clue bar, clue sheet, keyboard) | T114 | | | done |
| [T116](./T116-keyboard-other-types.md) | On-screen keyboard for sudoku, futoshiki and the ciphers | T114 | | | done |
| [T117](./T117-touch-pass.md) | Touch pass (tap targets, chess tap-to-move, spot-difference compare, Android backspace, WebKit project) | T113 | | | review |
| [T120](./T120-theme-surfaces-cast-shadows.md) | Theme-aware surfaces and cast shadows, with a guard against raw tokens | — | | | done |
| [T121](./T121-chess-piece-outlines.md) | Chess pieces outlined in the opposite colour in both themes | T120 | | | done |
| [T122](./T122-solved-footer-tear.md) | Solved footer, a small, ordered, framed tear behind the stamp | T120 | | | done |
| [T123](./T123-simplify-bullet-route-transition.md) | Simplify the bullet-hole route transition into the Collection | T122 | | | done |
| [T124](./T124-states-contrast-focus.md) | Disabled, error, contrast and focus states | T120 | | | done |
| [T125](./T125-grid-lines-textures.md) | Single-draw grid lines, crossword numbers on phones, and textures | — | | | done |
| [T126](./T126-themed-not-found.md) | Themed 404 page and the root script-tag error | — | | | done |
| [T127](./T127-book-cipher-layout.md) | Book cipher: lines never wrap on desktop, clear continuations on phones, aligned references | T120 | | | done |
| [T128](./T128-page-polish.md) | Per-page polish (rota, hubs, collection, sign-in, kitchen sink) | T120 | | | done |
| [T129](./T129-puzzle-preview-engine.md) | Puzzle preview engine and per-puzzle thumbnails | — | | | done |
| [T130](./T130-collection-type-thumbnails.md) | Collection type cards show a representative preview | T129, T128 | | | todo |
| [T131](./T131-check-shows-wrong-parts.md) | A failed check names the wrong parts, in the shared contract and the UI | T048, T100 | | | done |
| [T134](./T134-volume-position.md) | Order puzzles within a volume by an authored position | — | ✔ | | todo |
| [T135](./T135-crossword-content-polish.md) | Crossword content polish (fill, repeated roots, symmetry) | T080 | | | todo |
| [T136](./T136-generated-sudoku-futoshiki-content.md) | Generated sudoku and futoshiki at difficulties 3 and 4 | T100 | | | done |
| [T137](./T137-reverse-chess-mode-letters.md) | Reverse Chess mode letters: Proof Game is Mode C, the Rota is Mode D | — | | | done |
| [T138](./T138-v1-reveal-and-desk-scope.md) | Hide Reveal where it isn't built, and mark the Desk as post-launch | — | | | done |
| [T140](./T140-landing-wall-motion.md) | Landing walls come alive, a game unwinding on The Board, letters on The Grid and digits in The Mirror (nice-to-have) | T067 | | | todo |

## M6: Radio Times set

Not on the launch path (PLAN §3 M6).

| ID | Title | Depends on | Mig | Human | Status |
|---|---|---|---|---|---|
| [T084](./T084-sudoku-region-variants.md) | Sudoku: jigsaw and rainbow region variants | T046 | ✔ | | todo |
| [T085](./T085-type-chess-problem.md) | Puzzle type: chess problem (forward mate in N) | T025, T028, T018, T071 | ✔ | | todo |
| [T086](./T086-type-railroad.md) | Puzzle type: railroad | T021 | ✔ | | todo |
| [T087](./T087-type-star-battle.md) | Puzzle type: star battle | T084 | ✔ | | todo |
| [T088](./T088-type-troix.md) | Puzzle type: Troix | T021 | ✔ | | todo |
| [T089](./T089-type-circle9.md) | Puzzle type: Circle9 | T046 | ✔ | | todo |
| [T090](./T090-type-word-wheel.md) | Puzzle type: word wheel | T049 | ✔ | | todo |
| [T091](./T091-type-detective-scene.md) | Puzzle type: detective scene (engine, hit-test and solver) | T061 | ✔ | | todo |
| [T092](./T092-detective-scene-content.md) | Detective scene: artwork and launch content | T091 | | ✔ | todo |
| [T093](./T093-sudoku-killer-xv.md) | Sudoku: killer and XV constraint variants | T084 | ✔ | | todo |
| [T094](./T094-type-nonogram.md) | Puzzle type: nonogram (Ludwig picture reveals) | T021 | ✔ | | todo |
| [T095](./T095-type-kakuro.md) | Puzzle type: kakuro | T021 | ✔ | | todo |
| [T096](./T096-type-fillomino.md) | Puzzle type: fillomino | T021 | ✔ | | todo |
| [T097](./T097-type-norinori.md) | Puzzle type: norinori | T084 | ✔ | | todo |
| [T098](./T098-type-reflections.md) | Puzzle type: reflections (mirrors and beams) | T021 | ✔ | | todo |
| [T099](./T099-research-generators-krazydad.md) | Research: puzzle generation and grading, KrazyDad's blog against our pipeline | — | | | done |
| [T100](./T100-deterministic-generators.md) | Deterministic generator pipeline, plus sudoku and futoshiki generators | T099, T046, T047 | | | done |
| [T101](./T101-troix-generator.md) | Troix generator | T100, T088 | | | todo |
| [T102](./T102-star-battle-generator.md) | Star battle generator | T100, T087 | | | todo |
| [T103](./T103-kakuro-generator.md) | Kakuro generator | T100, T095 | | | todo |
| [T104](./T104-fillomino-generator.md) | Fillomino generator | T100, T096 | | | todo |
| [T105](./T105-norinori-generator.md) | Norinori generator | T100, T097 | | | todo |
| [T106](./T106-railroad-generator.md) | Railroad generator | T100, T086 | | | todo |
| [T107](./T107-reflections-generator.md) | Reflections generator | T100, T098 | | | todo |
| [T108](./T108-jigsaw-rainbow-generators.md) | Jigsaw and rainbow sudoku generators | T100, T084 | | | todo |
| [T109](./T109-killer-xv-generators.md) | Killer and XV sudoku generators | T100, T093 | | | todo |
| [T110](./T110-circle9-generator.md) | Circle9 generator | T100, T089 | | | todo |
| [T111](./T111-daily-grid-puzzles.md) | Daily seeded grid puzzles | T100 | ✔ | | todo |

## M7: Offline PWA (native deferred)

After launch (PLAN §3 M7). Native apps are not ticketed; the open options are in [`docs/research/native-app.md`](../research/native-app.md).

| ID | Title | Depends on | Mig | Human | Status |
|---|---|---|---|---|---|
| [T118](./T118-service-worker-offline.md) | Service worker and offline fallback (Serwist) | T112, T070 | | | todo |
| [T139](./T139-daily-gear-tooth-variety.md) | Widen the tooth sizes used by daily gear diagrams | T119, T070 | | | todo |
