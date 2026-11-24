---
id: T175
title: "Desktop solve panel, second pass: sections that fold instead of scrollbars, even spacing, and classic gears in the layout"
milestone: M5
epic: E12
depends_on: [T174]
migrations: false
requires_human: false
preview: true
spec: ["SPEC §4.5", "SPEC §6.7", "SPEC §8.3"]
skills: []
---

# T175: Desktop solve panel, second pass: sections that fold instead of scrollbars, even spacing, and classic gears in the layout

## Context

T170 built the desktop board-and-panel layout. User feedback on production (2026-11-24) asked for a second pass: the panel's scroll areas work but look bad (the system scrollbar "looks terrible") and are cramped, content runs into Check and Reset, the panel and the page have no margin, the crossword should show one clue list at a time, and classic gears must use the same layout as every other type.

T174 audited the built layout and wrote the results to `docs/research/desktop-solve-panel-audit.md`: the findings with their causes, a section plan for every panel type, the spacing rule, the panel width per type, what goes on the left for types without a board, and the plan for classic gears. **That document is this ticket's specification for the per-type work.** Read it before anything else. Where it and this ticket disagree, the document wins, and say so in the report.

Phones and tablets (solve mode, SPEC §4.5) do not change.

## Scope

**In**

- **Sections that fold, in place of scrolling.** One shared panel-section component in `src/puzzles/_shared/`, built the way the audit recommends: a heading with a caret that opens and closes its content, with an option to make a group exclusive (opening one closes the others). Each panel type's solver uses it for the blocks the audit marks as sections, in the state the audit gives for first paint. It applies only in the desktop layout (`panel:`); below `lg` and under `touch` the content renders as it does today.
- **Scrolling as the exception, and never the system scrollbar.** With the audit's first-paint state, every type's panel fits its budget at 1440×800 and 1280×650 without a scroll area, except where the audit says one stays (a long clue list at 650px). Build each of those as the audit designs it: at most one scroll area per panel, its scrollbar hidden or square and in the house style, padding between it and the buttons and content around it, and a hard rule where content is cut. One shared utility in `globals.css` styles every scroll area in the solve section; no solver styles its own.
- **The crossword:** Across and Down are two exclusive sections. Moving in the grid, pressing Space to switch direction or picking a clue opens the section for the direction being typed and closes the other. Opening a section by its caret switches the grid's direction to it. The active clue is in view in the open section. The clue line above stays the single `aria-live` announcement.
- **The spacing rule,** applied once in the shared layout (`solve-chrome.tsx`, `solve-layout.tsx`) and not per solver: the audit's numbers for the panel's padding, the gap above Check and Reset, the gap below the status line, the space between the layout and the site footer, and how a `paper-sheet` sits in the panel. The board column and the panel end on the same line.
- **The per-type work from the audit's section plans,** including the types the user named:
  - `rota`: the incident sheet, the pinned rota, How to play, Clues, Unswaps so far and the accusation as the audit orders and folds them; the pinned rota's list laid out for the panel's width, not the viewport's;
  - `logic-grid`: case notes and clues as the audit plans, the board centred in its column, and the panel width the audit gives;
  - `knights-knaves`: the statement cards and the question placed as the audit decides for types without a board;
  - `pictogram-cipher`, `caesar`, `keyword`: the sheet and the key inside the spacing rule, and the ciphertext sized as the audit decides;
  - every other `panel` type the audit lists a finding against.
- **Classic gears moves into the layout.** `gears` goes from `excludedSolveTypes` to `panelSolveTypes` in `src/config/solve-layout.ts`, and `src/puzzles/gears/solver.tsx` uses `SolveLayout`, `BoardCell` and `PanelCell`: the diagram on the left, sized by `--board-h` and its column, and the scrubber, convergence status, crank stepper, state table, swap panel and accusation where the audit puts them. Fix the Diagram is included. The stacked layout below `lg` and under `touch` keeps today's order.
- **A failed check opens the right section.** When a wrong part is framed in the panel (a clue, a pair, a ply), the section holding it opens and the part is in view.
- **The solved state** fits with the sections as the audit leaves them: the stamp, the time, the epilogue and "Next in volume" are in the viewport at both sizes for every `panel` and `board-only` type, `anagram` and `odd-one-out` included.
- **Every other finding** in the audit's table marked `broken` or `cramped`. `polish` findings are done where the audit says they are one-line changes, and the rest are listed in the report as follow-ups.
- **Tests.** Extend `e2e/desktop-layout.spec.ts` (parametrised over the registry) with the assertions in the ACs, and update `e2e/gears-layout.spec.ts` and the reading-column test in `e2e/spot-difference-desktop.spec.ts` as the audit says.
- **SPEC §4.5:** rewrite the "Wide solve layout" bullet: `gears` is a `panel` type, the panel folds into sections, the crossword's exclusive lists, the spacing rule, and the one place a scroll area may remain.

