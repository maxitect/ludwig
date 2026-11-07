---
id: T156
title: "Landing: LUDWIG writes in the clear, rooms exit through the right wall, piece shadows"
milestone: M5
epic: E10
depends_on: [T140]
migrations: false
requires_human: true
preview: false
spec: ["SPEC §1.4", "SPEC §6.3", "SPEC §6.6"]
skills: []
---

# T156: Landing: LUDWIG writes in the clear, rooms exit through the right wall, piece shadows

## Context

User feedback on the title sequence (`src/app/(marketing)/_components/`), confirmed with screenshots on the dev server at 1280px and 390px:

1. **The LUDWIG letters are hidden.** The hero card ("A fan-made puzzle collection") sits top-left over the Grid wall, exactly where LUDWIG writes down the first column, and fades out from 12% to 28% while the letters write from 12% to 24%. On a phone the hero covers the whole wall, so the word is half-written behind a half-faded card and the reveal is lost.
2. **The toppled pieces have block shadows.** `.seq-cast` is a translucent rectangle (a clipped polygon) behind each foreground piece. It reads as a cut-out, not a cast shadow.
3. **Every room is left through the same wall and we come back.** `seq-world` swings to a peak so the left side wall sweeps across, then swings back to the same calm pose with the next room's back wall swapped in. It reads as going into the wall and returning to the same room. The intended story is a walk forward: the first room shows LUDWIG on the Grid, the camera goes through the wall on the right into the second room where the game unwinds on the Board, then through the right wall again into the Mirror, and on to the finale. We never come back.

## Scope

**In**

- **Letters in the clear.** Retime so the hero is fully hidden before the first letter appears, and the LUDWIG column is unobstructed on both widths while it writes: hero out 4% to 12%, LUDWIG 14% to 26%, INK 26% to 30%, the first crossing from about 31%. Keep caption 1 visible until the crossing. Check that at 390px the hero's `visibility: hidden` lands before 14%.
- **Shadows.** Remove `.seq-cast`. Give the foreground pieces the piece's own long hard shadow, the eight-step `drop-shadow` stack `PieceGlyph` already offers (`shadow` prop), which is the brand treatment (SPEC §6.3, "long blue shadows"). The toppled rotation applies to the piece and its shadow together. If the stacked filter costs measurable paint during the scrub, keep the glyph rasterised once by animating only `translate` on `.seq-piece` (it already does) and record the frame numbers.
- **Walk forward through the right wall.** Rework `@keyframes seq-world` and the side-wall planes so that:
  - each crossing is the **right** side wall (`.seq-wall-right`, the grid-paper one) sweeping across the view from right to left, with the camera yawing and moving forward through it;
  - the room swap (Grid to Board, Board to Mirror) happens while the wall fully covers the view, as T140 does today;
  - the camera **does not swing back**. While the wall covers the view, the pose cuts to the next room's starting pose (a discontinuous keyframe at the covered instant), so the next room is entered facing its back wall with the same calm angle, never by reversing the swing;
  - the three crossings keep roughly the same track positions (about 31%, 65% and 88%) and durations (about 10% of the track each), and the calm dwell windows stay as T140 measured them;
  - the side wall is opaque and textured at the peak at 390px, 768px and 1280px (re-tune `--seq-peak` per width if the right wall needs a different angle from the left one, because `perspective-origin` is 50% 40%).
  - Whether the left wall is still needed as scenery is the implementer's call; if it only ever sweeps, remove it.
- **Both animation paths.** Every retimed or new keyframe is wired into the view-timeline block and the `[data-seq-scroll]` fallback block of `title-sequence.css`, with `steps()` inside the keyframe (T140 notes).
- **Tests.** Update `e2e/landing-walls.spec.ts`: AC1's crossing checks now measure `.seq-wall-right`; add a check that the hero is hidden (`visibility: hidden`) at 0.14 and LUDWIG is fully revealed by 0.26 with the hero hidden; add a check that between crossings the world's `rotateY` never returns through the peak (sample the computed transform at 0.02 steps and assert the yaw is monotonic within each crossing window and equal to the calm value in each dwell). The Firefox fallback project runs where Firefox launches (T140 AC7 note).
- SPEC §6.3 "Title-sequence walls" bullet: rooms are left through the right wall, forward only.

