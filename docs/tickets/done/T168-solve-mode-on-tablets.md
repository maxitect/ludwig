---
id: T168
title: Solve mode on tablets (iPad): our keyboard and the clue bar, no system keyboard
milestone: M5
epic: E12
depends_on: [T115, T116]
migrations: false
requires_human: false
preview: true
spec: ["SPEC §4.5", "SPEC §6.7", "PLAN §3 M5"]
skills: []
---

# T168: Solve mode on tablets (iPad): our keyboard and the clue bar, no system keyboard

## Context

User report (2026-11-10): on an iPad the crossword gets the desktop layout, but tapping a cell still raises the system keyboard. It covers the lower half of the page, so the clue and the cell being typed can't both be seen, and the player scrolls up and down for every entry. On phones this was solved by solve mode (T113 to T116): a fixed page, the clue bar and our own `PuzzleKeyboard`.

The cause is the `touch` variant (SPEC §6.7): `(pointer: coarse) and (max-width: 47.999rem)`. An iPad is 768px wide or more, so it falls outside, and SPEC says "Landscape phones and tablets keep the desktop layout". This ticket changes that for tablets.

## Scope

**In**

- **Solve mode reaches touch tablets** in portrait and landscape: the page doesn't scroll, the system keyboard doesn't open, typed solvers use `PuzzleKeyboard`, and the crossword shows its clue bar. The same rule applies to every solver that uses `PuzzleKeyboard` or a tap input in phone solve mode (the crossword, sudoku, futoshiki, kakuro, fillomino, the ciphers, the book cipher, napkin maths, word wheel, Troix and the others), because they share the cause.
- **One definition of "touch".** The CSS variant in `src/app/globals.css` and `TOUCH_QUERY` in `src/puzzles/_shared/puzzle-keyboard/keyboard-store.ts` must stay the same query. Decide how tablets are matched (widen `touch`, or add a tablet variant beside it) and record the choice in SPEC §6.7.
- **A layout that suits the width.** A phone layout stretched to 1024px is not acceptable. At the least: the grid is sized by the solver area's height so it never needs scrolling, and the pad and clue bar have a sensible maximum width and are centred. In landscape the crossword may put the clue list beside the grid instead of behind the Clues sheet; the implementer decides and self-assesses on the preview.
- **Hardware keyboards.** An iPad with a keyboard attached behaves as phones do now: a printable physical key hides the pad until the next tap on the grid, and "Use my device's keyboard" still works and lifts the bottom slot above the system keyboard.
- **Tests.** A Playwright project or spec at iPad sizes (WebKit, portrait and landscape) covering the crossword and one digit type: no page scroll, the pad is shown, the hidden input has `inputmode="none"`, and the clue stays visible while typing.
- SPEC §4.5 and §6.7 updated in the same PR.

**Out**

- Landscape phones. They keep the desktop layout unless the chosen query covers them for free; say which in the report.
- Touchscreen laptops, whose primary pointer is fine.
- New keyboard layouts or new solver features.
- The screen-reader checks (T070).

## Notes

- iPad viewport sizes to test: 768x1024 (mini and older), 820x1180 (Air), 1024x1366 (Pro 12.9), each in both orientations. Split View and Stage Manager can make the window narrower than 768px, which already gets phone solve mode.
- `touch-short` (`max-height: 44.999rem`) exists for short phones. Check what it does to a landscape tablet (768px tall is above it; 744px on an iPad mini is not).
- An iPad with a trackpad still reports `pointer: coarse` as its primary pointer in Safari; confirm rather than assume, and don't rely on `hover`.
- `--solver-height` and the bottom slot (`SolveSlot`) already do the sizing on phones. Reuse them; don't build a second mechanism.
- Solve mode hides the site header and footer for a compact solve header. That is fine on a tablet.
- Visual sign-off: no human approval step. The implementer assesses the preview in the browser at the sizes above in both themes, and the user reviews the preview on a real iPad afterwards.

## Acceptance criteria

- [ ] **AC1**: On a touch tablet in portrait, the crossword solve page doesn't scroll, shows the clue bar and our pad, and tapping a cell doesn't open the system keyboard.
  - _Verify (browser):_ WebKit at 820x1180 with touch: open a crossword, tap a cell, type an entry with the pad. `document.scrollingElement.scrollHeight === innerHeight`, the hidden input has `inputmode="none"`, and the active clue is in view throughout. Screenshots in both themes.
- [ ] **AC2**: The same holds in landscape.
  - _Verify (browser):_ WebKit at 1180x820 and 1366x1024 with touch: as AC1. The grid, the active clue and the pad are all visible at once without scrolling. Screenshots in both themes.
- [ ] **AC3**: Every typed type uses the pad on a tablet.
  - _Verify (browser):_ At 820x1180 with touch, open one puzzle of each type that uses `PuzzleKeyboard` in phone solve mode: the pad (or the type's own tap input) is shown and the hidden input has `inputmode="none"`.
- [ ] **AC4**: The layout suits the width.
  - _Verify (browser):_ At 1024x1366 and 1366x1024 the pad and clue bar are no wider than their stated maximum and are centred, and the grid fills the solver area without scrolling. Screenshots.
- [ ] **AC5**: A hardware keyboard and the device-keyboard setting work as on phones.
  - _Verify (browser):_ At 820x1180 with touch, press a letter key: the pad hides and the letter is entered; tap the grid: the pad returns. Turn on "Use my device's keyboard": the pad stays hidden and the clue bar stays visible.
- [ ] **AC6**: Phones and desktop are unchanged.
  - _Verify (cli):_ The existing `*-mobile.spec.ts` and desktop specs pass unchanged. Desktop at 1280px with a fine pointer keeps the desktop layout.
- [ ] **AC7**: The CSS variant and `TOUCH_QUERY` are one definition, and SPEC §4.5 and §6.7 describe tablets.
  - _Verify (code):_ Both use the same query string or share one constant, and the SPEC diff is in the PR.
- [ ] **AC8**: The behaviour holds on the PR's preview.
  - _Verify (deploy):_ Run the new iPad spec with `PLAYWRIGHT_BASE_URL=<preview-url>`.
- [ ] **AC9**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
