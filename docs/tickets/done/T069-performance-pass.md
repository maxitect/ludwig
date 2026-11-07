---
id: T069
title: Performance pass (Lighthouse targets)
milestone: M5
epic: E10
depends_on: [T045, T046, T047, T048, T049, T050, T051, T052, T053, T054, T055, T056, T057, T058, T059, T060, T061, T062, T063, T064, T066, T067, T113, T114, T115, T116, T120, T121, T122, T123, T124, T125, T126, T127, T128, T129, T130, T131, T134, T135, T136, T137, T138]
migrations: false
requires_human: false
spec: ["SPEC §8.3", "SPEC §6.1", "SPEC §6.3", "PLAN §3 M5"]
skills: []
---

# T069: Performance pass (Lighthouse targets)

## Context

This ticket meets the Lighthouse targets in SPEC §8.3 and the texture budget in SPEC §6.3 on a production build.

## Scope

**In**

- Measure and fix: font subsetting and `display` strategy, grain PNG size, image sizing, unused JavaScript on solve pages, lazy-loading heavy solvers (gears, chess), and the effectiveness of `use cache` on payload loads.
- A `scripts/lighthouse.ts`, or an npm script, that runs Lighthouse CLI against a local production server for a fixed URL list, and writes JSON to `.verification/T069/`.
- Measure the solve pages in solve mode (T113) at 390×844 with the touch emulation, so the scores reflect the phone layout with the on-screen keyboard.

**Out**

- Infrastructure changes (Neon plan, regions).
- Visual redesign.

## Notes

- Run against `pnpm build && pnpm start --port 3069`, never `pnpm dev`.
- Use the mobile form factor with Lighthouse's default throttling.

## Acceptance criteria

- [ ] **AC1**: The grain texture is under 40 KB.
  - _Verify (cli):_ `stat -f%z public/textures/grain.png` (or the actual path) is less than 40960.
- [ ] **AC2**: Every solve page scores Performance ≥ 90.
  - _Verify (cli):_ `pnpm build && pnpm start --port 3069 &`, then `npx lighthouse http://localhost:3069/puzzles/<type>/<slug> --only-categories=performance,accessibility --output=json --output-path=.verification/T069/<type>.json --chrome-flags="--headless"` for one puzzle per type. Every `categories.performance.score` is ≥ 0.90.
- [ ] **AC3**: Every audited page scores Accessibility ≥ 95.
  - _Verify (cli):_ Use the same runs as AC2, plus `/`, `/puzzles`, `/reverse-chess` and `/gears`. Every `categories.accessibility.score` is ≥ 0.95.
- [ ] **AC4**: The landing page and hubs score Performance ≥ 90.
  - _Verify (cli):_ Lighthouse JSON for `/`, `/reverse-chess` and `/gears` shows a performance score ≥ 0.90.
- [ ] **AC5**: There are no live SVG filters in animated elements.
  - _Verify (code):_ `grep -rn "feTurbulence\|filter: url(" src/` matches only the grain-generation script, if anything.
- [ ] **AC6**: The gear scrubber holds 60 fps on a throttled CPU.
  - _Verify (browser):_ With CPU throttling at 4× through `browser_run_code_unsafe` (CDP `Emulation.setCPUThrottlingRate`), scrub the timeline for 5s and measure with a `requestAnimationFrame` counter. The average is ≥ 55 fps.
- [ ] **AC7**: The Lighthouse script is reproducible.
  - _Verify (cli):_ `pnpm perf:lighthouse` (the new script) regenerates every JSON file from AC2–AC4 and exits non-zero if any target is missed.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
