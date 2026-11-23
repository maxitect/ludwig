---
id: T172
title: "ISR writes per visit: longer cache life, fewer prefetches, no site-wide purge on a settings save (high priority)"
milestone: M5
epic: E1
depends_on: [T159]
migrations: false
requires_human: true
preview: false
spec: ["SPEC §7.3 Cache Components", "SPEC §7.7", "docs/tickets/reports/T159.md"]
skills: ["vercel:next-cache-components"]
---

# T172: ISR writes per visit: longer cache life, fewer prefetches, no site-wide purge on a settings save

## Context

T159 cut build-time writes: builds prerender 394 pages (was 1788), and four production builds ran in the cycle that started on 2026-11-08 (57 in the cycle before). AC6 still failed. On 2026-11-23, day 16 of the cycle, ISR writes were about 105K and on course for about 200K, which is the Hobby limit. The full evidence is in the T159 report, "AC6 check".

Runtime writes now come from page views, not builds:

- **One engaged player moves the total.** Since 2026-11-17 one signed-in player made 57 of the 62 attempts on production. Their five evenings of play are the five spike days (about 6K to 12K writes each). The day they did not play was the cycle's lowest (2.5K).
- **Pages go stale quickly and each stale request regenerates.** Every catalogue and payload read uses `cacheLife("minutes")` (`src/lib/data/catalogue.ts`, `gears.ts`, `recommendations.ts`). Any page requested after its stale window comes back `STALE` (`stale_time`) and is regenerated, and each regeneration is an ISR write. Observability showed 635 time-based revalidations in 12 hours.
- **Prefetching multiplies each visit.** The header nav (`/`, `/about`, `/puzzles`, `/reverse-chess`, `/casebook`, `/gears`, `/this-week`) was requested about 1.8K times per link in one evening from that one player, and a `/puzzles` view prefetches every type page in the same second. Every prefetch of a stale page is a regeneration.
- **A settings save purges every page.** `saveTheme` (`src/lib/actions/theme.ts`) and `saveSettings` (`src/lib/actions/settings.ts`) call `revalidatePath("/", "layout")`, which marks every cached page on the site stale (`REVALIDATED`, `delete_tag` in the request log).

Hobby has no per-route ISR breakdown (`vercel metrics` and the observability query need Observability Plus), so per-change effects are measured from the Usage page by day and from `vercel logs` cache states.

## Scope

**In**

- **Cache life.** Move the shared catalogue and payload reads from `"minutes"` to a profile that regenerates at most about hourly (`"hours"`, or a custom `cacheLife` profile in `next.config.ts` if `"hours"` does not fit). Content changes still go through `cacheTag("puzzles")`. Check the one thing a longer life can delay: a daily published at London midnight appearing on its shelf and on `/this-week`. State the worst-case delay in SPEC §7.3, and if it is over an hour, add a midnight `revalidateTag("puzzles")` (cron or the existing daily job) rather than shortening the life.
- **Prefetch.** `prefetch={false}` on the header and mobile nav links and on shelf links below the first screen. Keep it on links where an instant transition is a stated requirement (check SPEC §6 and the solve flow). Record before and after request counts per page view from `vercel logs` (a clean browser session: load `/puzzles`, open one puzzle, go back).
- **Settings purge.** Replace `revalidatePath("/", "layout")` in `saveTheme` and `saveSettings` with `refresh()` or a scoped revalidation. Theme and settings are per user and render behind the session `<Suspense>`, so no shared cache entry depends on them. Confirm this, and confirm that the theme still applies without a reload (existing theme e2e).
- **Measure.** Record the writes per day in the T172 report for the week after the deploy, next to the T159 baseline (about 3K to 7K on quiet days, 6K to 12K on the player's days).
- SPEC §7.3 and §7.7: the new cache life, the prefetch rule, and the rule that no action revalidates the whole layout.

**Out**

- Blocking or rate-limiting the player. They are a real user.
- The favicon fetches by `ddg_win` (CDN only, no ISR writes, already challenged by Bot Protection).
- Upgrading the plan.

## Notes

- Next 16 docs for `cacheLife` profiles and `refresh()`: `node_modules/next/dist/docs/`. Use the `vercel:next-cache-components` skill.
- `getRecommendations` already uses `"hours"` for one of its reads; follow that.
- The cycle resets around 2026-12-08. Ship before then if writes are still on course for the limit.

## Acceptance criteria

- [ ] **AC1**: Shared reads regenerate at most about hourly.
  - _Verify (code):_ no `cacheLife("minutes")` in `src/lib/data`; the profile used and its `revalidate` value are in SPEC §7.3.
- [ ] **AC2**: A midnight daily reaches its shelf within the stated delay.
  - _Verify (api):_ on production, after London midnight, the new daily appears on its type shelf and on `/this-week` within the delay SPEC §7.3 states (record the time and `x-vercel-cache` header); its own page is 200 on first request (T159 AC3 still holds).
- [ ] **AC3**: Nav links do not prefetch.
  - _Verify (cli):_ `vercel logs` for one scripted visit (load `/puzzles`, open a puzzle, go back) shows no requests for the header nav routes that were not clicked; before and after counts in the report.
- [ ] **AC4**: A theme or settings save no longer purges the site.
  - _Verify (code + e2e):_ no `revalidatePath("/", "layout")` in `src/lib/actions`; the theme switch e2e passes; after a save, `vercel logs` shows no `delete_tag` on other pages.
- [ ] **AC5**: Writes fall.
  - _Verify (human):_ a Usage screenshot (ISR Writes by day) a week after the deploy shows quiet days under 2K and play days well under T159's 6K to 12K; the numbers are in the report.
- [ ] **AC6**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0, and `pnpm test:e2e e2e/offline.spec.ts e2e/smoke.spec.ts` passes.
