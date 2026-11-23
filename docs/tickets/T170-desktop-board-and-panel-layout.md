---
id: T170
title: Desktop solve layout: board on the left, clues and controls on the right, no page scroll
milestone: M5
epic: E12
depends_on: [T169]
migrations: false
requires_human: false
preview: true
spec: ["SPEC §4.5", "SPEC §6.7", "SPEC §8.3"]
skills: []
---

# T170: Desktop solve layout: board on the left, clues and controls on the right, no page scroll

## Context

User feedback (2026-11-23): on a desktop, Reverse Chess means scrolling up and down the page to play. The solve page is one `max-w-3xl` column (`src/app/(app)/puzzles/[type]/[slug]/page.tsx`), so the title, the prompt, a board up to 512px tall, the chain of plies, the ply choices, Check, the status line and the solved footer are stacked, while most of the screen's width sits empty. The same is true of every type that has clues, statements, a key or a set of controls beside its board.

This ticket adds one desktop layout for all of them: the board on the left and everything the player reads or presses on the right, sized so a whole puzzle, from the first entry to the Solved stamp, fits in the viewport. Phones and tablets already have their own answer (solve mode, SPEC §4.5) and do not change.

T169 audited every type and wrote the results to `docs/research/desktop-solve-layout.md`: each type's group, what goes in its panel, what grows, where the chrome goes, the board sizes to expect and the test puzzles. **That document is this ticket's specification for the per-type work.** Read it before anything else. Where it and this ticket disagree, the document wins, and say so in the report.

## Scope

**In**

- **A shared board-and-panel layout.** From the `lg` breakpoint (1024px) up, and not under `touch`:
  - the board is on the left and a panel on the right holds the type's secondary content (prompt, clues, statements, word list, key, chain, toggles), Check and Reset, the status line and, once solved, the solved footer (stamp, time, epilogue, "Next in volume");
  - the board is sized by the viewport height as well as the column width, so it never pushes the page past the fold;
  - when the panel's content is taller than the board (a long clue list or unwind chain), the panel scrolls inside itself, and the document still does not.
- **One implementation.** The layout lives in the solve chrome (`src/components/puzzle/solve-chrome.tsx`) and `src/puzzles/_shared/`. A solver says what belongs in the board cell and the panel cell; it does not build its own grid. The audit (section 9) rules out `SolveSlot` for the panel (it portals after hydration, so the panel would shift, and it leaves the `inert` wrapper): use CSS grid areas on the chrome's grid, with the solver's two small wrapper components `display: contents` below `lg` and under `touch`, so DOM order stays board then panel.
- **The chrome, decided once** (audit section 3): from `lg` up and not under `touch`, a one-row title bar over both columns (chevron back link, the `Credit` large line on one line, difficulty badge, timer; 62px; `PuzzleMenu` stays touch-only), `main` padding 12px instead of 48px, and Check and Reset, the status line and the solved footer at the foot of the panel (the footer at the touch stamp size, 248px, or 312px with "Next in volume", replacing the Check and Reset row once solved; its `max-h` comes from the panel, not the touch `35dvh`). That gives a board column and a panel `100dvh − 164px` tall: 636px at 1440×800 and 486px at 1280×650.
- **Opt-in by type** in `src/config/solve-layout.ts`, which today only has the `wideSolveTypes` set.
- **Types that get the layout:** the audit's groups (`docs/research/desktop-solve-layout.md`, section 4) are the list, with each type's panel contents in section 5 in that order. Fixed by the user (2026-11-23): Reverse Chess (both modes), `chess-problem`, `gear-train`, the crossword and every other type with many annotations or controls. The audit's result (30 `panel`, 2 `board-only`, 2 `excluded`):
  - chess boards: `reverse-chess` (both `last_move` and `unwind`), `chess-problem`;
  - `gear-train`;
  - clue lists and notes: `crossword`, `kakuro`, `sudoku`, `futoshiki`, `logic-grid`, `rota`, `sightlines`, `cctv-maze`, `detective-scene`, `knights-knaves`, `napkin-maths`, `acrostic`;
  - word lists and found words: `word-search`, `word-wheel`, `word-ladder`;
  - cipher keys: `caesar`, `keyword`, `pictogram-cipher`, `book-cipher`;
  - grid-only types, which need the rail because one column leaves a board under 400px at 1280×650: `fillomino`, `troix`, `nonogram`, `norinori`, `star-battle`, `circle9`, `railroad`, `reflections`. Their panel holds the brief where there is one and the chrome.

  The audit moved `odd-one-out` to `board-only` and the grid-only types above out of "probably board-only"; it added `sudoku`, `futoshiki`, `kakuro`, `fillomino`, `troix` to the notes types and found `word-search` also splits in two already (`md:flex-row`).

  `rota`, `word-wheel`, `gear-train`, `book-cipher` and `word-search` already split in two inside the narrow column; move them onto the shared layout and delete their own (`lg:` and `md:` grid and flex-row classes).
