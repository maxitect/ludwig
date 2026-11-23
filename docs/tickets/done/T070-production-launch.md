---
id: T070
title: Production verification on ludwigpuzzles.com
milestone: M5
epic: E10
depends_on: [T068, T069, T143, T144, T146]
migrations: false
requires_human: false
preview: true
spec: ["SPEC §7.5", "SPEC §7.7", "SPEC §8", "PLAN §3 M5"]
skills: []
---

# T070: Production verification on ludwigpuzzles.com

## Context

The site has been live on `https://ludwigpuzzles.com` since October (`ludwig-orcin.vercel.app` redirects there), so nothing is left to launch. This ticket closes M5 (PLAN §3) by proving the SPEC §8 bar on production, adding a repeatable smoke run, and doing the screen-reader checks that can be automated. There is no human step.

The real-iPhone VoiceOver pass that T068 left open is dropped by the user's decision (2026-11-10). This ticket replaces it with the automated screen-reader coverage below.

## Scope

**In**

- **`pnpm smoke <url>`.** A script that runs a production-safe Playwright selection against a given base URL: the signed-out journeys of SPEC §8.2 flows 3 (Reverse Chess) and 4 (Gears), plus the home page, `/puzzles` and one crossword solve page. It creates no account and writes nothing to the database.
- **Flow 1 (sign up, solve, Casebook)** runs against the PR's preview, where `@e2e.test` accounts are verified on creation. It does not run on production.
- **Auth origins.** Confirm `trustedOrigins` and `BETTER_AUTH_URL` are right for the production domain: preview origins are not trusted in production, and a foreign origin is rejected. Fix `src/lib/auth.ts` only if a check fails.
- **Accessibility on production.** Run the signed-out half of `e2e/a11y.spec.ts` (axe, both themes) against production. The signed-in half runs against the preview.
- **Screen-reader coverage, automated.** For the crossword in solve mode, with the on-screen pad and with "Use my device's keyboard" on, and for the chess board's `application` stop:
  - walk the solver with `@guidepup/virtual-screen-reader` in the existing jsdom solver tests and assert the spoken phrases: each cell announces its position and clue, a typed letter is announced, the clue line is the single live announcement, and the pad keys are labelled buttons;
  - try real macOS VoiceOver through `@guidepup/playwright` on this machine, time-boxed to one hour. If it runs, drive Safari through one crossword entry and record the spoken log. If the setup needs a system prompt the agent can't accept, or macOS 27 isn't supported, record what blocked it and stop. Don't change SIP.
- **Lighthouse on production** with `BASE=https://ludwigpuzzles.com pnpm perf:lighthouse`.
- **A launch checklist in the report:** each item of SPEC §8.3, the production checks below, and the screen-reader findings. Fix any blocker the screen-reader walk finds; file a ticket for anything larger than a label or role fix.
- Update the title's old wording wherever SPEC or PLAN still call production a `*.vercel.app` URL.

**Out**

- A VoiceOver pass on a real iPhone or iPad (dropped), and paid device clouds.
- A test account on production. No `smoke@test.local` user.
- New features, monitoring or analytics.
- The iPad solve layout (T168).

## Notes

- **Bot Protection is on (Challenge) since 2026-11-07,** so bare `curl` to production returns 429. Use `vercel curl --yes --deployment <production-deployment-url> <path>` for header checks. The latest entry of `vercel ls --prod` can be a cancelled docs-only build that answers 200 for every path: take the deployment `vercel inspect ludwigpuzzles.com` reports.
- **Playwright against production.** `playwright.config.ts` already sends `x-vercel-protection-bypass` when `VERCEL_AUTOMATION_BYPASS_SECRET` is set. Check first whether that header gets a browser past the challenge on `ludwigpuzzles.com`. If it doesn't, run against the production deployment URL instead, and say so in the report. Don't change Firewall settings; that needs the user's approval. Never print the secret.
- Never run the seed or migrations against production yourself. They only run in the Vercel build.
- Keep production load small (T159): one smoke run, one axe run and one Lighthouse run, not repeats.
- T069 recorded owner-accepted Lighthouse misses: crossword 87, reverse chess 84, `/` 89 to 92. Those are not failures here.
- `@guidepup/virtual-screen-reader` needs no system setup. `@guidepup/playwright` needs `npx @guidepup/setup`, which turns on VoiceOver's AppleScript control and asks for Accessibility and Automation access for the terminal.
- iOS VoiceOver can't be automated locally: the Simulator has no scriptable VoiceOver, and real-device automation is a paid cloud service.

