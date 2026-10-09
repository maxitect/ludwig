---
id: T059
title: "Puzzle type: sightlines"
milestone: M4
epic: E8
depends_on: [T058, T021]
migrations: true
requires_human: false
spec: ["SPEC §1.2 (S1E3)", "SPEC §2.3", "SPEC §7.4.4 (sightlines)", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T059: Puzzle type: sightlines

## Context

This is the S1E3 "perceptual puzzle" (SPEC §1.2): who could see the alcove past the pillars? The player marks the blind-spot cells. The blind spots are **derived** with `visibility.ts` (T058), never stored.

## Scope

**In**

- `src/puzzles/sightlines/`, built per `/new-puzzle-type`. Tables: `sightlines_puzzles` (rows, cols, target cell), `sightlines_obstacles`, `sightlines_observers` (`facing compass8`, `fov_deg` with a CHECK of 1–360), `sightlines_attempts` and `sightlines_attempt_marks`.
- **The question in v1** is "mark every floor cell that **no** observer can see".
- `derive.ts` computes the blind-spot set via `visibility.ts`.
- **The board** is a stone-floor grid showing pillars, observers drawn with facing wedges, and the target. Marked cells use red hand-drawn hatching.
- **Content:** 5 original puzzles.

**Out**

- A "which observer saw the target" variant, unless it falls out trivially. Don't add schema for it.

## Notes

- The `target` columns describe the cell the story centres on. The answer is still the blind-spot set. Make sure `puzzles:verify` requires the target to be a blind spot in every puzzle, so the narrative holds: "nobody could see the alcove".

## Acceptance criteria

- [ ] **AC1**: The tables, the `compass8` enum, the `fov_deg` CHECK and the subtype FK exist.
  - _Verify (db):_ `fov_deg = 0` fails, a wrong-type subtype insert fails, and an observer on an obstacle cell is caught by `puzzles:verify` rather than the DB.
- [ ] **AC2**: Blind spots are derived, and nothing is stored.
  - _Verify (code):_ there is no blind/visible column.
  - _Verify (unit):_ `derive.test.ts` has 2 hand-computed fixtures.
- [ ] **AC3**: `puzzles:verify` requires a non-empty blind-spot set that includes the target, and no observers or obstacles out of bounds.
  - _Verify (cli):_ it passes on the content and fails on a broken copy.
- [ ] **AC4**: The payload contains the layout only.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC5**: `check` requires the marked set to equal the derived set, and computes `cellsWrong`, covering both missing and extra cells. The count stays server-side: the result `checkPuzzleAnswer` returns to the browser is `{ correct }` only.
  - _Verify (unit)._
- [ ] **AC6**: Signed in, marks persist and completion is recorded.
  - _Verify (browser + db):_ `sightlines_attempt_marks` has rows, and `completed_at` is set.
- [ ] **AC7**: Cells are keyboard-markable, and each cell's accessible name includes its contents (pillar, observer facing NE, and so on).
  - _Verify (browser):_ `browser_snapshot`.
- [ ] **AC8**: Both themes render at 1280px and 390px.
  - _Verify (browser):_ screenshots.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
