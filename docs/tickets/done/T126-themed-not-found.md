---
id: T126
title: Themed 404 page and the root script-tag error
milestone: M5
epic: E10
depends_on: []
migrations: false
requires_human: false
spec: ["SPEC §3", "SPEC §6"]
skills: []
---

# T126: Themed 404 page and the root script-tag error

## Context

There is no `not-found.tsx` anywhere under `src/app`. Unknown routes and unknown puzzle slugs get the unstyled Next default: a `#fff` background, the system font, no header and no theme. The bad-slug 404 also logs "Encountered a script tag while rendering React component", from the theme init `<script>` in `src/app/layout.tsx`. See `docs/research/look-and-feel-audit.md` §8.

## Scope

**In**

- A root `src/app/not-found.tsx`, and route-group ones where the layout differs. They render inside the site shell (header, footer, theme, grain), with a `Credit` heading and a link back to the Collection. The walker or an empty-grid motif is optional.
- `notFound()` from the solve and type pages lands on the themed page.
- Fix the script-tag console error. Render the theme init script the way the Next 16 docs recommend (read `node_modules/next/dist/docs/` on `<Script>` and `beforeInteractive`, or inline it in `<head>`), so it doesn't render as a React child in the not-found tree.

**Out**

- Error boundaries (`error.tsx`), unless they show the same unstyled default. If they do, add them here and say so in the report.

## Acceptance criteria

- [ ] **AC1**: An unknown route renders the themed 404 in both themes.
  - _Verify (browser):_ Visit `/nope` and `/puzzles/anagram/nope` in Paper and Ink at 1280px and 390px. Screenshots show the header and footer. The computed `body` background resolves to `--background`, and the status is 404.
- [ ] **AC2**: There are no console errors on either 404.
  - _Verify (browser):_ `browser_console_messages` shows nothing but the expected 404 resource load.
- [ ] **AC3**: The behaviour holds on the PR's preview.
  - _Verify (deploy):_ `vercel curl --yes --deployment <preview-url> /nope -- -s -o /dev/null -w "%{http_code}"` prints 404, and a share-link screenshot shows the themed page.
- [ ] **AC4**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
