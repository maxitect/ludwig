---
id: T014
title: /dev/kitchen-sink route
milestone: M1
epic: E3
depends_on: [T010, T012, T013]
migrations: false
requires_human: false
spec: ["SPEC §3", "SPEC §8.3", "PLAN §3 M1"]
skills: []
---

# T014: Kitchen-sink route

## Context

This is a single page that renders every design-system component and token in both themes. It is the reference used to check the brand checklist (SPEC §8.3) on every later UI ticket.

## Scope

**In**

- `src/app/dev/kitchen-sink/page.tsx` renders:
  - colour token swatches, labelled with token names;
  - type specimens for every font variable;
  - texture utilities: grain, `.grid-paper` and `.raking`;
  - every `src/components/brand/` component;
  - every `src/components/ui/` component in all its variants, with overlays opened by buttons.
- A theme toggle on the page that forces Paper or Ink for screenshotting, independent of the user setting.
- `notFound()` when `process.env.VERCEL_ENV === "production"`, read through `src/env.ts`.

**Out**

- The real theme switching and its persistence (T015).

## Notes

- The page lists components by importing them. Don't build an auto-discovery mechanism.

## Acceptance criteria

- [ ] **AC1**: `/dev/kitchen-sink` returns 200 in development.
  - _Verify (api):_ `curl -s -o /dev/null -w "%{http_code}" http://localhost:3014/dev/kitchen-sink` prints `200`.
- [ ] **AC2**: The route returns 404 when `VERCEL_ENV=production`.
  - _Verify (cli + api):_ Run `VERCEL_ENV=production pnpm build && VERCEL_ENV=production pnpm start --port 3114`, then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3114/dev/kitchen-sink`. It prints `404`.
- [ ] **AC3**: Every component exported from `src/components/brand/index.ts` and every file in `src/components/ui/` is rendered on the page.
  - _Verify (code):_ A Vitest test, `src/app/dev/kitchen-sink/coverage.test.ts`, compares the brand exports and the ui filenames against the page's imports and fails on any that are missing.
- [ ] **AC4**: Every colour token from SPEC §6.2 has a labelled swatch.
  - _Verify (browser):_ The snapshot contains a label for each of the 12 token names.
- [ ] **AC5**: The theme toggle switches between Paper and Ink without reloading, and every surface changes.
  - _Verify (browser):_ Click the toggle. The `body` computed `background-color` changes between the `--paper` and `--ink` values. Take full-page screenshots of both themes at 1280px and 390px under `.verification/T014/`.
- [ ] **AC6**: The page has no horizontal scroll at 390px.
  - _Verify (browser):_ At 390px width, `document.documentElement.scrollWidth <= 390` is true.
- [ ] **AC7**: There are no console errors or warnings.
  - _Verify (browser):_ `browser_console_messages` is empty of errors and warnings after opening every overlay on the page.
- [ ] **AC8**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
