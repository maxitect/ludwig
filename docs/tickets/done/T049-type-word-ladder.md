---
id: T049
title: "Puzzle type: word ladder and the words dictionary"
milestone: M4
epic: E8
depends_on: [T019]
migrations: true
requires_human: false
spec: ["SPEC §2.3", "SPEC §7.4.4 (word-ladder, uniqueness exception)", "PLAN §3 M4", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T049: Puzzle type: word ladder and the words dictionary

## Context

A word ladder changes one letter per rung between a start word and an end word. It is the **only** exception to the exactly-one-solution rule: any valid ladder with `rung_count` rungs made of dictionary words is accepted (SPEC §7.4.4). It is the first "Word" group type (PLAN §3 M4) and builds the letter-tile pieces that T050 and T051 reuse.

## Scope

**In**

- **The `words` lookup table**, seeded from `content/words.txt` (SPEC §7.2):
  - lowercase a–z only;
  - an open-licence word list with its source and licence recorded in a header comment of the seed script;
  - 3–6 letter words.
- **`src/puzzles/word-ladder/`**, built per `/new-puzzle-type`:
  - `word_ladder_puzzles` (with FKs from start and end to `words`), `word_ladder_solution_rungs` **(S)**, `word_ladder_attempts` and `word_ladder_attempt_rungs`;
  - a CHECK that `rung_count` is ≥ 1.
- **Shared Word-group pieces** in `src/puzzles/_shared/`: letter tiles and a rung input.
- **Content:** 5 original ladders.

**Out**

- Shortest-path uniqueness. It is explicitly not required.

## Notes

- Seed `words` in batches, with a single `INSERT … ON CONFLICT DO NOTHING` per batch. The dictionary may hold tens of thousands of rows.
- Checking is done server-side against `words`, so the client never needs the dictionary. A rung typed in the client is validated when the ladder is checked, not on every keystroke.

## Acceptance criteria

- [ ] **AC1**: `words` is seeded, and the puzzle FKs reject non-dictionary words.
  - _Verify (db):_ `select count(*) from words` is greater than 5000.
  - _Verify (db):_ inserting a `word_ladder_puzzles` row with `start_word='zzzq'` fails on the FK.
- [ ] **AC2**: The subtype pattern and the `rung_count` CHECK hold.
  - _Verify (db):_ a wrong-type subtype insert fails, and `rung_count = 0` fails.
- [ ] **AC3**: `check` accepts **any** valid ladder of the right length, including one that differs from the reference ladder. It rejects:
  - a two-letter change;
  - a non-word;
  - the wrong rung count;
  - an endpoint mismatch.
  - _Verify (unit):_ `check.test.ts`, where the dictionary lookup is injected as a pure predicate.
- [ ] **AC4**: `puzzles:verify` validates each reference ladder instead of checking uniqueness, and fails a content file whose reference ladder is invalid.
  - _Verify (cli):_ `pnpm puzzles:verify` passes. A temporarily broken copy fails; revert it afterwards.
- [ ] **AC5**: The payload contains no reference rungs.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC6**: Signed in, a solve that uses a different valid ladder from the reference is accepted and recorded.
  - _Verify (browser + db):_ `word_ladder_attempt_rungs` holds the user's words, and `completed_at` is set.
- [ ] **AC7**: The solver is keyboard-operable and shows invalid rungs only after Check, with a non-colour cue.
  - _Verify (browser)._
- [ ] **AC8**: Both themes render at 1280px and 390px.
  - _Verify (browser):_ screenshots.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
