---
id: T115
title: Crossword on phones (clue bar, clue sheet, keyboard)
milestone: M5
epic: E12
depends_on: [T114]
migrations: false
requires_human: false
spec: ["SPEC §4.5", "SPEC §2.3", "PLAN §3 M5"]
skills: []
---

# T115: Crossword on phones (clue bar, clue sheet, keyboard)

## Context

This is the case that started the mobile work. With the system keyboard open, the clue and the grid can't both be seen (`docs/research/mobile.md` §4.3). In solve mode the crossword now shows, from top to bottom: the grid, a clue bar, and the `PuzzleKeyboard` from T114.

## Scope

**In**

- The crossword solver in solve mode (`src/puzzles/crossword/solver.tsx`), for both quick and cryptic styles:
  - The grid fills the flexible area.
  - The clue bar sits directly above the pad, with:
    - previous-clue and next-clue buttons, running in `deriveWords` order across both directions;
    - the active entry's label, clue text and enumeration, in one or two lines, never more;
    - tapping the clue text toggles direction when the active cell is in both an across and a down entry.
  - The `alpha` pad, with the action row Check cell, Reveal cell and Clues.
  - "Clues" opens a bottom `Sheet` holding the existing across/down `Tabs` list. Choosing a clue closes the sheet and selects that entry.
  - In solve mode the above-grid clue line and the inline clue list are hidden, so nothing is shown twice. The `aria-live` clue announcement still comes from a single place.
- With the device-keyboard setting on, the clue bar sits above the system keyboard through `useKeyboardInset`.

**Out**

- The desktop layout, which is unchanged.
- Other types (T116).

## Acceptance criteria

- [ ] **AC1**: At 390×844, the grid, the clue bar and the pad are all fully in view at once.
  - _Verify (browser):_ In the `mobile` emulation, open the largest curated cryptic and a quick crossword. The bounding boxes of `role=grid`, the clue bar and `role=group[name=Keyboard]` lie inside the viewport and don't overlap. Take screenshots in both themes.
- [ ] **AC2**: A crossword can be solved by tapping alone.
  - _Verify (cli):_ A new spec, `e2e/crossword-mobile.spec.ts` (`mobile` project only), fills a quick crossword using only `.tap()` on cells, pad keys and the next-clue button, presses Check in the menu, and sees "Solved.".
- [ ] **AC3**: Previous and next walk every entry, and tapping the clue toggles direction.
  - _Verify (browser):_ From 1 Across, pressing next as many times as there are entries returns to 1 Across, and the clue bar shows each entry once. On a cell in both an across and a down entry, tapping the clue text switches the highlighted entry.
- [ ] **AC4**: The clue sheet selects an entry.
  - _Verify (browser):_ Open Clues, choose the Down tab, then tap the third down clue. The sheet closes, the clue bar shows that clue, and its cells are highlighted.
- [ ] **AC5**: Check cell and Reveal cell work from the action row.
  - _Verify (browser):_ Signed in, type a wrong letter and tap Check cell. The status says "not right". Reveal cell fills the correct letter.
- [ ] **AC6**: Desktop is unchanged.
  - _Verify (cli):_ The existing crossword specs pass in the `desktop` project.
- [ ] **AC7**: The behaviour holds on the PR's preview.
  - _Verify (deploy):_ Run AC2's spec against the preview with `VERCEL_AUTOMATION_BYPASS_SECRET` set.
- [ ] **AC8**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
