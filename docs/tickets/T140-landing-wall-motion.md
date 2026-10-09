---
id: T140
title: Landing walls come alive, a game unwinding on The Board, letters on The Grid and digits in The Mirror
milestone: M5
epic: E10
depends_on: [T067]
migrations: false
requires_human: false
spec: ["SPEC §1.4", "SPEC §6.3", "SPEC §6.5", "SPEC §6.6"]
skills: []
---

# T140: Landing walls come alive, a game unwinding on The Board, letters on The Grid and digits in The Mirror

## Context

**Nice-to-have; not on the launch path.** The landing title sequence (T067, plus the scroll fallback for browsers without view timelines, `fec6f97`) scrubs a CSS 3D room with three walls. Today the walls themselves are static, and the only pieces are flat glyphs in front of the scene. This ticket puts the title sequence's motifs on the walls, scrubbed by scroll:

- a short game unwinds on The Board, echoing Reverse Chess;
- red hand letters fill The Grid;
- missing digits are written into The Mirror.

The research, measurements and rejected alternatives are in `docs/research/landing-wall-animation.md`.

The research also found that the left side wall swings across the view and covers the back wall. At 390px and 768px it covers The Board for the whole Board window, so nothing drawn on the Board would be visible. The owner likes that effect: the wall sweeping across forms a partition between rooms. So this ticket makes it a deliberate feature, **a wall crossing between rooms**. The wall sweeps across only in the transition windows, hiding the swap from one room's wall to the next, and the camera settles during each room's dwell window so the room's content is fully visible.

## Scope

**In**

