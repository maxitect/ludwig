---
id: T038
title: Crank interaction (drag, keyboard, ±)
milestone: M3
epic: E7
depends_on: [T037]
migrations: false
requires_human: false
spec: ["SPEC §5.2.4 (Controls, Accessibility)", "SPEC §6.4 (Slider)"]
skills: []
---

# T038: Crank interaction

## Context

This turns the T037 prototype's crank into the real control. When the player turns the driver, every meshed gear turns live in the correct direction and ratio (SPEC §5.2.4).

## Scope

**In**

- Drag-rotating the driver gear (pointer and touch), snapping to whole teeth.
- ± tooth buttons, plus arrow keys when the driver has focus:
  - Left/Right: ±1 tooth;
  - Shift+Left/Right: ±1 slot's worth of teeth on the driver;
  - Home: back to 0.
- The crank value wraps modulo L and is shown as a number.
- Live rendering of every gear's rotation from `stateAt`, at the current convergence.
- Saving `gear_attempts.crank` through `saveState`, debounced.
- Replacing the T037 rough −/+ buttons with these controls. The convergence select stays until T039.

**Out**

- The scrubber and animation (T039), and accuse (T040).

## Acceptance criteria

- [ ] **AC1**: The ratio and direction are correct.
  - _Verify (browser):_ on fixture F3, press Right 6 times on the driver.
    - `data-facing-deg` changes by +270° on A (8 teeth), −180° on B (12 teeth, opposite direction) and +135° on C (16 teeth), modulo 360.
- [ ] **AC2**: Wrap-around.
  - _Verify (browser):_ from crank 0, pressing Left once shows crank `47` for F3 (L=48), and the gears render the same as at crank 47 set directly.
- [ ] **AC3**: Dragging snaps to teeth.
  - _Verify (browser):_ `browser_drag` the driver by about 100° clockwise. The crank ends on an integer, and the facing equals `crank × 45°` for A.
- [ ] **AC4**: Touch on a small viewport.
  - _Verify (browser):_ at 390px with touch emulation, drag the driver. The crank changes and the page doesn't scroll during the drag (`window.scrollY` unchanged).
- [ ] **AC5**: Progress persists.
  - _Verify (browser + db):_ signed in as `T038-1`:
    1. Set crank 4 and reload. The crank is still 4.
    2. `SELECT crank FROM gear_attempts g JOIN attempts a ON a.id=g.attempt_id JOIN "user" u ON u.id=a.user_id WHERE u.email='T038-1@test.local'` returns `4`.
- [ ] **AC6**: Keyboard-only use and focus.
  - _Verify (browser):_ the driver is reachable with Tab, has the `grid-blue` focus ring and announces "Driver gear, crank 4 of 48" (snapshot).
- [ ] **AC7**: Reduced motion.
  - _Verify (browser):_ with `reducedMotion: 'reduce'`, the rotation updates instantly, with a computed transition duration of `0s`.
- [ ] **AC8**: Visuals and console.
  - _Verify (browser):_ screenshots in both themes at 1280px and 390px. The console is clean during 50 rapid key presses.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
