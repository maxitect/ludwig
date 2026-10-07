---
id: T138
title: Hide Reveal where it isn't built, and mark the Desk as post-launch
milestone: M5
epic: E10
depends_on: []
migrations: false
requires_human: false
spec: ["SPEC §3", "SPEC §4.5"]
skills: []
---

# T138: Hide Reveal where it isn't built, and mark the Desk as post-launch

## Context

The solve chrome shows a Reveal button on every puzzle, and its confirm dialog ends in "Reveal is not available for this puzzle yet." (`src/components/puzzle/solve-chrome.tsx`). Reveal-all needs a per-type design, and no ticket owns the signed-in Desk (SPEC §3). The user decided (2026-10-07) to hide Reveal for v1 and cut the Desk from v1.

## Scope

**In**

- Remove the Reveal button, its dialog and the `reveal-unavailable` notice from the solve chrome. Per-cell reveal (`revealCell`, e.g. crossword "reveal letter") stays.
- SPEC §4.5: actions are Check and Reset; reveal-all is post-launch. SPEC §3: `/` is the title-sequence landing for everyone in v1, and the Desk is post-launch. Keep whatever signed-in `/` shows today unless SPEC then contradicts it; say what it shows in the report.
- PLAN lists reveal-all and the Desk under M7 or a post-launch note.

**Out**

- Building reveal-all or the Desk.
- The `reveal_all` hint kind enum value, which stays for later.

## Acceptance criteria

- [ ] **AC1**: No solve page shows a whole-puzzle Reveal, and crossword "reveal letter" still works.
  - _Verify (browser):_ open a sudoku and a crossword solve page; no Reveal button; reveal one crossword letter. Screenshots in both themes at 1280px and 390px.
- [ ] **AC2**: The unavailable notice is gone.
  - _Verify (code):_ `grep -rn "reveal-unavailable" src` returns nothing.
- [ ] **AC3**: SPEC and PLAN reflect the v1 scope.
  - _Verify (code):_ SPEC §3 and §4.5 name the Desk and reveal-all as post-launch.
- [ ] **AC4**: The preview matches.
  - _Verify (deploy):_ `vercel curl` on a sudoku solve page on the preview has no "Reveal the answer?" text.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
