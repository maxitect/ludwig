---
id: T139
title: Widen the tooth sizes used by daily gear diagrams
milestone: M7
epic: E7
depends_on: [T119, T070]
migrations: false
requires_human: false
spec: ["SPEC §5.2.3"]
skills: []
---

# T139: Widen the tooth sizes used by daily gear diagrams

## Context

Daily gear diagrams use only 8- and 16-tooth gears, which makes them look alike. The user decided (2026-10-07) to widen the choice after launch.

## Scope

**In**

- Let the daily presets draw from the tooth sizes SPEC §5.2.3 allows, within T119's cap (`src/puzzles/gears/limits.ts`). Bump the generator version if output for a given seed changes, so stored dailies stay valid.
- Already-materialised dailies stay as they are; only new dates use the wider set.

**Out**

- Curated content and the cap itself.

## Notes

- `puzzles:verify` re-solves every `gear_daily` row, and the T119 layout guard runs on today's daily, so both must pass with the new sizes.

## Acceptance criteria

- [ ] **AC1**: Generated dailies use more than two tooth sizes and stay unique.
  - _Verify (unit):_ a property test over 100 seeds shows at least three tooth sizes overall and `solveAll(...).length === 1` for each.
- [ ] **AC2**: The perf guard still passes on a new daily.
  - _Verify (browser):_ `e2e/gears-layout.spec.ts` passes against a daily generated with the wider set.
- [ ] **AC3**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
