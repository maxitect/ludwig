---
id: T042
title: Accessible gear state table
milestone: M3
epic: E7
depends_on: [T039]
migrations: false
requires_human: false
spec: ["SPEC §5.2.4 (Accessibility)", "SPEC §6.3", "SPEC §8.3"]
skills: []
---

# T042: Accessible gear state table

## Context

The gear puzzle must be fully solvable without seeing the SVG. A toggleable textual state table mirrors the board (SPEC §5.2.4).

## Scope

**In**

- A "Show as table" toggle beside the board. The table is a real `<table>` with a caption, and one row per gear:
  - label;
  - teeth;
  - spin direction ("with driver" or "against driver");
  - current slot;
  - facing in degrees;
  - "sees victim: yes/no".
- The table updates with the crank and scrubber, from the same engine state.
- The toggle state persists in `localStorage`.

**Out**

- Changes to the engine or the board.

## Acceptance criteria

- [ ] **AC1**: The table matches the engine.
  - _Verify (browser):_ on F3 at crank 4, marker 2, the table rows read:
    - A: 8 teeth, with driver, slot 5, 45°, yes;
    - B: 12 teeth, against driver, slot 6, 90°, yes;
    - C: 16 teeth, with driver, slot 7, 202.5°, no.
  - Slots step by S/2+1 per figure (SPEC §5.2.4), matching `engine.test.ts` AC4.
- [ ] **AC2**: The table updates live.
  - _Verify (browser):_ scrub to marker 5. Only A's row says "yes" (`engine.test.ts` AC5).
- [ ] **AC3**: The puzzle can be solved with the table alone.
  - _Verify (browser):_ with the SVG hidden (`aria-hidden` plus `display:none`, via `browser_evaluate`), solve the dev puzzle using only the crank keys, the scrubber keys, the table and Accuse. The stamp appears.
- [ ] **AC4**: Semantics.
  - _Verify (browser):_ the snapshot shows a `table` role with a caption and column headers. The "sees" column uses text rather than colour alone.
- [ ] **AC5**: The toggle persists.
  - _Verify (browser):_ enable the table and reload. It stays enabled.
- [ ] **AC6**: Visuals and console.
  - _Verify (browser):_ screenshots in both themes at 1280px and 390px. At 390px the table scrolls inside its own container, not the page. The console is clean.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
