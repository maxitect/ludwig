---
id: T142
title: Solve-page LCP on crossword and reverse chess
milestone: M5
epic: E10
depends_on: [T069]
migrations: false
requires_human: false
preview: true
spec: ["SPEC §8.3", "SPEC §6.7"]
skills: []
---

# T142: Solve-page LCP on crossword and reverse chess

## Context

T069 brought 19 of 22 solve pages to Performance 90 or more, and the owner accepted the residual misses: crossword 87, reverse chess 84 to 85, with `/` and pictogram cipher crossing 90 from run to run (`docs/tickets/reports/T069.md`, Deviations). Total blocking time is 0 to 10 ms and layout shift is 0. The score is bound by simulated LCP (3.7 to 4.5 s against a simulated FCP of 1.4 to 1.7 s), because every script and font counts as an LCP dependency. This ticket closes the gap. It is not on the launch path and does not block T070.

## Scope

**In**

- Render the crossword clue bar on the server instead of through the post-hydration `SolveSlot` portal, so the largest text exists in the first HTML.
- Split Radix Tabs out of `ClueTabs` so the clue bar needs no Tabs code before it paints.
- Trim the reverse-chess board JavaScript that loads before the main content paints (defer what the first view does not need).
- Subset Caveat Brush and JetBrains Mono to Basic Latin.
- Measure with `pnpm perf:lighthouse` locally and also on the PR's Vercel preview (CDN, brotli, HTTP/2), and judge the targets on the preview.

**Out**

- Changes to other solvers unless a shared fix is the cheapest route.
- Dropping features, or changes to the visual design.
- Lighthouse targets for pages that already pass (do not regress them).

## Notes

- Experiments that did not help in T069 and were reverted: `experimental.inlineCss`, `font-display: optional` for the hand and mono fonts, preloading the hand and mono fonts on solve pages, a variable Josefin Sans. Do not retry them.
- Server-rendered solvers are visible before their lazy chunk hydrates, so e2e must use `openPuzzle` (waits for `networkidle`) before typing.
- Signed-out solve pages must keep leaking no solution (`curl` the page and grep for answer words).
- Honour `data-reduce-motion` and keep the post-hydration `Deferred` menus working.

## Acceptance criteria

- [ ] **AC1**: Crossword and reverse-chess solve pages score Performance 90 or more (median of three, 390×844 mobile, default throttling), and no page that passed in T069 drops below 90.
  - _Verify (cli):_ `pnpm build && pnpm perf:lighthouse` exits 0, with the JSON in `.verification/T142/`.
- [ ] **AC2**: The same two pages score 90 or more on the PR's preview.
  - _Verify (deploy):_ Lighthouse CLI against the preview URL (use a `get_access_to_vercel_url` share link, or `vercel curl`), median of three.
- [ ] **AC3**: The crossword clue bar is in the server-rendered HTML.
  - _Verify (cli):_ `curl` the signed-out page and expect the first clue text in the response, with none of the answer words.
- [ ] **AC4**: Crossword and reverse-chess e2e pass on both projects with `--repeat-each=3`, and axe reports 0 serious or critical on both pages in both themes.
  - _Verify (cli):_ `pnpm exec playwright test e2e/a11y.spec.ts e2e/reverse-chess.spec.ts e2e/crossword*.spec.ts --repeat-each=3`.
- [ ] **AC5**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
