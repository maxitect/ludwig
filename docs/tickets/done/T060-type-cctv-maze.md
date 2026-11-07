---
id: T060
title: "Puzzle type: CCTV maze"
milestone: M4
epic: E8
depends_on: [T058, T021]
migrations: true
requires_human: false
spec: ["SPEC §1.2 (S2E3 Labyrinthos)", "SPEC §2.3", "SPEC §7.4.4 (cctv-maze)", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T060: Puzzle type: CCTV maze

## Context

This is the S2E3 maze overlaid with camera sightlines (SPEC §1.2). The player must reach the exit without ever entering a camera's view. The path is **derived** and checked, never stored. Uniqueness means exactly one shortest unseen path. It uses `visibility.ts` from T058.

## Scope

**In**

- `src/puzzles/cctv-maze/`, built per `/new-puzzle-type`. Tables:
  - `cctv_maze_puzzles` (with start and exit cells);
  - `cctv_maze_walls` (enum `wall_side` 'north' and 'west'; the outer boundary is implicit);
  - `cctv_maze_cameras` (with `range_cells` CHECK ≥ 1);
  - `cctv_maze_attempts` and `cctv_maze_attempt_steps`.
- **`engine.ts`**: a breadth-first search over unseen cells that counts shortest paths, up to 2.
- **The board**: a Cambridge street-plan feel with walls in ink. Camera cones are hidden by default, with a "reveal cameras" toggle that counts as a hint and inserts an `attempt_hints` row.
- **The path** is built step by step, with the arrow keys or by tapping adjacent cells.
- **Content:** 5 original mazes.

**Out**

- Moving cameras or time steps.

## Acceptance criteria

- [ ] **AC1**: The tables, enum and checks exist. Walls key on `(puzzle_id, row, col, side)`.
  - _Verify (db):_ a duplicate wall insert fails, and `range_cells = 0` fails.
- [ ] **AC2**: Wall semantics derive the east and south walls from their neighbours.
  - _Verify (unit):_ a `derive.test.ts` fixture.
- [ ] **AC3**: `puzzles:verify` requires that the start and exit are unseen and that exactly one shortest unseen path exists.
  - _Verify (unit):_ engine fixtures for a unique maze, a maze with two equal shortest paths, and an unsolvable maze.
  - _Verify (cli):_ it passes on 5 files.
- [ ] **AC4**: `check` accepts any path from start to exit that is contiguous, wall-respecting and never seen, not only the shortest one. It reports the first invalid step.
  - _Verify (unit)._
- [ ] **AC5**: The payload contains walls and cameras, with no path.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC6**: Signed in, path steps persist, revealing the cameras records a hint, and completion is recorded.
  - _Verify (browser + db):_ `cctv_maze_attempt_steps` has rows, `attempt_hints` has a row after the reveal, and `completed_at` is set.
- [ ] **AC7**: The maze is fully playable with the arrow keys.
  - _Verify (browser)._
- [ ] **AC8**: Both themes render at 1280px and 390px.
  - _Verify (browser):_ screenshots, with cameras revealed and hidden.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
