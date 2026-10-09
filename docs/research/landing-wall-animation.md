# Landing: motion on the title-sequence walls

Research only, no production code. This looks at adding motion to the three walls of the landing title sequence (`src/app/(marketing)/_components/title-sequence.tsx`, `title-sequence.css`, `scroll-fallback.tsx`) as of `05ca452`: chess pieces moving on The Board, letters filling The Grid and digits appearing in The Mirror. Measurements were taken against the local dev server with headless Chromium from `@playwright/test`. Headless Chromium rasterises on the CPU, so the timings compare variants with each other; they are not device numbers. Ticket: [T140](../tickets/T140-landing-wall-motion.md).

## 1. Summary

1. **Put the pieces in the DOM, on the wall.** Render `PieceGlyph`s as absolutely positioned children of `.seq-wall-board`, sized and placed in `--seq-cell` units, and move them with `translate` keyframes on the existing `--seq` timeline. They inherit the wall's 3D transform and opacity for free, and the JS fallback drives them with no new code (section 3).
2. **Play a short game backwards.** As the reader scrolls down, the Scandinavian (1.e4 d5 2.exd5 Qxd5) unwinds one un-move at a time, captured pawns reappearing, until the position after 1.e4 remains. Scrolling up plays it forwards. It echoes Reverse Chess, which the Board caption links to (section 4).
3. **Fix the camera first.** On phones and tablets the left side wall swings in front of the back wall for the whole Board window, so nothing drawn on the Board is visible at 390px or 768px today. At 1280px it covers the Board for a moment at 50%. Making the peak `rotateY` of `seq-world` depend on width fixes it (section 2).
4. **Keep the pieces' long shadow.** Only `translate` and `opacity` animate, so each piece is rasterised once and then composited. The eight-step `drop-shadow` costs nothing measurable during the scrub (section 5).
5. **The Grid and The Mirror get one or two clip or opacity animations each:** red hand letters writing LUDWIG down the first column and INK across, and the five missing digits of the centre box written in, mirrored (section 6).

## 2. The camera hides The Board on narrow screens

`seq-world` swings to `rotateY(22deg) rotateX(4deg) translateZ(260px)` at 50% of the track. The left wall is 1200px deep and runs towards the viewer, so at that angle it sweeps across the back wall. Method: at each scroll position, screenshot the middle 80% of the Board's bounding box, hide `.seq-wall-left`, screenshot again, and compare. If the two differ, the left wall is in front of the Board.

| Viewport | Peak swing | Board covered at (track progress) |
|---|---|---|
| 390×844 | 22° (today) | 0.36 to 0.60, the whole Board window |
| 390×844 | 12° | 0.42 to 0.60 |
| 390×844 | 8° | 0.48 to 0.54 |
| 390×844 | 6° | never |
| 360×780 | 4° | never |
| 768×1024 | 22° (today) | 0.44 to 0.56 |
| 768×1024 | 12° | never |
| 1024×768 | 20° | 0.48 to 0.54 |
| 1024×768 | 16° | never |
| 1280×800 | 22° (today) | 0.50 (a full-screen flash of the side wall) |
| 1280×800 | 16° to 20° | never |
| 1440×900 | 22° (today) | never |

**Recommendation.** Read the peak from a custom property, `rotateY(var(--seq-swing))`, set to 4° below 48rem, 12° from 48rem and 16° from 64rem. The same keyframe then serves both the native and the fallback path. The side wall's tiles show the swing either way, and the room no longer cuts to a flat blue-grey screen at 1280px.

## 3. Placing pieces on the wall

### Geometry

`--seq-cell` is a fixed `80px` on `.title-sequence`. It is not derived from the viewport. The Board wall is `70% × 65%` of the stage.

| Viewport | Wall (layout px) | Cells across × down | Wall on screen in the Board window | One cell on screen |
|---|---|---|---|---|
| 1280×800 | 892 × 516 | 11.15 × 6.45 | about 620 × 400 | about 55px |
| 390×844 | 269 × 545 | 3.36 × 6.81 | about 190 × 410 | about 57px |

An 8×8 board never fits; the wall is a window onto an endless checker. Six whole ranks fit at both widths. Across, a phone shows three whole files, if the checker is centred on a file rather than aligned to the wall's left edge.

### Options

