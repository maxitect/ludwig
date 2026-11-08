---
id: T167
title: "Landing: three staged rooms and a continuous pan through two walls (rework of T156)"
milestone: M5
epic: E10
depends_on: [T156]
migrations: false
requires_human: false
preview: true
spec: ["SPEC §6.3"]
skills: []
---

# T167: Landing: three staged rooms and a continuous pan through two walls

**Top priority for the next session. Run this first.**

## Context

User feedback (2026-11-08) on T156's camera, with the diagnosis. T156 has one room set up that is swapped for the next while the wall covers the view. Each crossing yaws to look sideways at the wall, holds, and then cuts to what is the same room with new contents. There is nothing on the other side of the wall, which is why the camera ends up looking back at it. The real fault is the lack of continuity: the viewer never travels from one room into another.

What the user wants, in their words: the camera crosses the wall and the other room is **already staged** in there. It is a **pan**, left to right, through the wall (not a move forward into the wall). It stops once it is in the middle of the next room, the chess animation plays, and it pans through the wall again into the final room, stops, and that room's animation plays. All of it is continuous: there are no cuts, and each room is staged before the camera pans into it. **Set up all 3 rooms in the full scene, with 2 walls the camera goes through to get from one to the other.** Do not keep one room that transforms into each of the others.

## Scope

**In**

- **One scene, three rooms, built side by side.** The Grid room, the Board room and the Mirror room all exist in the DOM and 3D space at once, laid out left to right along the camera's path. Each is fully staged (back wall, floor, props, its words, pieces or digits in their start state) before the camera reaches it. Nothing is created, swapped or re-skinned during a crossing. Replace the current single-room-with-swapped-contents structure.
- **Two walls, one between each pair of rooms** (Grid|Board and Board|Mirror). The camera passes through each wall plane as part of one pan. The wall slides out of view behind the camera as it passes. The viewer sees the far room through and past the wall as the pan moves, not a wall filling the screen and a cut.
- **The move is a pan across,** left to right (a lateral travel with the matching view turn so the camera ends facing the next room's back wall, calm pose). It is not a dolly forward into the wall, and not a yaw to look at the wall's face. At no point does the camera face a wall it has already passed.
- **Dwell, then pan, then dwell.** Grid dwell (LUDWIG writes, Grid words), pan 1, Board dwell (the chess game unwinds), pan 2, Mirror dwell (the digits), then the finale. Keep T140/T156 dwell windows as the starting timings (Grid 0.06 to 0.26, Board 0.41 to 0.58, Mirror 0.72 to 0.86); the pans fill the gaps and may be longer than T156's crossings, because the pan is the point.
- **No cuts.** The camera position is continuous through the whole track (no discontinuous keyframe). Test: the sampled camera position and yaw have no jump larger than the per-step travel anywhere in 0 to 1.
- **Finale.** The Mirror dwell hands over to the finale as T156 does today (the stage scrolls away). Do not add a third wall or a return to a previous room. If the finale needs its own pan, ask the user.
- **Keep T156's fixes:** LUDWIG writes in the clear (hero hidden by 0.14), pieces carry the long hard drop-shadow stack, no `.seq-cast`.
- **Performance and layout:** three staged rooms must not cost the scrub. Rooms that are far from the camera may be `content-visibility`/`will-change` managed or have their animations paused, but must be present in the DOM and fully painted when the camera arrives (no pop-in). Keep T140 AC9 (p95 frame delta at most 20 ms under 4x CPU throttle) and AC10 (zero layout shift).
- **Both animation paths** (view-timeline block and `[data-seq-scroll]` fallback in `title-sequence.css`) and reduced motion (static composition, complete, no animations).
- **e2e:** update `e2e/landing-walls.spec.ts`: all three rooms are present and painted at progress 0; the camera path has no discontinuity; at each dwell the camera is centred in that room; during each pan the camera passes the wall plane; the next room's content is already in its start state before the pan begins (not created or changed during it).
- SPEC §6.3 "Title-sequence walls" bullet describes three staged rooms, two walls and a continuous pan.

**Out**

- New artwork, a door in the wall, a change to the Board game, the Grid words or the Mirror digits, three.js, WebGL, any dependency.

## Notes

- Self-assess by recording the scroll as a frame strip every 0.01 of progress through both pans (and the dwells either side) at 1280 and 390, both themes. Read the strips as a viewer would: the next room must be visible and already staged as the pan begins, the view moves continuously, and no frame shows the crossed wall from the side or the room contents changing. Save them under `.verification/T167/` and put them in the report. The user reviews on the preview.
- This reworks the camera and scene structure, so it is the larger change; budget for it.
- `preview: true`.

## Acceptance criteria

- [ ] **AC1**: All three rooms are staged in one scene from the start.
  - _Verify (browser):_ at progress 0, the Grid, Board and Mirror rooms are all in the DOM and 3D space, laid out left to right, each with its back wall and props painted; nothing is added to or swapped in a room during any pan (DOM and computed-style snapshots of the next room are identical immediately before and after the pan starts, apart from the camera).
- [ ] **AC2**: The camera path is continuous.
  - _Verify (browser):_ sampled every 0.01 across 0 to 1 at 1280 and 390, the camera position and yaw have no discontinuity larger than the neighbouring step.
- [ ] **AC3**: Each crossing is a pan through a wall into the next, already staged room.
  - _Verify (browser):_ across each pan the camera moves laterally from one room's centre to the next room's centre and passes the wall plane between them; the destination room is visible through the opening before the camera enters it; the camera never faces the crossed wall after passing.
- [ ] **AC4**: Frame strips read correctly.
  - _Verify (browser):_ strips for both pans at 1280 and 390, Paper and Ink, are in the report and in `.verification/T167/`; no frame shows the crossed wall from the side or a room changing contents.
- [ ] **AC5**: Dwells, LUDWIG reveal and piece shadows from T156 still hold.
  - _Verify (browser):_ `pnpm exec playwright test e2e/landing-walls.spec.ts --project=desktop --project=mobile` passes, including hero hidden by 0.14, LUDWIG complete by 0.26, and eight `drop-shadow` steps per piece.
- [ ] **AC6**: Fallback and reduced motion match.
  - _Verify (browser):_ with `data-seq-scroll` forced, the camera position equals the view-timeline one to within 1px at 0.14, 0.31 and 0.50; with `reducedMotion: 'reduce'`, `getAnimations({ subtree: true })` on `.title-sequence` is empty and the static composition is complete.
- [ ] **AC7**: Scrubbing stays smooth and there is no layout shift.
  - _Verify (browser):_ T140 AC9 and AC10 pass unchanged.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0; no console errors.
