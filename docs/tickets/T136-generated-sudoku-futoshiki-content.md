---
id: T136
title: Generated sudoku and futoshiki at difficulties 3 and 4
milestone: M5
epic: E8
depends_on: [T100]
migrations: false
requires_human: false
spec: ["SPEC §4.6", "docs/research/generators.md"]
skills: []
---

# T136: Generated sudoku and futoshiki at difficulties 3 and 4

## Context

T100's regrade left the hand-written sudoku weighted to difficulty 2 (cold-case, locked-room and dead-end all moved to 2). The user accepted the regrade (2026-10-07) on the basis that generated puzzles fill the gap. The three puzzles the grader can't solve (sudoku back-room, futoshiki tall-order and fine-margins) stay published at 5 (user, 2026-10-07).

## Scope

**In**

- With `pnpm puzzles:gen`, generate and commit 3 sudoku at difficulty 3 and 3 at difficulty 4, and 2 futoshiki at each of difficulties 3 and 4. Choose seeds whose output looks varied, give each an original title and slug that gives nothing away, and publish them.
- Add some of them to `content/weekly.ts` if it has slots left before 2026-12-28.

**Out**

- Generator or grader changes. If a tier yields badly, record it and stop.

## Acceptance criteria

- [ ] **AC1**: The new files exist with provenance and verify.
  - _Verify (cli):_ `pnpm puzzles:verify` passes and lists the new files as regenerated and matched.
- [ ] **AC2**: Each sudoku and futoshiki difficulty from 2 to 4 has at least 2 published puzzles.
  - _Verify (db):_ `select type_key, difficulty, count(*) from puzzles where type_key in ('sudoku','futoshiki') and published_at is not null group by 1,2` shows it.
- [ ] **AC3**: The preview seeds them.
  - _Verify (deploy):_ the preview build is Ready and `vercel curl` on two new solve pages returns 200.
- [ ] **AC4**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
