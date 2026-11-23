---
id: T171
title: "Landing: fit the stage under the header, one room per shot, and end on the Mirror"
milestone: M5
epic: E10
depends_on: [T167]
migrations: false
requires_human: false
preview: true
spec: ["SPEC §6.3"]
skills: []
---

# T171: Landing: fit the stage under the header, one room per shot, and end on the Mirror

## Context

User feedback (2026-11-23) on the landing title sequence after T167, with a screenshot of the first frame at about 2000×1245. Three faults:

1. **The stage ignores the site header.** `.seq-stage` is `position: sticky; top: 0; height: 100dvh` (`src/app/(marketing)/_components/title-sequence.css`), but the header above it is sticky too. On load the stage's bottom is below the fold, and as the page scrolls the stage's top slides behind the header, part-hiding the Ludwig wordmark on the hero card.
2. **Every room is on screen at once.** In the first frame the Grid's back wall fills only the middle of the view and the Board's wall is already a large part of the right side. During the pans all the walls are in view together. The user wants each shot to be one room: the camera is inside the room and sees that room only. **When the camera stops, it must not see the next room, and it must not see the cut end of the dividing wall.** This is the main point of the ticket. The user's words: "we are in the room, when would you be able to see through a wall in a real setting?" The next room comes into view only while the camera is panning past the wall into it. The left-to-right order and the continuous pan from T167 are right and stay.
3. **The fourth room is surplus.** T167 added a "finale space" entered by a third pan. It has no name and is the Mirror again at 20% opacity. The sequence should end on the Mirror.

This is the fourth ticket on this sequence (T140, T156, T167). The user asked that this one be **tested ruthlessly against each requirement**, because each earlier pass met its own tests and still came back. So every requirement below has a measurement that fails on today's build, and the ticket is not done until the measurements, the frame strips and the implementer's own reading of the strips all agree.

## Scope

**In**

- **Stage under the header.** The sticky stage starts at the header's bottom edge and ends at the viewport's bottom edge, at every scroll position of the track, on both animation paths. The header's height is not a constant (safe-area padding, the `touch` sizes), so derive it; don't hard-code a number. Scroll progress still runs from 0 with the page at the top to 1 at the end of the track.
- **One room per shot.** Change the geometry so that at each dwell the current room fills the frame. The user's two suggestions: make the dividing walls longer (reach further toward the camera) so they hide the next room, or bring the camera in closer. Use either or both; `--seq-pitch` (70%), the perspective and the side walls' depth are the levers. The result must be:
  - at a dwell, the back wall in front of the camera is the subject and is fully in frame;
  - **at a dwell, no part of any other room is visible: not one pixel.** The side walls run out of the frame toward the camera, so their near ends (the cut) are off screen and there is no gap to see past;
  - during a pan, only the room being left and the room being entered are visible, and the room being left is gone by the time the camera stops.
- **End on the Mirror.** Remove the fourth room (`--room: 3`, `.seq-wall-finale`), the third dividing wall's far side and the third pan. `--seq-rooms`, the floor's width, the camera keyframes (`seq-world-pan`, `seq-world-yaw`), the captions and the walker follow. The Mirror's right-hand wall closes the scene: nothing is visible beyond it. Retime the track for two pans and three dwells, and shorten `.seq-track` if the dwell lengths would otherwise stretch.
- **Keep** from earlier tickets: all three rooms staged in one scene from the start, the continuous camera path with no cut, the hero hidden before LUDWIG writes, the Board's game, the Mirror's digits finished before the track ends, the pieces' drop-shadow stack, both animation paths (view timeline and the `[data-seq-scroll]` fallback), reduced motion as a complete static composition, the scrub performance budget and zero layout shift.
- **A measuring helper** in `e2e/landing-walls.spec.ts` that says which room owns each part of the frame: inject a test-only style that paints every plane of room _n_ one flat colour, screenshot the stage and count pixels per colour. Rectangles from `getBoundingClientRect` are not enough, because they ignore what is hidden behind a nearer wall. Every visibility AC below uses it.
- **Frame strips** with `scripts/dev/landing-strip.mts` across the whole track, at every size and theme in the Notes.
- SPEC §6.3 "Title-sequence walls": three rooms, two pans, one room per shot, the stage under the header, no finale room.

