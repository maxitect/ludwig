---
id: T055
title: "Puzzle type: knights and knaves"
milestone: M4
epic: E8
depends_on: [T019]
migrations: true
requires_human: false
spec: ["SPEC §1.2 (S2E1)", "SPEC §2.3", "SPEC §7.4.4 (knights-knaves)", "PLAN §3 M4 (Logic text group)", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T055: Puzzle type: knights and knaves

## Context

This is the truth-teller and liar puzzle from S2E1 (SPEC §1.2). It is the first "Logic text" type (PLAN §3 M4) and builds the shared **statement list with toggles** that T056 and T057 may reuse. Each character's role is **(S)**.

## Scope

**In**

- `src/puzzles/knights-knaves/`, built per `/new-puzzle-type`. Tables: `knights_knaves_puzzles`, `knights_knaves_characters` (`role` enum `kk_role`, **(S)**), `knights_knaves_statements`, `knights_knaves_attempts` and `knights_knaves_attempt_roles`.
- `engine.ts`: statements are encoded for the solver as typed predicates **in the content file only**, as `contentSchema` data that is never stored. The solver brute-forces 2ⁿ role assignments to prove uniqueness.
- The shared statement-list component in `src/puzzles/_shared/`.
- 5 original puzzles with 2–5 characters.

**Out**

- Storing predicates in the DB. Statement text is all the player needs, and `check` compares against the stored roles. If the predicate data feels like it belongs in the DB, raise it as a SPEC question; don't add tables.

## Acceptance criteria

- [ ] **AC1**: The tables exist with `kk_role`. Statements key on `(puzzle_id, character_position, position)`, with an FK to the character.
  - _Verify (db):_ a statement for a non-existent character position fails, and a valid statement passes.
- [ ] **AC2**: The solver proves exactly one consistent assignment for each content file.
  - _Verify (unit):_ fixtures for a unique puzzle, an ambiguous one and a contradictory one.
  - _Verify (cli):_ `puzzles:verify` passes on the 5 files.
- [ ] **AC3**: The payload contains names and statements, but no roles.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC4**: `check` requires every role to be correct, and reports the count of wrong roles without naming which ones.
  - _Verify (unit)._
- [ ] **AC5**: Signed in, toggles persist and completion is recorded.
  - _Verify (browser + db):_ `knights_knaves_attempt_roles` has rows, and `completed_at` is set.
- [ ] **AC6**: The role toggles are keyboard-operable and announce their state.
  - _Verify (browser):_ `browser_snapshot`.
- [ ] **AC7**: Both themes render at 1280px and 390px.
  - _Verify (browser):_ screenshots.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
