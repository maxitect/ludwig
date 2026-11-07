---
id: T151
title: Even grid lines on the word-search grid
milestone: M5
epic: E8
depends_on: [T125]
migrations: false
requires_human: false
preview: false
spec: ["SPEC §6"]
skills: []
---

# T151: Even grid lines on the word-search grid

## Context

`src/puzzles/_shared/highlight-path/highlight-path-grid.tsx` draws per-cell borders on `1fr` tracks, so its lines come out uneven. T125 fixed this for `CellGrid`, but T128 left the word search as it was.

## Scope

**In**

- Move the grid to `snappedCell` from `cell-grid.tsx`, with single-draw lines as in T125.

**Out**

- Selection behaviour and any other solver change.

## Acceptance criteria

- [ ] **AC1**: Every grid line renders at one width, at 1280px and 390px, in both themes.
  - _Verify (browser):_ screenshots of a word search, plus measured track sizes differing by at most 1px.
- [ ] **AC2**: Selecting a word still works with mouse and touch.
  - _Verify (browser):_ the existing word-search e2e specs pass on desktop and mobile.
- [ ] **AC3**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
