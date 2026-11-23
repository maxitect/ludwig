---
id: T159
title: "Vercel Hobby limits: diagnose the ISR writes and CDN requests, then fix the causes without touching the cache design (high priority)"
milestone: M5
epic: E1
depends_on: [T118]
migrations: false
requires_human: true
preview: false
spec: ["SPEC §7.7", "SPEC §7.3 Cache Components", "docs/tickets/reports/T006.md"]
skills: ["vercel:next-cache-components"]
---

# T159: Vercel Hobby limits: diagnose the ISR writes and CDN requests, then fix the causes without touching the cache design

## Context

The Vercel usage page on 2026-11-07 (Hobby, cycle from 2026-10-08):

| Resource | Used | Limit |
|---|---|---|
| ISR Writes | **363K** | 200K (exceeded) |
| CDN Requests | 878K | 1M |
| Fluid Active CPU | 2h 52m | 4h |
| ISR Reads | 169K | 1M |

The Cache Components setup (T006, SPEC §7.3) is deliberate and stays as it is: `use cache` with `cacheTag("puzzles")` on the catalogue and payload reads, session UI behind `<Suspense>`, `instant = false` on the param routes. This ticket does not reduce caching. It finds what is being written and requested, and removes waste.

What was established on 2026-11-07 before this ticket:

- **Writes exceed reads.** 363K writes against 169K reads means the writes are not caches revalidating under traffic (that would need reads first). They are build-time writes.
- **Every build prerenders every puzzle.** The two crons keep a 366-day window of dailies generated ahead for sudoku, troix, kakuro and gears, so `puzzles` holds about 1,430 daily rows, one per type per day for the coming year, each with its `published_at` set to its date. That is the release-by-date design and it is correct: only today's are published. The waste is that `getPuzzleStaticParams` returns every row regardless of `published_at`, so each build prerenders about 1,400 pages for dates that have not arrived, every one of them a 404 today. Each is prerendered, and each prerender writes the page and its `use cache` entries (`getPuzzleSummary`, `getPuzzleForPlay`, the preview payload). There were 57 ready production builds and 22 ready preview builds this cycle (9 production builds on 2026-11-06 alone).
- **A side effect, a real bug.** An unpublished daily prerenders as a 404 (`getPuzzleSummary` returns null inside the cached function and the page calls `notFound()`). After midnight the first request for that day's daily is served the prerendered 404 (`x-vercel-cache: PRERENDER`, seen on `/puzzles/sudoku/daily-sudoku-2026-11-07` and `/puzzles/gears/daily-2026-11-07`); the stale-while-revalidate then refreshes it and the second request is 200. The first visitor each morning sees a 404.
- **CDN requests are not explained by the logs.** Hobby keeps about 30 minutes of request logs (`vercel logs --json` returned 50 rows, 12:15 to 12:41), so the 878K cannot be attributed from the CLI. Candidates: the service worker precache (every client refetches every chunk after every deploy), link prefetching on shelves, crawlers, and the production checks agents run after each merge. The Vercel dashboard has the breakdowns: Usage shows each resource by path and over time, and Firewall shows traffic by user agent and path, both on Hobby.
- **What "exceeded" does.** Vercel's published rule for Hobby is that usage beyond the included allowance can lead to the project being paused for the rest of the cycle, after warning emails. Nothing has been paused yet. The cycle resets on 2026-11-08.

## Scope

**In**

- **Diagnose and record.** In the report, before any change:
  - the Usage page breakdowns for ISR Writes and CDN Requests (by path and over time), from screenshots the user provides on request;
  - the Firewall traffic view by user agent for the last 24 hours (user screenshot), to see whether crawlers dominate CDN requests;
  - the production build log's "Generating static pages (N/N)" count (`vercel inspect <url> --logs`), and the number of `use cache` entries a build writes (count the cached functions and their params);
  - the deploy counts above, refreshed;
  - a written confirmation from the Vercel docs of what counts as an ISR write (build-time prerenders, time-based revalidation, on-demand revalidation).
