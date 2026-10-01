---
id: T051
title: "Puzzle type: word search (\"The Fob-Off\")"
milestone: M4
epic: E8
depends_on: [T021]
migrations: true
requires_human: false
spec: ["SPEC §1.2 (S2E3)", "SPEC §2.3", "SPEC §7.4.4 (word-search)", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T051: Puzzle type: word search ("The Fob-Off")

## Context

The word search is the deliberately jokey filler type (SPEC §1.2, S2E3), labelled "The Fob-Off" in the UI. Word placements are **derived** by searching the grid, not stored (SPEC §7.4.4). It builds the highlight-path selection that is shared across the Word group.

## Scope

**In**

- `src/puzzles/word-search/`, built per `/new-puzzle-type`.
- Tables: `word_search_puzzles`, `word_search_cells`, `word_search_words`, `word_search_attempts` and `word_search_attempt_found`.
- `derive.ts`: find each word's placement in all 8 compass directions.
- A highlight-path selection component in `src/puzzles/_shared/`: drag, or keyboard start and end. Found words are drawn as red pencil strokes.
- A category display name of "The Fob-Off", with the S2E3 quote on the category page.
- 5 original puzzles.

**Out**

- A word-search generator.

## Acceptance criteria

- [ ] **AC1**: The tables exist, there is no placement column, and the cell PK is `(puzzle_id, row, col)`.
  - _Verify (db):_ `\d word_search_cells`.
  - _Verify (code):_ there is no start, direction or placement column in `tables.ts`.
- [ ] **AC2**: `derive` finds every word in all 8 directions, and reports words found 0 times or more than once.
  - _Verify (unit):_ fixtures with one word per direction, a missing word and a duplicated word.
- [ ] **AC3**: `puzzles:verify` requires each listed word to appear exactly once and the grid to be full.
  - _Verify (cli):_ it passes on the content and fails on a broken copy.
- [ ] **AC4**: The payload contains cells and the word list, with no placements.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC5**: A selection is accepted only if it matches a word's derived placement, in either direction. Found words persist.
  - _Verify (browser + db):_ find 3 words, then reload; `word_search_attempt_found` has 3 rows. Finding all of them sets `completed_at`.
- [ ] **AC6**: Selection works by keyboard: move with the arrows, Enter marks the start, arrows extend, and Enter confirms.
  - _Verify (browser)._
- [ ] **AC7**: The category label reads "The Fob-Off".
  - _Verify (browser):_ on `/puzzles` and `/puzzles/word-search`.
- [ ] **AC8**: Both themes render at 1280px and 390px, and touch-drag selection works at 390px.
  - _Verify (browser):_ screenshots, plus a drag using `browser_drag` at 390px.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
