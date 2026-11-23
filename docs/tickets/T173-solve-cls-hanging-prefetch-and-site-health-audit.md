---
id: T173
title: "Fix the solve-page layout shift and the hanging type-page prefetch, then audit the whole site for runtime faults"
milestone: M5
epic: E1
depends_on: [T170, T172]
migrations: false
requires_human: false
preview: true
spec: ["SPEC §7.3 Cache Components", "SPEC §7.7", "SPEC §8.3"]
skills: ["vercel:next-cache-components"]
---

# T173: Fix the solve-page layout shift and the hanging type-page prefetch, then audit the whole site for runtime faults

## Context

Two faults on `main` were found in passing during session thirty-one and left out of scope:

- **Layout shift on every solve page.** Lighthouse gives a CLS of 0.083 from one shift of `body > div.flex`, which comes and goes between runs. The `div` is the wrapper in `src/app/(app)/layout.tsx`. It appears on every solve type, including `gears` and `spot-difference`, which T170 did not touch, so it predates T170. `caesar` reaches 0.120. The before and after figures are in `docs/tickets/reports/T170.md`, "AC14: CLS on the preview against production".
- **A prefetch that hangs.** On a second visit to a solve page in a production build, two RSC prefetches of `/puzzles/<type>` stay pending for about 26 seconds, then end `net::ERR_ABORTED` (`docs/tickets/reports/T169.md`, Review). It was first seen on `main` at 4c03512, just after T172 changed prefetching (`prefetch={false}` on lists and nav, prefetch kept on back links) and cache lives (`"hours"`, plus the `unpublished` profile). The cause is unknown. It might be the back link's prefetch, a cache entry that never resolves, or a stream that does not close.

Both were found by accident. The user wants a general audit as well, so that faults of this kind are found on purpose: a sweep of the whole site for layout shift, failed, hanging or aborted requests, console errors and hydration warnings.

## Scope

**In**

