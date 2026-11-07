---
id: T054
title: "Puzzle type: pictogram cipher and glyph set"
milestone: M4
epic: E8
depends_on: [T052]
migrations: true
requires_human: false
spec: ["SPEC §1.2 (S2E6)", "SPEC §2.3", "SPEC §7.4.4 (pictogram-cipher)", "SPEC §7.4.1 rule 5 (lookup)", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T054: Puzzle type: pictogram cipher and glyph set

## Context

This is the S2E6 stick-figure substitution cipher (SPEC §1.2: "a stick figure with an eyeball for a head is E"). `pictogram_glyphs` is a lookup table, because each glyph carries an asset and a letter (SPEC §7.4.1). The glyph-to-letter mapping is **(S)**: the client only ever sees glyph asset keys.

## Scope

**In**

- **Glyph set:**
  - 26 original stick-figure SVG glyphs in `public/glyphs/` (or as inline React SVG components), drawn in ink line style;
  - the "E" glyph is the eyeball-headed figure;
  - `pictogram_glyphs` is seeded from `content/lookups.ts`.
- **`src/puzzles/pictogram-cipher/`**, built per `/new-puzzle-type`. Tables: `pictogram_cipher_puzzles`, `pictogram_cipher_symbols`, `pictogram_cipher_given_glyphs`, `pictogram_cipher_attempts` and `pictogram_cipher_attempt_guesses`.
- **A solver** reusing the T052 cipher-key panel, with glyphs in place of cipher letters. Given glyphs are pre-filled and locked.
- **Content:** 5 original puzzles.

**Out**

- Per-puzzle alphabets. There is one global alphabet in v1.

## Notes

- Glyph asset filenames must not encode the letter (no `e.svg`). Use neutral keys such as `glyph-07`, so the network panel doesn't leak answers.

## Acceptance criteria

- [ ] **AC1**: `pictogram_glyphs` holds 26 rows with unique `asset_key` and unique `letter`.
  - _Verify (db):_ `select count(*), count(distinct letter), count(distinct asset_key) from pictogram_glyphs` returns 26, 26, 26. A duplicate letter insert fails.
- [ ] **AC2**: Asset keys and filenames don't reveal letters.
  - _Verify (code):_ `ls public/glyphs` (or the component names) shows no single-letter names.
  - _Verify (browser):_ the network requests list contains no letter-named glyph files.
- [ ] **AC3**: The payload contains glyph asset keys and the given glyphs' letters only. The full mapping is absent.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (api):_ fetching the solve page HTML and grepping it for the mapping of a non-given glyph finds nothing.
- [ ] **AC4**: The plaintext is derived from the symbols and glyph letters, and `check` normalises it.
  - _Verify (unit):_ `derive.test.ts` and `check.test.ts`.
- [ ] **AC5**: `puzzles:verify` requires every non-given glyph used in the puzzle to be inferable. The plaintext is at least 20 letters and uses at least 8 distinct glyphs.
  - _Verify (cli):_ it passes on the content and fails on a broken copy.
- [ ] **AC6**: Signed in, guesses persist and completion is recorded.
  - _Verify (browser + db):_ guess 3 glyphs, reload; `pictogram_cipher_attempt_guesses` has 3 rows. Solving sets `completed_at`.
- [ ] **AC7**: The solve works keyboard-only, and glyphs have neutral accessible labels ("Symbol 7") that don't reveal letters.
  - _Verify (browser):_ `browser_snapshot`.
- [ ] **AC8**: Both themes render at 1280px and 390px, and the glyphs read clearly in both.
  - _Verify (browser):_ screenshots.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
