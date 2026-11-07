---
id: T024
title: Playwright end-to-end flows 1 and 2
milestone: M1
epic: E4
depends_on: [T002, T009, T020, T022, T023]
migrations: false
requires_human: false
spec: ["SPEC §8.2", "PLAN §3 M1", "PLAN §5.2"]
skills: []
---

# T024: End-to-end flows 1 and 2

## Context

This closes M1 (PLAN §3 M1 exit criteria) by encoding SPEC §8.2 flows 1 and 2 as committed Playwright tests that run locally and against the Vercel preview URL.

## Scope

**In**

- **`e2e/flow-1-signup-solve-casebook.spec.ts`:** sign up, solve a quick crossword, and see it in the Casebook (SPEC §8.2, flow 1).
- **`e2e/flow-2-signed-out-merge.spec.ts`:** play signed out (complete one anagram, partially do a crossword), sign up, and confirm both are in the Casebook and the attempts. The partial crossword resumes with its letters (SPEC §8.2, flow 2).
- **Test helpers:**
  - unique emails per run;
  - answers read from `content/` files at test time, never hard-coded.
- **Playwright config:**
  - `baseURL` comes from `PLAYWRIGHT_BASE_URL`, falling back to the local dev server;
  - traces are kept on failure;
  - Chromium desktop and mobile (390px) projects.
- The CI job from T002 runs these against the preview URL, once that job exists, or locally against `pnpm dev`. Leave a TODO in the report if the preview wiring has to wait for T009.

**Out**

- Flows 3–5 (T032, T044, T046).

## Notes

- Flow 2's "partial resume" is asserted by cell contents after a reload. Don't use screenshots for it.

## Acceptance criteria

- [ ] **AC1**: Flow 1 passes on both projects against the local dev server.
  - _Verify (cli):_ `PLAYWRIGHT_BASE_URL=http://localhost:3024 pnpm test:e2e e2e/flow-1-signup-solve-casebook.spec.ts` exits 0 with 2 passed (desktop and mobile).
- [ ] **AC2**: Flow 2 passes on both projects against the local dev server.
  - _Verify (cli):_ `PLAYWRIGHT_BASE_URL=http://localhost:3024 pnpm test:e2e e2e/flow-2-signed-out-merge.spec.ts` exits 0 with 2 passed.
- [ ] **AC3**: The flows leave the expected rows behind (the test's own database assertions are independently confirmed).
  - _Verify (db):_ After AC1 and AC2, `psql "$DATABASE_URL" -c "select u.email, p.type_key, a.completed_at is not null from attempts a join puzzles p on p.id = a.puzzle_id join \"user\" u on u.id = a.user_id where u.email like 'e2e-%' order by 1, 2"` shows the expected attempts for each flow's users.
- [ ] **AC4**: The tests fail if the feature breaks, so they aren't vacuous.
  - _Verify (cli):_ Temporarily make `mergeLocalProgress` a no-op. Flow 2 fails with a clear assertion. Revert, and it passes again.
- [ ] **AC5**: The tests don't hard-code answers or depend on the order of seeded data.
  - _Verify (code):_ `grep -nE "['\"][A-Z]{4,}['\"]" e2e/*.spec.ts` shows no answer literals, and the helpers read from `content/`.
- [ ] **AC6**: Failure artefacts are captured.
  - _Verify (cli):_ In the AC4 failing run, a trace zip is produced under `test-results/`.
- [ ] **AC7**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
