---
id: T002
title: GitHub Actions CI pipeline
milestone: M0
epic: E1
depends_on: [T001]
migrations: false
requires_human: false
spec: ["PLAN §5.1", "PLAN §5.2", "PLAN §5.3"]
skills: []
---

# T002: GitHub Actions CI pipeline

## Context

CI runs the PLAN §5.3 gates on every PR. Deploys are handled by Vercel's git integration (T009), so CI doesn't deploy.

## Scope

**In**

- `.github/workflows/ci.yml`. It triggers on `pull_request` and on `push` to `main`. A single job runs on `ubuntu-latest` with:
  - a `postgres:17` service container (user, password and database `ludwig`, with a health check);
  - pnpm setup matching `packageManager`, and Node LTS with pnpm cache;
  - `pnpm install --frozen-lockfile`;
  - steps in this order: `typecheck`, `lint`, `db:migrate`, `test`, `puzzles:verify`, `build`.
- Job-level env:
  - `DATABASE_URL` and `DATABASE_URL_UNPOOLED` pointing at the service;
  - a dummy 32+ character `BETTER_AUTH_SECRET`;
  - `BETTER_AUTH_URL=http://localhost:3000`.
- `concurrency`, so superseded runs on the same ref are cancelled.

**Out**

- Playwright against preview deploys (added in T024).
- Vercel and Neon setup (T009).

## Notes

- `db:migrate` and `puzzles:verify` are stubs until T003 and T016. The workflow must call them anyway, so those tickets only need to swap the script body.
- If no GitHub remote is configured, mark AC4–AC5 as `BLOCKED` and ask the orchestrator for a remote. Don't create a repository.

## Acceptance criteria

- [ ] **AC1**: The workflow file is valid.
  - _Verify (cli):_ `pnpm dlx @action-validator/cli .github/workflows/ci.yml`, or `actionlint` if it's installed, exits 0.
- [ ] **AC2**: The workflow runs the gate steps in the order given in Scope.
  - _Verify (code):_ `grep -nE "pnpm (typecheck|lint|db:migrate|test|puzzles:verify|build)" .github/workflows/ci.yml` lists them in that order.
- [ ] **AC3**: Postgres in CI is a `postgres:17` service with a health check, and `DATABASE_URL` points at it.
  - _Verify (code):_ `grep -n "postgres:17\|pg_isready\|DATABASE_URL" .github/workflows/ci.yml` shows all three.
- [ ] **AC4**: The workflow passes on the pushed ticket branch.
  - _Verify (cli):_ `git push -u origin ticket/T002-ci-pipeline`, then `gh run watch --exit-status $(gh run list --branch ticket/T002-ci-pipeline --limit 1 --json databaseId -q '.[0].databaseId')` exits 0.
- [ ] **AC5**: A failing gate fails CI.
  - _Verify (cli):_ push a throwaway commit containing `const x: number = "a"` in `src/ci-probe.ts`, and confirm `gh run watch --exit-status` exits non-zero at the `typecheck` step. Then revert the commit (`git revert`) and confirm the next run is green.
- [ ] **AC6**: Gates pass locally.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
