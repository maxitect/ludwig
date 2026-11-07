---
id: T124
title: Disabled, error, contrast and focus states
milestone: M5
epic: E10
depends_on: [T120]
migrations: false
requires_human: false
spec: ["SPEC §6.2", "SPEC §6.4", "SPEC §8"]
skills: []
---

# T124: Disabled, error, contrast and focus states

## Context

Several states rely on opacity, or on colours that fail contrast. See `docs/research/look-and-feel-audit.md` §5. Fixing them before T068 means the accessibility audit checks the final look.

## Scope

**In**

- **Disabled buttons** (`src/components/ui/button.tsx`): replace `disabled:opacity-50` with explicit muted tokens per variant. That covers the fill, the border, the text and no shadow. Disabled buttons must look the same in both themes and must not let grain show through. Cover CHECK, CHECK CELL, UNDO, UNPROMOTE and EN PASSANT.
- **Auth field errors** (`src/components/auth/auth-form.tsx`): style them like `FormMessage` (`text-destructive`), not as underlined foreground text that looks like a link.
- **Cipher key panel** (`src/puzzles/_shared/cipher-key/cipher-key-panel.tsx`):
  - Answer underlines get at least 3:1 against the panel (today they are `border-paper-shade`, about 1.4:1).
  - Unused key letters (today `opacity-30`) meet AA for text. Show "unused" by a means other than fading, for example a dashed cell border.
- **Anagram focus** (`src/puzzles/anagram/solver.tsx`): the focus ring appears only for keyboard focus (`:focus-visible`), and it hugs the tile row instead of a box well past the tiles.
- **Focus ring on dark cells:** the ring is at least 3:1 against both paper and ink cells in each theme. Use an outline plus an offset contrasting halo if needed.
- **Icon buttons** (`size="icon"`, gear crank "+"/"−"): the glyphs are at the 2px stroke and sized to read at a glance.

**Out**

- Surface and shadow tokens (T120).
- The full axe audit (T068).

## Acceptance criteria

- [ ] **AC1**: Disabled buttons use tokens, not opacity, and match across themes.
  - _Verify (browser):_ On `/dev/kitchen-sink` and on a reverse chess puzzle in Paper and Ink, the computed `opacity` of a disabled button is `1`. Screenshots show no grain through the fill.
- [ ] **AC2**: Auth errors are red and not underlined.
  - _Verify (browser):_ Submit sign-up empty in both themes. The error's computed colour resolves to `--destructive`, and `text-decoration-line` is `none`.
- [ ] **AC3**: Cipher underlines and unused key letters meet contrast.
  - _Verify (browser):_ `browser_evaluate` computes at least 3:1 for the underline and at least 4.5:1 for the unused letter text in both themes.
- [ ] **AC4**: The anagram shows no focus ring on page load, and a tight one after pressing Tab.
  - _Verify (browser):_ Screenshots before and after a Tab key press.
- [ ] **AC5**: The focus ring is at least 3:1 against a black crossword cell and a dark chess square in both themes.
  - _Verify (browser):_ Focus each element and compute the contrast.
- [ ] **AC6**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
