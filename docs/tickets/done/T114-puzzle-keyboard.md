---
id: T114
title: Shared on-screen PuzzleKeyboard, CellGrid keyboard mode and the device-keyboard setting
milestone: M5
epic: E12
depends_on: [T113]
migrations: false
requires_human: false
spec: ["SPEC §4.1", "SPEC §4.5", "SPEC §6.4", "PLAN §3 M5"]
skills: []
---

# T114: Shared on-screen PuzzleKeyboard, CellGrid keyboard mode and the device-keyboard setting

## Context

The system keyboard takes about half a phone screen and hides the clue, the grid or the text being deciphered (`docs/research/mobile.md` §3–4). In solve mode, typed solvers will use our own fixed-height pad instead, as Puzzmo does. This ticket builds the shared pad and wires it into `CellGrid`. T115 and T116 adopt it per type.

## Scope

**In**

- `src/puzzles/_shared/puzzle-keyboard/`, a `PuzzleKeyboard` component:
  - Layouts: `alpha` (three QWERTY rows) and `digits` (taking the allowed digits, e.g. 1–9 or 1–N).
  - An erase key.
  - An optional action row (`children`) for the solver's own buttons, such as Check cell, Notes or Clues.
  - Keys are `<button>`s about 48px tall, with accessible names ("Q", "Delete"), inside `role="group"` with `aria-label="Keyboard"`. They are styled in tokens only: square ink keys on paper, red only when a key is active.
  - Keys call `preventDefault` on `pointerdown`, so focus stays on the grid's hidden input and the system keyboard never flashes.
- `CellGridHandle` gains `type(char)` and `erase()`. They run the same `enter` and `erase` paths as a physical key, so the pad adds no new state path.
- A `usePuzzleKeyboard()` hook. It returns whether the pad is active: `touch` matches, the device-keyboard setting is off, and no hardware keyboard has been seen. When the pad is active, `CellGrid` and `DigitGrid` put `inputmode="none"` on the hidden input. The hidden input stays focusable, so physical keys and assistive tech still work.
- **Hardware keyboard.** A printable `keydown` that did not come from the pad hides the pad until the next tap on the grid.
- **Device-keyboard setting.** "Use my device's keyboard" is a toggle in the solve-mode menu (T113). It is stored in `localStorage` under `ludwig:device-keyboard`, in try/catch, because it belongs to the device and must work signed out. When it is on, the pad is hidden, the hidden input gets its normal `inputMode`, and the solve-mode bottom slot is lifted above the system keyboard by a `useKeyboardInset()` hook. On iOS the hook uses `visualViewport` resize and scroll; with `interactive-widget=resizes-content`, `dvh` already handles Android.
- `/dev/kitchen-sink` shows both layouts in both themes.
- SPEC §4.5: in solve mode, typed solvers use `PuzzleKeyboard`. Add the same line to `.claude/rules/puzzles.md` and the `/new-puzzle-type` skill, so that future typed types (word ladder, acrostic, kakuro and so on) adopt it.

**Out**

- Adopting the pad in crossword (T115) and in the other types (T116).
- Android Backspace through the system keyboard (T117).

## Notes

- Use one module-level store for the "hardware keyboard seen" flag and the setting (`useSyncExternalStore`), so every grid on the page agrees. The server snapshot is "pad inactive", so SSR renders the plain input and the pad appears after hydration.
- Read `useKeyboardInset`'s offsets in a `requestAnimationFrame`. iOS 26 can leave `visualViewport.offsetTop` non-zero after the keyboard closes (Apple forums thread 800125), so reset when `visualViewport.height` returns to `innerHeight`.

## Acceptance criteria

- [ ] **AC1**: Pad keys drive the grid through the handle.
  - _Verify (unit):_ A Vitest and Testing Library test renders `CellGrid` with `PuzzleKeyboard` wired to its handle. Clicking Q, then A, then Delete leaves "Q" in the first cell, and the active cell has advanced and stepped back accordingly.
- [ ] **AC2**: In solve mode the hidden input does not raise the system keyboard.
  - _Verify (browser):_ In the `mobile` emulation, on a page using the `__fixture` or kitchen-sink grid, the hidden input has `inputmode="none"` after hydration. At 1280px it has no `inputmode="none"`.
- [ ] **AC3**: Focus stays on the grid input while keys are tapped.
  - _Verify (browser):_ In the `mobile` emulation, tap a cell, then `.tap()` three keys. `document.activeElement` is the grid's hidden input after each tap.
- [ ] **AC4**: A physical key hides the pad, and a tap on the grid brings it back.
  - _Verify (browser):_ `page.keyboard.press("B")` hides the pad (`role=group[name=Keyboard]` is not visible). Tapping a cell shows it again.
- [ ] **AC5**: The device-keyboard setting turns the pad off and persists.
  - _Verify (browser):_ Toggle "Use my device's keyboard" in the solve menu. The pad is hidden and the input has no `inputmode="none"`. After a reload it is still on, and `localStorage["ludwig:device-keyboard"]` is set.
- [ ] **AC6**: The keyboard inset follows `visualViewport`.
  - _Verify (unit):_ A test with a mocked `visualViewport` (`height` 500, `offsetTop` 0, `innerHeight` 844) gets an inset of 344. After `height` returns to 844, the inset is 0.
- [ ] **AC7**: The pad passes the brand checklist (SPEC §8.3) in both themes.
  - _Verify (browser):_ Screenshots of `/dev/kitchen-sink` at 390px in Paper and Ink show square keys, token colours only, and a visible `grid-blue` focus ring on a focused key.
- [ ] **AC8**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
