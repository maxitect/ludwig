---
id: T040
title: Accuse flow and server check
milestone: M3
epic: E7
depends_on: [T039]
migrations: false
requires_human: false
spec: ["SPEC §5.2.4 (Accuse)", "SPEC §4.2", "SPEC §4.5"]
skills: []
---

# T040: Accuse flow and server check

## Context

The player commits to a crank, a convergence and a killer. The server checks `(c, f, g)` against `gear_solutions` using the shared `checkAnswer` action (SPEC §4.2).

## Scope

**In**

- An "Accuse" control. It is enabled only when the scrubber sits on a convergence. The player picks a gear (click or keyboard) and confirms in a dialog.
- `src/puzzles/gears/check.ts`:
  - correct iff `crank mod L`, `convergence` and `killerId` equal the solution;
  - it returns only `{ correct }`.
- Saving `gear_attempts.accused_gear_id`.
- The completion stamp and time (SPEC §4.5).

**Out**

- Fix the Diagram (T041).

## Acceptance criteria

- [ ] **AC1**: Hand-computed check results.
  - _Verify (unit):_ `check.test.ts` with the solution `{crank:4, convergence:5, killer:B}`:
    - `(4, 5, B)` is correct;
    - `(52, 5, B)` is correct (mod L);
    - `(4, 5, A)`, `(4, 4, B)` and `(5, 5, B)` are all incorrect.
- [ ] **AC2**: A correct accusation solves the puzzle.
  - _Verify (browser + db):_ signed in as `T040-1`, on a dev puzzle whose stored solution is `(4, 5, B)`:
    1. Set crank 4, scrub to 5, Accuse, pick B and confirm.
    2. The "Solved." stamp appears.
    3. `attempts.completed_at` is set, and `gear_attempts.accused_gear_id` is B's id.
- [ ] **AC3**: A wrong accusation leaks nothing.
  - _Verify (browser):_ accusing A shows a "not quite" state.
  - _Verify (api):_ `browser_network_requests` shows the action response contains only `correct:false`, with no solution fields.
- [ ] **AC4**: Accuse is disabled off a convergence.
  - _Verify (browser):_ at half-phase 2 (between convergences) the Accuse button is disabled, with an accessible description that explains why.
- [ ] **AC5**: The server rejects malformed answers.
  - _Verify (unit):_ calling `checkAnswer` with `convergence: 9`, or with a gear id from another puzzle, throws a Zod or validation error and records nothing. Prove that with a DB count before and after.
- [ ] **AC6**: Keyboard-only accusation.
  - _Verify (browser):_ Accuse, gear selection (arrow keys cycle the gears) and confirm all work by keyboard alone.
- [ ] **AC7**: Visuals and console.
  - _Verify (browser):_ screenshots of the confirm dialog and the solved state in both themes at 1280px and 390px. The console is clean.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