## Acceptance criteria

- [ ] **AC1**: The production build for the `main` HEAD is green, with migrations applied in the Vercel build.
  - _Verify (cli):_ `vercel inspect ludwigpuzzles.com` shows status Ready for the deployment of the `main` HEAD sha (or the last non-docs commit), and its build log (`--logs`) shows the migrate and seed steps.
- [ ] **AC2**: `https://ludwigpuzzles.com` serves over HTTPS with a valid certificate, and `ludwig-orcin.vercel.app` redirects to it.
  - _Verify (api):_ `curl -vI https://ludwigpuzzles.com/` shows a valid certificate chain (a 429 body is fine for this check), and `vercel curl` on the production deployment returns 200 for `/`.
- [ ] **AC3**: Production content is seeded by the build.
  - _Verify (deploy):_ `vercel curl --yes --deployment <production-deployment-url> /puzzles` HTML lists every category, and `/gears` shows today's daily diagram.
- [ ] **AC4**: The smoke run passes against production and creates no user.
  - _Verify (cli):_ `pnpm smoke https://ludwigpuzzles.com` (or the production deployment URL, see Notes) passes. Neon MCP `run_sql` on `main`: `select count(*) from "user"` is the same before and after.
- [ ] **AC5**: Flow 1 passes on the preview.
  - _Verify (deploy):_ `PLAYWRIGHT_BASE_URL=<preview-url> pnpm test:e2e flow-1` passes.
- [ ] **AC6**: Auth trusts only the production origin.
  - _Verify (api):_ A `POST /api/auth/sign-in/email` to production with `Origin: https://evil.example` is rejected with 403. The same request with `Origin: https://ludwigpuzzles.com` and wrong credentials returns 401, not 403. A request with a preview origin is rejected.
- [ ] **AC7**: The kitchen sink is hidden.
  - _Verify (deploy):_ `vercel curl --yes --deployment <production-deployment-url> /dev/kitchen-sink -- -sI` returns 404.
- [ ] **AC8**: The footer shows the cburnett attribution and the not-affiliated note.
  - _Verify (browser):_ Production screenshots of the footer at 1280px and 390px.
- [ ] **AC9**: The signed-out axe audit passes on production in both themes, and the signed-in audit passes on the preview.
  - _Verify (cli):_ `e2e/a11y.spec.ts` "axe, signed out" against production and "axe, signed in" against the preview both pass.
- [ ] **AC10**: A screen reader can solve a crossword entry in solve mode, with the pad and with the device keyboard, and can read the chess board cursor.
  - _Verify (cli):_ The virtual screen reader tests pass, and the report quotes the spoken log for one crossword entry in each keyboard mode and for one chess board move.
- [ ] **AC11**: The real VoiceOver attempt is recorded.
  - _Verify (code):_ The report holds either the VoiceOver spoken log for one crossword entry in Safari, or the exact step that blocked the setup.
- [ ] **AC12**: Lighthouse on production meets SPEC §8.3 (Performance ≥ 90 on solve pages, Accessibility ≥ 95), apart from T069's accepted misses.
  - _Verify (cli):_ `BASE=https://ludwigpuzzles.com pnpm perf:lighthouse` output, pasted in the report.
- [ ] **AC13**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