- **The layout shift.** Find what moves `body > div.flex` (late header content, a font swap, a Suspense fallback of a different height, the session-dependent nav, the solve chrome's title bar) and fix the cause, so CLS is 0 on every solve page in repeated runs. Do not hide it with a fixed height that is wrong at other sizes. Also explain and fix `caesar`'s extra shift.
- **The hanging prefetch.** Reproduce it on a production build (`pnpm build && pnpm start`), name the cause (which link triggers the request, and why it doesn't complete), and fix it. Check whether it also happens on production with `vercel logs` (request durations for `_rsc` requests to `/puzzles/<type>`), and record the result. If the cause is T172's cache or prefetch change, keep T172's ISR savings: the fix must not bring back prefetching of lists or nav, nor a cache life shorter than `"hours"` for shared reads.
- **A site health script,** `scripts/dev/audit-site-health.mts`. It is a headless Playwright sweep against a production build. For each route below, it covers both themes, signed out and signed in where the route differs, and desktop 1440×800, desktop 1280×650, phone 390×844 (`touch`) and tablet 1024×1366 (`touch`). It visits each page once and then a second time by client navigation from another page, and records:
  - the CLS, and each shifting element's selector;
  - every request that fails, is aborted, returns 4xx or 5xx, or is still pending after 5 s, with its initiator where Playwright gives one;
  - console errors and warnings, page errors, React hydration warnings;
  - the time to `load` and to the last network response, so a hanging stream is visible.

  **Routes:** `/`, `/desk`, `/puzzles`, each type page, one solve page per registry type (use the representative from `docs/research/desktop-solve-layout.md`), both Reverse Chess modes in content, `/reverse-chess`, `/gears` and today's diagram, `/this-week`, `/casebook`, `/settings`, `/about`, `/sign-in`, `/sign-up`, the 404 page, and one solved solve page per layout group (`panel`, `board-only`, `excluded`). Also run once with the browser offline after a first visit, which checks the service-worker fallback.

  It writes a table and the raw JSON under `.verification/T173/`, and accepts `--only <routes>` and `--base <url>`.
- **The audit document,** `docs/research/site-health-audit.md`, holding:
  - **the findings table,** one row per distinct fault (deduplicated across routes and viewports), with the routes, viewports and themes it hits, and its severity (`broken`, `degraded`, `noise`);
  - **a cause, or the best lead,** for each `broken` and `degraded` finding;
  - **a run against production.** Run the sweep read-only against `https://ludwigpuzzles.com`, signed out only, through the bypass or from a browser the bot rule allows, and say where production differs from the local build. Make no writes on production.
- **Fix what is small and safe in this ticket:** one file, no design change, no SPEC change. File every other `broken` or `degraded` finding as its own ticket (`docs/tickets/T17x-*.md`, plus a row in `docs/tickets/README.md`), with the evidence from the document. List `noise` findings in the document only.

**Out**

- Accessibility (axe, screen readers): T068 and T070 cover it.
- Lighthouse performance scores other than CLS: T069 and T142.
- ISR write counts: T172.
- Visual design judgments, such as layout taste or board size: T170 and T171.
- Fixing large findings in this ticket, beyond the two named faults.

## Notes

- Run against `pnpm build && pnpm start --port 3173`, not the dev server. Dev mode has its own overlays, HMR traffic and double renders, and it would bury the findings.
- T169's script waited on `networkidle` and hit the hanging prefetch on every repeat visit; the reviewer capped the wait at 2.5 s (`scripts/dev/audit-desktop-layout.mts`). The new script must not wait on `networkidle`. It records the hang as a finding.
- Sign-up is rate-limited to 5 per 15 minutes locally. Create one signed-in user per run and reuse its storage state across routes.
- `curl` on the production apex gets 429 from the bot rule. Use `vercel curl` or the Vercel MCP `web_fetch_vercel_url` for single checks, and say in the report how the production sweep got through.
- The matching Playwright WebKit build is installed locally, so `touch` viewports can run on WebKit as well as Chromium. Record which engine each row used.
- A CLS that "comes and goes" needs at least 5 runs per page to call it fixed; give the distribution, not one number.

## Acceptance criteria

- [ ] **AC1**: The layout shift is gone from every solve page.
  - _Verify (cli):_ on a production build, `BASE=http://localhost:3173 pnpm perf:lighthouse` run 5 times gives CLS 0 on every solve page in every run (the distribution is in the report), and the report names the cause with a before and after trace of the shifting element.
- [ ] **AC2**: The prefetch no longer hangs.
  - _Verify (browser):_ on a production build, visit a solve page, go to another page, and visit it again. No request to `/puzzles/<type>` is pending after 5 s or ends `ERR_ABORTED`. The report names the link that started it, the cause and the fix. A test in `e2e/` asserts this, and it fails on `main`.
- [ ] **AC3**: T172's savings hold.
  - _Verify (code):_ no `cacheLife("minutes")` in `src/lib/data`, no `revalidatePath` in `src`, and the `prefetch={false}` set from T172 is unchanged, unless the report justifies one link by the cause found in AC2.
- [ ] **AC4**: The health script sweeps the whole route list.
  - _Verify (cli):_ `pnpm tsx scripts/dev/audit-site-health.mts --base http://localhost:3173` exits 0 and prints a row count equal to routes × viewports × themes × auth states that apply, plus the offline run. Its JSON is in `.verification/T173/`.
- [ ] **AC5**: The audit document is complete.
  - _Verify (code):_ `docs/research/site-health-audit.md` has the deduplicated findings table with severity, a cause or lead for every `broken` and `degraded` row, and a production section.
- [ ] **AC6**: Every finding is fixed or ticketed.
  - _Verify (code):_ each `broken` or `degraded` finding is either marked fixed (with the commit) and absent from a re-run of the script, or has a new ticket file and a README row naming it.
- [ ] **AC7**: The local build is clean after the fixes.
  - _Verify (cli):_ a re-run of the script on the final build shows no console errors, no hydration warnings and no failed or hanging requests, other than the findings ticketed in AC6.
- [ ] **AC8**: It holds on the PR's preview.
  - _Verify (deploy):_ the AC2 e2e test passes with `PLAYWRIGHT_BASE_URL=<preview-url>`, and `BASE=<preview-url> pnpm perf:lighthouse` shows CLS 0 on every solve page.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
