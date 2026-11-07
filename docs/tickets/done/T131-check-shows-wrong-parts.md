---
id: T131
title: A failed check names the wrong parts, in the shared contract and the UI
milestone: M5
epic: E10
depends_on: [T048, T100]
migrations: false
requires_human: false
spec: ["SPEC §4.1", "SPEC §4.5", "SPEC §7.4.4 (sudoku, futoshiki, logic-grid)"]
skills: ["/zod4"]
---

# T131: A failed check names the wrong parts, in the shared contract and the UI

## Context

Sudoku and futoshiki `check` already return `cellsWrong` (cells that break a rule, never a solution diff), and the logic grid (T048) returns `wrongPairs` (category pairs whose marks contradict the solution). SPEC §4.1 says the shared contract is `{ correct }` only, and the UI ignores both fields. The user decided (2026-10-07) that this feedback joins the contract and is shown to the player.

## Scope

**In**

- **Contract.** An optional field on the registry `check` result and the `checkAnswer` action result that names the wrong parts. Derive its type from each type's schema; don't hand-write a union. Choose one name and shape that covers cells (sudoku, futoshiki) and logic-grid pairs, and rename the existing fields to it.
- **UI.** After a failed full check, `SolveChrome` passes the wrong parts to the solver, and the solver highlights them until the player next edits. The highlight uses tokens only, and colour is never the only signal (a mark or pattern plus an accessible name, e.g. "R3C4, breaks a rule"). An `aria-live` line says how many parts are wrong.
- Sudoku, futoshiki and logic grid show the highlight.
- **SPEC §4.1, §4.5 and the three §7.4.4 entries** describe the field and the rule that it never reveals solution facts the player couldn't see by checking rules (sudoku, futoshiki) or never goes beyond the pairs the player has marked (logic grid).

**Out**

- Other types. Each new type opts in when it has wrong parts worth naming (T059 sightlines will).
- Showing wrong parts to signed-out players differently. Signed-out checks return the same result.

## Notes

- A check that returns wrong parts must still record nothing extra in `attempt_hints`: it is a full check, not a cell hint.
- Review each payload-leak test: the new field must be computed from the player's answer, and for the logic grid only for pairs the player marked.

## Acceptance criteria

- [ ] **AC1**: The shared result type carries the optional field, and sudoku, futoshiki and logic grid return it under the one name.
  - _Verify (code + unit):_ `grep -rn "cellsWrong\|wrongPairs" src` returns nothing, and each type's `check.test.ts` asserts the field on a wrong answer.
- [ ] **AC2**: A wrong sudoku, futoshiki and logic-grid answer highlights the wrong parts, and the highlight clears on the next edit.
  - _Verify (browser):_ for each type, fill a wrong answer, press Check, and screenshot the highlight in Paper and Ink at 1280px and 390px; type in one cell and expect the highlight gone.
- [ ] **AC3**: The feedback is accessible.
  - _Verify (browser):_ `browser_snapshot` shows the live count line and each highlighted cell's accessible name includes the wrong-part label.
- [ ] **AC4**: The feedback never leaks the solution.
  - _Verify (unit):_ the leak tests show the logic-grid field lists only marked pairs, and the sudoku/futoshiki field lists only rule breaks.
- [ ] **AC5**: The behaviour holds on the PR's preview.
  - _Verify (deploy):_ a share-link session on the preview shows the highlight after a wrong sudoku check.
- [ ] **AC6**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
