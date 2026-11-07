---
id: T045
title: "Crossword: cryptic style and content"
milestone: M4
epic: E8
depends_on: [T022]
migrations: false
requires_human: false
spec: ["SPEC §2.3", "SPEC §4.5", "SPEC §7.4.4 (crossword)", "PLAN §3 M4", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T045: Crossword: cryptic style and content

## Context

T022 built the `crossword` type with the `quick` style. This ticket enables the `cryptic` style, which has 13×13 or 15×15 grids and multi-word enumerations, and adds launch content. The tables are unchanged (SPEC §7.4.4). This is the first type in the PLAN §3 M4 "Cell grids" group, so the clue list, the multi-segment enumeration display and grid sizing must work at 15×15.

## Scope

**In**

- `style = 'cryptic'` support through `load.ts`, `derive.ts`, `check.ts` and `solver.tsx`. That includes multi-segment enumerations shown as "(4,3)" or "(5-4)", derived from `crossword_clue_segments`.
- A Cryptic shelf on `/puzzles/crossword` (a style filter), alongside Quick.
- 3 original cryptic puzzles in `content/crossword/` (PLAN §5.4). There must be no Guardian clues.

**Out**

- New tables or columns. If you think one is needed, stop and report it.
- Annotated or explained solutions (not in the spec).

## Notes

- The hyphen versus comma separator in an enumeration is not in the schema. If segments need a separator, raise it as a SPEC deviation instead of encoding it in text.
- At 390px a 15×15 grid must stay usable. The clue list goes into a sheet or tabs below the grid.

## Acceptance criteria

- [ ] **AC1**: Three cryptic crosswords are seeded, each 13×13 or 15×15.
  - _Verify (db):_ `psql "$DATABASE_URL" -c "select p.slug, c.style, c.rows, c.cols from puzzles p join crossword_puzzles c on c.puzzle_id=p.id where c.style='cryptic'"` returns 3 rows with rows=cols ∈ {13, 15}.
- [ ] **AC2**: Clue numbers and enumerations are derived, not stored.
  - _Verify (unit):_ `src/puzzles/crossword/derive.test.ts` includes a 15×15 fixture asserting the numbering and a multi-segment enumeration such as "(4,3)".
  - _Verify (code):_ `grep -n "number\|enumeration" src/puzzles/crossword/tables.ts` shows no such column.
- [ ] **AC3**: Each cryptic grid's clues cover every white cell run of length ≥ 2, and every clue's segment lengths sum to its run length.
  - _Verify (cli):_ `pnpm puzzles:verify` passes. A deliberately broken copy of one content file (one segment length changed) fails with a message naming the clue. Revert the copy afterwards.
- [ ] **AC4**: The play payload contains no letters.
  - _Verify (unit):_ the payload leak test for crossword runs against a cryptic fixture loaded through `load.ts` and passes.
- [ ] **AC5**: Signed in, solving a cryptic in the browser records progress and completion.
  - _Verify (browser):_ Open `/puzzles/crossword/<slug>`, type several letters, reload, and confirm the letters persist. Fill the grid using the content file's solution, press Check and see the Solved stamp.
  - _Verify (db):_ `select count(*) from crossword_attempt_cells cac join attempts a on a.id=cac.attempt_id where a.puzzle_id='<id>'` > 0, and `attempts.completed_at` is not null.
- [ ] **AC6**: The category page separates the Cryptic and Quick shelves.
  - _Verify (browser):_ `/puzzles/crossword` shows both shelves, and each lists only its own style.
- [ ] **AC7**: The grid and clue list are fully keyboard-operable at 15×15: arrows move, Tab cycles clues, typing advances, Backspace retreats.
  - _Verify (browser):_ complete five answers using the keyboard only.
- [ ] **AC8**: The layout is correct in both themes at 1280px and 390px, with no horizontal page scroll at 390px.
  - _Verify (browser):_ screenshots `.verification/T045/ac8-{paper,ink}-{1280,390}.png`, plus `document.documentElement.scrollWidth <= 390` through `browser_evaluate`.
- [ ] **AC9**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
