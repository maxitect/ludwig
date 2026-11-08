---
id: T167
title: "Landing: the camera walks through the right wall into the next room (rework of T156)"
milestone: M5
epic: E10
depends_on: [T156]
migrations: false
requires_human: false
preview: true
spec: ["SPEC §6.3"]
skills: []
---

# T167: Landing: the camera walks through the right wall into the next room

## Context

T156 merged a camera that does not do what the user asked. User feedback (2026-11-08): "it crosses the wall and turns, looks at the wall it just crossed, and then just cuts to being in the next room. It should cross the wall INTO the next fucking room."

What T156 built: at each crossing `seq-world` yaws to a peak so `.seq-wall-right` fills the view, holds the peak for about 2%, then cuts to the calm pose in the next room. The viewer ends up looking sideways at a wall, then teleports. T156's text said "the camera yawing and moving forward through it" and "a walk forward"; only the yaw and the cut were delivered. There is no forward motion and no moment of arriving on the far side.

The required experience: the camera faces the room's back wall, travels forward and through the right-hand wall, and comes out facing the next room. It reads as one continuous walk. Nothing may show the wall just crossed after the camera has passed it.

## Scope

**In**

- Rework `@keyframes seq-world` and the wall planes in `src/app/(marketing)/_components/title-sequence.css` (and any markup in the sequence components) so each crossing is a continuous move:
  - the camera travels toward and through the right wall, with a forward translate as well as the yaw, so the wall opens up and passes out of view on the near side;
  - the next room is already behind the wall (laid out in the same 3D space, or revealed through the wall as it passes) so the camera arrives facing the next room's back wall;
  - no view in which the camera looks back at the wall it just crossed, no hold at a sideways peak, and no visible cut of the whole scene. A swap of room contents is allowed only while an opaque wall fully covers the view AND the camera is still moving forward through it (no pause, no yaw reversal);
  - the dwell windows from T140/T156 stay: Grid 0.06 to 0.26, Board 0.41 to 0.58, Mirror 0.72 to 0.86, calm pose in each; crossings stay near 0.31, 0.65 and 0.88. The third crossing leads into the finale and must not return to the Mirror.
- Keep T156's fixes: LUDWIG writes in the clear, piece drop-shadow stack, no `.seq-cast`.
- Both animation paths (view-timeline block and `[data-seq-scroll]` fallback) and reduced motion (static, complete) as in T156.
- e2e: update `e2e/landing-walls.spec.ts` so the yaw/translate samples assert forward progress through each crossing (the camera's z or the wall's depth changes monotonically, yaw never decreases through the peak and never holds), and that the room visible after the crossing is the next room.
- SPEC §6.3 "Title-sequence walls" bullet describes the walk-through.

**Out**

- New artwork, a door, the finale, three.js, WebGL, any dependency.

## Notes

- Self-assess by recording the scroll through each crossing as a frame strip (every 0.01 of progress from 0.26 to 0.41, 0.58 to 0.72 and 0.86 to 0.92) at 1280 and 390, both themes, and read the strips as a viewer would: if any frame shows the crossed wall from the side, or the room changes with no travel, it fails. Put the strips under `.verification/T167/` and in the report. The user reviews on the preview.
- `preview: true`.

## Acceptance criteria

- [ ] **AC1**: Each crossing is continuous forward travel.
  - _Verify (browser):_ sampled at 0.01 steps through each crossing window, the world's forward translate changes monotonically and the yaw never reverses or holds for more than one sample; the room after the crossing is the next room.
- [ ] **AC2**: The crossed wall is never viewed from the far side.
  - _Verify (browser):_ frame strips for all three crossings at 1280 and 390 contain no frame where the camera faces the crossed wall sideways after passing it; recorded in the report.
- [ ] **AC3**: Dwell windows, LUDWIG reveal and piece shadows from T156 still pass.
  - _Verify (browser):_ `pnpm exec playwright test e2e/landing-walls.spec.ts --project=desktop --project=mobile` passes.
- [ ] **AC4**: Fallback and reduced motion match.
  - _Verify (browser):_ with `data-seq-scroll` forced the positions equal the view-timeline ones to within 1px at 0.14, 0.31 and 0.50; with `reducedMotion: 'reduce'`, `getAnimations({ subtree: true })` on `.title-sequence` is empty.
- [ ] **AC5**: Smooth, no layout shift, gates pass.
  - _Verify (browser + cli):_ T140 AC9 and AC10 pass unchanged; `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