**Out**

- Re-auditing. Use T174's figures; re-run `scripts/dev/audit-desktop-layout.mts --panel` only for the after figures.
- `spot-difference`: it stays excluded, apart from the shared spacing to the site footer if the audit lists it.
- The layout under `touch` and below 1024px with a fine pointer. The tablet splits T170's review restored (`touch:md:`, `touch:lg:`) stay.
- Changes to any engine, checker, board behaviour or content.
- The layout shift and the hanging prefetch: T173. If T173 has not merged, do not fix them here; if both tickets touch `solve-chrome.tsx`, rebase on whichever merges first.

## Notes

- **Target viewports:** 1440×800 and 1280×650, as in T170. The user's screenshots were about 1000px tall, so also check 1440×1000: more height must not leave sections closed that would fit open. The audit's section plan says which sections open when there is room.
- **Section state is not saved.** Sections are in the audit's first-paint state on each visit, and Reset does not change them.
- **Hydration.** A section that is closed on the server and opened on the client shifts the page. The first-paint state must be the same on both, and may not depend on a measurement taken after hydration (T069's CLS budget, and T173's fix).
- **`inert` once solved.** The solver wrapper is `inert` after a correct check, so carets inside it cannot be pressed. Whatever the solved state needs open or closed has to be set when it becomes solved.
- **Accessibility.** A section's caret is a button (or a `summary`) with `aria-expanded`, operable by Enter and Space, and its content is hidden from the accessibility tree when closed. Closed content that the keyboard flow depends on (the crossword's clue list for the current direction) is never the closed one. `aria-live` regions must not sit inside content that can be closed.
- **Tab and reading order follow the DOM** and do not change below `lg` or under `touch`. Do not reorder with `order-*`.
- **Classic gears:** `GearBoard` animates with `motion` and has a perf budget (T044, `scripts/dev/gears-perf.mjs`); resizing the diagram by height must not add a layout pass per frame. The state table is wide; the audit says how it fits a panel.
- This touches the solve chrome, so CI runs every e2e spec and `ticket:gates` skips its e2e step. Run the affected specs yourself before pushing, on the `desktop`, `mobile`, `iphone` and `tablet` projects.
- Work type by type and commit as you go: the shared section component and the spacing rule first, then the crossword, the four types in the user's screenshots, classic gears, then the rest.
- **Visual sign-off** is the implementer's self-assessment against `.claude/rules/design-system.md`; the user reviews the preview.

## Acceptance criteria

- [ ] **AC1**: Every finding is closed, and the after figures are recorded.
  - _Verify (cli, code):_ `pnpm tsx scripts/dev/audit-desktop-layout.mts --panel` against the new build. The report has one row per finding in the audit's table with its status (`fixed` with the commit, or `follow-up` for `polish` only) and one row per type with the before and after gaps, clipped-element count and scroll-container count at both sizes.
- [ ] **AC2**: Nothing in a panel is clipped at rest, and no panel needs a scrollbar to be read.
  - _Verify (browser):_ `e2e/desktop-layout.spec.ts`, for the representative puzzle of every `panel` type at 1440×800 and 1280×650, asserts that every element inside the solve section with `scrollHeight > clientHeight` is on the audit's list of scroll areas that stay, that each of those has the shared scrollbar style (no system scrollbar: `scrollbar-width` is `none` or `thin` with the house colours) and the audit's padding to the content beside it and to Check and Reset, and that no visible panel element outside them is cut by an ancestor's edge. The largest cases the audit names (at least `cold-frame` or `manifest`, `canteen-queue`, `night-ferry`, `fine-print`, `the-long-walk`) are covered as well as the representatives.
- [ ] **AC3**: The spacing rule holds for every type.
  - _Verify (browser):_ the same spec asserts, at both sizes for every `panel` and `board-only` type, the audit's minimum gap between the last panel content and Check and Reset, between the status line and the bottom of the layout, and between the layout and the site footer's rule; that no bordered sheet touches a button; and that the board column and the panel end within 1px of each other.
