# Look and feel audit (2026-10-07)

A visual QA pass on the dev server before writing M5 polish tickets. It covers every page at 1440px and 390px in both themes (Paper and Ink), a solve page for each of the 12 puzzle types with content, the solved state, and a frame-by-frame capture of the bullet-hole route transition. Screenshots were taken locally and are not committed.

The user reported five defects: Ink surfaces, chess pieces, the solved grid, the bullet transition and book cipher lines wrapping. The audit confirmed all five and found about thirty more. The findings are grouped below into proposed tickets, T120–T130.

**Decisions taken (user, 2026-10-07):**

1. Puzzle grids and the chess board stay light paper in Ink, with a visible light frame. Text panels invert fully.
2. The solved footer keeps a small tear behind the stamp. The grid inside it must be ordered and framed.
3. The bullet route transition is simplified (option B in section 4).
4. Grain stays over dialogs and toasts.
5. Raised surfaces in Ink are dark, not blue: cards, panels, dialogs, alert dialogs, sheets, dropdowns and toasts are ink-dark with a light border and a light block shadow. Blue (`shadow`) stops being an Ink surface colour.

## 1. Ink theme: hard-coded Paper surfaces and invisible shadows (T120)

**Root cause.** The shadcn `Card` correctly uses `bg-card border-border`, which is `shadow` `#1E2B3B` with paper at 60% in Ink. Puzzle panels instead hand-roll `border-2 border-ink bg-paper text-ink shadow-[3px_3px_0_var(--color-shadow)]`. In Ink, these panels stay light and their ink border vanishes. Inside them, theme-aware children such as the secondary `Button` render as Ink buttons on a Paper panel.

Separately, `--color-shadow` (`#1E2B3B`) on `--color-ink` (`#0A0B0D`) is about 1.3:1, so **every** hard offset shadow is invisible in Ink: buttons, toasts, dropdowns and dialogs. This is not limited to the panels.

| Severity | Where | File |
|---|---|---|
| High | Book cipher: book panel and References panel. Previous/Next page buttons render black on paper | `src/puzzles/book-cipher/solver.tsx:105,174` |
| High | Shared cipher key panel (caesar, keyword, pictogram cipher). The Clear button renders black on paper | `src/puzzles/_shared/cipher-key/cipher-key-panel.tsx:93` |
| Med | CellGrid frame (crossword, sudoku, futoshiki). The frame disappears, and black squares merge into the page so the crossword outline looks ragged | `src/puzzles/_shared/cell-grid/cell-grid.tsx:213,231` |
| Med | Anagram tiles. The shadow is invisible, and placed tiles go muddy grey in Ink but stay outlined in Paper | `src/puzzles/anagram/solver.tsx:12` |
| Med | All hard shadows: Button, Sonner, DropdownMenu, Dialog, AlertDialog | `src/components/ui/*` |
| Med | The invalid-input underline uses `--destructive` (blood), which is nearly invisible on ink | `src/components/ui/input.tsx` (`aria-invalid:border-destructive`) |
| Low–med | Spot the difference image frames | `src/puzzles/spot-difference/solver.tsx:53` |
| Low | Rota tokens | `src/puzzles/rota/board.tsx:129-132` |

These are intentional and should stay as they are: the `bg-paper text-ink` caps bands on the book-blue volume cards (`this-week/page.tsx:97`, `gears/page.tsx:138`, `card.tsx` `book` variant).

**Proposed fix:**

- Add semantic tokens and map them per theme in `globals.css`:
  - `--cast` for hard offset shadows: `shadow` in Paper, and a light value in Ink (paper at reduced alpha, or `paper-deep`), chosen so the block reads clearly against `ink` without overpowering the border;
  - `--destructive` gets an Ink-legible value, or a separate `--invalid`.
