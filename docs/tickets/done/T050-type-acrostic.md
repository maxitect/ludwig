---
id: T050
title: "Puzzle type: acrostic"
milestone: M4
epic: E8
depends_on: [T019]
migrations: true
requires_human: false
spec: ["SPEC §1.2 (S1E1)", "SPEC §2.3", "SPEC §7.4.4 (acrostic)", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T050: Puzzle type: acrostic

## Context

This is the S1E1 hidden-message letter (SPEC §1.2). The hidden message is **derived** from the lines using the puzzle's `acrostic_rule`. It is never stored (SPEC §7.4.4).

## Scope

**In**

- `src/puzzles/acrostic/`, built per `/new-puzzle-type`.
- Tables: `acrostic_puzzles` (`rule` enum `acrostic_rule`), `acrostic_lines`, `acrostic_attempts`.
- A letter or notebook-page presentation of the lines, with a single answer input. Reuse the T049 letter tiles if they fit; don't fork them.
- 5 original puzzles that between them use all three rules.

**Out**

- Highlighting the hidden letters as a hint. Hints are only the framework's check and reveal.

## Acceptance criteria

- [ ] **AC1**: The enum and tables exist, with no message column.
  - _Verify (db):_ `\dT+ acrostic_rule` shows the three values.
  - _Verify (code):_ there is no `message`, `answer` or `solution` column in `tables.ts`. The attempt's `answer` is the only text answer column.
- [ ] **AC2**: `derive.ts` extracts the message for each rule, ignoring punctuation and case.
  - _Verify (unit):_ there is one fixture per rule, including the S1E1-style "I LOVE YOU" first-letter-of-sentence example written as lines.
- [ ] **AC3**: `check` compares normalised answers (case, spaces and punctuation ignored).
  - _Verify (unit)._
- [ ] **AC4**: `puzzles:verify` fails a puzzle whose derived message is empty or under 4 letters.
  - _Verify (cli):_ it passes on the content and fails on a broken copy.
- [ ] **AC5**: The payload contains lines and the rule's display label, but no message.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC6**: Signed in, a solve is recorded.
  - _Verify (browser + db):_ `acrostic_attempts.answer` is set and `completed_at` is set.
- [ ] **AC7**: The solve works keyboard-only.
  - _Verify (browser)._
- [ ] **AC8**: Both themes render at 1280px and 390px.
  - _Verify (browser):_ screenshots.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
