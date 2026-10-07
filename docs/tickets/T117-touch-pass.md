---
id: T117
title: Touch pass (tap targets, chess tap-to-move, spot-difference compare, Android backspace, WebKit project)
milestone: M5
epic: E12
depends_on: [T113]
migrations: false
requires_human: false
spec: ["SPEC §6.7", "SPEC §5.1", "SPEC §8.2", "PLAN §3 M5"]
skills: []
---

# T117: Touch pass (tap targets, chess tap-to-move, spot-difference compare, Android backspace, WebKit project)

## Context

The audit in `docs/research/mobile.md` §3 found several touch problems outside the keyboard work:

- tap targets under 44px;
- a chess board that only moves by dragging on touch;
- spot-the-difference scenes stacked so they can't be compared;
- a possible Android Backspace bug in `CellGrid` when the system keyboard is used;
- no WebKit coverage in Playwright.

## Scope

**In**

- **Tap targets of at least 44×44px under `touch:`** (from T113), without changing desktop sizes:
  - `Button` sizes `sm`, `default` and `icon`, and `Toggle` `sm`;
  - the mobile menu trigger;
  - the cipher key slots;
  - the crossword clue list buttons;
  - the book-cipher reference buttons;
  - the rota tokens;
  - the gear swap buttons.
- **Chess tap-to-move** in `src/puzzles/_shared/chess-board/`. Tap a piece to select it, then tap a target square, using react-chessboard v5's `onPieceClick` and `onSquareClick`. It follows the same path as the keyboard Enter pick. Tapping the selected piece again cancels. The uncapture tray works by tap too.
- **Spot the difference on phones.** Under `touch:` only one scene shows at a time, at full width, with a two-way toggle (`ToggleGroup`: "Left" and "Right") to flip between them. A tap on the visible scene counts as before.
- **Android Backspace.** When the system keyboard is in use, `CellGrid` handles `beforeinput` with `inputType === "deleteContentBackward"` as an erase, so Gboard's `keydown` (key `Unidentified`, keyCode 229) on an empty input still erases. A physical Backspace must not erase twice.
- **Playwright WebKit project.** Add an `iphone` project (`devices["iPhone 15"]`, WebKit) that runs the mobile-specific specs (`*-mobile.spec.ts`) and the sign-in smoke test. Install WebKit in CI.
- SPEC §6.7 "Mobile": a minimum 44px target under `touch`.

**Out**

- The Casebook and gear state table layouts, which already scroll sideways.
- Landscape and tablet.

## Acceptance criteria

- [ ] **AC1**: Every interactive control on the listed screens is at least 44×44px in the `mobile` emulation.
  - _Verify (browser):_ A `browser_evaluate` script on one solve page per listed type, plus the open mobile nav, collects the `getBoundingClientRect()` of every `button`, `a`, `input` and `[role=gridcell]` outside `role=grid`. None is under 44 in either dimension. At 1280px the sizes match the pre-change screenshots.
- [ ] **AC2**: A Reverse Chess Mode A puzzle can be solved by taps only.
  - _Verify (cli):_ A new spec, `e2e/reverse-chess-mobile.spec.ts`, solves a curated Mode A puzzle with `.tap()` on a piece and then a square (plus the tray if needed), and sees "Solved.".
- [ ] **AC3**: Spot the difference shows one scene at a time on phones.
  - _Verify (browser):_ In the `mobile` emulation, only one scene is visible. The toggle switches it, and a tap on a known difference in either scene registers it.
- [ ] **AC4**: `deleteContentBackward` erases exactly once.
  - _Verify (unit):_ A `CellGrid` test dispatches `beforeinput` with `inputType: "deleteContentBackward"` on the hidden input and clears one cell. A physical `Backspace` keydown followed by its own `beforeinput` clears one cell, not two.
- [ ] **AC5**: The WebKit iPhone project runs in CI.
  - _Verify (cli):_ `pnpm test:e2e --project=iphone` passes locally. `.github/workflows/*.yml` installs WebKit and runs the project in the preview end-to-end job.
- [ ] **AC6**: The behaviour holds on the PR's preview.
  - _Verify (deploy):_ The preview end-to-end job, including `iphone`, is green on the PR.
- [ ] **AC7**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
