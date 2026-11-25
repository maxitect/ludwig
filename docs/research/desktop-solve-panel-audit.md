# Desktop solve panel audit (T174)

The second pass over the desktop board-and-panel layout T170 built from T169's audit. Measured against `pnpm build && pnpm start --port 3174` with `pnpm tsx scripts/dev/audit-desktop-layout.mts --panel` (and `--panel --widths`, `--panel --browsers`), at 1440x800 and 1280x650 with a fine pointer, Chromium with its **classic scrollbars on** (headless hides them by default, so `--panel` launches with `ignoreDefaultArgs: ["--hide-scrollbars"]`). With classic scrollbars the page's own vertical bar takes 15px, so the layout is 793px wide where T170 recorded 808px; heights are unaffected. Raw data: `.verification/T174/panel.json` (176 rows: 44 puzzles x 2 sizes x open and solved), `panel-widths.json`, `panel-browsers.json`, `gears-probe.txt`, and 368 screenshots (open and solved, Paper and Ink, both sizes). **T175 implements from this document.** Where this document and T175 disagree, this one is the authority.

Puzzles measured: the representative of each of the 34 registry types (both Reverse Chess modes), plus T169's largest cases (`the-long-walk`, `fine-print`, `manifest`, `night-ferry`, `the-long-shift`, `wound-up`), the user's four (`canteen-queue`, `cold-frame`, `by-the-fire`, `first-drawing`), classic gears `final-curtain` (largest curated, 11 gears), `crossed-wires` (Fix the Diagram) and `daily-2026-11-24` (a daily, generated locally with `pnpm puzzles:top-up-dailies`; the generator caps a daily at 11 gears, `src/puzzles/gears/limits.ts`, so the largest curated diagram is also the largest daily).

## 1. Decisions already taken (fixed)

Recorded as given by the user on 2026-11-24. The rest of this document and T175 respect them.

1. Folding into sections opened by a caret is preferred to scrolling.
2. The system scrollbar is never shown as it is today: a scroll area that stays has its scrollbar hidden or styled, and padding between it and the buttons and content around it.
3. The crossword's Across and Down are two exclusive sections, and the open one follows the grid's typing direction.
4. Classic `gears` is a `panel` type: diagram left, controls right.
5. The spacing fix applies to every type, not only the ciphers.

## 2. Headline findings

- **The panel budget is small and the content is not.** From the top of the panel to the top of Check there are **560px at 1440x800, 410px at 1280x650 and 760px at 1440x1000**. 21 of 30 panel types fit with room to spare. Nine do not at 1280x650: `rota` (801px of content), `logic-grid` (826; 1222 on `manifest`), `knights-knaves` (768; 972 on `night-ferry`), `crossword` (663; 927 on `fine-print`), `book-cipher` (458), `caesar` (454), `keyword` (482), `pictogram-cipher` (466), and Reverse Chess `unwind` with a long chain (418 with 14 plies; 352 with none). `word-search` `wound-up` is 12px over once the 16px gap is applied.
- **A wider panel does not fix them.** Content height against panel width (section 7): `knights-knaves` stays at 756px from 24 to 48rem, `crossword` at 610, `logic-grid` at 684 at 48rem, `rota` at 612. Only the three ciphers shrink, and for them the better move is the left sheet (section 9).
- **Every scroller is the system's.** 15px wide, grey, rounded, 4px from the content (`px-1`). Chromium and WebKit agree on the geometry. WebKit on macOS draws overlay bars that headless cannot force on, so it shows 0px of bar but the same 4px gap and the same clipped lines.
- **Content runs into Check.** Last visible content to Check is 0px on `rota` (1280x650), `logic-grid` and `cold-frame`, 2px on `caesar`, `keyword` and `manifest`, 8 on `pictogram-cipher`, and 0 to 8 on `knights-knaves` at 1440x800. Lines are cut by the button row: `Clues` (rota), clue 14 (cold-frame), the fourth card (by-the-fire).
- **The page scrolls by 98px on every panel type** at both sizes (the site header above, the footer below the layout). The layout ends 12px above the footer's rule (`main` bottom padding). At 1000px tall the footer is visible and the gap is exactly the user's complaint.
- **Dead space is large.** At 1280x650 the board (486px high) sits in a 793px cell: 307 to 396px of unused width on 21 types, and 145 to 400px at 1440x800. `logic-grid` is the one left-aligned board (482px at the left of 793px).
- **Classic gears is the worst case on the site.** Stacked in a 768px main it is 1164px tall (1816 to 2006px with the table shown), Check is below the fold at 650, and the solved stamp ends 849px past the bottom of the viewport.

## 3. The ten leads, confirmed or refuted

| # | Lead | Verdict | Evidence |
|---|---|---|---|
| 1 | No space between the scrolling body and Check | **Confirmed** | `solve-layout.tsx` `PART.body` is `overflow-y-auto` in the `minmax(0,1fr)` row, with `panel:pb-3` on the `PanelCell` inside the scroller. Last content to Check: 0 (`rota`, `logic-grid`, `cold-frame`), 2 (`caesar`, `keyword`, `manifest`) at 1280x650. `.verification/T174/rota-1280x650-open-paper.png`, `logic-grid-1280x650-open-paper.png` |
| 2 | The sheet touches the buttons on the ciphers; the board sheet ends lower | **Confirmed for the first half, refuted for the second** | `cipher-key-panel.tsx` puts `panel:paper-sheet` on the key's own container, so the border meets Check: `caesar` 2px, `keyword` 2px, `pictogram-cipher` 8px at 1280x650, and the key's last row is cut (`Z` on `keyword`). The board sheet and the panel end on the same line (board column bottom minus panel bottom is 0 for every type): the board column runs to the end of the *status* row, so the left sheet ends 36px below the buttons. That is `polish`, and the spacing rule keeps it (the status row is part of the panel) |
| 3 | Too tight to the site footer | **Confirmed** | section to footer rule is 12px for every panel type and the page scrolls 98px; Check to footer rule 48px. `solve-chrome.tsx` section `h-[calc(100dvh-5.625rem)]` and `main` `pb-3` |
| 4 | Native scrollbars | **Confirmed** | 15px bar, 4px gap (`panel:px-1`), `globals.css` has no scrollbar rule. `.verification/T174/crossword-1280x650-open-paper.png`, `pictogram-cipher-1280x650-open-paper.png` (grey rounded thumbs) |
| 5 | Rota: one scroller for four blocks; the pinned list follows the viewport | **Confirmed** | `canteen-queue` scroller 274px of 712 at 1280x650 holds the pinned rota, How to play, Clues, Unswaps and the accusation; `rota/solver.tsx` line 237 is `grid-cols-2 sm:grid-cols-3`, breakpoints of the viewport, so at 793px it is 3 columns of about 100px and every entry wraps. When solved the scroller collapses to 12px (`12/668`) and shows an empty stripe with a bar |
| 6 | Logic grid: 15 clues in 24rem beside a board with a gap; board left-aligned | **Confirmed** | `cold-frame` clues 250 of 680px at 1280x650; board 482px in 793px, dead width 311px; `MarkGrid` is the only board without `mx-auto`. `manifest` 1076px of clue list |
| 7 | Knights and knaves: cards in the panel, text on the left | **Confirmed** | `by-the-fire` left column holds two lines in a 793x486 cell, the panel holds 756px of cards in 410px; `night-ferry` 960px. `.verification/T174/knights-knaves-1280x650-open-paper.png` |
| 8 | Crossword: two force-mounted lists, each its own scroller | **Confirmed** | `clue-tabs.tsx` `split`: two `ol.overflow-y-auto` at 124px each (1280x650), 199px (1440x800), each with a bar, each cutting its last clue. The pinned clue line stays the single `aria-live` |
| 9 | Pictogram cipher: the ciphertext takes two rows of a sheet that fills the board column | **Confirmed** | `first-drawing` ciphertext fills about 190px of a 790x486 sheet; glyphs are 24x32px. The key's 8 figures are in the panel at 350px. See section 9 |
| 10 | Board-only types: the stamp is past the fold at 1280x650 solved | **Confirmed** | `anagram` stamp bottom 668 against 650 (+18), `odd-one-out` 724 (+74). `.verification/T174/odd-one-out-1280x650-solved-paper.png` |

## 4. Findings table

Severity: `broken` is content cut or unreachable without scrolling the page; `cramped` is readable but fighting for room; `polish` is a look.

