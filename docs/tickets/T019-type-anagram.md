---
id: T019
title: "Puzzle type: anagram (pilot)"
milestone: M1
epic: E5
depends_on: [T018]
migrations: true
requires_human: false
spec: ["SPEC §2.3", "SPEC §4.1", "SPEC §4.6", "SPEC §7.4.2", "SPEC §7.4.4 (anagram)", "PLAN §3 M1"]
skills: [/new-puzzle-type, /zod4]
---

# T019: Anagram (pilot type)

## Context

This is the first real puzzle type. It sets the reference pattern every later type copies (PLAN §2.6), so follow `/new-puzzle-type` exactly and keep the code exemplary.

## Scope

**In**

- `src/puzzles/anagram/`: `tables.ts`, `schema.ts`, `load.ts`, `load-solution.ts`, `derive.ts` (tiles from the answer plus `scramble_seed`), `check.ts`, `solver.tsx` and `verify` (the tiles are a permutation of the answer letters, and the scramble differs from the answer).
- Tables per SPEC §7.4.4: `anagram_puzzles` and `anagram_attempts`, using the subtype pattern from SPEC §7.4.2. Register the type in the registry and the `anagram` row in `content/lookups.ts`.
- **Solver:**
  - letter-tile UI using hand-font tiles;
  - tap or type to place letters into answer slots grouped by word lengths (derived);
  - shuffle and clear;
  - the definition hint is shown if present.
- **5 original anagram puzzles** in `content/anagram/`, across difficulties 1–4.

**Out**

- `localStorage` persistence (T020).

## Notes

- This is the first `tables.ts` outside the core schema. Make sure `src/db/schema/index.ts` re-exports it and the relations are registered.

## Acceptance criteria

- [ ] **AC1**: The migration creates `anagram_puzzles` with a generated `type_key` and a composite FK to `puzzles`, and there are no `jsonb` or array columns.
  - _Verify (db):_ `psql "$DATABASE_URL" -c "\d anagram_puzzles"` shows `type_key … generated always as ('anagram'::text) stored` and an FK on `(puzzle_id, type_key)`. Then `select table_name, data_type from information_schema.columns where table_name like 'anagram%' and data_type in ('jsonb','json','ARRAY')` returns 0 rows.
- [ ] **AC2**: The subtype pattern rejects misuse.
  - _Verify (db):_ In `BEGIN; … ROLLBACK;` blocks:
    - inserting `anagram_puzzles` for a puzzle whose `type_key` isn't `anagram` fails with an FK violation;
    - inserting an `anagram` puzzle with no subtype row fails at `COMMIT` with the subtype trigger error;
    - a valid supertype plus subtype pair commits.
- [ ] **AC3**: Seeding loads all 5 puzzles, and `puzzles:verify` passes.
  - _Verify (cli + db):_ `pnpm db:seed && pnpm puzzles:verify` exits 0, and `select count(*) from anagram_puzzles` returns `5`.
- [ ] **AC4**: The play payload contains no answer.
  - _Verify (unit + api):_
    - `src/puzzles/anagram/schema.test.ts` asserts that `payloadSchema.strict()` rejects an object containing `answer`, and that a real `load()` result parses.
    - `curl -s http://localhost:3019/puzzles/anagram/<slug> | grep -ci "<answer>"` prints `0` for each of the 5 slugs.
- [ ] **AC5**: `derive` and `check` are pure and correct.
  - _Verify (unit):_ `derive.test.ts` shows the tiles are the same multiset as the answer letters and are stable for a fixed seed. `check.test.ts` accepts the answer case- and space-insensitively and rejects single-letter swaps.
- [ ] **AC6**: A signed-in player can solve a puzzle in the browser, and the server records completion.
  - _Verify (browser + db):_
    - Sign up `T019-1@test.local`, open an anagram, place the tiles to spell the answer, and press Check. The `SolvedStamp` shows.
    - `select a.completed_at is not null, aa.answer from attempts a join anagram_attempts aa on aa.attempt_id = a.id …` returns `t` and the answer.
- [ ] **AC7**: A wrong answer is rejected, and autosave persists partial progress across reloads.
  - _Verify (browser + db):_ Place a wrong arrangement and press Check; it shows as incorrect. Reload; the partial arrangement is restored, and `anagram_attempts.answer` holds it.
- [ ] **AC8**: The solver works keyboard-only.
  - _Verify (browser):_ Solve one puzzle using only `browser_press_key`: typing letters, Backspace and Enter to check.
- [ ] **AC9**: The solver passes the brand checklist.
  - _Verify (browser):_ Screenshots of an unsolved and a solved puzzle in Paper and Ink at 1280px and 390px, under `.verification/T019/`.
- [ ] **AC10**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
