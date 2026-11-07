---
id: T129
title: Puzzle preview engine and per-puzzle thumbnails
milestone: M5
epic: E10
depends_on: []
migrations: false
requires_human: false
spec: ["SPEC §3", "SPEC §4", "SPEC §6"]
skills: []
---

# T129: Puzzle preview engine and per-puzzle thumbnails

## Context

Puzzle cards on the shelves of `/puzzles/[type]`, and on the Reverse Chess and Gears hubs, are text only. Players should be able to recognise a puzzle at a glance. This ticket adds a preview for every type, rendered from the puzzle's own payload. T130 reuses it for the Collection type cards. See `docs/research/look-and-feel-audit.md` §9.

## Scope

**In**

- **Per-type preview:** each type gets a `src/puzzles/<type>/preview.tsx`. It is a pure server component, `Preview({ payload })`, that renders a small static SVG of the puzzle's starting state.
  - It takes the **payload only**. It never sees the solution, attempt state or client state, so no **(S)** value reaches the page.
  - It uses theme tokens and follows T120's surfaces once that lands (grids stay paper).
  - It has no interactivity and no `"use client"`.
- **Shared drawing parts** in `src/puzzles/_shared/preview/`:
  - a mini cell grid (crossword, sudoku, futoshiki, and the M6 grid types later);
  - a mini chess board (reverse chess, rota);
  - a cipher strip (caesar, keyword, pictogram cipher);
  - a text and tile block (anagram, book cipher).
  - Gears and spot the difference reuse their own pure engines to draw a reduced diagram or scene.
- **Registration:** a `previews` map in `src/puzzles/previews.ts`, kept separate from the server registry the same way `solvers.ts` is, and typed so it must list every registered type key. A new type fails typecheck until it ships a preview. Add `preview.tsx` to the folder contract in `.claude/rules/puzzles.md` and to the `/new-puzzle-type` skill.
- **Data:** shelf cards load each puzzle's payload through a `"use cache"` data-access function tagged `puzzles` (the existing tag), so a shelf doesn't run uncached queries per card. Keep it to one query per shelf where the type's `load` allows it. Otherwise, cache per puzzle.
- **UI:** the thumbnail is shown on shelf cards in `/puzzles/[type]`, on `/reverse-chess` and on `/gears`, at a fixed aspect ratio, in both themes and at 390px.
- Add a preview item to the scope of the M6 type tickets (T084–T098, T101–T110) that haven't started.

**Out**

- The Collection type cards (T130).
- Showing a signed-in player's progress on the thumbnail. It depends on the session and would break caching.

## Notes

- Read the Cache Components guide in `node_modules/next/dist/docs/` before writing the cached loader. Anything session-dependent must stay out of the cached scope.
- Previews should be cheap: no filters, and fewer than about 300 SVG nodes each. A shelf of 30 must not regress Lighthouse (T069).
- The payload leak test pattern still applies. A test asserts each preview renders from `payloadSchema`-parsed data alone.

## Acceptance criteria

- [ ] **AC1**: Every registered type has a preview, and a missing one fails typecheck.
  - _Verify (cli):_ Removing one entry from `previews.ts` makes `pnpm typecheck` fail. Restore it.
- [ ] **AC2**: Each preview renders from a payload alone.
  - _Verify (cli):_ A Vitest test renders every type's preview with `renderToStaticMarkup` from its fixture payload and snapshots it.
- [ ] **AC3**: Shelf cards show thumbnails in both themes at 1280px and 390px.
  - _Verify (browser):_ Screenshot `/puzzles/crossword`, `/puzzles/book-cipher`, `/reverse-chess` and `/gears` in Paper and Ink.
- [ ] **AC4**: No solution data appears in the shelf page.
  - _Verify (browser):_ For a crossword shelf, the HTML (`document.documentElement.outerHTML`) contains none of the solution answers.
- [ ] **AC5**: The shelf page stays fast.
  - _Verify (cli):_ The node count per preview stays under the budget (test). A local Lighthouse run of `/puzzles/crossword` keeps the performance score within 5 points of `main`.
- [ ] **AC6**: The behaviour holds on the PR's preview.
  - _Verify (deploy):_ Screenshot `/puzzles/sudoku` on the preview URL.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
