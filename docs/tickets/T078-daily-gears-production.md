---
id: T078
title: Keep a year of daily gear diagrams generated in production
milestone: M3
epic: E7
depends_on: [T036]
migrations: false
requires_human: false
spec: ["SPEC §5.2", "SPEC §4.6"]
skills: []
---

# T078: Keep a year of daily gear diagrams generated in production

## Context

Daily gear diagrams come from `pnpm puzzles:gen-gears --from YYYY-MM-DD --days N` (T036). The generator is deterministic from a seeded PRNG, with no AI, and each daily is stored with `published_at` at London midnight, so future dailies already stay hidden until their date. Nothing runs it in production, so production has no dailies. User decision (2026-10-04): use a Vercel cron job. Generating ahead with release dates is the same mechanism, so the cron keeps a rolling window filled.

## Scope

**In**

- A route handler (e.g. `src/app/api/cron/daily-gears/route.ts`) that generates any missing dailies from today (London) to today + 365 days, through the existing `generate-gears` code path and `upsertPuzzle`. Extract the shared generation function from `scripts/generate-gears.ts` so the script and the route call the same code.
- Authorise the route with `CRON_SECRET` (`Authorization: Bearer <CRON_SECRET>`, the Vercel cron convention); reject everything else with 401.
- A daily cron schedule in the project config (`vercel.ts` with `@vercel/config` if the project adopts it, otherwise `vercel.json`); one run a day is enough.
- Make generation idempotent and bounded: existing dates are skipped (already true), and one run does at most the missing days. Measure the time for 365 days; if it is near the function limit, generate in batches across runs and record that.
- Check that unpublished future dailies are not reachable: their solve routes return 404 and they don't appear in `/puzzles/gears` before their date.

**Out**

- The `/gears` hub and the daily-diagram UI (T043).
- Any change to the generator's parameters.

## Notes

- The orchestrator may add a missing per-environment secret (`CRON_SECRET`) generated with `openssl rand` and piped straight into `vercel env add`, without printing it (INSTRUCTIONS §3.1). Any other Vercel setting change needs the user.
- Read `node_modules/next/dist/docs/` for route handlers, and the Vercel cron docs for the schedule and auth header.
- Cron jobs only run on production deployments, so verify the handler on the preview by calling it with the secret.

## Acceptance criteria

- [ ] **AC1**: The route rejects requests without the secret.
  - _Verify (api):_ `curl -i` without the header, and with a wrong one, returns 401 and writes nothing (row count in `gear_daily` unchanged).
- [ ] **AC2**: An authorised call fills the window and is idempotent.
  - _Verify (api + db):_ with the secret, the first call creates 366 `gear_daily` rows from today; a second call creates 0. Every generated row passes `pnpm puzzles:verify`.
- [ ] **AC3**: Future dailies stay hidden.
  - _Verify (browser or api):_ tomorrow's daily slug returns 404 and is not listed in `/puzzles/gears`; today's is reachable.
- [ ] **AC4**: The cron is configured.
  - _Verify (code + deploy):_ the config declares the schedule for the route; the preview build log is clean and calling the preview route with the secret via `vercel curl` succeeds.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
