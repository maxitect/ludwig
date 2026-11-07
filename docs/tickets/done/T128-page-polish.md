---
id: T128
title: Per-page polish (rota, hubs, collection, sign-in, kitchen sink)
milestone: M5
epic: E10
depends_on: [T120]
migrations: false
requires_human: false
spec: ["SPEC §3", "SPEC §6.3"]
skills: []
---

# T128: Per-page polish (rota, hubs, collection, sign-in, kitchen sink)

## Context

These are the smaller layout and content defects from the audit (`docs/research/look-and-feel-audit.md` §8). None is severe on its own, but together they make the app feel unfinished.

## Scope

**In**

- **Rota** (`src/puzzles/rota/`):
  - The clue column is wide enough that clues don't wrap mid-phrase (today it is about 170px).
  - The intro uses body size like the other types.
  - At 390px the board keeps the page gutter.
- **Reverse Chess hub** (`src/app/(app)/reverse-chess/page.tsx:33,40`): Unwind and Proof Game are no longer both labelled "Mode B". Use the names from SPEC §5.1, and update the spec if they disagree.
- **Gears hub:**
  - Don't repeat the difficulty on every row under a heading that already gives it.
  - The gears solve page doesn't stack two red primary buttons (ACCUSE and CHECK). Only one action is primary at a time.
- **Collection** (`src/app/(app)/puzzles/page.tsx`): a type with 0 published puzzles gets a "coming soon" treatment. It is not styled as a live link, and it is either not focusable or links to a page that says so. T130 reuses this.
- **Sign-in and sign-up:** the form sits on a card with the ink splat behind the wordmark, as SPEC §6.3 says.
- **Kitchen sink** (`src/app/dev/kitchen-sink/theme-toggle.tsx`): the toggle starts on the user's current theme.

**Out**

- The book cipher (T127), the 404 (T126), and thumbnails (T130).

## Acceptance criteria

- [ ] **AC1**: The rota clues read in full lines, and the board keeps the gutter at 390px.
  - _Verify (browser):_ Screenshots at 1280px and 390px in both themes.
- [ ] **AC2**: The Reverse Chess hub labels are distinct and match the spec.
  - _Verify (browser):_ A snapshot of `/reverse-chess` lists each mode label once.
- [ ] **AC3**: The gears hub shows the difficulty once per group, and the solve page has one primary button.
  - _Verify (browser):_ Screenshots of `/gears` and a gears solve page.
- [ ] **AC4**: Types with nothing published look unavailable.
  - _Verify (browser):_ On `/puzzles`, a 0-published card has no `href` (or links to a coming-soon state) and is visually distinct in both themes.
- [ ] **AC5**: The sign-in page has the card and the ink splat.
  - _Verify (browser):_ Screenshots of `/sign-in` in both themes at 1280px and 390px.
- [ ] **AC6**: The kitchen-sink toggle matches the active theme on load.
  - _Verify (browser):_ With Ink saved in settings, `/dev/kitchen-sink` opens in Ink.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
