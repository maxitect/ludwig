---
id: T113
title: Solve mode, the full-height phone layout for the solve page
milestone: M5
epic: E12
depends_on: [T018, T112]
migrations: false
requires_human: false
spec: ["SPEC §4.5", "SPEC §6", "PLAN §3 M5"]
skills: []
---

# T113: Solve mode, the full-height phone layout for the solve page

## Context

On a phone the solve page is one long column. The solver starts about 300px down, and the timer and the Check/Reveal/Reset bar scroll out of view (`docs/research/mobile.md` §3). Solve mode turns the page into a fixed, full-height layout on touch phones, so that the grid and the controls share one screen. T114 then puts the on-screen keyboard in the bottom slot this ticket creates.

## Scope

**In**

- A Tailwind custom variant, `touch`, in `globals.css`: `@media (pointer: coarse) and (max-width: 47.999rem)`. It is pure CSS, so there is no JS and no hydration mismatch. Landscape phones and tablets keep the current layout.
- Solve mode for the solve page (`src/app/(app)/puzzles/[type]/[slug]/page.tsx`, `src/components/puzzle/solve-chrome.tsx`), under `touch:`:
  - The page is exactly `100dvh`, and the document itself does not scroll.
  - The site header is replaced by a compact solve header in one row: a back link to the category, the title (a compact `Credit`, truncated to one line), the timer, and a menu button.
  - Check, Reveal and Reset move into that menu (a `DropdownMenu`). The Reveal confirmation dialog is unchanged.
  - The solver area is `flex-1 min-h-0`. It scrolls internally if a solver's content is taller than the space.
  - The status line (`aria-live`) stays rendered and visible as a single line under the header.
  - A bottom slot for solver controls, padded for the safe area, is empty until T114.
- `CellGrid` and `DigitGrid` size themselves to the smaller of the width and the height available in solve mode, so a grid never needs scrolling. Use a size container on the solver area and `min(100cqw, 100cqh)`-style sizing, or an equivalent.
- Every solver still works in solve mode. Solvers taller than one screen (gears, rota, spot the difference, reverse chess) scroll inside the solver area.
- SPEC §4.5 gets a "Solve mode" paragraph. SPEC §6.7 "Mobile" gets the `touch` variant.

**Out**

- The on-screen keyboard (T114) and per-type layouts (T115, T116).
- Touch target sizes (T117).
- Landscape and tablet layouts.
- Any change to the desktop layout.

## Notes

- Check that Playwright's `mobile` project (`isMobile`, `hasTouch`) matches `(pointer: coarse)` in Chromium. If it does not, add the media emulation to that project, not to individual specs.
- Headings still use `Credit`. Shrink it through `className` the way `solve-chrome.tsx` already does; don't hand-roll a heading.
- `Enter` still checks from inside the solver. The keydown handler stays where it is.

## Acceptance criteria

- [ ] **AC1**: At 390×844 on touch, the solve page does not scroll, and the header, timer and whole grid are in view.
  - _Verify (browser):_ In the `mobile` emulation, open a 15×15 cryptic crossword and a sudoku. `document.scrollingElement.scrollHeight <= innerHeight`. The bounding boxes of the timer and of the `role=grid` element lie inside the viewport. Take screenshots in both themes.
- [ ] **AC2**: Check, Reveal and Reset are reachable from the menu and behave as before.
  - _Verify (browser):_ In the `mobile` emulation, solve an anagram, then open the menu and tap Check. "Solved." appears. Reset from the menu clears the board.
- [ ] **AC3**: The desktop layout is unchanged.
  - _Verify (browser):_ Screenshots of the same two puzzles at 1280px match the pre-change screenshots (same element order, site header present, action bar under the solver).
- [ ] **AC4**: Every registered solver renders and can be interacted with in solve mode.
  - _Verify (cli):_ `pnpm test:e2e --project=mobile` passes in full.
- [ ] **AC5**: The behaviour holds on the PR's preview.
  - _Verify (deploy):_ Run AC1 against the preview URL using a `get_access_to_vercel_url` share link.
- [ ] **AC6**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