**Out**

- New artwork, a door in the wall, or any change to the Board game, the Grid words or the Mirror digits.
- The finale.
- three.js, WebGL or any new dependency.

## Notes

- Visual acceptance needs the user: screenshots at 0.00, 0.10, 0.20, 0.31, 0.45, 0.65, 0.80, 0.88 at 1280px and 390px in both themes, under `.verification/T156/`, for the user to approve the camera story. That is the human step.
- Timing numbers above are a starting point; the dwell windows in T140's AC1 (Grid 0.06 to 0.26, Board 0.41 to 0.58, Mirror 0.72 to 0.86) are the constraint to keep. If the hero needs longer on screen at the top, start LUDWIG later rather than overlapping.
- Reduced motion keeps the static composition: hero visible, both Grid words finished, no shadows animating.

## Acceptance criteria

- [ ] **AC1**: LUDWIG writes with nothing in front of it.
  - _Verify (browser):_ at 1280×800 and 390×844, for progress 0.14 to 0.26 in 0.02 steps, the hero's computed `visibility` is `hidden`, and a screenshot clipped to the LUDWIG column's on-screen box is identical with and without `.seq-hero` in the DOM. At 0.26 all six letters are revealed.
- [ ] **AC2**: Each room is left through the right wall, forward only.
  - _Verify (browser):_ at progress 0.31, 0.65 and 0.88, `.seq-wall-right`'s on-screen box covers at least 70% of the viewport width at all three viewports; the active room's wall opacity changes only inside each crossing window; the world's yaw sampled at 0.02 steps is monotonic within each crossing and equals `--seq-calm` throughout each dwell window, with no sample between a dwell and the next crossing equal to the previous crossing's peak.
- [ ] **AC3**: The toppled pieces carry the piece shadow and no block.
  - _Verify (code + browser):_ `grep -n "seq-cast" src/app/(marketing)` returns nothing; each `.seq-piece` glyph has a computed `filter` containing eight `drop-shadow` steps. Screenshots at 0.00 in both themes at 1280px and 390px.
- [ ] **AC4**: The dwell windows still show each room unobstructed.
  - _Verify (browser):_ T140 AC1's dwell check (screenshot with and without the side wall are identical) passes for Grid 0.06 to 0.26, Board 0.41 to 0.58 and Mirror 0.72 to 0.86 at all three viewports.
- [ ] **AC5**: The fallback path matches.
  - _Verify (browser):_ with `data-seq-scroll` forced, AC1 and AC2 pass to within 1px at 0.14, 0.31 and 0.50.
- [ ] **AC6**: Reduced motion is static and complete.
  - _Verify (browser):_ with `reducedMotion: 'reduce'`, `getAnimations({ subtree: true })` on `.title-sequence` is empty; the hero, both Grid words and all three pieces are visible.
- [ ] **AC7**: Scrubbing stays smooth and the page has no layout shift.
  - _Verify (browser):_ T140 AC9 and AC10 pass unchanged (p95 frame delta ≤ 20 ms with 4x CPU throttling; summed `layout-shift` is 0).
- [ ] **AC8**: The user approves the camera story.
  - _Verify (human):_ the user reviews the screenshot set in `.verification/T156/` on the PR and says so in the report.
- [ ] **AC9**: Gates pass, and there are no console errors.
  - _Verify (cli + browser):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0; `pnpm test:e2e e2e/landing-walls.spec.ts` passes on `desktop` and `mobile`; `browser_console_messages` is empty.