- **Board-only types** (`anagram`, `odd-one-out`) keep one column under the compact title bar; open, they fit both viewports with it. Solved, the footer puts the status line 66px and 122px past the fold at 1280×650 (audit section 4); the audit leaves it to this ticket's owner whether they take the chrome-only rail instead.
- **Raising the board caps and bounding boards by height.** Only `CellGrid` sizes by `--solver-height` today, and it is small because of caps; every other board follows its width alone. The audit's table in section 9 lists each board and what changes: lift the cell cap to 72px (4.5rem) in `CellGrid`, `RegionMarkGrid`, `HighlightPathGrid`, `TrainBoard` and the grids with their own `maxWidth` (`nonogram`, `reflections`, `sightlines`, `cctv-maze`, `railroad`), with `futoshiki` and `troix` keeping their 80px; widen the `max-w-xl` wrappers (`DigitGrid`, `kakuro`, `fillomino`, `troix`); give every board but `CellGrid` a height bound from `--solver-height` (the chess board, `RotaBoard`, the wheel and the street scene included); make the logic grid's `MarkGrid` scale (its 36px cells and 128px label bands are fixed today); and set `--solver-height` and `container-type: inline-size` on the board column (audit sections 7 and 9). The `book-cipher` page gets a `max-h` from the same variable and scrolls inside.
- **Panel scrolling** (audit sections 5 and 6): the `unwind` chain is the scroll area with `PlyChoices` and `NotationToggle` pinned under it; the crossword shows both clue lists when the panel is tall enough and scrolls the active clue in its list; `logic-grid`, `knights-knaves` and `rota` scroll the whole panel.
- E2E spec `e2e/desktop-layout.spec.ts`, parametrised over the registry, plus the per-type journeys named in the ACs.
- SPEC §4.5: rewrite the "Wide solve layout" bullet to describe the layout, the types in each group and the viewport sizes it is built for.

**Out**

- **Classic gears (`gears`).** The user's call: it has too few controls to justify a panel. Its state table and swap panel stay where they are.
- Re-auditing. Use T169's figures; re-run `scripts/dev/audit-desktop-layout.mts` only to produce the after figures. It has `--chrome`, `--grown` and `--sweep` modes for the chrome blocks, the growing-panel cases and every published puzzle.
- **Spot the difference.** It keeps its two-up scenes (T152).
- The layout under `touch` (phones and tablets): solve mode stays as it is.
- Widths under 1024px with a fine pointer (a narrow desktop window): the stacked layout stays.
- Changes to any engine, checker, board behaviour or content.

## Notes

