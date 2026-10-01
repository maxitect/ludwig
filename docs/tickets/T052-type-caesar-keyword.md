---
id: T052
title: "Puzzle types: caesar and keyword (shared cipher-key panel)"
milestone: M4
epic: E8
depends_on: [T019]
migrations: true
requires_human: false
spec: ["SPEC §2.3 (Cipher)", "SPEC §7.4.4 (caesar, keyword)", "PLAN §3 M4 (Cipher group)", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T052: Puzzle types: caesar and keyword (shared cipher-key panel)

## Context

This is the first ticket in the Cipher group ("James's Notebooks"). It builds two types, plus the **cipher-key panel** and substitution input in `src/puzzles/_shared/`, which T053 and T054 reuse (PLAN §3 M4). The ciphertext is derived from the plaintext and the key. The plaintext and key are **(S)**.

## Scope

**In**

- `src/puzzles/caesar/` and `src/puzzles/keyword/`, each built per `/new-puzzle-type`.
  - `caesar_puzzles` has `shift CHECK 1–25`.
  - Each type has its own `<type>_attempts.answer`.
- The shared cipher-key panel: an A–Z row where the player assigns guessed letters, and the ciphertext live-updates with their guesses. Panel guesses are client-only working state. Only the final `answer` is persisted, per SPEC §7.4.4.
- A "James's Notebooks" category grouping, with notebook-styled presentation using the existing design tokens.
- 5 original puzzles for each type.

**Out**

- Book and pictogram ciphers (T053, T054).

## Notes

- Keyword alphabet rule: write the keyword's letters once each, in order, then the rest of the alphabet in order. Implement it once in `derive.ts`, with fixtures.

## Acceptance criteria

- [ ] **AC1**: Both subtype tables exist, with no ciphertext columns, and the shift CHECK works.
  - _Verify (db):_ `shift = 26` fails, a wrong-type insert fails, and a valid insert passes.
  - _Verify (code):_ there is no `ciphertext` column.
- [ ] **AC2**: Encipherment is correct.
  - _Verify (unit):_ caesar fixtures (shift 3: "ATTACK" → "DWWDFN", with wrap-around) and keyword fixtures (keyword "LUDWIG"). Non-letters pass through unchanged.
- [ ] **AC3**: The payload contains the ciphertext only. The plaintext, shift and keyword are absent.
  - _Verify (unit):_ the payload leak test passes for both types.
- [ ] **AC4**: `check` normalises case, spacing and punctuation.
  - _Verify (unit)._
  - _Verify (cli):_ `puzzles:verify` passes. Each plaintext is at least 20 letters, and each keyword has no non-letters.
- [ ] **AC5**: The cipher-key panel is a reusable component in `src/puzzles/_shared/`, used by both solvers.
  - _Verify (code):_ `grep -rn "CipherKeyPanel" src/puzzles` shows the shared definition plus 2 usages.
- [ ] **AC6**: Signed in, solving both types records completion.
  - _Verify (browser + db):_ `caesar_attempts.answer` and `keyword_attempts.answer` are set, and both `completed_at` values are set.
- [ ] **AC7**: The panel is keyboard-operable, with an accessible name per letter slot.
  - _Verify (browser)._
- [ ] **AC8**: Both themes render at 1280px and 390px.
  - _Verify (browser):_ screenshots for each type.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
