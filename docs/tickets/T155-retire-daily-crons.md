---
id: T155
title: "Retire the daily crons: top up dailies in the build, release by date"
milestone: M6
epic: E11
depends_on: [T149, T139]
migrations: false
requires_human: false
preview: false
spec: ["SPEC §4.6", "SPEC §5.2.3", "SPEC §7.7"]
skills: []
---

# T155: Retire the daily crons: top up dailies in the build, release by date

## Context

Two Vercel crons (`/api/cron/daily-gears` at 00:05 UTC, `/api/cron/daily-puzzles` at 00:10 UTC) keep a 366-day window of dailies generated. The project is on Vercel Hobby and is running into its limits, and the crons are the only scheduled function work. Release is already by date: every daily has `published_at` at London midnight of its date and the catalogue hides anything after `now()`. The crons only extend the window.

Production today (Neon `main`, 2026-11-07): gears 397 rows through 2027-11-07, sudoku 369 through 2027-11-07, troix 366 through 2027-11-07, kakuro 295 through 2027-08-28 (the first run stopped on its 270 s budget and later runs were to finish it).

Generation is deterministic from the date, so any run anywhere writes the same puzzle for a date. That is what makes the crons replaceable.

## Scope

**In**

- **One top-up script.** `pnpm puzzles:top-up-dailies`: for gears and each type in `dailyTypes`, generate missing dates from today (London) through today + `WINDOW_DAYS`, through the existing `generateDailies` functions. Default window 400 days. Prints one line per type with created and skipped counts. Reuse `scripts/generate-daily.ts` and the gears generator; delete `scripts/generate-daily.ts`'s CLI if the new script covers it, or keep it as the per-type form.
- **Run it in the Vercel build.** `vercel.json` `buildCommand` becomes `pnpm db:migrate && pnpm db:seed && pnpm puzzles:top-up-dailies && pnpm build`. On a steady production the top-up writes only the days since the previous deploy, so it costs seconds of build time. Previews deploy from a copy of `main`, so they write nothing (or the few days since the branch point). Give the script a run budget like the cron's, and have it exit 0 with a `pending` line when the budget stops it, so a cold database can never fail a build.
- **Remove the crons.** Delete the `crons` block from `vercel.json`, both route handlers under `src/app/api/cron/`, and their tests. Keep `CRON_SECRET` in `src/env.ts` (optional, as today) and in Vercel: the user wants it available for a future cron (T157 uses it).
- **Guard the window.** `pnpm puzzles:verify` already re-solves every daily row. Add a check that the latest daily of each type is at least 180 days ahead of today, failing with a clear message, so a database that is drifting toward empty is noticed in CI's `db` job. CI has no dailies by default (see the T149 report), so the check runs only when the table is non-empty, or the `db` job generates a 200-day window first; choose the cheaper one (verify takes about 130 s on 1100 rows) and say which.
- **Docs.** SPEC §4.6 ("materialised at cron time" becomes "materialised by the top-up script in every build"), SPEC §5.2.3 daily diagrams, SPEC §7.7 build command, `docs/research/generators.md` §5.7 if it names the cron, `CLAUDE.md` commands table, and the T078, T111 and T149 reports get a one-line "superseded by T155" note at the top.

**Out**

- Changing the generators, the difficulty cycle or any stored daily (published dailies never change).
- Moving the weekly schedule (already a seed, T148).
- Anything else that may be hitting the Hobby limits, such as `generateStaticParams` listing every daily at build time (see the open question in the README section for this ticket).

## Notes

- Why the build and not a longer one-off backfill: a three-year backfill works too, but every deploy then does nothing and the window still ends. The build top-up keeps the window rolling for as long as the site is deployed, and the 400-day window means a year without a deploy is still safe.
- The user asked whether the gear daily can drop its cron too, given a year is already generated. Yes: `gear_daily` is included in the top-up.
- The build runs on Neon's unpooled connection for migrations; the top-up can use `DATABASE_URL` like the seed.
- Keep the `pg_advisory_xact_lock` per date in `generateDailies`: two builds can overlap (a production deploy and a preview on the same branch point do not share a database, but two production deploys can).
- After merge, confirm on production: the deploy's build log shows the top-up line, `select type_key, max(date) from daily_puzzles group by 1` on Neon `main` shows kakuro caught up to the window, and the Vercel project no longer lists cron definitions (`vercel api /v9/projects/prj_LjiTaW3OEqx9y01sCWPpXeBUM86I` has an empty `crons.definitions`).

## Acceptance criteria

- [ ] **AC1**: The top-up script fills the window and is idempotent.
  - _Verify (cli):_ on an empty local database `pnpm puzzles:top-up-dailies` creates 400 rows per type (gears included); a second run creates 0 and skips 400 per type.
- [ ] **AC2**: The script never fails a build.
  - _Verify (cli):_ with a 5 s budget on an empty database it exits 0 and prints a `pending` count per type; the next run continues from the first missing date.
- [ ] **AC3**: No cron route or schedule remains.
  - _Verify (code):_ `grep -rn "cron" vercel.json src/app scripts package.json` returns nothing; `CRON_SECRET` is still declared in `src/env.ts`.
- [ ] **AC4**: The window guard catches a short window.
  - _Verify (cli):_ with a local table whose latest date is 30 days out, `pnpm puzzles:verify` fails naming the type; with 400 days it passes.
- [ ] **AC5**: Production keeps generating after the merge.
  - _Verify (deploy):_ `vercel inspect <production-url> --logs` shows the top-up line; Neon MCP `run_sql` on `main` shows every type's `max(date)` ≥ today + 365; the project's cron definitions are empty.
- [ ] **AC6**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
