---
id: T056
title: "Puzzle type: odd one out"
milestone: M4
epic: E8
depends_on: [T019]
migrations: true
requires_human: false
spec: ["SPEC §2.3", "SPEC §7.4.4 (odd-one-out)", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T056: Puzzle type: odd one out

## Context

Choose the odd item from 4 or 5 (SPEC §2.3, from the Radio Times special). The solution, which is the item position plus an explanation, lives in `odd_one_out_solutions` **(S)**, with a composite FK to the items (SPEC §7.4.4).

## Scope

**In**

- `src/puzzles/odd-one-out/`, built per `/new-puzzle-type`. Tables: `odd_one_out_puzzles`, `odd_one_out_items`, `odd_one_out_solutions` (FK `(puzzle_id, item_position)` → items) and `odd_one_out_attempts`.
- After a correct solve, the explanation is shown. It is fetched from the server only once the attempt is complete.
- 5 original puzzles.

**Out**

- Image items. Labels are text in v1.

## Notes

- Uniqueness here can't be machine-proven. `puzzles:verify` checks structure only (one solution row, item count 4–5, explanation present). Each content file carries a `reviewNote` in `meta` that justifies why the other items are not odd.

## Acceptance criteria

- [ ] **AC1**: The solution FK prevents pointing at a non-existent item.
  - _Verify (db):_ a solution with `item_position = 9` fails, and a valid one passes.
- [ ] **AC2**: `puzzles:verify` enforces 4–5 items, exactly one solution row, a non-empty explanation and a `reviewNote`.
  - _Verify (cli):_ it passes on the content and fails on a broken copy.
- [ ] **AC3**: The payload contains the items but no solution or explanation. The explanation is returned only after completion.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (browser):_ before solving, the page HTML lacks the explanation text; after solving, it appears.
- [ ] **AC4**: `check` is correct.
  - _Verify (unit)._
- [ ] **AC5**: Signed in, a solve is recorded.
  - _Verify (browser + db):_ `odd_one_out_attempts.item_position` is set, and `completed_at` is set.
- [ ] **AC6**: The items act as a radio group, fully keyboard-operable.
  - _Verify (browser)._
- [ ] **AC7**: Both themes render at 1280px and 390px.
  - _Verify (browser):_ screenshots.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
