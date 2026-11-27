---
id: T176
title: "Vercel Web Analytics and Speed Insights on production"
milestone: M5
epic: E1
depends_on: []
migrations: false
requires_human: true
preview: true
spec: ["SPEC §7.1", "SPEC §7.7"]
skills: []
---

# T176: Vercel Web Analytics and Speed Insights on production

## Context

On 2026-11-26 outreach emails went to Jon Petrie and to Big Talk. A day later we could not tell whether anyone had opened the site. Web Analytics returned no rows (no package installed, product not enabled), request metrics and firewall history need Observability Plus, and Hobby keeps runtime logs for one hour. The only evidence was a 25-hour firewall window with no referrers, plus sign-ups and attempts in the database.

This ticket turns on the two free Vercel products, so visitors, pages, referrers, countries, devices and real-user Core Web Vitals are recorded from now on. Campaign links and funnel events are T177.

## Scope

**In**

- Add `@vercel/analytics` and `@vercel/speed-insights` (exact versions, as the rest of `package.json`). Mount `<Analytics />` and `<SpeedInsights />` from the `/next` entry points in `src/app/layout.tsx`.
- **Production only.** Render both only when `VERCEL_ENV` is `production`. Previews, `pnpm dev`, the ticket gate (`VERCEL_ENV=preview`) and CI (`next start` off Vercel) must not request `/_vercel/insights/*` or `/_vercel/speed-insights/*`: off Vercel those paths 404, which would add console errors and failed requests to the e2e runs, Lighthouse and the T173 site health sweep, and preview traffic would pollute the numbers. Read the variable where the existing env validation lives; do not read `process.env` ad hoc if the repo has a validated env module.
- **Service worker.** `src/app/sw.ts` must leave `/_vercel/*` alone: never precached, never served from a runtime cache, no failed-request noise offline. Add an explicit rule only if the current matchers would catch these paths.
- **Dynamic routes.** Check how pages are grouped in the dashboard for `/puzzles/[type]/[slug]`. The `/next` components read the route from the router; confirm the Route dimension shows the pattern and the Path dimension the real URL.
- **Signed-in rewrite.** `/` is rewritten by `proxy.ts` to `/desk` for signed-in visitors. Record which path Analytics reports for them and note it in SPEC, so the landing and Desk numbers are read correctly.
- **About page.** One short paragraph on `/about`: the site counts visits with Vercel Web Analytics, which sets no cookies and does not identify visitors. House voice, no banner, no consent dialog.
- **Human step.** Enabling Web Analytics and Speed Insights in the Vercel project settings is a project setting change. Ask the user to approve it (or to click it); do not enable it unprompted.
- **Budget.** State the Hobby allowances for both products in the report (events and data points per month, retention), with the source, and what happens when they run out. If Speed Insights would exceed its allowance at current traffic, set `sampleRate` and say why.
- SPEC §7.1 (the two packages) and §7.7 (what is measured, production only, the allowances, where to read the numbers: dashboard, Vercel MCP `aggregate_pageviews` and `count_pageviews`).

**Out**

- UTM links, custom events and any conversion funnel (T177).
- Observability Plus, log drains or any paid add-on.
- A third-party analytics product, a cookie banner, or storing visits in our own database.
- Fixing anything Speed Insights reveals. File follow-ups.

## Notes

- Read the installed packages' READMEs and the Vercel docs for the current API before writing code (`search_vercel_documentation` on the Vercel MCP). Do not rely on remembered props.
- The root layout is static and uses Cache Components. Neither component may read the session or make the layout dynamic. Check the build output: the same routes are static before and after.
- T172 is about ISR writes. The analytics script and its beacons are served by Vercel and are not ISR writes, but confirm no page gains a new write or a new prefetch.
- The project has a strict `Content-Security-Policy` only on `/serwist/*`. No CSP change is expected; say so in the report if that holds.
- Vercel Bot Protection is in Challenge mode on production. Check that the beacon requests are allowed, not challenged (`vercel firewall traffic list --path /_vercel/insights/view` or the equivalent).

## Acceptance criteria

- [ ] **AC1**: Both components are mounted once, in the root layout, and only on production.
  - _Verify (code):_ `grep -rn "@vercel/analytics\|@vercel/speed-insights" src` shows imports in one file; the condition is `VERCEL_ENV === "production"` (through the env module if there is one).
- [ ] **AC2**: A local production build and a preview request no analytics endpoints.
  - _Verify (browser):_ a headless Playwright script against `pnpm start` loads `/`, `/puzzles` and one solve page and records zero requests whose URL contains `/_vercel/`, and no console errors. Same on the PR's preview through a share link.
- [ ] **AC3**: The build's static and dynamic route split is unchanged.
  - _Verify (cli):_ the route table from `pnpm build` on the branch matches `main` (diff in the report).
- [ ] **AC4**: The service worker does not cache or break the analytics requests, and going offline adds no errors.
  - _Verify (code + e2e):_ the `sw.ts` matchers exclude `/_vercel/*` (quote them); `pnpm test:e2e e2e/offline.spec.ts` passes.
- [ ] **AC5**: `/about` says what is counted and that no cookies are set.
  - _Verify (browser):_ screenshots of the paragraph in both themes at 1280px and 390px.
- [ ] **AC6**: After merge, production records page views and vitals.
  - _Verify (deploy):_ with both products enabled by the user, load `/`, `/puzzles` and one solve page on `ludwigpuzzles.com` in a real browser; the beacon requests return 2xx and are not challenged; within the hour Vercel MCP `aggregate_pageviews` by `requestPath` for the day returns those paths, and the Speed Insights dashboard shows data points. Record the tool output.
- [ ] **AC7**: Dynamic routes and the Desk rewrite are reported as SPEC §7.7 says.
  - _Verify (deploy):_ `aggregate_pageviews` by `route` shows `/puzzles/[type]/[slug]` as one route; the path reported for a signed-in visit to `/` is recorded and matches the SPEC text.
- [ ] **AC8**: The allowances are documented.
  - _Verify (code):_ SPEC §7.7 states the Hobby allowance and retention for both products with a link to the source.
- [ ] **AC9**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
