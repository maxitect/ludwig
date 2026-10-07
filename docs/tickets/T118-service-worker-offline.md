---
id: T118
title: Service worker and offline fallback (Serwist)
milestone: M7
epic: E12
depends_on: [T112, T070]
migrations: false
requires_human: false
spec: ["SPEC §7", "SPEC §4.3", "PLAN §3 M7"]
skills: []
---

# T118: Service worker and offline fallback (Serwist)

## Context

This is the second step of the PWA (`docs/research/mobile.md` §5.2). After launch, an installed Ludwig should open with its shell and static assets even on a bad connection, and should say clearly when it is offline, instead of showing the browser's error page. Offline play of uncached puzzles is not a goal.

## Scope

**In**

- `@serwist/turbopack`, set up as in `https://serwist.pages.dev/docs/next/turbo`: a route handler at `src/app/serwist/[path]/route.ts`, `src/app/sw.ts`, and the provider. Read the Serwist page and `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` first.
- **Precached:** the static build assets, fonts, textures, glyphs and icons.
- **Runtime caching,** stale-while-revalidate, only for the session-independent public routes: `/`, `/puzzles`, `/puzzles/[type]`, `/reverse-chess`, `/gears` and `/this-week`. Their RSC responses get their own cache entries, keyed with the `RSC` header, kept apart from the HTML.
- **Never cached:** solve pages for signed-in users, `/casebook`, `/settings`, `/api/*`, and any response that set or read the session. When in doubt, don't cache. Server Actions are POSTs and are never cached.
- **An offline fallback page,** in the brand style with the Walker, served for failed navigations.
- **Updates:** a new service worker takes over on the next navigation (`skipWaiting` plus `clientsClaim`), so a deploy never strands an old shell.
- **Headers** from the Next PWA guide for the service worker script (`Cache-Control: no-cache, no-store, must-revalidate`, plus a strict CSP).
- SPEC §7: the service worker and its never-cache list.

**Out**

- Offline solving with server sync. Signed-out progress already lives in `localStorage`.
- Web push.
- `experimental.useOffline`, which is experimental and not for production per the Next docs. Note it in SPEC as something to revisit.

## Acceptance criteria

- [ ] **AC1**: The service worker registers on a production build.
  - _Verify (browser):_ `pnpm build && pnpm start --port 3118`, open `/`, and `navigator.serviceWorker.controller` is non-null after one reload.
- [ ] **AC2**: Visited public pages open offline. Unvisited pages show the offline fallback.
  - _Verify (browser):_ Visit `/puzzles`, set the context offline (`context.setOffline(true)`), and reload. `/puzzles` renders. Navigate to an unvisited solve page and the offline fallback renders.
- [ ] **AC3**: No session-dependent response is ever cached.
  - _Verify (browser):_ Sign in, visit `/casebook`, `/settings` and a solve page, then list every Cache Storage entry through `browser_evaluate` (`caches.keys()` and `cache.keys()`). No URL matches `/casebook`, `/settings`, `/api/` or `/puzzles/*/*`.
- [ ] **AC4**: A new deploy takes over.
  - _Verify (browser):_ After a rebuild with a changed asset, one navigation loads the new asset (its hash changes in the network log).
- [ ] **AC5**: Signing out leaves no signed-in content readable offline.
  - _Verify (browser):_ Sign out, go offline, and open `/`. The page shows the signed-out landing, not the signed-in Desk.
- [ ] **AC6**: The behaviour holds on production after merge.
  - _Verify (deploy):_ `vercel curl` on production returns `/sw.js` (or the Serwist route) with the no-cache header.
- [ ] **AC7**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
