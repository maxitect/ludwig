---
id: T011
title: "shadcn restyle A: button, input, label, card, badge, separator, skeleton"
milestone: M1
epic: E3
depends_on: [T007]
migrations: false
requires_human: false
spec: ["SPEC §6.2", "SPEC §6.4"]
skills: []
---

# T011: shadcn restyle A

## Context

This is the first batch of shadcn primitives, installed and restyled to the Ludwig treatments. Every later screen uses these, so they have to be right before any screen is built.

## Scope

**In**

- `pnpm dlx shadcn@latest add button input label card badge separator skeleton` into `src/components/ui/`, then restyle each in place per SPEC §6.4.
- Add `components.json` if T007 didn't, pointing at `src/components/ui` and the `globals.css` tokens.
- **Button:** variants `default` (red), `secondary` (paper, inverting to ink on hover), `ghost` and `destructive` (blood). Sizes `sm`/`default`/`lg`/`icon`, with a 3px hard offset shadow that collapses on `:active`.
- **Input:** the default answer-line style (bottom border only). The `CellInput` grid comes in T021.
- **Card:** grain, a 2px ink border, an optional `clueNumber` prop rendered top-left, and a `book` variant styled as a Pocket Puzzle Collection cover.
- **Badge:** a `difficulty` variant rendering 1–5 cells.
- **Skeleton:** grey grid cells. The `Walker` in skeletons is composed at the call site.

**Out**

- Dialogs and overlays (T012).
- Tabs, slider and form (T013).
- The showcase route (T014).

## Notes

- If the generated shadcn code includes `rounded-*` classes, remove them rather than overriding them. `--radius: 0` must be the only radius source.
- Keep the shadcn file names and exports, so future `shadcn add` diffs stay readable.

## Acceptance criteria

- [ ] **AC1**: All seven components exist in `src/components/ui/` and are installed through the shadcn CLI.
  - _Verify (cli):_ `ls src/components/ui/{button,input,label,card,badge,separator,skeleton}.tsx` lists all seven, and `components.json` exists.
- [ ] **AC2**: No component in this batch uses `rounded-*`, raw hex values or Tailwind palette colours.
  - _Verify (code):_ `grep -nE "rounded-|#[0-9a-fA-F]{3,6}\b|-(red|blue|gray|slate|zinc|neutral)-[0-9]" src/components/ui/{button,input,label,card,badge,separator,skeleton}.tsx` matches nothing.
- [ ] **AC3**: The primary button matches SPEC §6.4:
  - red fill, paper text, Josefin 700 uppercase;
  - border-radius 0 and a 2px ink border;
  - an offset shadow that collapses on press.
  - _Verify (browser):_ On a temporary test page, `getComputedStyle` on the button shows `border-radius: 0px`, `border-top-width: 2px` and `text-transform: uppercase`. The `box-shadow` differs between the normal and `:active` states (use `browser_evaluate` with a forced `:active` class or a pointer down).
- [ ] **AC4**: The secondary button inverts to an ink fill on hover.
  - _Verify (browser):_ `browser_hover` on the secondary button changes the computed `background-color` to the `--ink` value.
- [ ] **AC5**: Focus is visible with a `grid-blue` ring on button, input and card links, with no radius.
  - _Verify (browser):_ Tab to each element with `browser_press_key` Tab. The computed `outline-color` or `box-shadow` contains the `--grid-blue` value, and the radius is 0.
- [ ] **AC6**: The Card `clueNumber` and `book` variants render as specified.
  - _Verify (browser):_ The snapshot shows the clue number text in the card's top-left. The `book` variant's background resolves to the `--book-blue` value.
- [ ] **AC7**: The difficulty badge renders exactly N filled cells out of 5 for N = 1…5.
  - _Verify (unit):_ `src/components/ui/badge.test.tsx` renders each N with Testing Library and counts the filled-cell elements.
- [ ] **AC8**: Every component looks correct in both themes.
  - _Verify (browser):_ Screenshots of the test page in Paper and Ink at 1280px and 390px, saved under `.verification/T011/`.
- [ ] **AC9**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
