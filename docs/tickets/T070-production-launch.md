---
id: T070
title: Production domain, final seed, launch
milestone: M5
epic: E10
depends_on: [T068, T069]
migrations: false
requires_human: true
spec: ["SPEC §7.5", "SPEC §7.7", "SPEC §8", "PLAN §3 M5"]
skills: []
---

# T070: Production domain, final seed, launch

## Context

The final launch (PLAN §3 M5). Repo-side preparation is done by the implementer. The account, domain and production database actions are done by the user (INSTRUCTIONS §1, step 3).

## Scope

**In (implementer)**

- A launch checklist in the report.
- `trustedOrigins` and `BETTER_AUTH_URL` handling for the production domain.
- A `pnpm smoke <url>` script: a Playwright run of end-to-end flows 1, 3 and 4 against a given base URL, using a throwaway account.
- Confirm that `/dev/kitchen-sink` returns 404 in production.

**In (human: the orchestrator pauses for these)**

1. Choose the domain, add it to the Vercel project, and configure DNS.
2. Set production env vars in Vercel: `BETTER_AUTH_SECRET` (new) and `BETTER_AUTH_URL` (the domain). The Neon integration supplies `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
3. Approve and run `pnpm db:seed` against the Neon **production** branch. This is the only sanctioned production write.
4. Promote the production deployment.

**Out**

- New features.
- Monitoring or analytics.

## Notes

- Never run the seed or migrations against production yourself. Prepare the exact command and hand it to the user.

## Acceptance criteria

- [ ] **AC1**: The production build is green on `main`, with migrations applied in the Vercel build.
  - _Verify (cli):_ `vercel inspect <prod-url>` (or the dashboard output pasted by the user) shows the deployment as `READY`, and the build log contains the `db:migrate` success line.
- [ ] **AC2**: The domain serves over HTTPS with a valid certificate.
  - _Verify (api):_ `curl -sI https://<domain>/` returns `HTTP/2 200`, and `curl -vI` shows a valid certificate chain.
- [ ] **AC3**: Production content is seeded.
  - _Verify (api):_ `curl -s https://<domain>/puzzles` HTML lists every category, and `/gears` shows today's daily diagram.
- [ ] **AC4**: The smoke test passes against production.
  - _Verify (cli):_ `pnpm smoke https://<domain>` passes flows 1, 3 and 4.
- [ ] **AC5**: Auth works on the domain and preview origins are not trusted in production.
  - _Verify (api):_ Sign up and sign in through `https://<domain>/api/auth/...` with curl, which returns 200 and sets a cookie. A request with `Origin: https://evil.example` is rejected.
- [ ] **AC6**: The kitchen sink is hidden.
  - _Verify (api):_ `curl -sI https://<domain>/dev/kitchen-sink` returns 404.
- [ ] **AC7**: The footer shows the cburnett attribution and the not-affiliated note.
  - _Verify (browser):_ A production screenshot of the footer at 1280px and 390px.
- [ ] **AC8**: The whole of SPEC §8 passes on production.
  - _Verify (cli):_ Run T068's a11y spec and T069's Lighthouse script with the base URL set to production. Both pass.
