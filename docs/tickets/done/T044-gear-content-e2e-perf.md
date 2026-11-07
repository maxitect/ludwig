---
id: T044
title: Gear content ×12, end-to-end flow 4, performance budget
milestone: M3
epic: E7
depends_on: [T041, T042, T043]
migrations: false
requires_human: false
spec: ["SPEC §5.2", "SPEC §8.2 (flow 4)", "PLAN §3 (M3 exit criteria)", "PLAN §5.4"]
skills: []
---

# T044: Gear content ×12, end-to-end flow 4, performance budget

## Context

This closes M3: launch content, the Playwright flow and the 60 fps scrubbing budget on a mid-range phone (PLAN §3, M3 exit criteria).

## Scope

**In**

- Twelve curated diagrams in `content/gears/`:
  - at least 3 per difficulty;
  - at least 3 Fix the Diagram variants, including at least one with K=2.

  Each one is hand-designed, or selected from generator seeds and published unedited. `generator_seed` is `NULL` for curated content, and the provenance goes in `meta.source_note`.
- Removing or promoting the dev fixtures from T037–T041.
- `e2e/gears.spec.ts`, implementing SPEC §8.2 flow 4.
- Fixing whatever performance issues the budget AC finds.

**Out**

- Further engine features, such as occlusion.

## Acceptance criteria

- [ ] **AC1**: Content counts.
  - _Verify (db):_ after seeding, report the query output showing that:
    - curated published gear puzzles (`generator_seed IS NULL`) total 12;
    - at least 3 have `max_adjustments > 0`, and at least 1 has `max_adjustments = 2`;
    - each preset tier (easy, medium, hard, expert, recorded in `meta` and mapped to `puzzles.difficulty`) has at least 3 puzzles.
- [ ] **AC2**: Every diagram is unique.
  - _Verify (cli):_ `pnpm puzzles:verify` exits 0. Normal diagrams have one solution. Fix diagrams have zero solutions as printed and exactly one repair.
- [ ] **AC3**: Flow 4 passes.
  - _Verify (cli):_ `pnpm test:e2e e2e/gears.spec.ts` passes. The flow: open a curated puzzle, crank to the solution, scrub to the convergence, accuse, and see the stamp. A second test covers a Fix variant.
- [ ] **AC4**: The 60 fps scrubbing budget on a throttled mid-range profile.
  - _Verify (browser):_ on a 12-gear expert diagram at a 390×844 viewport:
    1. Use `browser_run_code_unsafe` to open a CDP session and send `Emulation.setCPUThrottlingRate { rate: 4 }`.
    2. Inject a `requestAnimationFrame` loop that records frame deltas.
    3. Play the dance for 5 s, and separately drive the scrubber with keyboard repeat for 5 s.

    Pass if the **median frame delta is ≤ 16.7 ms**, **p95 is ≤ 25 ms**, and there are **no long tasks over 50 ms** (`PerformanceObserver` `longtask`). Report all three numbers for both runs.
- [ ] **AC5**: No layout thrash during the animation.
  - _Verify (browser):_ a CDP `Performance.getMetrics` delta over the 5 s play shows `LayoutCount` growing by fewer than 10. Report the value.
- [ ] **AC6**: Grain and texture are cheap.
  - _Verify (code):_ `grep -rn "feTurbulence\|filter=" src/puzzles/gears/` returns no live SVG filters inside the animated board.
- [ ] **AC7**: Visual regression snapshot.
  - _Verify (browser):_ screenshots of the hub and of one expert board at a convergence, in both themes at 1280px and 390px, stored in `.verification/T044/`. The console is clean.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
