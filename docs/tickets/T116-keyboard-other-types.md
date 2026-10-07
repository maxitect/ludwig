---
id: T116
title: On-screen keyboard for sudoku, futoshiki and the ciphers
milestone: M5
epic: E12
depends_on: [T114]
migrations: false
requires_human: false
spec: ["SPEC §4.5", "SPEC §2.3", "PLAN §3 M5"]
skills: []
---

# T116: On-screen keyboard for sudoku, futoshiki and the ciphers

## Context

Every other typed type suffers from the system keyboard too (`docs/research/mobile.md` §3):

- sudoku and futoshiki lose their bottom rows and the Notes toggle;
- caesar, keyword and pictogram cipher lose the ciphertext above the key slots;
- book cipher hides the page you are reading from.

This ticket adopts T114's pad in each of them.

## Scope

**In**

- **Sudoku and futoshiki** (through `DigitGrid`): the `digits` pad with the type's allowed digits, and the Notes toggle plus Clear notes in the action row. Notes mode applies to taps on the pad exactly as it does to typed digits.
- **Caesar, keyword and pictogram cipher** (through `CipherKeyPanel`):
  - The ciphertext stays in view in the flexible area.
  - The 26 key slots are in a compact strip or grid above the pad.
  - Tapping a slot selects it, and pad letters fill it.
  - In pad mode the slot `<input>`s take `inputmode="none"`.
- **Book cipher:**
  - The page stays in view in the flexible area.
  - A bar above the pad shows the active reference and its current answer, with previous and next reference buttons.
  - Pad letters fill the active reference.
- Each type keeps its desktop layout, and its existing keyboard specs still pass.

**Out**

- Types not yet built (word ladder, acrostic and the M6 grid types). They adopt the pad in their own tickets, as the rule added by T114 requires.
- Touch target sizes outside the pad (T117).

## Acceptance criteria

- [ ] **AC1**: At 390×844, each type shows its working area and the pad together.
  - _Verify (browser):_ In the `mobile` emulation, for a sudoku, a futoshiki, a caesar, a pictogram cipher and a book cipher, the pad's bounding box and the grid, ciphertext or book page lie inside the viewport, with no overlap. Take screenshots in both themes.
- [ ] **AC2**: Sudoku can be solved by tapping, including notes.
  - _Verify (cli):_ The new spec `e2e/sudoku-mobile.spec.ts` (`mobile` project) enters one note with Notes on, then completes the grid with pad taps and sees "Solved.".
- [ ] **AC3**: A caesar and a pictogram cipher can be solved by tapping.
  - _Verify (cli):_ The new spec `e2e/cipher-mobile.spec.ts` taps slots and pad letters until "Solved." shows, and asserts that the ciphertext stayed visible after every key (`toBeInViewport`).
- [ ] **AC4**: A book cipher reference can be answered by tapping, with the page in view.
  - _Verify (browser):_ Tap next reference twice, then type the answer on the pad. The bar shows the answer, and the book page is `toBeInViewport` throughout.
- [ ] **AC5**: The desktop and keyboard behaviour is unchanged.
  - _Verify (cli):_ `pnpm test:e2e --project=desktop` passes, including the sudoku, futoshiki and cipher keyboard specs.
- [ ] **AC6**: The behaviour holds on the PR's preview.
  - _Verify (deploy):_ Run AC2 and AC3 against the preview with `VERCEL_AUTOMATION_BYPASS_SECRET` set.
- [ ] **AC7**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