- **Target viewports.** 1440×800 (a 13-inch MacBook's visible area) and 1280×650 (a 1366×768 laptop with the browser's own chrome). Below 650px tall the page may scroll.
- **The desktop site header and footer stay.** "No page scroll" means the player never needs to scroll to play, check or read the result; the site footer may sit below the fold.
- **Read solve mode first.** It already sizes every `CellGrid` from the solver area's height with `--solver-height` and a size container. The desktop layout reuses that sizing, not a second scheme, and extends it to the boards that do not read it yet (audit section 9). `SolveSlot` is for the touch pad only; the audit explains why the panel does not use it (section 9).
- **Crossword.** On desktop it has a clue line above the grid, an inline clue list with Across and Down tabs, and Check cell and Reveal cell. In the panel both lists should be visible at once when the height allows, with the active clue scrolled into view. The clue line stays the single `aria-live` announcement.
- **Hydration.** `DeferredChessBoard` (`src/puzzles/_shared/chess-board/deferred-chess-board.tsx`) reserves a `max-w-lg` square before the board code loads. Every placeholder must take the same size as its board in the new layout, or the page shifts on hydration (T069's CLS budget).
- **Solved state.** It sets `inert` on the solver and moves focus to the solved footer, and wide content keeps its scroll position (SPEC §4.5). All three must still hold when the footer lives in the panel.
- **Wrong parts.** A failed check frames the wrong parts and the status line counts them. A wrong part listed in the panel (a clue, a statement) must be scrolled into view.
- Reading order and tab order follow the DOM: the board first, then the panel. Don't reorder visually with `order-*` in a way that breaks it.
- Landscape phones are under 1024px wide, so they keep the stacked layout.
- This touches the solve chrome, so CI runs every e2e spec and `ticket:gates` skips its e2e step. Run the affected specs yourself before pushing.
- The T069 Lighthouse figures (crossword 87 and reverse chess 84, owner-accepted) must not get worse.
- Work type by type and commit as you go; the shared layout and the chess boards come first, since they are the reported problem.

## Acceptance criteria

- [ ] **AC1**: Every type is built as the audit says, and the after figures are recorded.
  - _Verify (cli, code):_ `pnpm tsx scripts/dev/audit-desktop-layout.mts` against the new build shows no overflow at either size for every `panel` and `board-only` type. The report has one row per type with the audit's group, the before overflow from `docs/research/desktop-solve-layout.md` and the after figure, and explains any departure from the audit.
- [ ] **AC2**: Every type except `gears` and `spot-difference` fits both target viewports.
  - _Verify (browser):_ `e2e/desktop-layout.spec.ts` opens the representative puzzle of every type in the registry (the audit's: first in volume order, then by slug) at 1440×800 and 1280×650 and asserts, at `scrollY` 0, that the board, Check, Reset and the status line lie inside the viewport. For panel types it also asserts that the panel's left edge is right of the board's right edge. A test fails if a type in the registry is in none of the three groups.
- [ ] **AC3**: Boards stay a usable size.
  - _Verify (browser):_ The same spec asserts each board is at least 400px on its shorter side at 1280×650 and at least 520px at 1440×800, apart from the types the audit lists as smaller (`docs/research/desktop-solve-layout.md`, section 7): `railroad` at 1280×650 (360px for the representative 5×5), and at 1440×800 `futoshiki` and `troix` (477px), `railroad` (360px), `reflections` and `gear-train` (432px on the shorter side) and `detective-scene` (512px), plus `word-wheel` and `rota` until their boards grow. The spec asserts the audit's board size for each of those, not just the floor. Board budget: `100dvh − 164px`, 636px and 486px.
- [ ] **AC4**: A whole Reverse Chess game can be played, checked and seen solved without the document scrolling, in both modes.
  - _Verify (browser):_ A spec solves one `last_move` and one `unwind` puzzle from their content files' solutions at 1280×650, presses Check and asserts the Solved stamp and the time are inside the viewport, with `window.scrollY` equal to 0 throughout and focus on the solved footer.
- [ ] **AC5**: The same holds for a crossword, a gear train and a chess problem.
  - _Verify (browser):_ Specs solve one of each at 1280×650 with the AC4 assertions. For the crossword, moving to an entry scrolls its clue into view inside the panel.
- [ ] **AC6**: Tall panel content scrolls inside the panel, not the page.
  - _Verify (browser):_ With the test puzzles the audit names for growing panels (at least `the-long-walk`, the 14-ply `unwind` puzzle, fully entered, and the 15×15 crossword `fine-print`), at 1280×650: the document does not scroll past the site footer, the panel's `scrollHeight` is greater than its `clientHeight`, and the latest ply or the active clue is in view.
- [ ] **AC7**: A wrong part in the panel is brought into view after a failed check.
  - _Verify (browser):_ On `manifest` (logic grid, 15 clues) or `night-ferry` (knights and knaves, 5 characters) with a wrong answer entered at 1280×650, press Check: the framed statement or clue is inside the panel's visible area and the status line gives the count.
- [ ] **AC8**: Nothing changes under `touch` or below 1024px.
  - _Verify (browser):_ The `mobile`, `iphone` and `tablet` projects pass unchanged, and at 1000×800 with a fine pointer a Reverse Chess puzzle and a crossword are stacked.
- [ ] **AC9**: No board shifts when it hydrates.
  - _Verify (browser):_ At 1440×800, for a chess board and a `CellGrid` type, the placeholder's bounding box before the board loads equals the board's after, to within 1px.
- [ ] **AC10**: There is one layout, not one per solver.
  - _Verify (code):_ `grep -rn -E "(lg|md):(grid-cols|flex-row)" src/puzzles/*/solver.tsx` shows no solver building its own two-column split (`word-search` used `md:flex-row`), and the types' groups are read from `src/config/solve-layout.ts` and match the audit's (section 4).
- [ ] **AC11**: The layout reads as part of the house style in both themes.
  - _Verify (browser):_ Screenshots in Paper and Ink at 1440×800 and 1280×650 of: Reverse Chess `unwind` mid-game and solved, a crossword, a gear train, a logic grid, a cipher and a sudoku; plus one board-only type, and 390px shots of Reverse Chess and the crossword to show the phone layout is unchanged. Self-assess against `.claude/rules/design-system.md` and say what you judged.
- [ ] **AC12**: Keyboard and screen-reader behaviour is intact.
  - _Verify (unit, cli):_ The existing `screen-reader.test.tsx` files and solver tests pass unchanged, and `e2e/a11y.spec.ts` passes on the desktop project.
- [ ] **AC13**: SPEC §4.5 describes the layout.
  - _Verify (code):_ `grep -n "Wide solve layout\|board-and-panel" docs/SPEC.md` shows the rewritten bullet naming the groups, the excluded types and the two viewport sizes.
- [ ] **AC14**: The layout holds on the PR's preview, and Lighthouse is no worse than T069's figures.
  - _Verify (deploy):_ `PLAYWRIGHT_BASE_URL=<preview-url> pnpm test:e2e desktop-layout` passes, and `BASE=<preview-url> pnpm perf:lighthouse` shows reverse chess Performance at 84 or more, crossword at 87 or more, and CLS no higher than before on any solve page.
- [ ] **AC15**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