| Option | Verdict |
|---|---|
| **HTML children of `.seq-wall-board`, positioned in cell units** | **Recommended.** Each piece is a `div` holding `PieceGlyph`, `width` and `height` `var(--seq-cell)`, placed with `left: calc(50% - var(--seq-cell) / 2 + file * var(--seq-cell))` and `top: calc(rank-from-top * var(--seq-cell))`. Moves are `translate` keyframes in multiples of `var(--seq-cell)`, so everything scales if the cell ever changes. The wall's transform, `opacity` animation and fallback all apply unchanged. |
| One inline SVG board (`viewBox` 0 0 8 8) inside the wall | Rejected. It would draw a second checker over the CSS one, or replace it and change the wall's look. An 8×8 viewBox cannot match a wall that is 11×6 on desktop and 3×7 on a phone without letterboxing. SVG `<use>` of the glyphs loses `PieceGlyph`'s CSS-variable colours unless refactored. |
| Pieces outside the 3D scene, faked with 2D transforms | Rejected. They would not follow the camera, and the illusion breaks as soon as the world rotates. |
| three.js or WebGL | Already rejected: breaks the flat ink-and-paper look, heavy, and needs 3D piece models. |

The centred checker needs `background-position: calc(50% + var(--seq-cell) / 2) 0` on `.seq-wall-board` (the percentage resolves against the wall minus one 2-cell tile). With that, the centre column is the e-file, e8 is light and d8 is dark in Paper, which a prototype confirmed. Files a to h then sit fully inside the desktop wall (columns −4 to +3 of ±5.5). On a phone, files d, e and f are whole and c and g show as slivers, so pieces outside d to f should be hidden below 48rem. `overflow: clip` on the wall keeps anything that slides past its edge from poking out of the plane.

## 4. Choreography

**Scrub with scroll, not a loop.** The existing sequence is entirely scroll-scrubbed, and a scrubbed un-play reverses naturally when the reader scrolls back up, which is exactly the Reverse Chess idea. A loop that plays while the room is visible would need either JS timers or CSS `animation-trigger`, which is new and missing from Firefox. It would move while the reader has stopped to read, which is worse for vestibular comfort. It would also need a third path for reduced motion and the fallback. Loop-while-visible is rejected.

**The Board window.** The wall fades in from 28% to 38%, is fully opaque from 38% to 60% and fades out by 70%. Caption 2 is visible from 38% to 58%. All moves fit inside 38% to 58%, with holds so each position can be read.

**Position at 38%** (after 1.e4 d5 2.exd5 Qxd5), with files relative to e and ranks counted from the top of the wall (rank 8 = row 0):

- Black: Ra8 Nb8 Bc8 Ke8 Bf8 Ng8 Rh8, pawns a7 b7 c7 e7 f7 g7 h7, queen on d5.
- White: nothing on ranks 8 to 3. The e-pawn and black's d-pawn have both been captured.

| Window | Un-move | What moves |
|---|---|---|
| 38–41% | hold | The final position |
| 41–45% | un-Qxd5 | The queen slides d5 → d8 (up three ranks). The white pawn fades in on d5 between 41% and 43% |
| 45–47% | hold | |
| 47–51% | un-exd5 | The white pawn slides d5 → e4 (one file right, one rank down). The black pawn fades in on d5 between 47% and 49% |
| 51–53% | hold | |
| 53–56% | un-d5 | The black pawn slides d5 → d7 (up two ranks) |
| 56–60% | hold | The position after 1.e4 |

Every square involved is on files d and e and ranks 8 to 4, so the whole sequence is visible on a phone. Three keyframes cover all the motion (`seq-board-queen`, `seq-board-pawn-white`, `seq-board-pawn-black`); the other 14 pieces are static.

**The board keeps true colours in both themes.** SPEC §6.5 makes white pieces paper and black pieces ink in both themes, and a game needs both sides to read correctly. The `.seq-piece-paper`/`.seq-piece-ink` inversion is for lone decorative pieces; swapping the colours here would show a pawn un-moving in the wrong direction. In Ink the wall's checker inverts with the theme (existing behaviour), and the piece outlines from T121 keep both colours legible on either square (prototype screenshots at 390px in Ink).

**Same keyframes in both paths.** All existing keyframes use whole-track percentages, and the fallback replays them with `animation-duration: 1s; animation-play-state: paused; animation-delay: calc(var(--seq-progress) * -1s)`. New keyframes written the same way work in the fallback once their selectors are added to its selector list and given `animation-name`, exactly like `.seq-piece-a`. If a keyframe needs `steps()`, set it inside the keyframe block, because both paths force `animation-timing-function: linear` on the element.

## 5. Performance

**Native path (Chromium).** Twelve pieces were injected into the Board wall, each with a scroll-driven `translate` animation, and the page was scrubbed from 34% to 64% and back over about 4s with the mouse wheel. Each variant ran twice.

| Variant | 1280px, no throttle: main-thread task | 390px, 4× CPU throttle: main-thread task | Paint events | rAF p50 / p95 |
|---|---|---|---|---|
| No pieces | 103–125ms | 297–376ms | 4–8 | 16.7 / 16.8ms |
| Pieces, no filter | 111–145ms | 368–434ms | 4–8 | 16.7 / 16.8ms |
| Pieces, one `drop-shadow` | 110–132ms | 358–459ms | 4–8 | 16.7 / 16.8ms |
| Pieces, `PieceGlyph`'s eight-step `drop-shadow` | 103–138ms | 355–457ms | 4–8 | 16.7 / 16.8ms |

