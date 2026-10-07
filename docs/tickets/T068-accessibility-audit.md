---
id: T068
title: Accessibility audit (axe and screen reader)
milestone: M5
epic: E10
depends_on: [T045, T046, T047, T048, T049, T050, T051, T052, T053, T054, T055, T056, T057, T058, T059, T060, T061, T062, T063, T064, T112, T113, T114, T115, T116, T117, T120, T121, T122, T123, T124, T125, T126, T127, T128, T129, T130, T131, T134, T135, T136, T137, T138]
migrations: false
requires_human: true
spec: ["SPEC §8.2", "SPEC §8.3", "SPEC §6.6", "PLAN §3 M5"]
skills: []
---

# T068: Accessibility audit (axe and screen reader)

## Context

This is the M5 accessibility gate (PLAN §3 M5). Every route type must pass automated checks, and each solver group (PLAN §3 M4 table) needs a keyboard and screen-reader pass.

## Scope

**In**

- Add `@axe-core/playwright`, plus a spec `e2e/a11y.spec.ts` that visits one URL per route type:
  - `/`, `/sign-in`, `/sign-up`, `/puzzles`, `/puzzles/[type]`;
  - one solve page per puzzle type;
  - `/reverse-chess`, `/gears`, `/this-week`, `/casebook`, `/settings`.

  It runs in both themes and checks the WCAG 2.1 AA tags.
- Fix every serious or critical violation found.
- A manual keyboard pass, recorded in the report, for one solver per group: cell grids (sudoku), word (word ladder), cipher (caesar), logic text (knights and knaves), spatial (CCTV maze), visual (spot the difference), case (rota), plus the Reverse Chess Mode A and Gears flagships.
- A VoiceOver pass on a real iPhone in solve mode (T113–T116): the crossword with the on-screen pad, and the same crossword with "Use my device's keyboard" on. Record in the report whether each can be solved, and fix any blocker.

**Out**

- Performance (T069).
- New features.

## Notes

- Use Playwright MCP's `browser_snapshot` (the accessibility tree) as the screen-reader proxy. Record the role and name for each interactive control.

## Acceptance criteria

- [ ] **AC1**: Zero serious or critical axe violations on every route type, in both themes.
  - _Verify (cli):_ `pnpm test:e2e e2e/a11y.spec.ts` passes. The report lists the route count and shows `0 serious, 0 critical` per route.
- [ ] **AC2**: Every solver in the keyboard list can be solved with the keyboard only.
  - _Verify (browser):_ For each listed solver, complete the puzzle using only `browser_press_key`/`browser_type` (no clicks). Record the key sequence and final "Solved." snapshot in the report.
- [ ] **AC3**: Focus is always visible, using the `grid-blue` ring.
  - _Verify (browser):_ Tab through each listed solver. Screenshots show a visible focus indicator on every stop, with no focus traps outside dialogs.
- [ ] **AC4**: Every interactive control has an accessible name.
  - _Verify (browser):_ `browser_snapshot` on each listed solver shows no unnamed `button`, `textbox`, `slider` or `gridcell`.
- [ ] **AC5**: The gear state table and chess board expose their state as text.
  - _Verify (browser):_ The snapshots of `/gears/[slug]` (state table toggled on) and of a Reverse Chess puzzle include each gear's facing and "sees victim", and the piece-square labels.
- [ ] **AC6**: Colour is never the only signal (SPEC §6.6).
  - _Verify (browser):_ Screenshots with `browser_emulate_media` `forcedColors: 'active'` of gears, crossword check and logic grid show that states are still distinguishable.
- [ ] **AC7**: The axe spec runs in CI.
  - _Verify (code):_ `.github/workflows/*.yml` includes the a11y spec in the preview end-to-end job.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
