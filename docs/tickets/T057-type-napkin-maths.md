---
id: T057
title: "Puzzle type: napkin maths"
milestone: M4
epic: E8
depends_on: [T019]
migrations: true
requires_human: false
spec: ["SPEC §1.2 (S2E5)", "SPEC §2.3", "SPEC §7.4.4 (napkin-maths)", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T057: Puzzle type: napkin maths

## Context

This type is a deduction from partial working scribbled on a napkin (S2E5: "not a code… shorthand"). The player reads the lines and gives a numeric answer. `answer numeric` is **(S)** (SPEC §7.4.4).

## Scope

**In**

- `src/puzzles/napkin-maths/`, built per `/new-puzzle-type`. Tables: `napkin_maths_puzzles` (`question_text`, `answer numeric` **(S)**), `napkin_maths_lines` and `napkin_maths_attempts`.
- A napkin presentation: grid-paper or tissue texture from the existing utilities, with lines in the hand font.
- 5 original puzzles.

**Out**

- Expression evaluation of user input. The answer is a number.

## Notes

- Exact `numeric` comparison: parse the user input with Zod as a decimal string, then compare it as a string-normalised decimal. Don't compare floats.
- Each content file carries the full worked derivation in `meta.workings`, for review only. `puzzles:verify` doesn't evaluate it.

## Acceptance criteria

- [ ] **AC1**: The tables exist, and `answer` is `numeric`.
  - _Verify (db):_ `\d napkin_maths_puzzles`. A wrong-type subtype insert fails.
- [ ] **AC2**: `check` compares decimals exactly: "4", "4.0" and "04" are correct when the answer is 4, while "4.01" and "four" are rejected with a validation error rather than a crash.
  - _Verify (unit)._
- [ ] **AC3**: The payload contains the question and lines, with no answer.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC4**: `puzzles:verify` validates the structure: at least 2 lines, an answer present, and `meta.workings` present.
  - _Verify (cli)._
- [ ] **AC5**: Signed in, a solve is recorded.
  - _Verify (browser + db):_ `napkin_maths_attempts.answer` is set, and `completed_at` is set.
- [ ] **AC6**: The solve works keyboard-only. The numeric input uses `inputmode="decimal"`.
  - _Verify (browser)._
- [ ] **AC7**: Both themes render at 1280px and 390px.
  - _Verify (browser):_ screenshots.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
