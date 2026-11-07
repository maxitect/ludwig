---
id: T120
title: Theme-aware surfaces and cast shadows, with a guard against raw tokens
milestone: M5
epic: E10
depends_on: []
migrations: false
requires_human: false
spec: ["SPEC §6.2", "SPEC §6.4", "PLAN §3 M5"]
skills: []
---

# T120: Theme-aware surfaces and cast shadows, with a guard against raw tokens

## Context

In the Ink theme, many puzzle panels stay light, and their ink border and `shadow` block shadow vanish against the `ink` page. The panels that do follow the theme are blue (`shadow`), not dark. See `docs/research/look-and-feel-audit.md` §1. This ticket makes every raised surface follow one rule in both themes: a surface colour, a 2px border and a hard block shadow, all of which contrast with the page. It also adds a guard so new puzzle types can't reintroduce raw tokens. T121, T122, T124, T127 and T128 build on these tokens.

## Scope

**In**

- **Tokens** (`src/app/globals.css`, in both the `[data-theme="ink"]` block and the `prefers-color-scheme: dark` block):
  - A semantic `--cast` colour for hard offset shadows, exposed to Tailwind. It is `shadow` in Paper. In Ink it is a light value (paper at reduced alpha, or `paper-deep`), so a block shadow reads clearly against `ink` without overpowering the border.
  - Ink `--card` and `--popover` change from `shadow` to `ink`, so raised surfaces are dark, not blue. Their light `border` and light `--cast` shadow separate them from the page.
  - Ink `--muted` gets a dark, non-blue value. Check every use: the active clue row, hover states and selected toggle cells.
  - An Ink-legible `--destructive`, or a separate invalid token, so the `aria-invalid` underline is visible on `ink`.
- **shadcn components:** every `shadow-[…var(--color-shadow)]` in `src/components/ui/` uses the cast token instead. That covers Button, Dialog, AlertDialog, Sheet, DropdownMenu, Popover, Tooltip and Sonner. Dialog surfaces in Ink are dark with a light block shadow.
- **Puzzle surfaces** that hand-roll `border-ink bg-paper text-ink` move to `Card`, or to `bg-card border-border text-card-foreground` plus the cast shadow:
  - the book cipher book and References panels (`src/puzzles/book-cipher/solver.tsx`);
  - the shared cipher key panel (`src/puzzles/_shared/cipher-key/cipher-key-panel.tsx`), which covers caesar, keyword and pictogram cipher;
  - the anagram tiles, the spot the difference image frames and the rota tokens.
- **Grids stay paper in Ink (decided).** `CellGrid` and the chess board keep paper cells and ink black squares, like a printed page on a dark desk. Their outer frame becomes a light `border`, and they get the cast shadow, so the grid edge and its black squares no longer merge into the page.
- **Guard:** an ESLint rule (`no-restricted-syntax` on class strings) or a Vitest test that greps the source. It rejects `border-ink`, `bg-paper`, `text-ink` and `var(--color-shadow)` in `src/puzzles/**` and `src/components/**`. An explicit allowlist covers the intentional uses: the book-band caps on volume cards, chess squares, black crossword cells, and grid cells that stay paper by decision. It runs in `pnpm lint` or `pnpm test`.
- **Docs:** update SPEC §6.2 (the Ink mapping: `card` → ink, the cast token, `muted`) and §6.4 (Card and Dialog in Ink). Update `.claude/rules/design-system.md`: borders are 2px semantic `border`, and shadows use the cast token.

**Out**

- Chess piece outlines (T121), the solved footer (T122), disabled and error states beyond the token values (T124), and book cipher layout (T127).

## Notes

- The book-blue volume cards keep their `bg-paper text-ink` caps band (`card.tsx` `book` variant, `this-week/page.tsx`, `gears/page.tsx`). Allowlist them.
- Grain stays above dialogs and toasts. That was decided, and is not a defect.
- Reference screenshots from the audit (local only) include `s-bookcipher-ink-d.png`, `s-caesar-ink-d.png`, `s-crossword-ink-d.png` and `ks-overlay-alert-dialog-ink.png`. Retake them for the report.

## Acceptance criteria

- [ ] **AC1**: In Ink, every puzzle text panel is dark, with a visible light border and a visible light block shadow.
  - _Verify (browser):_ In Ink at 1280px and 390px, open a book cipher, caesar, keyword, pictogram cipher, anagram, spot the difference and rota puzzle. For each panel, `getComputedStyle` gives a background equal to `--card` (ink) and a non-`ink` border colour. Screenshots show the shadow. Take the same screenshots in Paper and confirm there is no regression.
- [ ] **AC2**: In Ink, dialogs, alert dialogs, sheets, dropdowns, tooltips and toasts are dark (not blue), with a light block shadow.
  - _Verify (browser):_ On `/dev/kitchen-sink` in Ink, open each overlay and screenshot it. The computed background is not `#1E2B3B`.
- [ ] **AC3**: In Ink, crossword, sudoku, futoshiki and chess boards have a visible light frame, and black squares no longer merge into the page.
  - _Verify (browser):_ Screenshot a 15×15 crossword and a sudoku in Ink. The outer frame is visible along all four edges.
- [ ] **AC4**: Every hard shadow is visible in both themes.
  - _Verify (browser):_ On `/dev/kitchen-sink`, the button, card and toast shadows are visible in Paper and Ink screenshots. The contrast of the Ink cast against `ink` is at least 3:1 (`browser_evaluate` computes it from the resolved colours).
- [ ] **AC5**: The invalid input underline is visible in Ink.
  - _Verify (browser):_ Submit the sign-up form empty in Ink. The underline contrast against `ink` is at least 3:1.
- [ ] **AC6**: The guard rejects raw tokens.
  - _Verify (cli):_ Adding `className="border-ink"` to a puzzle solver makes `pnpm lint` (or `pnpm test`) fail with a message naming the rule. Revert, and it passes.
- [ ] **AC7**: The spec and rules match the code.
  - _Verify (cli):_ `grep -n "card" docs/SPEC.md` shows the new Ink mapping, and `.claude/rules/design-system.md` names the cast token.
- [ ] **AC8**: The behaviour holds on the PR's preview.
  - _Verify (deploy):_ Repeat AC1 for the book cipher in Ink on the preview URL.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
