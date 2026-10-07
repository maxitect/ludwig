---
id: T133
title: Enforce reverse_chess_puzzles.ply_count for every mode with a trigger
milestone: M4
epic: E6
depends_on: [T081]
migrations: true
requires_human: false
spec: ["SPEC §5.1", "SPEC §7.4.5"]
skills: ["/db-trigger"]
---

# T133: Enforce reverse_chess_puzzles.ply_count for every mode with a trigger

## Context

`reverse_chess_puzzles.ply_count` is redundant for Mode A and Unwind goals: it equals the number of authored solution plies. Only Proof Games have a trigger (T081, derived from the fullmove number). The database rules (`.claude/rules/database.md`) allow stored redundancy only when a trigger or FK keeps it consistent. The user decided (2026-10-07) to add the trigger.

## Scope

**In**

- A deferred constraint trigger that requires `ply_count` to equal the count of the puzzle's solution plies, for every puzzle that is not a Proof Game. It fires on the puzzle row and on solution-ply inserts, updates and deletes, so a change on either side is checked at commit. Mode A must have exactly one ply.
- SPEC §7.4.5 documents it beside the Proof Game rule.
- DB-integrity tests in the T005 harness: a mismatched count fails at commit on both the puzzle side and the ply side; a matching one passes.

**Out**

- Removing the column. Proof Games and the hub still read it.

## Notes

- Read T081's trigger and report first, and keep both triggers in one function only if that stays readable.
- The seed writes the puzzle row and plies in one transaction, so a deferred trigger passes for valid content. Run `pnpm db:seed` and `puzzles:verify` to prove every existing content file satisfies it.

## Acceptance criteria

- [ ] **AC1**: A mismatched `ply_count` fails at commit, from either side.
  - _Verify (db):_ in a psql transaction, change a Mode B puzzle's `ply_count` and `COMMIT`; expect an error naming the trigger. Repeat by deleting one of its solution plies.
- [ ] **AC2**: Existing content seeds.
  - _Verify (cli):_ `pnpm db:seed` exits 0 and `pnpm puzzles:verify` passes.
- [ ] **AC3**: Integrity tests cover it.
  - _Verify (unit):_ the new tests pass in `pnpm test`.
- [ ] **AC4**: The migration and seed run on the PR's preview.
  - _Verify (deploy):_ the preview build is Ready, and Neon MCP `run_sql` on `preview/<branch>` lists the trigger.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
