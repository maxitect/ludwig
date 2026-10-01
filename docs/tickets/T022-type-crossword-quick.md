---
id: T022
title: "Puzzle type: crossword (quick style)"
milestone: M1
epic: E5
depends_on: [T019, T021]
migrations: true
requires_human: false
spec: ["SPEC §2.3", "SPEC §4.1", "SPEC §7.4.4 (crossword)", "SPEC §7.4.5", "PLAN §3 M1"]
skills: [/new-puzzle-type, /db-trigger, /zod4]
---

# T022: Crossword (quick style)

## Context

This is the second type. It forces child tables, derived clue numbers, the `CellInput` grid (T021) and the first per-type fill trigger for controlled redundancy (SPEC §7.4.5). It ships only the `quick` style; cryptic content follows in T045 on the same tables.

## Scope

**In**

- `src/puzzles/crossword/`:
  - `tables.ts`: `crossword_puzzles`, `crossword_cells`, `crossword_clues`, `crossword_clue_segments`, `crossword_attempts` and `crossword_attempt_cells`, per SPEC §7.4.4.
  - `schema.ts`, `load.ts`, `load-solution.ts` and `check.ts`.
  - `derive.ts`:
    - clue numbering;
    - answer extraction from the cells;
    - enumerations from the segments;
    - the word map for `CellGrid`.
  - `solver.tsx`: the grid plus across and down clue lists, with the active clue highlighted.
  - `verify`, which checks:
    - every white run of length 2 or more has exactly one clue, and every clue starts a run;
    - the segment lengths sum to the run length;
    - the grid is connected.
- **Controlled redundancy:** `crossword_attempt_cells.puzzle_id` gets a composite FK to `attempts (id, puzzle_id)` plus the FK to `crossword_cells`, and a `BEFORE INSERT` fill trigger. Add the row to SPEC §7.4.5 if it isn't already listed.
- **Per-cell check and reveal** through T017's actions, which record `attempt_hints`.
- **5 original quick crosswords** (11×11) in `content/crossword/`, with `style: "quick"`.

**Out**

- The cryptic style and its content (T045).
- Shared grid behaviour (T021).

## Notes

- Clue numbers are derived (SPEC §7.4.4). Don't add a `number` column.
- Blocks are the absence of a `crossword_cells` row. Don't add an `is_block` column.

## Acceptance criteria

- [ ] **AC1**: The schema follows SPEC §7.4.4: no `number` or `is_block` columns, and no `jsonb` or arrays.
  - _Verify (db):_ `select column_name from information_schema.columns where table_name like 'crossword%' and column_name in ('number','is_block','answer')` returns 0 rows. The `jsonb`/`json`/`ARRAY` check from T019 AC1, run over `crossword%`, also returns 0 rows.
- [ ] **AC2**: The fill trigger populates `crossword_attempt_cells.puzzle_id`, and the composite FKs reject cross-puzzle rows.
  - _Verify (db):_
    - Insert a `crossword_attempt_cells` row without `puzzle_id`; it is filled with the attempt's puzzle.
    - In a rollback block, insert a row whose `(row, col)` exists only in another puzzle; it fails with an FK violation.
- [ ] **AC3**: The subtype pattern rejects a wrong-type subtype row and a missing subtype row.
  - _Verify (db):_ The same two negative tests as T019 AC2, run against `crossword_puzzles`.
- [ ] **AC4**: All 5 puzzles seed, and `puzzles:verify` passes. A broken grid fails verification.
  - _Verify (cli):_
    - `pnpm db:seed && pnpm puzzles:verify` exits 0, and `select count(*) from crossword_puzzles where style = 'quick'` returns `5`.
    - Temporarily remove one clue from a content file; `pnpm puzzles:verify` exits 1 and names the run.
- [ ] **AC5**: Derived numbering and enumerations are correct.
  - _Verify (unit):_ `derive.test.ts` runs against a hand-numbered 5×5 fixture, matching numbers, answers and "(4,3)"-style enumerations.
- [ ] **AC6**: The payload contains no letters.
  - _Verify (unit + api):_ `payloadSchema.strict()` rejects a cell with `letter`. `curl -s …/puzzles/crossword/<slug>` contains none of that puzzle's answer words (grep each word and get 0 matches).
- [ ] **AC7**: A signed-in player can solve a crossword in the browser, with per-cell check and reveal recorded as hints.
  - _Verify (browser + db):_
    - Sign up `T022-1@test.local`, fill in one grid (reading the answers from the content file), use Check cell once and Reveal cell once, then Check the whole grid. The `SolvedStamp` appears.
    - `select kind, count(*) from attempt_hints … group by kind` returns `check_cell = 1` and `reveal_cell = 1`.
    - The attempt's `completed_at` is set.
- [ ] **AC8**: Clicking a clue focuses its first cell and highlights its run. Typing follows the clue's direction.
  - _Verify (browser):_ Click a down clue, then type 3 letters; they fill downwards. The snapshot shows the highlighted cells.
- [ ] **AC9**: The crossword passes the brand checklist.
  - _Verify (browser):_ Screenshots of an in-progress and a solved grid in Paper and Ink at 1280px and 390px (with the clue list stacked under the grid on mobile), under `.verification/T022/`. There is no horizontal scroll at 390px.
- [ ] **AC10**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
