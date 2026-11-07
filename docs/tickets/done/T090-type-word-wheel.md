---
id: T090
title: "Puzzle type: word wheel"
milestone: M6
epic: E11
depends_on: [T049]
migrations: true
requires_human: false
spec: ["SPEC §2.4 (word-wheel)", "SPEC §7.4.4 (word-wheel, word-ladder)", "SPEC §7.2 (words.txt)", "PLAN §3 M6"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T090: Puzzle type: word wheel

## Context

The Radio Times word wheel gives nine letters with a compulsory centre. The player finds the nine-letter word and as many shorter words as possible (SPEC §2.4). It uses the `words` dictionary and letter tiles that T049 built. Finding the nine-letter word solves the puzzle, and the other words count towards a derived rating.

## Scope

**In**

- **Dictionary:** widen `content/words.txt` from 3–6 letters to 3–9 letters, from the same open-licence source. Keep the source and licence header up to date. Word-ladder content must still verify.
- **`src/puzzles/word-wheel/`**, built per `/new-puzzle-type`. Tables: `word_wheel_puzzles`, `word_wheel_attempts` and `word_wheel_attempt_words`, as in SPEC §7.4.4.
- **`engine.ts`:** the derived wheel (centre plus a seeded rim), `fits(wheel, minLength, word)`, and `validWords(wheel, minLength, dictionary)`, which gives the rating thresholds.
- **`verify`:** the target is nine letters and in `words`; it is the only nine-letter dictionary word the letters make; there are at least 15 valid words.
- **Check and save:** a server action accepts a submitted word when it fits the wheel and is in `words`, then stores it. Completion is set when the target is found. The client never receives the dictionary or the word list.
- **Solver UI:** a circular wheel of letter tiles, the centre emphasised. Type or tap to build a word. The list of found words. The rating (Average, Good, Genius) with counts derived on the server.
- **Content:** 5 original wheels.
- **Preview:** add `src/puzzles/<type>/preview.tsx` (T129) and register it in `src/puzzles/previews.ts`. Typecheck fails until you do.

**Out**

- Excluding plurals and verb forms. SPEC §2.4 accepts whatever the dictionary has.
- A reveal of every valid word. Reveal shows the target only.

## Notes

- A 9-letter dictionary is much larger. Keep T049's batched `INSERT … ON CONFLICT DO NOTHING` seeding, and record the row count and seed time in the report.
- The rating thresholds need `validWords` against the full dictionary. Compute them in `load.ts` with a query, not in the client, and don't store them; they're derived.

## Acceptance criteria

- [ ] **AC1**: The table exists, and `target_word` must be in `words`.
  - _Verify (db):_ an insert with a word not in the dictionary fails on the FK.
- [ ] **AC2**: The dictionary holds 3–9 letter words, and the word-ladder content still verifies.
  - _Verify (db):_ `select max(length(word)) from words` returns 9.
  - _Verify (cli):_ `pnpm puzzles:verify` passes.
- [ ] **AC3**: The engine is correct.
  - _Verify (unit):_ `fits` rejects a word without the centre, a word using a letter more often than the wheel has it, and a word that is too short. `verify` rejects a wheel whose letters make two nine-letter words.
- [ ] **AC4**: The payload carries the centre, the rim and the thresholds, never the target, the centre position or the word list.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC5**: Signed in, found words persist across a reload, a non-word is rejected with a message, and finding the target completes the puzzle.
  - _Verify (browser + db):_ `word_wheel_attempt_words` has rows and `completed_at` is set.
- [ ] **AC6**: The puzzle can be solved by keyboard alone. Both themes render correctly at 1280px and 390px.
  - _Verify (browser):_ screenshots `.verification/T090/ac6-*.png`.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
