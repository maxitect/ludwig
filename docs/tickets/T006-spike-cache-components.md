---
id: T006
title: "Spike S2: Cache Components decision"
milestone: M0
epic: E1
depends_on: [T003]
migrations: false
requires_human: false
spec: ["SPEC §7.3 Cache Components", "PLAN §3 M0 S2", "PLAN §7"]
skills: []
---

# T006: Spike S2, Cache Components decision

## Context

This decides whether `cacheComponents` is on for v1 (the recommendation is on), by proving the two patterns the app needs:

- session-dependent UI streamed behind `<Suspense>`;
- session-independent data cached with `use cache` and `cacheTag`.

See PLAN §3 M0 S2.

## Scope

**In**

- `next.config.ts`: `cacheComponents: true`.
- A minimal `src/app/(app)/layout.tsx` user slot. An async server component reads the session through `auth.api.getSession` and renders the email or "Signed out". It is wrapped in `<Suspense>` with a plain text fallback. T008 replaces the direct call with `getCurrentUser()`, and T015 replaces the markup.
- A probe in `src/lib/data/probe.ts`: a `use cache` function tagged `cacheTag("probe")` that returns `now()` from Postgres. It renders on `src/app/(app)/probe/page.tsx`.
- A route handler `src/app/api/probe/revalidate/route.ts` that calls `revalidateTag("probe")`. It is dev-only and returns 404 when `VERCEL_ENV === "production"`.
- A decision record: edit SPEC §7.3 "Cache Components" to read **on** or **off**, with a one-line reason. If off, remove `cacheComponents` and the probe.

**Out**

- Real nav and UI (T015).
- `getCurrentUser` (T008).

## Notes

Read these before starting:

- `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`
- `.../01-app/03-api-reference/directives/use-cache.md`
- `.../01-app/03-api-reference/functions/cacheTag.md`
- `.../01-app/02-guides/instant-navigation.md` (the `instant = false` escape hatch)

The probe page and route are deleted in T015, which notes it. Leave a `// probe: removed in T015` marker at the top of each probe file.

## Acceptance criteria

- [ ] **AC1**: The build succeeds with `cacheComponents` on, with no validation errors for the session-reading route.
  - _Verify (cli):_ `pnpm build` exits 0. The output has no "uncached data was accessed outside of `<Suspense>`" error.
- [ ] **AC2**: The session slot streams: the static shell renders the fallback first, and the user's email follows.
  - _Verify (api):_ after signing up, run `curl -s -N -b cookies.txt http://localhost:3006/probe | head -c 20000`. The HTML contains the fallback text before the streamed email.
- [ ] **AC3**: The cached probe returns the same value across requests until it is revalidated.
  - _Verify (api):_ two `curl /probe` calls a few seconds apart show the same timestamp. After `curl /api/probe/revalidate`, the next `/probe` shows a new timestamp.
- [ ] **AC4**: There are no runtime errors in the dev server.
  - _Verify (next):_ `nextjs_call` for errors on the running dev server reports none after AC2–AC3.
- [ ] **AC5**: The decision is recorded.
  - _Verify (code):_ `grep -n "Cache Components" docs/SPEC.md` shows a line stating on or off, with a reason.
- [ ] **AC6**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