- **Ink surfaces go dark, not blue (decided).** In the Ink mapping, `--card` and `--popover` change from `shadow` (`#1E2B3B`) to `ink`. A surface is separated from the page by its light `border` and light `--cast` block shadow, which is the same treatment in both themes, inverted. This covers Card, Dialog, AlertDialog, Sheet, DropdownMenu, Popover, Tooltip and Sonner (`ks-overlay-alert-dialog-ink.png` shows today's blue dialog). Check `--muted` too: it is also `shadow` in Ink, and the active-clue row and hover states that use it need a dark, non-blue value. Update SPEC §6.2 ("`card` → shadow") and the `prefers-color-scheme: dark` block, which duplicates the Ink mapping.
- Replace `var(--color-shadow)` in every `shadow-[…]` with the new token. Replace the hand-rolled panels with `Card` (or `bg-card border-border text-card-foreground`).
- Add a CI guard: a grep or ESLint `no-restricted-syntax` check that rejects `border-ink`, `bg-paper`, `text-ink` and `var(--color-shadow)` in `src/puzzles/**` and `src/components/**`, with an allowlist for intentional uses (book bands, chess squares, black crossword cells). Without it, the ten generator types still to come (T101–T110) will reintroduce the bug.
- Update `.claude/rules/design-system.md`. "Borders are 2px `ink`" should read "2px `border` (semantic)", and "shadows use `shadow`" should read "use the cast token".

**Decided: grids stay paper in Ink.** CellGrid and the chess board keep light paper cells with ink black squares, like a printed page lying on a dark desk, and get a visible light frame and the Ink cast shadow. Text panels (book, references, cipher key, anagram tiles, spot the difference frames, rota tokens) invert fully to `card`.

## 2. Chess pieces (T121)

**Root cause.** `PIECE_COLOURS` in `src/puzzles/_shared/chess-board/pieces.tsx:125-136`:

- white pieces are a paper fill with `outline: none`;
- black pieces are an ink fill with `var(--piece-black-outline, none)`, and that variable is defined **only in Ink**.

The squares are paper and ink, so in Paper:

- white pieces on light squares and black pieces on dark squares show only as their cast shadow;
- the b8 knight, a7/c7/g7 pawns and h8 rook disappear.

In Ink, black pieces get a paper stroke and read as outlined white pieces, so the two sides look alike.

| Severity | Issue | File |
|---|---|---|
| High | Pieces invisible on matching squares in Paper | `pieces.tsx:125-136`, `globals.css` `--piece-black-outline` |
| High | Black and white look alike in Ink | same |
| High | "Piece the move captured" tray icons are blank white shapes on paper in Paper | `src/puzzles/_shared/chess-board/uncapture-tray.tsx:42` |
| Med | Unchecked "White to move" box renders as a solid paper square in Ink, so it reads as checked | `src/puzzles/reverse-chess/last-move.tsx:85-86` |
| Low | Rank-1 file labels a and d–h are hidden under pieces | `chess-board.tsx:172-178` |

**Proposed fix:**

- Outline every piece in the opposite colour, in both themes: white pieces get an ink outline and black pieces a paper outline. This is how cburnett is drawn.
- Delete `--piece-black-outline`.
- Tray glyphs reuse the same treatment.
- Check performance as well: each piece stacks 8 `drop-shadow` filters (`SHADOW_FILTER`). With 32 pieces that is 256 filter passes, which T069 will feel. One SVG-drawn offset shadow, or 2–3 drop-shadows, gives the same long cast.

## 3. Solved footer grid (T122)

**Root cause.** `.bullet-hole` (`src/components/brand/bullet-hole.css`) paints a full-opacity 1px `var(--color-ring)` grid behind the whole rectangular footer (`solve-chrome.tsx:341-342`).

- In Ink, `--ring` is book-blue, so the grid is bright blue on black. The spec says `grid-blue`.
- The clip polygon ends past 100%, so the end state is a hard-edged rectangle with no torn edge.
- The grid phase is arbitrary: there are half cells at the left and right edges and no top or bottom rule.
- On a wide, short footer the percentage polygon is a squashed lozenge.
- "Solved in" and the stamp sit directly on the lines.
- The spring stamp lands before the hole opens.

**Decided: a small, ordered, framed tear behind the stamp.**

- **Shape:** one truly circular torn hole behind the stamp only, sized in `px`/`em`, not `%`. The rest of the footer is a plain background, and "Solved in", the epilogue and Next sit on it, never on grid lines.
- **Ordered grid:** the grid inside the hole is drawn on the 24px pitch of the rest of the brand, anchored so the hole's centre falls on a cell centre. Whole cells only: no half cells at the rim and no stray line ends. Use `grid-blue` in both themes, never `--ring`, at an alpha that reads as a revealed layer, not a spreadsheet.
- **Framed:** the hole has a defined edge. Either a torn paper rim (a slightly lighter or darker ring following the torn polygon) or a thin 2px border just inside the tear, so the grid looks like something seen *through* the paper rather than painted on it.
- **Sequence:** the hole opens (about 300ms, ease-out), then the stamp lands on top of it. With reduced motion, both appear at once.
- Update SPEC §6.3 to describe the in-page hole like this.

## 4. Bullet-hole route transition into the Collection (T123)

**How it works now.** The three landing CTAs carry `transitionTypes={["bullet-hole"]}`. `BulletHoleTransition` (`src/components/brand/bullet-hole-transition.tsx`) is mounted in both route-group layouts. The CSS runs two clip animations:

- the old page tears open, 600ms ease-in;
- the new page grows in, 500ms ease-out after a 200ms delay.

The group background is a ring-coloured grid.

**Why it feels clunky** (measured from screencast frames):

1. **The two clip animations fight.** The ease-in tear is tiny for about 250ms. Then the new page catches the old hole at about 330ms and covers the tear. The blue grid shows for only about 100–150ms, as a thin jagged ring, and the second half of the tear is wasted.
2. **The pacing is uneven.** About 250ms of nothing, then the hole goes from 20% to 85% of the screen in about 3 frames.
3. **Corners linger.** Old-page corners (the wordmark and checkerboard) stay on screen for about 100ms at the end. There is also a 15px jump as the old page's scrollbar disappears.
4. **It isn't circular.** Polygon percentages are per axis, so the hole is a 1.6:1 ellipse on desktop and a tall pill on a phone.
5. **It starts at the viewport centre,** not at the button that was clicked.
6. **The header is torn and replaced too,** even though it is the same on both pages, so nothing on screen stays fixed.
7. **It is inconsistent.** The header "Collection" link and the Desk "Casebook" link cut with no effect.
8. **It is fragile.** It cancels React-internal animations by pseudo-element name and forces `view-transition-name: root !important`, and this has already broken once (T066 review). The `data-vt` test marker is never removed.
9. **Cold navigations add dead time.** On a cold or slow RSC fetch there is nothing between the click and the commit.

**Options:**

- **A. Rectify in place.** Make the hole a true circle using `vmax` calc coordinates, start it from the click point (`--vt-x`/`--vt-y` set from the pointer event), make the final radius cover the farthest corner, and re-time it so a grid ring persists. This keeps the fragile hack.
- **B. Simplify (recommended).** Use one shape and one moving layer. The old snapshot sits on top and tears open from the click point (a `vmax` circle, ease-out, about 400ms) to reveal the grid. The new snapshot sits underneath and only fades in (200–500ms), so the grid "develops" into the Collection. Give the header its own `view-transition-name` with `animation: none` so it stays as an anchor. Remove `data-vt`. Decide whether the header Collection link also gets the transition.
- **C. Drop the route tear.** Keep the in-page solve hole (T122) and make landing → Collection a plain crossfade. This deletes the hack and needs a SPEC §6.3 edit.

**Decided: B.** If the React hack breaks again under B, fall back to C.

## 5. States, contrast and focus (T124)

| Severity | Issue | File |
|---|---|---|
| Med | Disabled buttons use `disabled:opacity-50`: washed pink in Paper versus maroon in Ink, with grain showing through and a half-transparent border and shadow. They should use explicit muted tokens | `src/components/ui/button.tsx:10` |
| Med | Auth field errors are underlined foreground text with no red, so they look like links. This is inconsistent with `form.tsx` `text-destructive` | `src/components/auth/auth-form.tsx:64` |
| Med | Cipher answer underlines are `border-paper-shade`, about 1.4:1 on paper | `cipher-key-panel.tsx:122` |
| Med | Unused key letters use `opacity-30`, far below AA | `cipher-key-panel.tsx:184` |
| Low–med | The anagram focus ring shows on load without keyboard use, as a 3px box well past the tiles | `src/puzzles/anagram/solver.tsx` (`role=group tabIndex=0`) |
| Low | Paper `--ring` (grid-blue) on ink cells and squares is about 1.9:1 | `globals.css` |
| Low | `size="icon"` "+"/"−" glyphs are tiny (gear crank) | `button.tsx` |
| — | Grain (`z-index: 100`) sits over dialogs and toasts (`z-50`). **Decided: keep it;** it reads as a paper sheet on the desk | `globals.css` `body::before` |

## 6. Grids and textures (T125)

| Severity | Issue | File |
|---|---|---|
| Med | Grid line weights vary. Cells have fractional widths and each draws its own 1px border, so lines alternate black and grey (sudoku, futoshiki, crossword at 390). Draw lines once, with a gap over an ink background or one SVG/background grid | `cell-grid.tsx:265` |
| Low | 15×15 crossword clue numbers are about 6px at 390, and the active clue row bleeds to the right edge | `cell-grid.tsx`, crossword solver |
| Low | Sudoku mirrored digits read as stray glyphs: a column right of the grid plus clipped tops | `globals.css` `mirrored-digits`, `src/puzzles/sudoku/solver.tsx:32` |
| Low | `.grid-paper` stops partway down Casebook, Settings and the landing desk (`min-h-full` doesn't fill the page). In Ink the `paper-deep` crosses are busy behind form text | `globals.css` `grid-paper`, `casebook/page.tsx:24`, `settings/page.tsx:15` |

## 7. Book cipher layout (T127)

The book cipher's mechanic is *line* numbers, so a book line must always read as one line. Today it doesn't:

| Severity | Issue | File |
|---|---|---|
| High | **Long lines wrap.** At desktop width, page 4 line 6 of *The Natural History of Selborne* ("breed every summer in some moory ground on the verge of") wraps "of" onto a second row. The extra row has no number, but it looks like a line of its own, so a reference such as `4:7:n` can be miscounted. On phones almost every line wraps | `src/puzzles/book-cipher/solver.tsx:111-143` |
| Med | Reference chips have no fixed width ("4:8:2" is 62px, the others 70px), so the answer lines start and end unevenly | `solver.tsx:188` |
| Low | The panel titles ("The Natural History of Selborne", "References") are not in the uppercase credit style | `solver.tsx:108,176` |
| Low | On phones, References sits below a very long book panel, so every lookup needs a long scroll. Previous/Next page wrap | `solver.tsx:100` |

**Proposed fix for wrapping:**

- **Desktop and tablet: never wrap.** Lines get `white-space: nowrap`. `paginate` already caps lines at `LINE_WIDTH` = 56 characters (`src/puzzles/book-cipher/derive.ts`), so size the text column (a size container, with the font size fitted by `cqi`) to hold 56 characters at body size. The book panel can also take more of the row: the References column only needs about `13rem`.
- **Phones (below a minimum readable size, about 14px): wrap clearly.** Continuation rows get a hanging indent and a turn marker (for example `↪` in `ink-soft`), and alternate lines get a faint `paper-shade` band, so which numbered line a word belongs to is never ambiguous.
- **Width check:** a test confirms a worst-case 56-character line fits on one line at the desktop size.

## 8. Pages and layout polish (T126, T128)

**T126: 404 page (high).**

- There is no `not-found.tsx` anywhere under `src/app`, so 404s get the unstyled Next default: `#fff`, system font, no header, no theme.
- The bad-slug 404 also logs "Encountered a script tag while rendering React component", from the theme init `<script>` in `src/app/layout.tsx`.

**T128: per-page polish (all low–med).**

- Rota: the clue column is about 170px wide, so clues wrap badly. The intro is `text-sm` where other types use body size. At 390 the board sits nearly flush with the right edge.
- The Reverse Chess hub labels both Unwind and Proof Game "Mode B" (`reverse-chess/page.tsx:33,40`).
- The Gears hub repeats the difficulty on every row under a heading that already gives it. ACCUSE and CHECK, two red primaries, are stacked together.
- Collection: types with 0 published look exactly like live ones. They need a coming-soon or disabled treatment, which ties in with T130.
- Sign-in has no card or ink splat, which SPEC §6.3 calls for.
- The kitchen-sink theme toggle always starts on Paper and ignores the user's theme.

## 9. Puzzle previews and thumbnails (T129, T130)

This is a new feature, not a defect. Puzzle type cards on `/puzzles` (`src/app/(app)/puzzles/page.tsx`) and puzzle cards on the shelves in `/puzzles/[type]` are text only. Players should be able to recognise a puzzle type at a glance.

**T129: preview engine and per-puzzle thumbnails.**

- Each type gets a `src/puzzles/<type>/preview.tsx`: a pure server component that takes the puzzle's **payload** and renders a small static SVG.
  - It has no solution, attempt or client state, so nothing that is (S) leaks.
  - It uses theme tokens.
- Shared drawing parts go in `src/puzzles/_shared/preview/`: a mini grid (crossword, sudoku, futoshiki, and later kakuro and the other generator grids), a mini board (reverse chess, rota), a cipher strip and a text block. Most types then need only a few lines.
- Previews go in a `previews` map typed as `Record<PuzzleTypeKey, …>`, so a new type fails typecheck until it ships one.
- Payload loads for shelf cards are cached with `use cache` plus `cacheTag` per puzzle.

**T130: Collection type-card thumbnails.**

- Each type card shows the preview of one representative published puzzle.
- A type with nothing published shows a fixed motif and the coming-soon treatment from T128.

The generator tickets (T101–T110) should then list a preview in their scope. T129 should land before them, or each one gets a follow-up.

**Out of scope:** showing a signed-in player's progress on the thumbnail. It depends on the session and would break caching.

## 10. Proposed tickets and order

| Ticket | Title | Depends on | Size |
|---|---|---|---|
| T120 | Theme-aware surfaces and cast shadows, with a CI guard against raw tokens | — | M |
| T121 | Chess pieces outlined in the opposite colour in both themes; tray, side-to-move box and labels | T120 (cast token) | S |
| T122 | Solved footer: a small, ordered, framed circular tear behind the stamp | T120 | S |
| T123 | Simplify the bullet-hole route transition (option B) | T122 (shared keyframes) | M |
| T124 | Disabled, error, contrast and focus states | T120 | S |
| T125 | Single-draw grid lines, crossword numbers on phones, textures | — | M |
| T126 | Themed 404 and the root script-tag error | — | S |
| T127 | Book cipher: lines never wrap on desktop, clear continuations on phones, aligned references | T120 | M |
| T128 | Per-page polish (rota, hubs, collection, sign-in, kitchen sink) | T120 | M |
| T129 | Puzzle preview engine and per-puzzle thumbnails | — | L |
| T130 | Collection type cards show a representative preview | T129, T128 | S |

All of these should land before the accessibility audit (T068) and the performance pass (T069), so those audit the final look. T120 goes first because T121, T122, T124, T127 and T128 build on its tokens.

Every ticket's browser AC should require screenshots in **both themes at 1280px and 390px**, compared with the audit screenshots. The original T066 ACs checked only that the mechanism ran, not how it looked, and that is how these defects got through.
