---
id: T079
title: Confirm before the seed removes a puzzle that has attempts
milestone: M1
epic: E4
depends_on: [T073]
migrations: false
requires_human: false
spec: ["SPEC §4.6"]
skills: []
---

# T079: Confirm before the seed removes a puzzle that has attempts

## Context

Deleting a content file makes `db:seed` remove the puzzle, and `attempts.puzzle_id` cascades, so players' saved attempts go with it. User decision (2026-10-04): that is acceptable, but only after an explicit confirmation. The seed is a CLI that also runs non-interactively in the Vercel build and CI, so the "modal" is an interactive prompt locally and a required flag elsewhere.

## Scope

**In**

- Before removing puzzles whose files are gone, `db:seed` counts their attempts. Puzzles with no attempts are removed as today.
- If any have attempts:
  - In an interactive terminal (TTY), list each `<type>/<slug>` with its attempt count and ask for confirmation (`y/N`). On no, leave those puzzles in place and exit non-zero.
  - Non-interactive (no TTY, e.g. Vercel build and CI): fail with an error naming the puzzles and counts, unless `SEED_CONFIRM_REMOVE` lists them (comma-separated `<type>/<slug>`, or `all`). Nothing is removed on failure.
- SPEC §4.6 updated in the same PR (the "Puzzles whose file is gone are removed" sentence).

**Out**

- Soft-deleting or archiving attempts.
- Any end-user UI.

## Acceptance criteria

- [ ] **AC1**: A removed file with no attempts is removed silently.
  - _Verify (unit):_ seed test.
- [ ] **AC2**: A removed file with attempts fails non-interactively and changes nothing.
  - _Verify (cli + db):_ create an attempt on a local puzzle, move its content file away, run `pnpm db:seed < /dev/null`; it exits non-zero naming `<type>/<slug>` and the count, and the puzzle and attempt rows still exist.
- [ ] **AC3**: Confirming removes it.
  - _Verify (cli + db):_ `SEED_CONFIRM_REMOVE=<type>/<slug> pnpm db:seed` exits 0 and the puzzle and its attempts are gone; the interactive prompt path is covered by a unit test with a stubbed prompt.
- [ ] **AC4**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
