---
id: T009
title: "Spike S3: Vercel + Neon deployment"
milestone: M0
epic: E1
depends_on: [T005, T008]
migrations: false
requires_human: false
spec: ["SPEC §7.5", "SPEC §7.7", "PLAN §3 M0 S3", "PLAN §5.1"]
skills: []
---

# T009: Spike S3, Vercel + Neon deployment

## Context

This proves the production topology from SPEC §7.7:

- Vercel with Fluid compute;
- Neon through the Marketplace;
- one Neon branch per preview;
- migrations run in the build;
- sign-in working on preview URLs.

The account-side setup was done by the user on 2026-10-01 (see **Already done** below), so this ticket runs without pausing.

## Scope

**In (repo side, done by the implementer)**

- `vercel.json`:
  - `regions: ["lhr1"]`;
  - `buildCommand: "pnpm db:migrate && pnpm db:seed && pnpm build"`. Until T016 lands, `db:seed` is the T001 stub, which exits 0.
- `src/lib/auth.ts`:
  - `baseURL` from `env.BETTER_AUTH_URL`, falling back to `https://${VERCEL_URL}` when `VERCEL_ENV === "preview"`;
  - `trustedOrigins` includes the production domain env value and `https://${process.env.VERCEL_URL}`.
- `src/env.ts`: `BETTER_AUTH_URL` is optional when `VERCEL_ENV === "preview"`.
- README "Deployment" section: 10 lines at most, pointing to SPEC §7.7.

**Already done (user, 2026-10-01):**

- The Vercel project is connected to `maxitect/ludwig` on the Hobby plan.
- The Neon integration is in London (eu-west-2), connected to Production and Preview (not Development), with a database branch per preview.
- `BETTER_AUTH_SECRET` is set for Production and Preview. `BETTER_AUTH_URL` is set for Production.
- The functions region is `lhr1`.
- Neon Auth is disabled.

**Getting URLs without the user:**

- Open a PR from this ticket's branch with `gh pr create`. Get the preview URL from `gh api repos/maxitect/ludwig/deployments?ref=<branch>`, using the latest deployment's statuses `environment_url`, or from the Vercel bot comment (`gh pr view --json comments`).
- Get the production URL from the same API with `environment=Production`.

**Out**

- Custom domain and launch (T070).
- Playwright against previews (T024).

## Notes

- Never run migrations or seed against Neon from a local machine. The Vercel build runs them (INSTRUCTIONS §3).
- **No writes to the production database from this ticket.** Sign-ups happen only on the preview, whose Neon branch is deleted with the PR branch. That is why no cleanup step is needed.
- Get preview verification URLs from the Vercel bot comment on the PR, or from `gh pr view --json comments`.

## Acceptance criteria

- [ ] **AC1**: The repo config matches SPEC §7.7.
  - _Verify (code):_ `cat vercel.json` shows `lhr1` and `pnpm db:migrate && pnpm db:seed && pnpm build`. `grep -n "trustedOrigins\|VERCEL_URL" src/lib/auth.ts` shows the preview origin handling.
- [ ] **AC2**: The production deploy builds with migrations applied.
  - _Verify (cli):_ `vercel inspect <prod-url> --logs`, shows `db:migrate` succeeding before `next build`.
- [ ] **AC3**: Auth is live on production and reaches the database.
  - _Verify (api):_ `curl -i <prod-url>/api/auth/get-session` returns 200 with a `null` session. `curl -i -H 'content-type: application/json' -d '{"email":"nobody-t009@test.local","password":"wrong-password-123"}' <prod-url>/api/auth/sign-in/email` returns 401. The 401 proves the user lookup ran against the database.
- [ ] **AC4**: A preview deploy gets its own Neon branch.
  - _Verify (api):_ sign up `t009-2@test.local` on the **preview** URL, which returns 200. Signing in to **production** as `t009-2@test.local` returns 401, which proves the databases are separate.
- [ ] **AC5**: Sign-in works on the preview URL without setting `BETTER_AUTH_URL` there.
  - _Verify (browser):_ on `<preview-url>/sign-in`, sign in as `t009-2@test.local`. The user slot shows the email, and the console has no CORS or origin errors.
- [ ] **AC6**: The proxy works in production.
  - _Verify (api):_ `curl -sI <prod-url>/casebook` returns 307 to `/sign-in?next=%2Fcasebook`.
- [ ] **AC7**: The region and pooling are correct.
  - _Verify (api):_ the `x-vercel-id` response header from the prod URL contains `lhr1`. Record the user's 2026-10-01 confirmation (eu-west-2, pooled `DATABASE_URL`) in the report.
- [ ] **AC8**: No test data was written to production.
  - _Verify (api):_ `curl -i -H 'content-type: application/json' -d '{"email":"t009-2@test.local","password":"correct-horse-battery"}' <prod-url>/api/auth/sign-in/email` returns 401. The preview user does not exist in production.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