- **Camera and wall crossings.**
  - Every room is left through a wall. The side wall (`.seq-wall-left`) sweeps across the view and fully covers the back wall at three track positions: **33%** (The Grid to The Board), **65%** (The Board to The Mirror) and **88%** (The Mirror to the finale). The wall swap behind it (`seq-wall-grid`, `seq-wall-board` and `seq-wall-mirror` opacity, currently 28–38% and 60–70%) is timed to happen while the wall covers the view, so the change of room reads as passing through a partition, not a crossfade. Retime those opacity keyframes if the crossing peaks need it.
  - `@keyframes seq-world` gets stops: crossing peaks at 33%, 65% and 88% use `rotateY(22deg) rotateX(4deg) translateZ(260px)` (today's 50% pose; tune per viewport so the wall reads as solid at 390px, 768px and 1280px), and calm stops between them use `rotateY(var(--seq-calm))` with `--seq-calm` set to 4° below 48rem, 12° from 48rem and 16° from 64rem. These are the measured values at which the side wall does not cover the Board (research §2). The start and end poses stay as they are.
  - The side wall must read as a wall, not a glitch: opaque and textured at the peak (it is the same grid tile as the floor today), no flicker from the opacity swaps, and the crossing lasts about 10% of the track (a wall sweeps past, it doesn't linger).
- **The Board.**
  - Pieces are `PieceGlyph` children of `.seq-wall-board`, one cell (`var(--seq-cell)`) square, placed in cell units from a centred e-file.
  - The checker is recentred with `background-position: calc(50% + var(--seq-cell) / 2) 0`, so e8 is light in Paper.
  - The wall gets `overflow: clip`. Pieces outside files d to f are hidden below 48rem.
  - Start position (38%): black Ra8 Nb8 Bc8 Ke8 Bf8 Ng8 Rh8, pawns a7 b7 c7 e7 f7 g7 h7, and the queen on d5.
  - The un-moves, with track windows:

    | Window | Un-move | What moves |
    |---|---|---|
    | 41–45% | un-Qxd5 | The queen goes d5 → d8, and a white pawn fades in on d5 by 43% |
    | 47–51% | un-exd5 | The white pawn goes d5 → e4, and a black pawn fades in on d5 by 49% |
    | 53–56% | un-d5 | The black pawn goes d5 → d7 |

    It holds between moves, and from 56% to 60% on the position after 1.e4.
  - Pieces keep true colours in both themes (no Paper/Ink swap), and keep `PieceGlyph`'s default shadow.
- **The Grid.**
  - LUDWIG writes down column 0 (rows 0 to 5) from 12% to 24%, then INK across row 4 from the shared I, from 24% to 28%.
  - Each word is one element revealed with a stepped `clip-path` (two animations in all).
  - Letters are `font-hand`, `text-primary`, with the seeded ±2° per-cell rotation.
  - Their base (unanimated) style is the finished word.
- **The Mirror.**
  - The centre box's five missing digits (r4c4 = 7, r4c6 = 1, r5c5 = 5, r6c4 = 9, r6c6 = 4) appear in red hand, still mirrored, row by row, from 72% to 90%.
  - They render through an opt-in prop on `MirroredSudoku`, so the finale copy stays as it is.
- **Both paths.** Every new keyframe uses whole-track percentages and is wired into both the view-timeline block and the `[data-seq-scroll]` fallback block of `title-sequence.css`, like `.seq-piece-a`. Set `steps()` inside the keyframe, because both blocks force `linear` on the element.
- **Tests.**
  - A Vitest test that replays 1.e4 d5 2.exd5 Qxd5 with `chess.js` against the board's square data.
  - A new `e2e/landing-walls.spec.ts`.
  - A Firefox Playwright project scoped to that spec, with `firefoxUserPrefs: { "layout.css.scroll-driven-animations.enabled": false }` so it always runs the fallback.
- **Spec.** Add a "Title-sequence walls" bullet to SPEC §6.3 describing the three wall motions and the scrubbed, static-under-reduced-motion behaviour.

**Out**

- Restructuring the duplicated native and fallback rule blocks in `title-sequence.css`.
- A door, window or gap in the crossing wall, and any change to the wall artwork.
- The one layout and style recalc per scroll frame that the landing already does (T069).
- New artwork (the knife in a square), or more motion on the toppled foreground pieces.
- three.js, WebGL or any new dependency.

## Notes

- Positions and moves are `calc(n * var(--seq-cell))`, never px, so everything follows the cell size. Rows count from the top of the wall (rank 8 = row 0); files count from the centred e-file (d = −1).
- Animate only `translate` and `opacity` on pieces. Research §5 measured that they are rasterised once and then composited, so the eight-step shadow is free. Animating `scale`, `filter` or colour would re-rasterise it on every frame.
- Keep the added animations grouped, about six in all (three for pieces, two for Grid words, one to three for Mirror rows). In the fallback, every animated element is restyled on every scroll frame (research §5).
- The finale's `MirroredSudoku` and the reduced-motion composition must not change visually, apart from the Grid words, which show finished.
- The design-system rules apply: tokens only, no rounded corners, and no `var(--color-shadow)` outside `pieces.tsx`.
- This ticket doesn't block T068, T069 or T070. If it lands before T069, the performance pass covers it.

## Acceptance criteria

- [ ] **AC1**: Each room is seen unobstructed, and each room is left through a wall.
  - _Verify (browser):_ In `e2e/landing-walls.spec.ts`, at 390×844, 768×1024 and 1280×800, for dwell windows (Grid 0.06 to 0.26, Board 0.41 to 0.58, Mirror 0.72 to 0.86, in 0.02 steps), take a screenshot clipped to the middle 80% of the room's wall, hide `.seq-wall-left`, and screenshot again. The two buffers are identical at every step. At progress 0.33, 0.65 and 0.88, the side wall's on-screen bounding box covers at least 70% of the viewport width, and the active room's wall opacity changes only between 0.30 and 0.36, 0.62 and 0.68, and 0.85 and 0.91 respectively. Take a screenshot of each crossing at each viewport.
- [ ] **AC2**: The game unwinds in cell units on the scroll timeline.
  - _Verify (browser):_ At progress 0.40, the queen's computed `translate` is `0px 0px`. At 0.58, it is three cells up: `0px -240px` with today's 80px `--seq-cell`. The black d-pawn's opacity is 0 at 0.46 and 1 at 0.50. Take screenshots at 0.40, 0.46, 0.52 and 0.58 at 1280px and 390px.
- [ ] **AC3**: The game is legal.
  - _Verify (unit):_ The new Vitest test plays 1.e4 d5 2.exd5 Qxd5 with `chess.js` from the initial position. It asserts that the rendered start squares equal the final position on ranks 8 to 3, and that each un-move's from and to squares are the reverse of the matching game move.
- [ ] **AC4**: The Grid and The Mirror fill in.
  - _Verify (browser):_ At progress 0.12, the LUDWIG element shows no letters (clip fully closed). At 0.28, LUDWIG and INK are fully revealed. At 0.71, the five centre-box digits are hidden; at 0.92, all five are visible and mirrored. Take screenshots at 1280px and 390px.
- [ ] **AC5**: The phone shows the whole sequence.
  - _Verify (browser):_ At 390×844 and progress 0.42, 0.50 and 0.58, the queen and both d/e pawns are inside the wall's on-screen bounding box. No piece outside files d to f is rendered (computed `display: none`). `document.documentElement.scrollWidth <= 390`.
- [ ] **AC6**: Both themes render correctly.
  - _Verify (browser):_ Screenshots at progress 0.20, 0.48 and 0.85 in Paper and in Ink (`data-theme="ink"`), at 1280px and 390px. White pieces are paper and black pieces ink in both themes. The Grid letters are red. There are no flat whites.
- [ ] **AC7**: The fallback path plays the same sequence.
  - _Verify (browser):_ Run the spec's Firefox project. `CSS.supports("animation-timeline: view()")` is false, and `.title-sequence` has `data-seq-scroll`. At progress 0.50, the queen's and the white pawn's computed `translate` match the Chromium values from AC2 to within 1px, and AC4's Grid and Mirror checks pass.
- [ ] **AC8**: Reduced motion shows a static composition.
  - _Verify (browser):_ With `browser_emulate_media` `reducedMotion: 'reduce'`, and separately with `data-reduce-motion` set on `<html>`, `document.querySelector(".title-sequence").getAnimations({ subtree: true })` is empty. The Grid shows LUDWIG and INK finished, and the page matches T067's static composition otherwise.
- [ ] **AC9**: Scrubbing stays smooth on a throttled phone.
  - _Verify (browser):_ In the spec's mobile project, with CDP `Emulation.setCPUThrottlingRate` 4, wheel-scrub from progress 0.34 to 0.64 and back. rAF frame deltas have p95 ≤ 20ms and no frame over 50ms. CDP `Paint` events during the scrub are no more than 20.
- [ ] **AC10**: Server and client render the same, with no layout shift.
  - _Verify (browser):_ Load `/` and check that `browser_console_messages` has no hydration warning. The summed `layout-shift` entries from a `PerformanceObserver` registered with `buffered: true` total 0 after load.
- [ ] **AC11**: Brand checklist items for the landing pass.
  - _Verify (code):_ `grep -nE "#[0-9a-fA-F]{3,6}|rounded-|bg-white|var\(--color-shadow\)" "src/app/(marketing)"` returns only the existing `.seq-cast` and `--seq-*` token lines in `title-sequence.css`, with no new ones.
- [ ] **AC12**: Gates pass, and there are no console errors.
  - _Verify (cli + browser):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0, `pnpm test:e2e e2e/landing-walls.spec.ts` passes in all three projects, and `browser_console_messages` is empty.