**Out**

- The closing section below the track (`.seq-finale`: "Take a seat. Begin" with the Open the Collection button). It is page content, not a room, and it stays. Rename its class if the word "finale" would mislead after this ticket.
- New artwork, a change to the Grid words, the Board game or the Mirror digits, three.js, WebGL, any dependency.
- The signed-in Desk.

## Notes

- **Sizes to test, all of them:** 2000×1245 (the user's screenshot), 1920×1080, 1440×900, 1280×800, 1280×650, 1024×768, and 390×844 and 430×932 on the phone projects. Paper and Ink. The geometry is in percentages of the stage and a fixed 900px perspective, so a fix tuned at one size can fail at another; the wide and short sizes are the likely ones.
- **Write the failing tests first.** Add the measurements, run them on `main`, and put the failing output in the report as the baseline. A test that passes before the fix is measuring the wrong thing.
- **The header.** `src/components/shell/site-header.tsx` is `sticky top-0`. Whether the stage reads the header's height from a custom property, sits in a layout that accounts for it, or uses another route is the implementer's call, as long as it holds without JavaScript on first paint (no layout shift, T140 AC10) and under the fallback path.
- **Dwell windows** are a starting point, not a requirement: today the Grid dwells 0.06 to 0.26, the Board 0.41 to 0.58 and the Mirror 0.72 to 0.86, with a third pan after. With the third pan gone the Mirror should hold to the end of the track.
- **The opening yaw.** The world starts at `rotate: y -16deg` and settles to `--seq-calm` by 0.06. That opening turn must not show a second room either.
- **No glimpse at a dwell. None.** The user confirmed this twice (2026-11-23): a stopped camera sees one room, with no sliver of the next room and no visible end of a wall. T167 asked for the opposite ("the viewer sees the far room through and past the wall"), which is why today's build shows it; that instruction is withdrawn for dwells and applies only during a pan. Do not trade this away for a prettier pan. If the geometry can't give a clean dwell and a good pan together, the dwell wins, and say what was given up.
- Phones use different calm and lead angles (`--seq-calm` 12deg and 16deg at the narrower breakpoints). Check the one-room rule there separately; don't assume the desktop geometry carries over.
- Firefox takes the fallback path and does not launch headless on the dev machines; CI's `landing-fallback` project covers it. Force `data-seq-scroll` in Chromium for the local fallback checks.
- Read the strips as a viewer would, frame by frame, and write down what each dwell and each pan shows. A strip that passes the pixel counts and still looks like two rooms is a failure: fix it and tighten the numbers.

## Acceptance criteria

- [ ] **AC1**: The new measurements fail on `main` before the fix.
  - _Verify (cli):_ The report holds the failing output of the AC2, AC4, AC5 and AC7 tests run against `main`, with the measured values.
- [ ] **AC2**: With the page at the top, the stage sits exactly between the header and the bottom of the viewport, and the hero is clear of the header.
  - _Verify (browser):_ At every size in the Notes, with `scrollY` 0: the stage's top equals the header's bottom and the stage's bottom equals `innerHeight`, each to within 1px; the hero wordmark's bounding box is wholly below the header and wholly inside the viewport; scroll progress reads 0.
- [ ] **AC3**: The stage stays there for the whole track, and nothing of it is ever under the header.
  - _Verify (browser):_ Sampled every 0.02 of progress from 0 to 1 at every size, on the view-timeline path and with `data-seq-scroll` forced: the stage's top and bottom hold the AC2 values to within 1px, and `document.elementFromPoint` at the stage's top-left, top-centre and top-right corners returns a stage element, not the header. Progress reaches 1 at the end of the track.
- [ ] **AC4**: At each dwell, the camera sees one room and nothing of any other.
  - _Verify (browser):_ With the room-colour helper, at the middle and both ends of each of the three dwell windows, at every size and both paths: every other room covers exactly 0 pixels; the current room's back wall is wholly inside the stage; the current room's left wall reaches the stage's left edge and its right wall reaches the stage's right edge over the walls' full visible height, so neither wall's near end is in frame. Sample the whole dwell every 0.01 as well, with the same 0-pixel rule.
- [ ] **AC5**: During each pan, only the two rooms either side of the wall are visible.
  - _Verify (browser):_ Sampled every 0.01 across both pans at every size and both paths: at most two rooms have any pixels, they are the room being left and the room being entered, the room being entered's share only rises while the other's only falls, and the room being left is at 0 pixels on the first sample of the next dwell.
- [ ] **AC6**: The opening turn shows one room.
  - _Verify (browser):_ Sampled every 0.01 from 0 to the start of the Grid dwell, no room other than the Grid covers any pixel.
- [ ] **AC7**: There are three rooms, two pans and no finale room.
  - _Verify (browser, code):_ `.seq-room` count is 3; `grep -n "seq-wall-finale\|--room\": 3" src/app/\(marketing\)/_components/` returns nothing; the camera's lateral position, sampled every 0.01, changes during exactly two intervals and is constant from the start of the Mirror dwell to progress 1; the Rooms nav has three links.
- [ ] **AC8**: The sequence ends on the Mirror, finished.
  - _Verify (browser):_ At progress 0.98 and 1.0 the Mirror's five written digits are fully drawn, the Mirror meets AC4, and the next thing to scroll into view is the closing section with the Open the Collection button.
- [ ] **AC9**: The camera path is still continuous and the rooms are still staged from the start.
  - _Verify (browser):_ T167's AC1 and AC2 tests pass, updated for three rooms: no jump in camera position or yaw larger than the neighbouring step at 0.01 sampling, and each next room's DOM and computed styles are identical immediately before and after its pan starts.
- [ ] **AC10**: The earlier fixes hold.
  - _Verify (browser):_ The existing tests for the hero hidden before LUDWIG writes, LUDWIG and INK complete in the Grid dwell, the Board game unwinding in cell units, the eight `drop-shadow` steps per piece and both themes rendering pass, retimed where the track changed.
- [ ] **AC11**: The fallback path and reduced motion match.
  - _Verify (browser):_ With `data-seq-scroll` forced, the camera transform equals the view-timeline one to within 1px at five progress values spread over the track, including one inside each pan. With `reducedMotion: 'reduce'`, `getAnimations({ subtree: true })` on `.title-sequence` is empty, the composition is complete, the stage is clear of the header and no fourth room is present.
- [ ] **AC12**: Scrubbing stays smooth and nothing shifts.
  - _Verify (browser):_ T140 AC9 (p95 frame delta at most 20ms under 4x CPU throttle) and AC10 (zero layout shift, no hydration warning) pass.
- [ ] **AC13**: The frame strips read as one room per shot.
  - _Verify (browser):_ Strips every 0.01 of progress for the whole track at 2000×1245, 1280×800, 1280×650 and 390×844, in Paper and Ink, are in `.verification/T171/` and the key frames (each dwell's middle, each pan's middle, the first and last frame) are in the report. The report states, for each dwell and each pan, what is visible, and confirms no dwell frame shows any part of another room or the end of a wall, and no frame shows a third room, a room behind the header or the faded fourth room.
- [ ] **AC14**: The whole landing spec passes on every project, three times running.
  - _Verify (cli):_ `pnpm exec playwright test e2e/landing-walls.spec.ts --project=desktop --project=mobile --project=iphone --project=tablet --repeat-each=3` passes with no flaky retries.
- [ ] **AC15**: It holds on the PR's preview.
  - _Verify (deploy):_ `PLAYWRIGHT_BASE_URL=<preview-url> pnpm exec playwright test e2e/landing-walls.spec.ts --project=desktop --project=mobile` passes, and preview screenshots of the first frame at 2000×1245 and 390×844 are in the report beside the user's original.
- [ ] **AC16**: SPEC §6.3 matches what was built.
  - _Verify (code):_ The "Title-sequence walls" bullet describes three rooms, two pans, one room per shot with no view of another room while the camera is stopped, the stage under the header and the Mirror as the end, and no longer mentions a finale space or a third pan.
- [ ] **AC17**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0; no console errors on `/`.
