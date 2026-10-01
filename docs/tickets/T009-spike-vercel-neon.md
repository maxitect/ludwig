---
id: T009
title: "Spike S3: Vercel + Neon deployment"
milestone: M0
epic: E1
depends_on: [T005, T008]
migrations: false
requires_human: true
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

It needs account actions only the user can take.

## Scope

**In (repo side, done by the implementer)**

- `vercel.json`:
  - `regions: ["lhr1"]`;
  - `buildCommand: "pnpm db:migrate && pnpm build"`.
- `src/lib/auth.ts`:
  - `baseURL` from `env.BETTER_AUTH_URL`, falling back to `https://${VERCEL_URL}` when `VERCEL_ENV === "preview"`;
  - `trustedOrigins` includes the production domain env value and `https://${process.env.VERCEL_URL}`.
- `src/env.ts`: `BETTER_AUTH_URL` is optional when `VERCEL_ENV === "preview"`.
- README "Deployment" section: 10 lines at most, pointing to SPEC §7.7.

**Human steps** (the orchestrator pauses and asks the user to do these, in order):

1. Create a Vercel project from the GitHub repo (framework: Next.js) on the Hobby plan.
2. In Vercel, go to Storage, then Marketplace, then Neon. Create a database in region **AWS eu-west-2 (London)**, connect it to the project for all environments, and enable **"Create database branch for each preview deployment"**.
3. Confirm the integration injected `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct). If the unpooled name differs, tell the implementer, who aliases it in `src/env.ts`.
4. Add the env vars:
   - `BETTER_AUTH_SECRET`: different random 32+ byte values for Production and for Preview;
   - `BETTER_AUTH_URL`: Production only, set to the production URL.
5. Push `main` (or merge this ticket's PR) and share the production URL. Open a PR from this branch and share the preview URL.

**Out**

- Custom domain and launch (T070).
- Playwright against previews (T024).

## Notes

- Never run migrations or seed against Neon from a local machine. The Vercel build runs `db:migrate` (INSTRUCTIONS §3).
- Get preview verification URLs from the Vercel bot comment on the PR, or from `gh pr view --json comments`.

## Acceptance criteria

- [ ] **AC1**: The repo config matches SPEC §7.7.
  - _Verify (code):_ `cat vercel.json` shows `lhr1` and `pnpm db:migrate && pnpm build`. `grep -n "trustedOrigins\|VERCEL_URL" src/lib/auth.ts` shows the preview origin handling.
- [ ] **AC2**: The production deploy builds with migrations applied.
  - _Verify (cli):_ `vercel inspect <prod-url> --logs`, or the Vercel UI build log the user shares, shows `db:migrate` succeeding before `next build`.
- [ ] **AC3**: Sign-up and sign-in work on production.
  - _Verify (api):_ `curl -i -H 'content-type: application/json' -d '{"email":"t009-1@test.local","password":"correct-horse-battery","name":"T"}' <prod-url>/api/auth/sign-up/email` returns 200 with `Set-Cookie`. `/api/auth/get-session` with that cookie returns the user.
- [ ] **AC4**: A preview deploy gets its own Neon branch.
  - _Verify (api):_ sign up `t009-2@test.local` on the **preview** URL, which returns 200. Signing in to **production** as `t009-2@test.local` returns 401, which proves the databases are separate.
- [ ] **AC5**: Sign-in works on the preview URL without setting `BETTER_AUTH_URL` there.
  - _Verify (browser):_ on `<preview-url>/sign-in`, sign in as `t009-2@test.local`. The user slot shows the email, and the console has no CORS or origin errors.
- [ ] **AC6**: The proxy works in production.
  - _Verify (api):_ `curl -sI <prod-url>/casebook` returns 307 to `/sign-in?next=%2Fcasebook`.
- [ ] **AC7**: The region and pooling are correct.
  - _Verify (cli):_ the response header `x-vercel-id` from the prod URL contains `lhr1`. The user confirms the Neon project region is eu-west-2, and that `DATABASE_URL` contains `-pooler`. Record the user's confirmation in the report.
- [ ] **AC8**: Test users are cleaned up.
  - _Verify (api):_ delete `t009-*` users through the Neon SQL editor (the user runs this) or through Better Auth admin deletion. Report the method used.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
