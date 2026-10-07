---
id: T119
title: Guard the gear performance budget in CI and cap generated diagrams to it
milestone: M3
epic: E7
depends_on: [T044, T078]
migrations: false
requires_human: false
spec: ["SPEC §5.2.3", "SPEC §5.2.4", "PLAN §5.3", "docs/tickets/reports/T044.md"]
skills: []
---

# T119: Guard the gear performance budget in CI and cap generated diagrams to it

## Context

T044 measured the gear performance budget once, by hand, on one curated diagram (`final-curtain`, 11 gears): about 16.7 ms per frame and 8 layouts in the 5 s of play. Nobody hand-tunes or hand-checks gear puzzles: the cron generates a daily every day (T078), and the curated set is unedited generator output. Nothing stops a later change to the board or the presets from bringing back per-frame layout. This ticket makes the budget a standing check, and ties the generator to the budget it was measured on.

## Scope

**In**

- **A layout guard in the `preview` e2e check.** Add a Playwright spec (or a test in `e2e/gears.spec.ts`) that opens a gear board at 390×844, presses play, and uses CDP `Performance.getMetrics` to read the growth in `LayoutCount` over the 5 s window that starts 150 ms after the press, as T044 measured it. It fails at 10 or more. Run it on:
  - the curated diagram with the most gears;
  - today's daily, found the way `/gears` finds it.
- **Leave frame timing out of CI.** Shared CI runners are too noisy for frame times. `scripts/dev/gears-perf.mjs` stays the manual frame-time check. Its header should say so, and say when to run it: after any change to `board.tsx`, `scrubber.tsx`, `crank.ts` or `presets.ts`.
- **Cap the generator.** A diagram may have at most 11 gears and only 8- or 16-tooth gears, which is what T044 measured. Put the cap in one constant in `src/puzzles/gears/`, used by:
  - a unit test asserting every preset's `gears.max` and `teeth` are within the cap;
  - `puzzles:verify`, which fails any stored diagram (curated or `gear_daily`) over the cap and names it.
- **Fix the provenance wording.** `docs/tickets/T044-gear-content-e2e-perf.md` says curated diagrams are "generated and then hand-tuned". Change it to "selected from generator seeds and published unedited", which is what T044 shipped. Check SPEC §5.2 for the same claim.

**Out**

- Changing the board, the presets or the budget itself.
- The gear train (T082, T083). When T083 adds its board, it should reuse this guard.
- A Lighthouse pass (T069).

## Notes

- On previews `databaseAvailable` is false. Find today's daily through the page, not through SQL.
- Hover and the press itself cause 2 layouts. That is why the window starts 150 ms after the press (T044 report, AC5).
- The guard must fail for the right reason. Prove it by temporarily reintroducing a per-frame layout, for example animating an SVG `transform` attribute on the board. Record the failing count in the report, then revert.

## Acceptance criteria

- [ ] **AC1**: The layout guard passes on the current board and fails on a per-frame layout.
  - _Verify (browser):_ run the new spec locally against a production build on the mobile project: it passes and prints the layout count for both diagrams. With a temporary per-frame SVG transform it fails, with a count of 10 or more. Report both counts.
- [ ] **AC2**: The guard runs in the `preview` check.
  - _Verify (deploy):_ the PR's `preview` check log shows the new spec passing against the preview URL for both diagrams.
- [ ] **AC3**: The generator and stored diagrams are capped.
  - _Verify (unit + cli):_ the preset unit test passes. A copied curated content file with a 12th gear (not committed) makes `pnpm puzzles:verify` fail and name the file. Without it, `puzzles:verify` passes, including every `gear_daily` row.
- [ ] **AC4**: The provenance wording matches what shipped.
  - _Verify (code):_ `grep -rn "hand-tuned" docs/tickets/T044-gear-content-e2e-perf.md docs/SPEC.md` finds no gear-content claim.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
