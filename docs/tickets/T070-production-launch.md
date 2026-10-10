---
id: T070
title: Production launch on the Vercel domain
milestone: M5
epic: E10
depends_on: [T068, T069, T143, T144, T146]
migrations: false
requires_human: false
spec: ["SPEC §7.5", "SPEC §7.7", "SPEC §8", "PLAN §3 M5"]
skills: []
---

# T070: Production launch on the Vercel domain

## Context

The final launch (PLAN §3 M5). There's no human step:

- Production is the project's `*.vercel.app` URL. A custom domain can be added later by the user.
- The env vars are already set (T009).
- Production is migrated and seeded by the Vercel build (SPEC §7.7).
- Merging to `main` deploys to production.

## Scope

**In (implementer)**

- A launch checklist in the report.
- `trustedOrigins` and `BETTER_AUTH_URL` handling for the production domain.
- A `pnpm smoke <url>` script: a Playwright run of end-to-end flows 1, 3 and 4 against a given base URL. It uses one dedicated account, `smoke@test.local`, created on its first run and reused afterwards, so production collects at most one test user.
- Confirm that `/dev/kitchen-sink` returns 404 in production.

**Out**

- New features.
- Monitoring or analytics.

## Notes

- Never run the seed or migrations against production yourself. They only run in the Vercel build.
- Get the production URL from `gh api repos/maxitect/ludwig/deployments?environment=Production` (the latest status `environment_url`).

## Acceptance criteria

- [ ] **AC1**: The production build is green on `main`, with migrations applied in the Vercel build.
  - _Verify (cli):_ `gh api repos/maxitect/ludwig/deployments?environment=Production` shows that the latest deployment for the `main` HEAD sha has the status `success`.
- [ ] **AC2**: The production URL serves over HTTPS with a valid certificate.
  - _Verify (api):_ `curl -sI https://<prod-host>/` returns `HTTP/2 200`, and `curl -vI` shows a valid certificate chain.
- [ ] **AC3**: Production content is seeded by the build.
  - _Verify (api):_ `curl -s https://<prod-host>/puzzles` HTML lists every category, and `/gears` shows today's daily diagram.
- [ ] **AC4**: The smoke test passes against production.
  - _Verify (cli):_ `pnpm smoke https://<prod-host>` passes flows 1, 3 and 4.
- [ ] **AC5**: Auth works on the domain and preview origins are not trusted in production.
  - _Verify (api):_ Sign in as `smoke@test.local` through `https://<prod-host>/api/auth/sign-in/email` with curl, which returns 200 and sets a cookie. A request with `Origin: https://evil.example` is rejected.
- [ ] **AC6**: The kitchen sink is hidden.
  - _Verify (api):_ `curl -sI https://<prod-host>/dev/kitchen-sink` returns 404.
- [ ] **AC7**: The footer shows the cburnett attribution and the not-affiliated note.
  - _Verify (browser):_ A production screenshot of the footer at 1280px and 390px.
- [ ] **AC8**: The whole of SPEC §8 passes on production.
  - _Verify (cli):_ Run T068's a11y spec and T069's Lighthouse script with the base URL set to production. Both pass.