The Paint and raster counts do not grow with the pieces: they are rasterised once, at load, and the scrub only composites them. The filter is part of that one-time raster, so the shadow variant makes no measurable difference. **Keep `PieceGlyph`'s default shadow** (SPEC §6.5 says to keep that look), and animate only `translate` and `opacity` on pieces. Anything that forces a re-raster (animating `scale`, `filter`, colour or `width`) would bring the filter cost back on every frame. Memory is small: a piece layer at 3× DPR is about 240×240×4 bytes, about 230 KB, or about 4 MB for 17 pieces.

The page already does one layout and one style recalc per frame while scrolling, with or without the new pieces (240 layouts in 240 frames). That is existing behaviour and out of scope here; T069 can look at it.

**Fallback path.** Firefox could not be launched from the research sandbox, so the fallback was emulated in Chromium at 390px with 4× throttle: every animated element forced onto the paused, negative-delay path and a copy of `ScrollFallback` setting `--seq-progress` on scroll.

| Variant | Animations | Style recalc during the scrub | rAF p95 |
|---|---|---|---|
| Today | 14 | 483–491ms | 16.7ms |
| +12 moving pieces and +30 per-digit animations | 56 | 1052–1075ms | 16.7ms |

`--seq-progress` is set on `.title-sequence`, so every descendant restyles on every scroll frame, and each animated element adds sampling cost. Real hardware at 1× would see roughly 0.5ms a frame today against 1.1ms with 42 more animations. That is affordable, but it argues for grouping. The recommended design adds about six animations (three for pieces, two for the Grid words, one per row or a single one for the Mirror digits), not one per glyph.

## 6. The other walls

**The Grid** (opaque 0% to 28%, fading by 38%; the hero fades out between 12% and 28%). The title sequence has red crayon letters filling grid cells (SPEC §1.4). Column 0 has no black squares in rows 0 to 5, and row 4 has none at all, so:

- LUDWIG writes itself down column 0, one letter per step, from 12% to 24%;
- INK writes across row 4 from the shared I, from 24% to 28%.

Both words sit inside columns 0 to 2, so they are visible on a phone. Each word is one element whose `clip-path: inset(...)` animates with `steps(n)`, so the Grid adds two animations. Letters use `font-hand` in `ludwig-red` (via the `primary` token, which is red in both themes), with the seeded ±2° rotation per cell from SPEC §6.3. The Grid is the one wall visible under reduced motion, so its letters' base style must be the finished state.

**The Mirror** (fades in from 60% to 70%, opaque to 100%). The landing puzzle is the well-known Wikipedia sudoku, and its centre box is missing five digits: r4c4 = 7, r4c6 = 1, r5c5 = 5, r6c4 = 9 and r6c6 = 4. Write them in red hand, still mirrored with `scale-x-[-1]`, row by row between 72% and 90%. Render them inside `MirroredSudoku` behind an opt-in prop, so the finale's copy stays static.

**Not recommended for now.** The knife stabbing into a square (SPEC §1.4) needs new artwork. Animating the toppled foreground pieces further would compete with the Board. The Walker already moves.

## 7. Accessibility, SSR and tests

- **Accessibility.** Everything new sits inside `.seq-scene`, which is `aria-hidden`. No focusable elements are added and no text is announced.
- **Reduced motion.** All new animation rules go inside the two existing blocks guarded by `prefers-reduced-motion: no-preference` and `:root:not([data-reduce-motion])`. Under reduced motion, `getAnimations()` on the sequence stays empty and the static composition shows the Grid with both words written in.
- **SSR and hydration.** Everything new is static server-rendered markup with inline custom properties and fixed data. There is no randomness (rotation is seeded by index) and no new client component, so server and client render the same. New elements are absolutely positioned inside planes that already have a fixed size, so there is no layout shift.
- **Unit test (Vitest).** If the board's squares live in a small TS module, a test can replay 1.e4 d5 2.exd5 Qxd5 with `chess.js` (already a dependency) and check that the rendered start position and each un-move match the game.
- **End to end (Playwright).** A new `e2e/landing-walls.spec.ts`, in the style of `gears-layout.spec.ts`:
  - the occlusion probe from section 2 at 390px and 1280px;
  - the queen's computed `translate` at 40% and 58%;
  - `getAnimations()` empty under reduced motion and with `data-reduce-motion`;
  - a frame-time guard at 390px with 4× throttle.
- **Fallback in e2e.** Run the spec in Playwright's Firefox, launched with `firefoxUserPrefs: { "layout.css.scroll-driven-animations.enabled": false }` so the fallback is exercised even when a newer Firefox ships view timelines. Assert that `data-seq-scroll` is set and that the queen's computed `translate` at 50% matches Chromium's.
