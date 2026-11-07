---
id: T039
title: Dance scrubber, animation and sightlines
milestone: M3
epic: E7
depends_on: [T038]
migrations: false
requires_human: false
spec: ["SPEC §5.2.1", "SPEC §5.2.4 (Dance scrubber)", "SPEC §6.6"]
skills: []
---

# T039: Dance scrubber, animation and sightlines

## Context

This is the dance itself: 8 figures, each going in to a convergence and then out to the opposite side with reversed rotation. It is animated with `motion` and scrubbable (SPEC §5.2.1, §5.2.4).

## Scope

**In**

- A timeline scrubber over 16 half-phases, with play/pause and labelled convergence markers 1–8. It replaces the T037 convergence select.
- Interpolated position along the in/out path, and rotation using `m_in` and `m_out` teeth per half-phase.
- At an exact convergence, sightlines are drawn (T037) and the "seeing" count is announced in an `aria-live="polite"` region.
- `selected_convergence` is saved to `gear_attempts.convergence` when the scrubber stops on a convergence.
- Installing `motion`.

**Out**

- Accuse (T040) and the state table (T042).

## Notes

- **One source of truth.** Interpolation is presentation only. At each convergence the rendered state must equal `stateAt` exactly: snap at the markers.
- **No React state per frame.** Drive the animation from a single `motionValue` for the timeline and derive each gear's transform from it. Don't re-render the React tree every frame.

## Acceptance criteria

- [ ] **AC1**: Convergence markers match the engine.
  - _Verify (browser):_ on F3 at crank 4, scrub to marker 5. `data-facing-deg` and `data-slot` equal `stateAt(F3, 4, 5)`, and only B shows a sightline.
- [ ] **AC2**: Positions alternate sides.
  - _Verify (browser):_ at marker 2, gear A has `data-slot=4`. At marker 3 it has `data-slot=0`.
- [ ] **AC3**: Rotation reverses on the way out.
  - _Verify (browser):_ sample A's facing at half-phases 1→2→3, i.e. in to convergence 1, out, and in to convergence 2. It moves by +m_in teeth and then −m_out teeth (+135° then −45° for A).
- [ ] **AC4**: Play and pause.
  - _Verify (browser):_ press Play. After 2 s the timeline position has advanced. Pause stops it, and Space toggles playback when the scrubber has focus.
- [ ] **AC5**: Keyboard scrubbing.
  - _Verify (browser):_ with the scrubber focused, Right moves one half-phase, End jumps to marker 8, and each landing on a convergence updates the live region text, e.g. "Convergence 5: 1 dancer sees the victim".
- [ ] **AC6**: Reduced motion.
  - _Verify (browser):_ with `reducedMotion: 'reduce'`, Play steps marker to marker without interpolation. Measure: no intermediate `data-facing-deg` values are observed between markers.
- [ ] **AC7**: The selected convergence persists.
  - _Verify (browser + db):_ stop on marker 5 and reload. The scrubber is at 5, and `gear_attempts.convergence` is `5`.
- [ ] **AC8**: No per-frame React renders.
  - _Verify (browser):_ with React Profiler or a render counter in dev, playing 2 s of animation causes fewer than 5 commits of the solver component. Report the number.
- [ ] **AC9**: Visuals and console.
  - _Verify (browser):_ screenshots in both themes at 1280px and 390px, mid-animation and at a convergence. The console is clean.
- [ ] **AC10**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