- [ ] **AC4**: The crossword shows one clue list at a time, and it follows the grid.
  - _Verify (browser):_ on a crossword at 1280×650: Across is open and Down closed at first; pressing Space in the grid opens Down and closes Across; clicking a Down clue keeps Down open and moves the grid to it; opening Across by its caret switches the grid's direction; the active clue is inside the open list's visible area throughout; exactly one list is in the accessibility tree at any time; `window.scrollY` stays 0. On `fine-print` (15×15) the same holds.
- [ ] **AC5**: The rota, the logic grid and knights and knaves read without scrolling.
  - _Verify (browser):_ on `canteen-queue`, `cold-frame` and `by-the-fire` at 1280×650 and 1440×800, every block the audit marks open at first is fully inside the viewport, each closed section opens by its caret with the keyboard and by a click, and Check, Reset and the status line stay in view with every section open that the audit says may be open together.
- [ ] **AC6**: A wrong part is shown after a failed check.
  - _Verify (browser):_ on `manifest` and on a rota puzzle with a wrong answer entered at 1280×650, with the section holding the clues closed, press Check: the section opens, the framed part is inside the viewport and the status line gives the count.
- [ ] **AC7**: Classic gears uses the board-and-panel layout.
  - _Verify (browser):_ at 1440×800 and 1280×650, for the largest curated diagram, a Fix the Diagram puzzle and today's daily: the diagram is left of the panel, at least the size the audit gives, and the scrubber, crank stepper, state table toggle, swap panel (where present), Check, Reset and the status line are inside the viewport at `scrollY` 0. A spec solves one diagram from its content file and asserts the Solved stamp and the time are in the viewport with focus on the solved footer. `src/config/solve-layout.ts` has `gears` in `panelSolveTypes`.
- [ ] **AC8**: Gears still performs.
  - _Verify (cli):_ `e2e/gears-layout.spec.ts` (updated as the audit says) passes, and `node scripts/dev/gears-perf.mjs` on the largest curated diagram is within T044's budget.
- [ ] **AC9**: The solved footer fits for every type.
  - _Verify (browser):_ the spec's solved pass (a completion row, as in T169) asserts the stamp, the time and "Next in volume" are inside the viewport at both sizes for every `panel` and `board-only` type, `anagram` and `odd-one-out` included.
- [ ] **AC10**: Nothing changes under `touch` or below 1024px.
  - _Verify (browser):_ the `mobile`, `iphone` and `tablet` projects pass, `e2e/solve-layout-tablet.spec.ts` passes unchanged, and a comparison of every element's box in the solve section against `main` at 390×844, an iPad in portrait and in landscape, for one puzzle of every type, shows no visible element moved.
- [ ] **AC11**: Nothing shifts on load.
  - _Verify (browser):_ at 1440×800, for the crossword, the rota and classic gears, the section states and the board's box at first paint equal those after hydration (within 1px), and `BASE=http://localhost:3175 pnpm perf:lighthouse` shows no solve page with a higher CLS than `main`.
- [ ] **AC12**: Keyboard and screen-reader behaviour is intact.
  - _Verify (unit, cli):_ the `screen-reader.test.tsx` files and solver tests pass (any changed assertion is listed in the report with its reason), the shared section component has a test for `aria-expanded`, Enter and Space and the exclusive group, and `e2e/a11y.spec.ts` passes on the desktop project with sections open and closed.
- [ ] **AC13**: The second pass reads as part of the house style in both themes.
  - _Verify (browser):_ screenshots in Paper and Ink at 1440×800 and 1280×650 of the rota, the logic grid, knights and knaves, a crossword with each list open, the pictogram cipher, the Caesar cipher, the keyword cipher, classic gears open and solved, and Reverse Chess `unwind` mid-game; plus 390px shots of the crossword and classic gears to show the phone layout is unchanged. Self-assess against `.claude/rules/design-system.md` (no rounded scrollbars or carets, no fades, tokens only) and say what was judged.
- [ ] **AC14**: SPEC §4.5 describes the layout as built.
  - _Verify (code):_ `grep -n "Wide solve layout" docs/SPEC.md` shows the rewritten bullet: `gears` among the `panel` types, the folding sections, the crossword's exclusive lists and the spacing rule.
- [ ] **AC15**: It holds on the PR's preview.
  - _Verify (deploy):_ `PLAYWRIGHT_BASE_URL=<preview-url> pnpm test:e2e desktop-layout gears-layout solve-layout-tablet` passes, and `BASE=<preview-url> pnpm perf:lighthouse` shows reverse chess Performance at 84 or more, the crossword at 87 or more, and no solve page with a higher CLS than production.
- [ ] **AC16**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