| ID | Finding | Types | Cause (file, class) | Severity |
|---|---|---|---|---|
| F1 | Panel content ends flush against Check and Reset (0 to 8px), lines cut by the button row | `rota`, `logic-grid` (also `manifest`), `knights-knaves`, `caesar`, `keyword`, `pictogram-cipher`, `book-cipher` (10px) | `src/puzzles/_shared/solve-layout.tsx` `PART.body` (`panel:overflow-y-auto`, `panel:px-1`) and `PanelCell` `panel:pb-3` inside the scroller; `solve-chrome.tsx` controls row `panel:pb-3` and no top gap | broken |
| F2 | System scrollbar: 15px grey rounded thumb on a light track, 4px from content | every scroller: `rota`, `logic-grid`, `knights-knaves`, `crossword` (2), `book-cipher` (2), `caesar`, `keyword`, `pictogram-cipher`, Reverse Chess `unwind` | `globals.css` has no scrollbar rule; `solve-layout.tsx` `px-1` | broken (the user's main complaint) |
| F3 | Cipher key sheet is the scroller and touches Check; the last row is cut | `caesar`, `keyword`, `pictogram-cipher` | `src/puzzles/_shared/cipher-key/cipher-key-panel.tsx`: `paper-sheet ... p-4` on the key group inside a `PanelCell` body that scrolls | broken |
| F4 | 12px from the layout to the site footer's rule; the page scrolls 98px | all 30 panel types | `solve-chrome.tsx` section `panel:h-[calc(100dvh-5.625rem)]`; `main` `pb-3` | cramped |
| F5 | Rota's pinned list wraps every entry onto two lines | `rota` | `rota/solver.tsx:237` `grid-cols-2 sm:grid-cols-3` follows the viewport, not the 24rem panel | cramped |
| F6 | One scroller holds four blocks; the `Clues` heading is cut by Check | `rota` | `rota/solver.tsx` single `PanelCell` body for pinned rota, How to play, Clues, Unswaps, accusation | broken |
| F7 | Two short clue scrollers, 124px at 650 | `crossword` (stage-door, fine-print) | `crossword/clue-tabs.tsx` `split`: two force-mounted `ol.overflow-y-auto` | cramped |
| F8 | Four or five cards in the panel, cut by Check; two lines of text in a 793x486 cell | `knights-knaves` | `knights-knaves/solver.tsx`: `StatementList` in `PanelCell`, prompt in `BoardCell` | broken |
| F9 | 15 clues in 24rem, clue 14 cut; board left-aligned with 311px dead width | `logic-grid` | `logic-grid/solver.tsx` clues in the body; `logic-grid/mark-grid.tsx` has no centring | cramped |
| F10 | Ciphertext sheet is a 790x486 sheet with two rows of text; the key is squeezed into the panel | `caesar`, `keyword`, `pictogram-cipher` | `cipher-key-panel.tsx`: `BoardCell` holds the ciphertext, the key sits in the panel | cramped |
| F11 | The ply chain is a 98px scroller at 1280x650 (3 plies visible; the first line is half cut), 4px from its bar | Reverse Chess `unwind` with more than 3 plies (`the-long-walk`: 14) | `reverse-chess/unwind.tsx` `ol[retro-chain]` | cramped |
| F12 | References list over budget: 458px of content against 410px, with a 15px bar; the page text itself scrolls in the board (334 of 560px at 650, 484 at 800) | `book-cipher` | `book-cipher/solver.tsx` References `gap-3` list; the page sheet `overflow-y-auto` | cramped |
| F13 | `wound-up` is 12px over budget with the 16px gap (406px of 394) | `word-search` | `word-search/solver.tsx` found-word list in one column | cramped |
| F14 | Solved rota: the pinned sheet collapses to a 12px stripe with a bar, and the epilogue (about 770px) scrolls inside a 326px footer | `rota` | `solve-chrome.tsx` footer `panel:overflow-y-auto` and `panel:max-h-[calc(var(--solver-height)-2.5rem)]` | cramped |
| F15 | Solved footer is clipped at 650 (client 230px, scroll 296px) | `cctv-maze` | same footer `max-h` against a longer body | polish |
| F16 | Solved stamp ends 18px (`anagram`) and 74px (`odd-one-out`) past the fold at 1280x650 | `anagram`, `odd-one-out` | `solve-chrome.tsx` footer stamp `--hole-size:216px` in a one-column layout under the compact bar | broken |
| F17 | Classic gears: stacked 576px diagram in a 768px main, controls below the fold, 1164px tall; table adds 538 to 636px; solved stamp 849px below the fold | `gears` | `gears/solver.tsx` is `section.flex.flex-col.gap-4`, and `gears` is in `excludedSolveTypes` | broken |
| F18 | Dead width 307 to 400px beside height-bound boards, mostly an empty gutter; the panel above Check is mostly empty on `sudoku`, `kakuro`, `futoshiki` (52px of content) | 21 types (table in section 8) | `solve-chrome.tsx` fixed `grid-cols-[minmax(0,1fr)_24rem]` | polish |
| F19 | The left sheet ends 36px below the buttons (it runs to the end of the status row) | all types with a left sheet (`caesar`, `keyword`, `pictogram-cipher`, `acrostic`, `nonogram`, `railroad`, `reflections`, `book-cipher`) | `BoardCell` `row-span-6` | polish |
| F20 | The status line sits flush at the section bottom with no space below it | all | `solve-chrome.tsx` status row is the last row, `min-h-6` | polish |
| F21 | `detective-scene` board 804x536 in a 808x636 cell: 100px of dead height at 800 | `detective-scene` | aspect of the scene | polish |

`spot-difference` stays excluded. Its section to footer gap is 48px and Check to footer 96px, both above the spacing rule: **no finding**.

## 5. Spacing rule

One set of numbers, stated once, for `solve-chrome.tsx` and `solve-layout.tsx`. T175 applies it there and not in solvers.

| Quantity | Today | Rule |
|---|---|---|
| Panel content to the top of Check and Reset | 0 to 12px | **16px** minimum (`panel:pb-4` on the last panel part; where a scroller is the last block it ends 16px above Check with a 2px hard rule at its bottom edge) |
| Last content inside a scroller to the scroller's cut edge | 12px of `pb` inside the scroller | **12px** of end padding inside the scroller |
| Scroller content to its scrollbar and to the panel edge | 4px (`px-1`) | **12px** to the bar (`pr-3` with a 10px bar), 0 on the left |
| Check and Reset to the status line | 12px | 12px (no change) |
| Status line bottom to the site footer's rule | 12px | **24px** (section `calc(100dvh - 6.375rem)`; `main` `pb-3` stays, the section takes 12px of its own bottom padding) |
| A bordered sheet (`paper-sheet`) in the panel | the sheet is the `PanelCell` or fills the body, so its border or its 3px cast meets Check | a sheet is **an inner element, never the `PanelCell`**; its bottom edge plus its 3px cast sits at least **16px** above Check; its content padding is the sheet's own |
| Board column and panel bottoms | equal (0px) | equal within 1px, both ending at the status row's bottom |

Effect on boards: `--solver-height` is `100dvh - 164px`. Taking 12px for the footer gap makes it `100dvh - 176px`: **624px at 1440x800 and 474px at 1280x650** (from 636 and 486). Boards bounded by height shrink 12px (2 to 3%). That is the cost of the 24px rule; the alternative is to leave 12px and accept the footer 12px below the layout. The budget for the panel falls by the same 12px plus 4px of the larger gap: **544px at 800, 394px at 650, 744px at 1000** (the plan budgets below).

Breaches today (measured at 1280x650; all at 1440x800 too): every panel type breaches the 24px footer gap (12px). `pictogram-cipher`, `caesar` and `keyword` breach the 16px content gap (8, 2 and 2px). `rota`, `logic-grid`, `knights-knaves` and `cold-frame`/`manifest` breach it (0 to 2px). `book-cipher` breaches it (10px) and its References sheet runs under the button row. `crossword`, `Reverse Chess`, `unwind` at 12px breach the 16px by 4px. The full per-type, per-size table is in section 6.

## 6. Measured gaps per type

Last content to Check, Check to status, section to footer, board column against panel, and how far the page scrolls. "Breaches" applies section 5 (`content<16`, `footer<24`, `sheet<16`). Every panel type has `footer<24` (12px); it is not repeated in the column unless another breach applies. `gears` and `spot-difference` rows are the stacked layout (no panel).

| Puzzle | Size | Last content to Check | Check to status | Status to section bottom | Section to site footer rule | Board column bottom minus panel bottom | Page scrolls by | Breaches of the rule |
|---|---|---|---|---|---|---|---|---|
| acrostic | 1440x800 | 436 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| acrostic | 1280x650 | 286 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| anagram | 1440x800 | - | 12 | 0 | 218 | - | 0 | - |
| anagram | 1280x650 | - | 12 | 0 | 68 | - | 0 | - |
| book-cipher | 1440x800 | 114 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| book-cipher | 1280x650 | 10 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24, sheet<16 |
| caesar | 1440x800 | 122 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| caesar | 1280x650 | 2 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| cctv-maze | 1440x800 | 308 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| cctv-maze | 1280x650 | 158 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| chess-problem | 1440x800 | 284 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| chess-problem | 1280x650 | 134 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| circle9 | 1440x800 | 456 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| circle9 | 1280x650 | 306 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| crossword | 1440x800 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| crossword | 1280x650 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| detective-scene | 1440x800 | 456 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| detective-scene | 1280x650 | 306 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| fillomino | 1440x800 | 540 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| fillomino | 1280x650 | 390 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| futoshiki | 1440x800 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| futoshiki | 1280x650 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| gear-train | 1440x800 | 36 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| gear-train | 1280x650 | 36 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| gears | 1440x800 | - | 24 | 0 | 48 | - | 624 | - |
| gears | 1280x650 | - | 24 | 0 | 48 | - | 774 | - |
| kakuro | 1440x800 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| kakuro | 1280x650 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| keyword | 1440x800 | 94 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| keyword | 1280x650 | 2 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| knights-knaves | 1440x800 | 8 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| knights-knaves | 1280x650 | 62 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| logic-grid | 1440x800 | 0 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| logic-grid | 1280x650 | 0 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| napkin-maths | 1440x800 | 360 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| napkin-maths | 1280x650 | 210 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| nonogram | 1440x800 | 432 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| nonogram | 1280x650 | 282 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| norinori | 1440x800 | 432 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| norinori | 1280x650 | 282 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| odd-one-out | 1440x800 | - | 12 | 0 | 162 | - | 0 | - |
| odd-one-out | 1280x650 | - | 12 | 0 | 12 | - | 0 | footer<24 |
| pictogram-cipher | 1440x800 | 110 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| pictogram-cipher | 1280x650 | 8 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| railroad | 1440x800 | 384 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| railroad | 1280x650 | 234 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| reflections | 1440x800 | 356 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| reflections | 1280x650 | 206 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| reverse-chess:last_move | 1440x800 | 300 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| reverse-chess:last_move | 1280x650 | 150 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| reverse-chess:unwind | 1440x800 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| reverse-chess:unwind | 1280x650 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| rota | 1440x800 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| rota | 1280x650 | 0 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| sightlines | 1440x800 | 280 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| sightlines | 1280x650 | 130 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| spot-difference | 1440x800 | - | 24 | 0 | 48 | - | 315 | - |
| spot-difference | 1280x650 | - | 24 | 0 | 48 | - | 460 | - |
| star-battle | 1440x800 | 480 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| star-battle | 1280x650 | 330 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| sudoku | 1440x800 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| sudoku | 1280x650 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| troix | 1440x800 | 480 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| troix | 1280x650 | 330 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| word-ladder | 1440x800 | 535 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| word-ladder | 1280x650 | 385 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| word-search | 1440x800 | 294 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| word-search | 1280x650 | 144 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| word-wheel | 1440x800 | 298 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| word-wheel | 1280x650 | 148 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| reverse-chess / the-long-walk | 1440x800 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| reverse-chess / the-long-walk | 1280x650 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| crossword / fine-print | 1440x800 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| crossword / fine-print | 1280x650 | 12 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| logic-grid / manifest | 1440x800 | 8 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| logic-grid / manifest | 1280x650 | 2 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| knights-knaves / night-ferry | 1440x800 | 8 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| knights-knaves / night-ferry | 1280x650 | 62 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| rota / the-long-shift | 1440x800 | 0 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| rota / the-long-shift | 1280x650 | 0 | 12 | 0 | 12 | 0 | 98 | content<16, footer<24 |
| word-search / wound-up | 1440x800 | 166 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| word-search / wound-up | 1280x650 | 16 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| pictogram-cipher / first-drawing | 1440x800 | 210 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| pictogram-cipher / first-drawing | 1280x650 | 60 | 12 | 0 | 12 | 0 | 98 | footer<24 |
| gears / final-curtain | 1440x800 | - | 24 | 0 | 48 | - | 624 | - |
| gears / final-curtain | 1280x650 | - | 24 | 0 | 48 | - | 774 | - |
| gears / daily-2026-11-24 | 1440x800 | - | 24 | 0 | 48 | - | 624 | - |
| gears / daily-2026-11-24 | 1280x650 | - | 24 | 0 | 48 | - | 774 | - |

## 7. Scroll containers and their verdicts

Every element in the solve section with `overflow` auto or scroll that actually overflows (the script records the ones that do not as well, in the JSON). Types not listed here have no overflowing scroller at either size: their `PanelCell` body is `overflow-y-auto` but never scrolls, so **the body loses its `overflow-y-auto`** (the one shared scroll utility is applied only where a section's content needs it).

| Puzzle | Size | Scroll container | Visible / content (px) | Bar | Gap content to bar | Clipped at rest (last) | Verdict |
|---|---|---|---|---|---|---|---|
| book-cipher | 1440x800 | `div[Page text]` | 484 / 560 | 15 | 377.9 | 12 (span.relative "at") | References: removed by folding and tightening the gap (388px of 394px); the page text is the board and stays a scroller (house style) |
| book-cipher | 1280x650 | `div[Page text]` | 334 / 560 | 15 | 362.9 | 11 (span.relative "several") | References: removed by folding and tightening the gap (388px of 394px); the page text is the board and stays a scroller (house style) |
| book-cipher | 1280x650 | `div "References"` | 286 / 352 | 15 | 22 | 1 (ol.grid.grid-cols-1.gap-3 "6:18:76) | References: removed by folding and tightening the gap (388px of 394px); the page text is the board and stays a scroller (house style) |
| caesar | 1280x650 | `div.contents.panel:col-start-2.panel:min` | 310 / 356 | 15 | 33 | 1 (button.inline-flex.shrink-0.items-) | removed: the key moves into the left sheet |
| crossword | 1440x800 | `ol.relative.flex.flex-col` | 199 / 384 | 15 | 92.3 | 2 (span.whitespace-nowrap "(5)") | removed for stage-door at 1440x1000; stays for the open list when its content (384px, 624px on fine-print) exceeds the space; one scroller, not two |
| crossword | 1440x800 | `ol.relative.flex.flex-col` | 199 / 384 | 15 | 82.2 | 2 (span.whitespace-nowrap "(5)") | removed for stage-door at 1440x1000; stays for the open list when its content (384px, 624px on fine-print) exceeds the space; one scroller, not two |
| crossword | 1280x650 | `ol.relative.flex.flex-col` | 124 / 384 | 15 | 92.3 | 1 (button.flex.w-full.gap-2 "10Inflat) | removed for stage-door at 1440x1000; stays for the open list when its content (384px, 624px on fine-print) exceeds the space; one scroller, not two |
| crossword | 1280x650 | `ol.relative.flex.flex-col` | 124 / 384 | 15 | 82.2 | 1 (button.flex.w-full.gap-2 "5Dreadfu) | removed for stage-door at 1440x1000; stays for the open list when its content (384px, 624px on fine-print) exceeds the space; one scroller, not two |
| keyword | 1280x650 | `div.contents.panel:col-start-2.panel:min` | 282 / 356 | 15 | 33 | 2 (input[Cipher letter Z, no guess] ") | removed: the key moves into the left sheet |
| knights-knaves | 1440x800 | `div "Ivo. Is this speaker a k"` | 560 / 804 | 15 | 30 | 2 (label.flex.min-h-11.cursor-pointer) | removed by moving the cards to the board cell (two rows of cards, 384px in a 486px cell) |
| knights-knaves | 1280x650 | `div "Ivo. Is this speaker a k"` | 410 / 804 | 15 | 30 | 1 (div "Kit. Is this speaker a k" "Ki) | removed by moving the cards to the board cell (two rows of cards, 384px in a 486px cell) |
| logic-grid | 1440x800 | `div "Clues"` | 400 / 680 | 15 | 4 | 2 (button.cursor-pointer.text-left.ou) | stays: one scroller in the open Clues section; a wider panel does not remove it (684px at 48rem) |
| logic-grid | 1280x650 | `div "Clues"` | 250 / 680 | 15 | 4 | 2 (strong "Lena:") | stays: one scroller in the open Clues section; a wider panel does not remove it (684px at 48rem) |
| pictogram-cipher | 1280x650 | `div.contents.panel:col-start-2.panel:min` | 310 / 368 | 15 | 33 | 0 () | removed: the key moves into the left sheet |
| rota | 1440x800 | `div "The rota as pinned up th"` | 424 / 712 | 15 | 4 | 1 (span "Site log Zone A5 had no powe) | stays only in the open Clues section (one scroller); the pinned rota, incident sheet, unswaps and how to play are removed by folding |
| rota | 1280x650 | `div "The rota as pinned up th"` | 274 / 712 | 15 | 4 | 2 (h3.font-display.text-lg.font-bold ) | stays only in the open Clues section (one scroller); the pinned rota, incident sheet, unswaps and how to play are removed by folding |
| reverse-chess / the-long-walk | 1440x800 | `div.contents.panel:col-start-2.panel:blo` | 248 / 440 | 15 | 4 | 1 (ol[retro-chain] "1.BlackNb52.White) | stays: the ply chain is the one scroller, from the 4th ply at 1280x650 |
| reverse-chess / the-long-walk | 1280x650 | `div.contents.panel:col-start-2.panel:blo` | 98 / 440 | 15 | 4 | 3 (span.font-mono "d4") | stays: the ply chain is the one scroller, from the 4th ply at 1280x650 |
| crossword / fine-print | 1440x800 | `ol.relative.flex.flex-col` | 199 / 648 | 15 | 21.1 | 2 (span.whitespace-nowrap "(5)") | removed for stage-door at 1440x1000; stays for the open list when its content (384px, 624px on fine-print) exceeds the space; one scroller, not two |
| crossword / fine-print | 1440x800 | `ol.relative.flex.flex-col` | 199 / 648 | 15 | 9.4 | 2 (span "Dance venue, losing nothing,) | removed for stage-door at 1440x1000; stays for the open list when its content (384px, 624px on fine-print) exceeds the space; one scroller, not two |
| crossword / fine-print | 1280x650 | `ol.relative.flex.flex-col` | 124 / 648 | 15 | 21.1 | 1 (button.flex.w-full.gap-2 "10Dust c) | removed for stage-door at 1440x1000; stays for the open list when its content (384px, 624px on fine-print) exceeds the space; one scroller, not two |
| crossword / fine-print | 1280x650 | `ol.relative.flex.flex-col` | 124 / 648 | 15 | 9.4 | 1 (button.flex.w-full.gap-2 "4Spoil u) | removed for stage-door at 1440x1000; stays for the open list when its content (384px, 624px on fine-print) exceeds the space; one scroller, not two |
| logic-grid / manifest | 1440x800 | `div "Clues"` | 400 / 1076 | 15 | 4 | 1 (ol.flex.flex-col.gap-3 "1.Cross ou) | stays: one scroller in the open Clues section; a wider panel does not remove it (684px at 48rem) |
| logic-grid / manifest | 1280x650 | `div "Clues"` | 250 / 1076 | 15 | 4 | 1 (div.flex.flex-col.gap-1 "Cross out) | stays: one scroller in the open Clues section; a wider panel does not remove it (684px at 48rem) |
| knights-knaves / night-ferry | 1440x800 | `div "Mara. Is this speaker a "` | 560 / 1008 | 15 | 30 | 2 (label.flex.min-h-11.cursor-pointer) | removed by moving the cards to the board cell (two rows of cards, 384px in a 486px cell) |
| knights-knaves / night-ferry | 1280x650 | `div "Mara. Is this speaker a "` | 410 / 1008 | 15 | 30 | 1 (div "Odile. Is this speaker a" "Od) | removed by moving the cards to the board cell (two rows of cards, 384px in a 486px cell) |
| rota / the-long-shift | 1440x800 | `div "The rota as pinned up th"` | 448 / 688 | 15 | 4 | 2 (span.font-bold "Zane") | stays only in the open Clues section (one scroller); the pinned rota, incident sheet, unswaps and how to play are removed by folding |
| rota / the-long-shift | 1280x650 | `div "The rota as pinned up th"` | 298 / 688 | 15 | 4 | 3 (span.mr-1.font-display.text-xs "Si) | stays only in the open Clues section (one scroller); the pinned rota, incident sheet, unswaps and how to play are removed by folding |

### Panel width does not remove them

Content height of the whole panel at 24, 30, 36, 42 and 48rem (`--widths`; budget 410px at 1280x650, 560px at 1440x800), 1280x650:

| Puzzle | 24rem | 30rem | 36rem | 42rem | 48rem | Board cell width at 48rem |
|---|---|---|---|---|---|---|
| `rota` canteen-queue | 836 | 684 | 660 | 636 | 612 | 409 |
| `rota` the-long-shift | 788 | 660 | 636 | 612 | 588 | 409 |
| `logic-grid` cold-frame | 828 | 708 | 708 | 684 | 684 | 409 |
| `logic-grid` manifest | 1224 | 1128 | 1104 | 1080 | 1080 | 409 |
| `knights-knaves` by-the-fire | 756 | 756 | 756 | 756 | 756 | 409 |
| `knights-knaves` night-ferry | 960 | 960 | 960 | 960 | 960 | 409 |
| `crossword` stage-door | 610 | 610 | 610 | 610 | 610 | 409 |
| `crossword` fine-print | 874 | 826 | 802 | 802 | 802 | 409 |
| `caesar` | 438 | 366 | 266 | 266 | 266 | 409 |
| `keyword` | 466 | 366 | 294 | 294 | 266 | 409 |
| `pictogram-cipher` first-drawing | 350 | 350 | 322 | 222 | 222 | 409 |
| `book-cipher` | 418 | 418 | 390 | 390 | 390 | 409 |
| Reverse Chess `the-long-walk` | 398 | 398 | 398 | 398 | 398 | 409 |
| `word-search` wound-up | 394 | 394 | 394 | 394 | 394 | 409 |

(The 1440x800 columns are the same to within 20px at every width; the budget there is 560px.) **Only the ciphers shrink with width, and a panel at 48rem takes the board's cell from 793px to 409px, below the 486px the board needs.** At 1280x650 a square board is 486px in a 793px cell, so up to 307px (to about 43rem) can go to the panel without shrinking the board; at 1440x800 up to 172px (about 35rem). A wider panel buys nothing for the clues (the rota, the logic grid and the crossword need 600px or more at every width), so **the panel stays 24rem** for every type except where the left sheet takes the key (section 9).

### Scroll verdict: what stays, and how it is built

After folding, **one scroll area may remain in a panel**, in these cases only, at these sizes:

| Where | Stays when |
|---|---|
| `rota` open Clues section | content 428 to 452px against 234px (1280x650) or 384px (1440x800); gone at 1440x1000 (584px) |
| `logic-grid` open Clues section | content 668px (`cold-frame`) against 314px (650) and 464px (800); at 1000 it is 664px (4px over on `cold-frame`: tighten the clue gap), and `manifest` (1064px) scrolls at every size |
| `crossword` open clue list | 384px (stage-door) against 220px (650) and 370px (800); gone at 1000 (570px); 624px on `fine-print` at every size |
| Reverse Chess `unwind` ply chain | from the fourth ply at 1280x650 and about the ninth at 1440x800 |
| `book-cipher` page text | it is the board: 560px of text in a 334px (650) or 484px (800) sheet |
| solved footer of `rota` (epilogue) | the timeline is about 770px (estimated from a stand-in of the real length) |

**Design of the one scroller** (a shared `@utility` in `globals.css`, say `panel-scroll`, applied by the section component and by the board's page sheet; no solver styles its own):

- **Scrollbar:** visible, square, in the house style, not hidden. A hidden bar would need a second cue; a visible bar is the cue. `::-webkit-scrollbar { width: 10px }`, `::-webkit-scrollbar-track { background: var(--color-paper-shade); border-left: 2px solid var(--color-border) }`, `::-webkit-scrollbar-thumb { background: var(--color-ink); border: 2px solid var(--color-paper-shade); border-radius: 0 }` (WebKit, Blink; both ignore the standard properties once those are set). Firefox, which has no `::-webkit-scrollbar`: `@supports not selector(::-webkit-scrollbar) { scrollbar-width: thin; scrollbar-color: var(--color-ink) var(--color-paper-shade) }`. Two themes: the tokens flip in Ink.
- **Padding:** 12px between the content and the bar (`pr-3`), none on the left, 12px of end padding so the last item is never flush with the cut, and the 16px gap above Check from section 5.
- **A hard rule where content is cut:** a 2px `border-b-2 border-border` along the scroller's bottom edge (and `border-t-2` when `scrollTop > 0` is not needed: the top is the section header). No fade, no gradient.
- **How the player can tell there is more:** the bar's track and thumb (the thumb length is the visible share), the hard rule at the bottom edge, and a clipped line at the edge: the scroller height is set to a whole number of rows (`min-h` multiple of the row height) so a row is **never half cut**; a half-visible row is the other signal and is allowed only below the last full row.
- **The scroller is the open section's content**, never the panel body, so a section header and Check are always in view.
- It scrolls the framed or active part into view with `scrollWithin` (`src/puzzles/_shared/scroll-within.ts`), opening the section first.

## 8. Dead space and block heights

Board against its cell, panel content against budget (`content / budget`: content is the unclipped height of every block plus the padding below it; budget is the measured 560px at 1440x800 and 410px at 1280x650), and the blocks at 1280x650 with their heights. Types that are `board-only` or excluded have no cell.

| Puzzle | Size | Board (WxH) | Board cell (WxH) | Dead (W x H) | Panel content / budget | Panel blocks (height at 1280x650 where listed) |
|---|---|---|---|---|---|---|
| acrostic | 1440x800 | - | 808x636 | - | 136 / 560 |  |
| acrostic | 1280x650 | - | 793x486 | - | 136 / 410 | 124 (label.font-display.tex 20, p.text-muted-foregroun 48, input.h-10.w-full.min- 40) |
| anagram | 1440x800 | - | - | - | 0 / - |  |
| anagram | 1280x650 | - | - | - | 0 / - |  |
| book-cipher | 1440x800 | 904x636 | 904x636 | 0 x 0 | 458 / 560 |  |
| book-cipher | 1280x650 | 889x486 | 889x486 | 0 x 0 | 458 / 410 | 112; 322 (h2.font-display.text-l 28, ol.grid.grid-cols-1.ga 264) |
| caesar | 1440x800 | - | 808x636 | - | 454 / 560 |  |
| caesar | 1280x650 | - | 793x486 | - | 454 / 410 | 84; 342 (div.touch:hidden 276, div.touch:hidden 32) |
| cctv-maze | 1440x800 | 636x636 | 808x636 | 172 x 0 | 264 / 560 |  |
| cctv-maze | 1280x650 | 486x486 | 793x486 | 307 x 0 | 264 / 410 | 220 (p[puzzle-brief] 76, p 72, div.flex.flex-wrap.gap 40); 20 |
| chess-problem | 1440x800 | 636x636 | 808x636 | 172 x 0 | 284 / 560 |  |
| chess-problem | 1280x650 | 486x486 | 793x486 | 307 x 0 | 284 / 410 | 100 (p.font-display.text-2x 64, div.flex.items-center. 32); 160 (div.flex.flex-col.gap- 76, div.flex.flex-col.gap- 68, div[status] 24) |
| circle9 | 1440x800 | 636x636 | 808x636 | 172 x 0 | 116 / 560 |  |
| circle9 | 1280x650 | 486x486 | 793x486 | 307 x 0 | 116 / 410 | 72; 20 |
| crossword | 1440x800 | 627x627 | 808x636 | 181 x 9 | 738 / 560 |  |
| crossword | 1280x650 | 484x484 | 793x486 | 309 x 2 | 663 / 410 | 27 (p.sr-only 1, p.min-h-7.text-lg.touc 30); 568 (div[tabpanel] "across" 148, div[tabpanel] "down" 148); 32 |
| detective-scene | 1440x800 | 804x536 | 808x636 | 4 x 100 | 113 / 560 |  |
| detective-scene | 1280x650 | 641x427 | 793x486 | 152 x 59 | 113 / 410 | 25; 64 (form.flex.items-end.ga 64, p[scene-status] 24) |
| fillomino | 1440x800 | 633x633 | 808x636 | 175 x 3 | 32 / 560 |  |
| fillomino | 1280x650 | 483x483 | 793x486 | 310 x 3 | 32 / 410 | 20 |
| futoshiki | 1440x800 | 477x477 | 808x636 | 331 x 159 | 52 / 52 |  |
| futoshiki | 1280x650 | 477x477 | 793x486 | 316 x 9 | 52 / 52 | 40 |
| gear-train | 1440x800 | 648x432 | 808x636 | 160 x 204 | 322 / 560 |  |
| gear-train | 1280x650 | 648x432 | 793x486 | 145 x 54 | 322 / 410 | 108 (p 48, p.text-sm.text-muted-f 60); 130 (button[8-tooth cog, 3  68, button[16-tooth cog, 2 68, button[24-tooth cog, 1 68); 48 (p[train-status] 48, p[placement-notice] 24) |
| kakuro | 1440x800 | 563x633 | 808x636 | 245 x 3 | 52 / 52 |  |
| kakuro | 1280x650 | 427x480 | 793x486 | 366 x 6 | 52 / 52 | 40 |
| keyword | 1440x800 | - | 808x636 | - | 482 / 560 |  |
| keyword | 1280x650 | - | 793x486 | - | 482 / 410 | 112; 342 (div.touch:hidden 276, div.touch:hidden 32) |
| knights-knaves | 1440x800 | - | 808x636 | - | 768 / 560 |  |
| knights-knaves | 1280x650 | - | 793x486 | - | 768 / 410 | 756 (li "Ivo. Is this speak 180, li "Jude. Is this spea 180, li "Kit. Is this speak 180, li "Lark. Is this spea 180) |
| logic-grid | 1440x800 | 632x638 | 808x636 | 176 x -2 | 826 / 560 |  |
| logic-grid | 1280x650 | 482x488 | 793x486 | 311 x -2 | 826 / 410 | 134 (h2.font-display.text-s 20, p[logic-grid-brief] 96); 668 (h2.font-display.text-2 32, div 624) |
| napkin-maths | 1440x800 | - | 808x636 | - | 212 / 560 |  |
| napkin-maths | 1280x650 | - | 793x486 | - | 212 / 410 | 56; 132 (label.text-lg 28, input.h-10.w-full.min- 40, p.text-muted-foregroun 48) |
| nonogram | 1440x800 | 589x614 | 808x636 | 219 x 22 | 140 / 560 |  |
| nonogram | 1280x650 | 439x464 | 793x486 | 354 x 22 | 140 / 410 | 96; 20 |
| norinori | 1440x800 | 576x576 | 808x636 | 232 x 60 | 140 / 560 |  |
| norinori | 1280x650 | 486x486 | 793x486 | 307 x 0 | 140 / 410 | 96; 20 |
| odd-one-out | 1440x800 | - | - | - | 0 / - |  |
| odd-one-out | 1280x650 | - | - | - | 0 / - |  |
| pictogram-cipher | 1440x800 | - | 808x636 | - | 466 / 560 |  |
| pictogram-cipher | 1280x650 | - | 793x486 | - | 466 / 410 | 84; 354 (div.touch:hidden 288, div.touch:hidden 32) |
| railroad | 1440x800 | 412x402 | 808x636 | 396 x 234 | 188 / 560 |  |
| railroad | 1280x650 | 412x402 | 793x486 | 381 x 84 | 188 / 410 | 144; 20 |
| reflections | 1440x800 | 501x429 | 808x636 | 307 x 207 | 216 / 560 |  |
| reflections | 1280x650 | 408x350 | 793x486 | 385 x 136 | 216 / 410 | 96; 96 (p[status] 20, p[beam-note] 60) |
| reverse-chess:last_move | 1440x800 | 636x636 | 808x636 | 172 x 0 | 268 / 560 |  |
| reverse-chess:last_move | 1280x650 | 486x486 | 793x486 | 307 x 0 | 268 / 410 | 68 (p.font-display.text-2x 32, div.flex.items-center. 32); 176 (div.flex.flex-col.gap- 176, div[status] 24) |
| reverse-chess:unwind | 1440x800 | 636x636 | 808x636 | 172 x 0 | 352 / 560 |  |
| reverse-chess:unwind | 1280x650 | 486x486 | 793x486 | 307 x 0 | 352 / 410 | 100 (p.font-display.text-2x 32, p[goal] 24, div.flex.items-center. 32); 32 (p.font-display.text-sm 20, div.panel:col-start-2. 32); 184 (div.flex.flex-col.gap- 132, div.flex.flex-col.gap- 40) |
| rota | 1440x800 | 608x608 | 808x636 | 200 x 28 | 801 / 560 |  |
| rota | 1280x650 | 458x458 | 793x486 | 335 x 28 | 801 / 410 | 109 (h3.font-display.text-s 20, p[rota-brief] 72); 668 (div "The rota as pinne 224, div "Clues" 452) |
| sightlines | 1440x800 | 636x636 | 808x636 | 172 x 0 | 292 / 560 |  |
| sightlines | 1280x650 | 486x486 | 793x486 | 307 x 0 | 292 / 410 | 140 (p[puzzle-brief] 76, p 48); 128 (ul[Observers] 92, p[status] 20) |
| star-battle | 1440x800 | 576x576 | 808x636 | 232 x 60 | 92 / 560 |  |
| star-battle | 1280x650 | 486x486 | 793x486 | 307 x 0 | 92 / 410 | 48; 20 |
| sudoku | 1440x800 | 633x633 | 808x636 | 175 x 3 | 52 / 52 |  |
| sudoku | 1280x650 | 480x480 | 793x486 | 313 x 6 | 52 / 52 | 40 |
| troix | 1440x800 | 477x477 | 808x636 | 331 x 159 | 92 / 560 |  |
| troix | 1280x650 | 477x477 | 793x486 | 316 x 9 | 92 / 410 | 48; 20 |
| word-ladder | 1440x800 | - | 808x636 | - | 37 / 560 |  |
| word-ladder | 1280x650 | - | 793x486 | - | 37 / 410 | 25 (strong.font-display.up 19, strong.font-display.up 19) |
| word-search | 1440x800 | 571x571 | 808x636 | 237 x 65 | 278 / 560 |  |
| word-search | 1280x650 | 483x483 | 793x486 | 310 x 3 | 278 / 410 | 266 (p[status] 24, section "Find 6 words" 230) |
| word-wheel | 1440x800 | 636x636 | 808x636 | 172 x 0 | 274 / 560 |  |
| word-wheel | 1280x650 | 486x486 | 793x486 | 307 x 0 | 274 / 410 | 262 (div.-mt-2.flex.flex-co 156, div "Found 0" 102) |
| reverse-chess / the-long-walk | 1440x800 | 632x632 | 808x636 | 176 x 4 | 568 / 560 |  |
| reverse-chess / the-long-walk | 1280x650 | 482x482 | 793x486 | 311 x 4 | 418 / 410 | 100 (p.font-display.text-2x 32, p[goal] 24, div.flex.items-center. 32); 98 (p.font-display.text-sm 20, ol[retro-chain] 388, div.panel:col-start-2. 32); 184 (div.flex.flex-col.gap- 132, div.flex.flex-col.gap- 40) |
| crossword / fine-print | 1440x800 | 633x633 | 808x636 | 175 x 3 | 1002 / 560 |  |
| crossword / fine-print | 1280x650 | 483x483 | 793x486 | 310 x 3 | 927 / 410 | 27 (p.sr-only 1, p.min-h-7.text-lg.touc 30); 832 (div[tabpanel] "across" 148, div[tabpanel] "down" 148); 32 |
| logic-grid / manifest | 1440x800 | 632x638 | 808x636 | 176 x -2 | 1222 / 560 |  |
| logic-grid / manifest | 1280x650 | 482x488 | 793x486 | 311 x -2 | 1222 / 410 | 134 (h2.font-display.text-s 20, p[logic-grid-brief] 96); 1064 (h2.font-display.text-2 32, div[Which statement is 1020) |
| knights-knaves / night-ferry | 1440x800 | - | 808x636 | - | 972 / 560 |  |
| knights-knaves / night-ferry | 1280x650 | - | 793x486 | - | 972 / 410 | 960 (li "Mara. Is this spea 180, li "Nico. Is this spea 180, li "Odile. Is this spe 180, li "Pip. Is this speak 180) |
| rota / the-long-shift | 1440x800 | 608x608 | 808x636 | 200 x 28 | 753 / 560 |  |
| rota / the-long-shift | 1280x650 | 458x458 | 793x486 | 335 x 28 | 753 / 410 | 85 (h3.font-display.text-s 20, p[rota-brief] 48); 644 (div "The rota as pinne 224, div "Clues" 428) |
| word-search / wound-up | 1440x800 | 627x627 | 808x636 | 181 x 9 | 406 / 560 |  |
| word-search / wound-up | 1280x650 | 483x483 | 793x486 | 310 x 3 | 406 / 410 | 394 (p[status] 24, section "Find 10 words 358) |
| pictogram-cipher / first-drawing | 1440x800 | - | 808x636 | - | 366 / 560 |  |
| pictogram-cipher / first-drawing | 1280x650 | - | 793x486 | - | 366 / 410 | 84; 254 (div.touch:hidden 188, div.touch:hidden 32) |

The budget the plan works to is the measured budget less the spacing rule's 16px (12px section, 4px gap): **544 at 1440x800, 394 at 1280x650, 744 at 1440x1000.** At 1440x1000 there is 200px more height and the gutters are larger still. **Nothing opens or closes by measurement** (it would shift the page, T069 and T173): the first-paint state is one state for every viewport, chosen for 1280x650, and a taller window simply has spare room. Where a section would fit open at 1000 and is closed at 650 the plan says so.

## 9. Section plan for every panel type

**Mechanism: native `<details name="...">`.** A shared `PanelSection` in `src/puzzles/_shared/` wraps `<details>` and a styled `<summary>`, with an optional `name` for an exclusive group.

| | `<details name>` | shadcn `accordion` (Radix) |
|---|---|---|
| Script | none, so hydration cannot differ from the server; `open` is a server-rendered attribute | `@radix-ui/react-accordion` (a new dependency; the repo has no `accordion.tsx` in `src/components/ui/`), state in React |
| Exclusive group | the `name` attribute (Chrome 120, Safari 17.2, Firefox 130); opening one closes the others natively | `type="single"` |
| Keyboard | `summary` is a button: Enter and Space toggle; Tab order follows the DOM. No arrow-key roving to fight the grid | Enter, Space, and Up/Down/Home/End roving across triggers (not wanted in a panel next to a grid that owns the arrow keys) |
| Screen reader | `summary` exposes expanded and collapsed state (Chromium, WebKit, Gecko); closed content is not in the accessibility tree | `button aria-expanded` and `role="region"`; closed content `hidden` |
| Find in page | opens a closed section that holds the match | closed content is `hidden`, not found |
| Programmatic control | controlled by setting `open` and listening to `toggle`; the crossword sets it from its direction state | controlled `value` |
| Look | `summary::marker` replaced with a square hard caret (`border` triangle), no rounding | restyle in place |

**Recommendation: `<details name>`.** It is script-free (no hydration shift), keeps the existing How to play pattern in `rota`, and adds no dependency. Its two costs are no height animation (wanted anyway: Ludwig has no soft motion) and that exclusivity is driven by the browser (T175 sets `open` from state only for the crossword). `aria-live` regions must never sit inside a section that can be closed: the crossword clue line, `rota-status` and the status line stay outside.

Section header height: **32px** (`min-h-8`, 2px border). The first-paint state is chosen so the open content fits the 394px budget at 1280x650.

### Plan per type

`A` is always shown, `S+` is a section open at first, `S-` a section closed at first. Heights are the measured blocks (1280x650, 24rem) unless marked *est.*; the total is blocks plus section headers and 16px gaps, to be compared with the 394px budget (544 and 744 are larger). "Wrong part" is where a failed Check frames something in the panel and which section it opens.

| Type | Blocks in order, with state and height | Open-at-first total vs 394 | Exclusive | Fallback and notes |
|---|---|---|---|---|
| `sudoku`, `kakuro`, `futoshiki` | actions row A 52 | 52 | n/a | none needed; board-only content |
| `fillomino`, `circle9`, `star-battle`, `troix`, `norinori`, `nonogram`, `railroad`, `reflections`, `napkin-maths`, `acrostic`, `word-ladder`, `detective-scene` | prompt and status A (32, 116, 92, 92, 140, 140, 188, 216, 212, 136, 37, 113) | all fit | n/a | no sections. `reflections` wrong ports are on the board |
| `cctv-maze`, `chess-problem`, `sightlines`, Reverse Chess `last_move`, `word-wheel`, `gear-train` | prompt and controls A (264, 284, 292, 268, 274, 322) | all fit | n/a | none. `chess-problem` frames the wrong ply: it is in the panel, always shown |
| `word-search` | status 24 + found list A (278; `wound-up` 406) | fits; `wound-up` is 12px over | n/a | lay the found list in two columns when it has more than 8 words (-40px), or `S-` found list after the first word |
| Reverse Chess `unwind` | prompt, goal A 100; **Plies so far** A header 32 + chain; capture row, notation A 184 | 352 with an empty chain; `the-long-walk` 418 | n/a | the chain is the one scroller (section 7), from the fourth ply; its height is the remaining room, in whole rows. The latest ply stays in view. A wrong ply scrolls into view in the chain (`unwind.tsx` already uses `scrollWithin`) |
| `rota` | **Incident sheet** S+ (header 32 + 109 to 136), **The rota as pinned** S- (header 32; list 2 columns *est.* 150 at 24rem, replacing `sm:grid-cols-3`), **Clues** S- (header 32; 428 to 452), **Unswaps so far** S- (header 32; 80 to 130), **How to play** S- (32 + 70), the accusation when restored | 5 x 32 + 136 + 16 = **312** (fits); Clues open: 160 + 428 = 588 (**scrolls**, one scroller of 234px at 650) | one exclusive group of all five | Incident sheet open first (the prompt), because everything else is a tool. On restoration the group closes every section and the accusation is shown below the headers in two columns of options (about 196px, *est.*): 160 + 196 + 16 = 372. Wrong part: `data-broken` clue, so a failed Check **opens Clues** and `scrollWithin` brings the broken clue into view. The "Unswaps so far" status `aria-live` (`rota-status`) leaves the section |
| `logic-grid` | **Case notes** S- (32 + 134), **Clues** S+ (32 + 668; 1064 on `manifest`) | 32 + 32 + 16 = 80 closed Case notes; Clues open at 650: 394 - 80 = **314px of list**, 668 needed (**scrolls**) | Case notes and Clues non-exclusive | the one scroller is the open Clues list. A wrong pair lands in the list at the top of the panel (always shown, 20px a line, above the sections); Check opens Clues. The board is centred (`mx-auto`) |
| `knights-knaves` | prompt and rule A (about 100) in the panel; **the statement cards move to the board cell** | panel 100; the board cell holds 2 rows of cards: 2 x 180 + 24 = **384px of 486** (5 characters in `auto-fit minmax(15rem,1fr)`: 3 columns, still 2 rows) | n/a | no section, no scroller. Knights and knaves reports a count only, so there is no framed statement. Panel becomes 18rem wide, board cell widens |
| `crossword` | clue line A 42 (outside the sections), **Across** S+ and **Down** S-, actions A 44 | 42 + 2 x 32 + 44 + 24 = 174; the open list 394 - 174 = **220px** against 384px (stage-door) and 624px (`fine-print`): **scrolls** | exclusive group of two, **driven by the typing direction** (`direction` state in `crossword/solver.tsx`) | opening a section by its caret switches the direction; Space, arrow moves and picking a clue open the matching section. The active clue stays in view (`scrollWithin` replaces the hand-rolled `offsetTop` code). One scroller instead of two. The tab list `ClueTabs` that `split` renders both lists of goes away on desktop |
| `book-cipher` (18rem) | prompt A 112, **References** S+ (the summary replaces the 28px `h2`; list 264 with `gap-3`, 244 with `gap-2`) | 112 + 16 + 32 + 244 = **404** against 394: 10px over | n/a | References stay open (they are the clues). To close the 10px: the prompt is 4 lines at 18rem, and cutting its last sentence (-24px) gives 380. If that is not acceptable the list is the one scroller in house style. The page text is the board and stays a scroller in house style (section 7) |
| `caesar`, `keyword`, `pictogram-cipher` | **left sheet**: ciphertext, then the key (13 columns, 2 rows; pictogram 11 symbols per row, *est.*); **panel**: prompt A (84 to 112), Clear A (32) | panel 148; the left sheet holds ciphertext 60 to 190 + key 140 to 190 + padding = 260 to 420 of 474 (*est.* from today's 276px/288px key at 8 columns) | n/a | no section and no scroller. The ciphertext glyphs grow to fill the sheet (container-sized, 1.5x on a 790px sheet). Panel is 18rem. The sheet is a `paper-sheet` on the board cell and never touches the panel buttons (different column) |
| `gears` | see section 11 | | | |

### What goes on the left for types without a board

| Type | Left cell today | Left cell plan |
|---|---|---|
| `knights-knaves` | two lines of text in an 830px column | the statement cards as an auto-fit grid (2 rows); the question and the rule in the panel |
| `caesar`, `keyword` | ciphertext sheet, mostly empty | ciphertext **and the key** in one sheet; panel keeps the prompt and Clear |
| `pictogram-cipher` | ciphertext sheet | same, with the glyphs grown |
| `napkin-maths` | working sheet and equations (the sheet is the board) | unchanged; the input row stays in the panel (212px) |
| `acrostic` | the letter figure | unchanged |
| `word-ladder` | the ladder (rungs) | unchanged; panel holds 37px |

## 10. The panel is not wider, the board is not smaller

| Type | Panel width | Why |
|---|---|---|
| all `panel` types | 24rem | section 7: no clue list shrinks with width; a wider panel only costs board width |
| `book-cipher`, `caesar`, `keyword`, `pictogram-cipher`, `knights-knaves` | 18rem | the panel holds a prompt and a row of buttons; the left cell gains 96px |
| `rota` | 24rem | the pinned list becomes 2 columns of the panel's width |

At 1280x650 a square board is 474px after the 12px footer cost, in a cell of 793px (or 889px at 18rem): the gutter stays about 320px. The gutter is dead space (F18); the audit does not recommend filling it, because the only content that would use it (the rota's pinned sheet beside its board) is needed beside Check.

## 11. Classic gears plan

Today `src/puzzles/gears/solver.tsx` is `section.flex.flex-col.gap-4` in a 768px main: the quotation (Fix the Diagram only), `GearBoard` 576x576, `Scrubber` 576x56, the convergence status, `StateTableToggle` (button), `StateTable` (704px wide, 538px high for a 9-gear daily, 636px for `final-curtain`), `SwapPanel` (188px), the crank stepper and the accusation. Raw numbers: `.verification/T174/gears-probe.txt`.

**Move `gears` from `excludedSolveTypes` to `panelSolveTypes`** (`src/config/solve-layout.ts`).

| Part | Where | Order and state |
|---|---|---|
| `GearBoard` (the diagram) | **board cell** | **474px at 1280x650 and 576px at 1440x800** (the minimum of the cell, `--board-h` after the 12px footer rule, and the `max-w-xl` 576px cap). The `@container` `cq` units in `board.tsx` scale the gears with it; no per-frame layout work (sizes come from `--board-h` and the cell, not a measurement) |
| `Scrubber` | **panel head**, `A` | 56px at the panel's 384px (`max-w-xl` is wider than the panel, so it fills it) |
| Convergence status (`aria-live`, `seeing-count`) | panel head, `A` | 24px, never inside a section |
| Fix the Diagram quotation | **section** `S+` "The brief" | 68px at 704px, about 150px *est.* at 384px; **open at first only on Fix puzzles**. Closed leaves 32px |
| `SwapPanel` | **section** `S+` "Adjust the diagram" (Fix only) | 188px |
| Crank stepper | panel, `A` | 40px |
| Accusation trigger (`AlertDialog`) | panel, `A` | 40px; the dialog is unchanged |
| `StateTableToggle` | panel `A` 40px | the toggle keeps its `aria-controls` and `aria-expanded` |
| `StateTable` | **replaces the diagram in the board cell** when shown | the table is 703px wide with 6 columns and does not fit 384px; the board cell is 793px wide and 474px high: rows must be at most 34px (11 gears + caption + header = 13 x 34 = 442px, with the cell padding 16px). The diagram stays mounted (`hidden`) so its state and `motion` do not remount. Fallback: a section "State table" in the panel with the table scrolling horizontally, which breaks the one-scroller rule, so it is not recommended |

Panel at first paint, normal puzzle: scrubber 56 + status 24 + crank 40 + toggle 40 + accuse 40 + 4 gaps of 16 = **264px of 394** (fits at both sizes). Fix puzzle: + the section headers 2 x 32 and the open brief about 150 and the open swap panel 188: 264 + 64 + 150 + 188 = 666: **over 394 at 650 and 544 at 800**. Plan for Fix: the brief `S+` and the swap panel `S-`, an exclusive pair: 264 + 64 + 150 + 32 = 510 (closed swap panel) still over 394 at 650. So at 650 the Fix puzzle also moves the crank stepper and the accusation trigger into one row (`flex` on 384px: both are 40px high and 150px wide): 264 - 56 = 208 + 64 + 150 = 422: still 28px over. **Fallback for Fix at 1280x650:** the brief opens closed (`S-`) in an exclusive pair with the swap panel (`S+`, the working surface): 208 + 64 + 188 = 460, over 394 by 66; the swap panel's list scrolls (the one scroller, 122px visible of 188) in house style. At 1440x800 (544) it all fits without scrolling. This is the one gears scroller.

Diagram size by viewport (min of cell, `--board-h`, 576px cap): **474px at 1280x650 and 576px at 1440x800 and 576px at 1440x1000**, for `final-curtain` (11 gears of 16 teeth, the largest curated) and for the daily (11 gears at most, `gearCap`). The smallest cog is 8 teeth; at 474px that is 82% of today's size, which still gives the 4px stroke at `cq` scaling: T175 checks the label size.

Solved: the footer is 296px (stamp 216 + time + epilogue). At 1280x650 the panel holds the head (scrubber, status: 96px) and the footer: 96 + 16 + 296 = 408: **14px over 394**; hide the crank, toggle and accuse (they are `inert` once solved) so only the scrubber and status remain, and drop the stamp to the `--hole-size: 200px` the footer already supports under `panel:` (-16px): 392. The stamp ends in view.

e2e changes T175 makes:

- `e2e/gears-layout.spec.ts` measures layouts per frame at 390x844 only (`test.skip(({isMobile}) => !isMobile, ...)`); it stays, and a desktop copy at 1280x650 and 1440x800 asserts the same layout budget (< 10 layouts in 5 s while playing) with the diagram in the board cell.
- `e2e/spot-difference-desktop.spec.ts` has `for (const type of ["gears"])` asserting `main` is at most 768px wide ("keeps the gears solve page in the reading column"). With `gears` a `panel` type that is no longer true: the loop is replaced by a test that `main` carries `data-solve-layout="panel"` for `gears`, and the reading-column assertion is kept for no remaining type (so the test is removed rather than weakened).
- `e2e/desktop-layout.spec.ts` gains a gears case in the registry-wide fit and solved journeys.

## 12. The solved state

Solved footer (stamp, time, epilogue, Next in volume) at both sizes. Types with an epilogue (`rota`, `nonogram`, `odd-one-out`) have a footer loaded from a completion row without one; the script inserts text of the real length (the rota timeline with one line per authored swap, the nonogram caption, the odd-one-out explanation), so those three rows are an estimate with that stand-in.

| Puzzle | Size | Solved footer (height / content) | Stamp bottom | Next button bottom | Viewport | Result |
|---|---|---|---|---|---|---|
| acrostic | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| acrostic | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| anagram | 1440x800 | 248 / 248 | 668 | - | 800 | in view |
| anagram | 1280x650 | 248 / 248 | 668 | - | 650 | stamp +18px past the fold |
| book-cipher | 1440x800 | 296 / 296 | 664 | - | 800 | in view |
| book-cipher | 1280x650 | 296 / 296 | 514 | - | 650 | in view |
| caesar | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| caesar | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| cctv-maze | 1440x800 | 248 / 248 | 713 | - | 800 | in view |
| cctv-maze | 1280x650 | 230 / 296 | 580 | - | 650 | in view; footer scrolls (230 of 296) |
| chess-problem | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| chess-problem | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| circle9 | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| circle9 | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| crossword | 1440x800 | 312 / 312 | 648 | 772 | 800 | in view |
| crossword | 1280x650 | 312 / 312 | 498 | 622 | 650 | in view |
| detective-scene | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| detective-scene | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| fillomino | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| fillomino | 1280x650 | 248 / 248 | 563 | - | 650 | in view |
| futoshiki | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| futoshiki | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| gear-train | 1440x800 | 248 / 248 | 713 | - | 800 | in view |
| gear-train | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| gears | 1440x800 | 296 / 296 | 1499 | - | 800 | excluded layout: below the fold |
| gears | 1280x650 | 296 / 296 | 1499 | - | 650 | excluded layout: below the fold |
| kakuro | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| kakuro | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| keyword | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| keyword | 1280x650 | 248 / 248 | 563 | - | 650 | in view |
| knights-knaves | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| knights-knaves | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| logic-grid | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| logic-grid | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| napkin-maths | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| napkin-maths | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| nonogram | 1440x800 | 296 / 296 | 664 | - | 800 | in view |
| nonogram | 1280x650 | 296 / 296 | 514 | - | 650 | in view |
| norinori | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| norinori | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| odd-one-out | 1440x800 | 248 / 248 | 725 | - | 800 | in view |
| odd-one-out | 1280x650 | 248 / 248 | 724 | - | 650 | stamp +74px past the fold |
| pictogram-cipher | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| pictogram-cipher | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| railroad | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| railroad | 1280x650 | 248 / 248 | 563 | - | 650 | in view |
| reflections | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| reflections | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| reverse-chess:last_move | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| reverse-chess:last_move | 1280x650 | 248 / 248 | 563 | - | 650 | in view |
| reverse-chess:unwind | 1440x800 | 248 / 248 | 713 | - | 800 | in view |
| reverse-chess:unwind | 1280x650 | 248 / 248 | 563 | - | 650 | in view |
| rota | 1440x800 | 476 / 772 | 484 | - | 800 | in view; footer scrolls (476 of 772) |
| rota | 1280x650 | 326 / 772 | 484 | - | 650 | in view; footer scrolls (326 of 772) |
| sightlines | 1440x800 | 248 / 248 | 713 | - | 800 | in view |
| sightlines | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| spot-difference | 1440x800 | 296 / 296 | 1189 | - | 800 | excluded layout: below the fold |
| spot-difference | 1280x650 | 296 / 296 | 1184 | - | 650 | excluded layout: below the fold |
| star-battle | 1440x800 | 248 / 248 | 713 | - | 800 | in view |
| star-battle | 1280x650 | 248 / 248 | 563 | - | 650 | in view |
| sudoku | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| sudoku | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| troix | 1440x800 | 248 / 248 | 713 | - | 800 | in view |
| troix | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| word-ladder | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| word-ladder | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| word-search | 1440x800 | 248 / 248 | 713 | - | 800 | in view |
| word-search | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| word-wheel | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| word-wheel | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| reverse-chess / the-long-walk | 1440x800 | 248 / 248 | 713 | - | 800 | in view |
| reverse-chess / the-long-walk | 1280x650 | 248 / 248 | 563 | - | 650 | in view |
| crossword / fine-print | 1440x800 | 248 / 248 | 713 | - | 800 | in view |
| crossword / fine-print | 1280x650 | 248 / 248 | 563 | - | 650 | in view |
| logic-grid / manifest | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| logic-grid / manifest | 1280x650 | 248 / 248 | 563 | - | 650 | in view |
| knights-knaves / night-ferry | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| knights-knaves / night-ferry | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| rota / the-long-shift | 1440x800 | 500 / 848 | 460 | - | 800 | in view; footer scrolls (500 of 848) |
| rota / the-long-shift | 1280x650 | 350 / 848 | 461 | - | 650 | in view; footer scrolls (350 of 848) |
| word-search / wound-up | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| word-search / wound-up | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| pictogram-cipher / first-drawing | 1440x800 | 248 / 248 | 712 | - | 800 | in view |
| pictogram-cipher / first-drawing | 1280x650 | 248 / 248 | 562 | - | 650 | in view |
| gears / final-curtain | 1440x800 | 296 / 296 | 1498 | - | 800 | excluded layout: below the fold |
| gears / final-curtain | 1280x650 | 296 / 296 | 1499 | - | 650 | excluded layout: below the fold |
| gears / daily-2026-11-24 | 1440x800 | 296 / 296 | 1499 | - | 800 | excluded layout: below the fold |
| gears / daily-2026-11-24 | 1280x650 | 296 / 296 | 1498 | - | 650 | excluded layout: below the fold |

Plan: with sections as above, **every panel type's stamp and time are in view at both sizes** today and stay so, because the solved panel hides its tools (the solver wrapper is `inert`) and the footer replaces Check and Reset. Four things to fix:

1. `anagram` (+18px) and `odd-one-out` (+74px) at 1280x650: in the one-column layout the footer sits below the board and the stamp ends past the fold. **Plan:** in `board-only` the solved footer is a row: stamp at **128px** (`--hole-size`) beside the time, epilogue and Next in volume. That saves 88px (216 to 128) on a footer of 248px, and puts the stamp's bottom 14px inside the fold on `odd-one-out`. If the stamp reads too small at 128px, the fallback is to collapse the board to its answered row when solved.
2. `rota`: the epilogue (about 770px) would push Next in volume out of view and the footer scrolls. **Plan:** the epilogue is the last block in the footer (`panel:order-last`, it holds no focusable element), Next in volume sits under the time, and the epilogue is the footer's own scroll area (house style); the pinned sheet and the five sections are collapsed to their headers (160px) in the solved state.
3. `cctv-maze`: footer clipped by 66px at 650 (client 230px, scroll 296px) because the panel body above it keeps 32px of room: the footer takes the full panel height under the status row.
4. `nonogram`, `book-cipher` (296px footers): fit.

## 13. Test puzzles for T175

| Case | Puzzle | Why |
|---|---|---|
| rota, user's | `canteen-queue` | the user's screenshot; 9 workers |
| rota, largest | `the-long-shift` | 9 workers, longest epilogue (about 770px) |
| logic grid, user's | `cold-frame` | the user's screenshot (15 clues, 680px) |
| logic grid, largest | `manifest` (1076px of clues) |
| knights and knaves, user's | `by-the-fire` (4 characters) |
| knights and knaves, largest | `night-ferry` (5 characters) |
| crossword | `stage-door` (the representative: 2 x 384px lists) and `fine-print` (15x15, 624px lists) |
| ciphers | `first-drawing` (pictogram), the first `caesar` and `keyword` |
| Reverse Chess | `the-long-walk` (14 plies) and `four-steps` (unwind) |
| gears | `final-curtain` (11 gears), `crossed-wires` (Fix the Diagram), `daily-2026-11-24` |
| book cipher | `bowerbird-nest` |
| word search | `wound-up` (10 words) |
| board-only | `anagram` and `concert-programme` (`odd-one-out`) |

## 14. Anything else found

Every type was looked at, open and solved, at both sizes in Paper and Ink (368 screenshots in `.verification/T174/`). Judged on the screenshots I opened (rota, logic grid, knights and knaves, crossword, pictogram, caesar, `the-long-walk`, book cipher, sudoku, word search, classic gears, solved rota and odd one out, WebKit logic grid) and, for the rest, on the measured rows above (their data rows show no clipping at either size):

| Type | What reads badly | Severity |
|---|---|---|
| `sudoku`, `kakuro`, `futoshiki` | the panel is two rows of buttons at the bottom of a 384px column with 300px of nothing above them; the board is centred with the gutter on the right | polish |
| `word-search` | found-word list is a plain column with a rule; fine, but 150px of empty above Check | polish |
| `crossword` | the two lists each cut their last row; the grid is centred with a 309px gutter | cramped |
| `reverse-chess` `unwind` | chain scroller is 98px, its first line half cut under the "goal" line | cramped |
| `book-cipher` | the page text scrolls inside the sheet whose bar sits in the 4px gutter; the references sheet is the heading and the bar together | cramped |
| `caesar`, `keyword`, `pictogram-cipher` | the ciphertext sheet is three-quarters empty while the key is squeezed | cramped |
| classic gears | everything | broken |
| `anagram`, `odd-one-out` solved | stamp below the fold | broken |
| `rota` solved (Ink) | a 12px stripe where the pinned sheet was, with its bar | polish |
| Ink, all types | no contrast issue found: borders, sheets, scrollbars thumbs (the system's) are readable; the scrollbars are the only element outside the palette | n/a |

Under touch and below 1024px nothing is audited. **Where a T175 change could leak into them:** the section component must render as plain content under `touch:` and below `lg` (the `panel:` variant only); the cipher key moving left must not change the touch layout (`touch:` keeps the key under the ciphertext, as the pad expects); the footer `order-last` and the 128px stamp must be `panel:` / `desk:` only.
