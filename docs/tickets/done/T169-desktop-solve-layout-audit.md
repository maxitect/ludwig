---
id: T169
title: Audit the desktop solve page for every puzzle type: what fits, what scrolls, what belongs in a side panel
milestone: M5
epic: E12
depends_on: [T152, T168]
migrations: false
requires_human: false
preview: false
spec: ["SPEC §4.5", "SPEC §6.7"]
skills: []
---

# T169: Audit the desktop solve page for every puzzle type: what fits, what scrolls, what belongs in a side panel

## Context

User feedback (2026-11-23): on a desktop, Reverse Chess means scrolling up and down the page to play. The solve page is one `max-w-3xl` column (`src/app/(app)/puzzles/[type]/[slug]/page.tsx`), so the title, the prompt, the board, the chain of plies, the ply choices, Check, the status line and the solved footer are stacked, while most of the screen's width sits empty. The user wants a desktop layout with the board on the left and the clues and controls on the right, for every type that benefits.

This ticket is the audit. It measures every type and writes down, per type, what T170 has to build. It changes no app code. T170 implements from this ticket's results document and nothing else, so the document has to be complete enough to build from.

## Scope

**In**

- **A measuring script,** `scripts/dev/audit-desktop-layout.mts`: a headless Playwright run against a local production build that opens the representative puzzle of every type in the registry (and both Reverse Chess modes) at 1440×800 and 1280×650, with a fine pointer, and records for each:
  - the document's scroll height and how far it overflows the viewport;
  - the bounding boxes of the board, each block of secondary content, Check, Reset and the status line, and which of them are below the fold;
  - the same after solving from the content file's solution, for the solved footer.

  It writes the figures as a table and saves a screenshot per type and size under `.verification/T169/`.
- **The results document,** `docs/research/desktop-solve-layout.md`, holding:
  - **the measurements table,** one row per type and viewport;
  - **a group for every type:** `panel` (board left, panel right), `board-only` (one column, board sized by viewport height) or `excluded` (layout unchanged), with one line of reasoning each;
  - **for each `panel` type, the panel's contents** in order, named by the component or element in the solver source (for the crossword: the clue lists, Check cell and Reveal cell; for Reverse Chess `unwind`: the prompt, side to move, the chain, the ply choices and the notation toggle), and what stays with the board;
  - **what in the panel can grow** (clue list, chain, found words) and so needs to scroll inside it, with the largest case in `content/` named as the test puzzle;
  - **the solve chrome's cost:** the height the site header, the title block, the timer row, Check and Reset and the status line take at each size, and a recommendation for where each goes (in the panel, or a compact header) so the page fits;
  - **the board size** each type can reach at each viewport under that recommendation, and any type that would fall under 400px at 1280×650;
  - **the types that already split in two** at `lg` in their own solver (`rota`, `word-wheel`, `gear-train`, `book-cipher`) and what moving them to a shared layout changes;
  - **risks per type** for T170: placeholders that must match their board's size, wide content (the logic grid, the gears state table), anything that reads worse in two columns.
- **Decisions already taken by the user,** recorded in the document as fixed:
  - classic `gears` is `excluded`: too few controls to justify a panel. Still measure it.
  - `gear-train` is `panel`.
  - Reverse Chess (both modes) and `chess-problem` are `panel`.
  - the crossword and every other type with many annotations or controls are `panel`.
  - `spot-difference` is `excluded` and keeps its two-up scenes (T152).
- **Update T170** (`docs/tickets/done/T170-desktop-board-and-panel-layout.md`) where the audit contradicts it: its starting list of types, its board-size floors and its named test puzzles. The audit is the authority.

**Out**

- Any change under `src/`, `content/` or `e2e/`. Building the layout is T170.
- Phones and tablets (`touch`): solve mode is not audited.
- Viewports other than the two targets, apart from a note on where the stacked layout should take over (T170 assumes below 1024px).

## Notes

- **Target viewports.** 1440×800 (a 13-inch MacBook's visible area) and 1280×650 (a 1366×768 laptop with the browser's own chrome).
- **A starting list, from a grep of the solver sources, not from looking at the pages.** Treat it as a hypothesis to test:
  - chess boards: `reverse-chess`, `chess-problem`;
  - `gear-train`;
  - clue lists: `crossword`, `acrostic`, `kakuro`, `logic-grid`, `rota`, `sightlines`, `cctv-maze`, `knights-knaves`, `detective-scene`, `napkin-maths`, `odd-one-out`;
  - word lists: `word-search`, `word-wheel`, `word-ladder`;
  - cipher keys: `caesar`, `keyword`, `pictogram-cipher`, `book-cipher`;
  - grids with a key or note controls: `sudoku`, `futoshiki`, `fillomino`, `troix`;
  - probably board-only: `nonogram`, `norinori`, `star-battle`, `circle9`, `railroad`, `reflections`, `anagram`.
- Run it against `pnpm build && pnpm start --port 3169`, not the dev server, so sizes match production.
- The representative puzzle of a type is the first in its volume order (SPEC §4.6). Where a type's puzzles vary a lot in size (crossword grids, unwind ply counts), measure the largest in `content/` as well.
- `scripts/dev/` is not run by the build or CI, and a push touching only that folder and docs skips CI and Vercel.
- Solve mode's sizing (`--solver-height`, the size container in `solve-chrome.tsx`) and `SolveSlot` (`src/puzzles/_shared/solve-slot.tsx`) are the existing ways to size a board from the available height and to move a solver's content elsewhere. Say in the document whether T170 can reuse them on desktop.

## Acceptance criteria

- [ ] **AC1**: The script measures every type at both sizes.
  - _Verify (cli):_ `pnpm tsx scripts/dev/audit-desktop-layout.mts` exits 0 against the local build and prints one row per type and viewport. The count of types equals the registry's, plus the second Reverse Chess mode.
- [ ] **AC2**: The results document has the measurements and a group for every type.
  - _Verify (code):_ `docs/research/desktop-solve-layout.md` has the table, and every key in `src/puzzles/registry.ts` appears once with a group of `panel`, `board-only` or `excluded` and a reason.
- [ ] **AC3**: Every `panel` type has its panel contents, its growing part and its test puzzle named.
  - _Verify (code):_ Each `panel` row names the elements that move, in order, by their name in the solver source, and a `content/<type>/<slug>.ts` for the largest case where one applies.
- [ ] **AC4**: The chrome recommendation is backed by figures.
  - _Verify (code):_ The document gives the height of each chrome block at both sizes, the recommended placement, and the board size each type reaches under it.
- [ ] **AC5**: The user's fixed decisions are recorded and respected.
  - _Verify (code):_ `gears` and `spot-difference` are `excluded`; `gear-train`, `reverse-chess`, `chess-problem` and `crossword` are `panel`.
- [ ] **AC6**: The screenshots exist.
  - _Verify (browser):_ `.verification/T169/` holds one screenshot per type and size, before solving and solved; the report embeds Reverse Chess `unwind`, the crossword and gear train.
- [ ] **AC7**: T170 agrees with the audit.
  - _Verify (code):_ T170's list of types, board-size floors and named test puzzles match the document, and T170 names the document as its source. `git diff --stat` shows no file under `src/`, `content/` or `e2e/`.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
