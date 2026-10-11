---
id: T147
title: Repair the preview end-to-end suite that main broke
milestone: M5
epic: E10
depends_on: []
migrations: false
requires_human: false
preview: true
spec: []
skills: []
---

# T147: Repair the preview end-to-end suite that main broke

## Context

The Playwright suite runs against each PR preview, and every PR must pass it before merge. The T143 preview run (actions run 38100230660) failed 31 of 395 tests, none caused by T143. The same specs fail against production. The last green preview run was 2026-10-10 08:11. Since then PR #95 ("lock solved puzzles and show solved state in collection") moved Check and Reset out of the solve menu into the inline solver UI, made the header sticky, and changed how solved puzzles lock. The failures are probably specs written against the old UI, but each one must be diagnosed: a real product regression is fixed in the product, a stale spec is fixed in the spec.

## Scope

**In**

- Diagnose and fix every failing spec in the T143 preview run: landing-walls (AC1, AC2, AC4 to AC10 across projects), rota (wrong sequence, keyboard), cipher-mobile, crossword-mobile, cipher-keyboard, book-cipher, pictogram-cipher, wrong-parts (sudoku, futoshiki), a11y axe on pictogram-cipher (mobile), and flow-1 sign-up (mobile).
- Do not weaken a spec to make it pass. Keep what it asserts, and update selectors and flow to the current UI.

**Out**

- New features, and the sign-up helper changes from T143 (`@e2e.test` accounts).

## Notes

- Use `gh run view 38100230660 --log-failed` for the failures and `git log` on #95 for what changed.
- Never run specs that sign up against production.

## Acceptance criteria

- [ ] **AC1**: Every failure listed in Scope is diagnosed as a stale spec or a product regression and fixed accordingly, with the cause noted in the report.
  - _Verify (deploy):_ the E2E workflow on the PR preview is green.
- [ ] **AC2**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