- **Prerender what is visited, keep the rest on demand.** `getPuzzleStaticParams` returns curated puzzles and the dailies on each type's shelf (published, the 14 most recent per daily type, plus the gear daily for today). Everything else renders on first request through the same cached functions and is then served from the cache. This removes the stale 404 too, because an unpublished page is never prerendered. `instant = false` stays for unknown slugs.
- **Fewer builds.** Merges to `main` are batched: the orchestrate skill merges every reviewed PR of a session, then the deploy happens once, unless a merge needs production verification before the next. Document it in `.claude/skills/ludwig-orchestrate/SKILL.md` and `PROMPT.md`. Preview builds stay opt-in (already).
- **CDN requests, only what the data shows.** Likely candidates, each applied only if the breakdown names it:
  - service worker precache trimmed to the shell, fonts and the offline page (keep T118's offline guarantees and `e2e/offline.spec.ts` green);
  - `prefetch={false}` on shelf links below the first screen;
  - a Firewall rule for abusive crawlers (user approval needed: Vercel settings change);
  - agent production checks limited to `curl -I` on one page, not browser loads of several.
- **Active CPU.** Record what the Usage breakdown attributes CPU to. If it is the daily-generation crons, T155 removes them; if it is solve-page renders, note it and leave it, since the per-request work is the session read the design wants.
- SPEC §7.7: a "Hobby limits" paragraph with the numbers, the rules (prerender shelf and curated only, batch deploys) and where to look (Usage and Firewall pages).

**Out**

- Changing `cacheLife`, `cacheTag`, the `use cache` boundaries or `instant`.
- Upgrading the plan.
- The crons (T155).

## Notes

- Hobby has no usage API (`/v1/usage` is Pro only) and about 30 minutes of request logs. The user's dashboard screenshots are the evidence; ask for them at the start.
- A stale 404 can be reproduced locally: seed a puzzle with `published_at` tomorrow, `pnpm build && pnpm start`, request it, then move `published_at` to the past and request again.
- Cache Components prerenders a param route's static shell at build; a route left out of `generateStaticParams` is rendered on first request with the same `use cache` functions and cached from then on, so the Collection and shelves are unchanged.

## Acceptance criteria

- [ ] **AC1**: The report attributes the usage before any change.
  - _Verify (human + deploy):_ the ISR Writes and CDN Requests breakdowns and the Firewall traffic view are in the report with the build-log prerender count and the deploy counts.
- [ ] **AC2**: Builds prerender curated puzzles and the shelf dailies only.
  - _Verify (cli):_ `pnpm build` on a database with a year of dailies lists at most 14 daily pages per daily type plus today's gear daily; the build-log count on the next production deploy drops accordingly and is recorded.
- [ ] **AC3**: A daily that becomes published after a build serves 200 on its first request.
  - _Verify (api):_ the local reproduction above returns 200 on the first request after `published_at` passes; on production, the first `curl -I` of tomorrow's daily after London midnight is 200 (record the headers).
- [ ] **AC4**: Unknown slugs still 404 and the cache boundaries are unchanged.
  - _Verify (code + api):_ `instant = false` remains on both param routes; `grep -rn 'use cache' src/lib/data | wc -l` is unchanged from `main`; `/puzzles/sudoku/no-such-slug` is 404.
- [ ] **AC5**: Deploys are batched.
  - _Verify (code):_ the orchestrate skill and `PROMPT.md` state the batching rule.
- [ ] **AC6**: Usage trends down across the next cycle.
  - _Verify (human):_ two weeks into the next cycle the user's Usage screenshot shows ISR Writes and CDN Requests on course for under half their limits; the report records the numbers.
- [ ] **AC7**: Gates pass and offline still works.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0 and `pnpm test:e2e e2e/offline.spec.ts e2e/smoke.spec.ts` passes.
