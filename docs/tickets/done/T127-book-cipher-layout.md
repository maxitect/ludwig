---
id: T127
title: "Book cipher: lines never wrap on desktop, clear continuations on phones, aligned references"
milestone: M5
epic: E10
depends_on: [T120]
migrations: false
requires_human: false
spec: ["SPEC §2.3", "SPEC §7.4.4", "SPEC §6"]
skills: []
---

# T127: Book cipher: lines never wrap on desktop, clear continuations on phones, aligned references

## Context

The book cipher's mechanic is line numbers, so a book line must always read as one line. Today long lines wrap. For example, page 4 line 6 of *The Natural History of Selborne* puts "of" on a second, unnumbered row that looks like a line of its own, so a reference can be miscounted. On phones almost every line wraps. The reference chips also vary in width, which misaligns the answer lines. See `docs/research/look-and-feel-audit.md` §7.

## Scope

**In**

- **Desktop and tablet: never wrap.**
  - Lines are `white-space: nowrap`.
  - `paginate` already packs lines to at most `LINE_WIDTH` (56) characters (`src/puzzles/book-cipher/derive.ts`), so the worst case is known and fixed. Size the text column to fit `LINE_WIDTH` characters of Jost at the body size, with a margin for wide glyphs. Use a size container and `font-size: min(<body size>, calc(100cqi / <LINE_WIDTH × Jost average width>))` so narrower panels shrink to fit. Express the CSS in terms of `LINE_WIDTH`, not a second hard-coded number.
  - The book panel takes more of the row if needed. The References column only needs about `13rem`.
- **Phones: wrap clearly.** Once the fitted size would drop below about 14px, lines wrap. Continuation rows then get a hanging indent and a turn marker (for example `↪` in `ink-soft`, `aria-hidden`), and alternate lines get a faint band. It is never ambiguous which numbered line a word belongs to.
- **Width check:** a test renders the widest line in the seeded books (and a synthetic 56-character line of wide letters) and confirms it fits on one line at the desktop size. If `LINE_WIDTH` ever changes, this test catches the layout.
- **References:**
  - The chips have a fixed width (`w-[7ch]` or a grid column), so every answer line starts and ends at the same x.
  - The panel titles use the uppercase credit style (`Credit`, or the same classes).
- **Phone layout:** the References panel stays reachable without a long scroll past the whole page: sticky, or above the book as a compact strip. Previous and Next page stay on one row. Coordinate with T113 solve mode if it has landed.

**Out**

- Surface colours (T120).
- Other cipher types.

## Notes

- Screen readers already get the word position through the `sr-only` text in the `mark`. Keep it.
- Keep the arrow-key page navigation (`onReaderKeyDown`).

## Acceptance criteria

- [ ] **AC1**: At 1280px and 1024px, no book line wraps on any page of any book cipher.
  - _Verify (browser):_ For each published book cipher, step through every page. `browser_evaluate` checks that each `li`'s text span has a single line box (`getClientRects().length === 1`). Take screenshots of page 4 of the Selborne puzzle in both themes.
- [ ] **AC2**: At 390px, every continuation row is marked and indented.
  - _Verify (browser):_ Screenshot in both themes. Every `li` with more than one line box shows the marker, and the continuation starts right of the text column's left edge.
- [ ] **AC3**: A worst-case 56-character line fits on one line at 1024px.
  - _Verify (browser):_ The width check from scope passes. In the browser, the computed font size of the book text at 1024px is at least 14px.
- [ ] **AC4**: The reference answer lines align.
  - _Verify (browser):_ `browser_evaluate`: every answer input has the same `left` and `width`.
- [ ] **AC5**: The panel titles are uppercase display type.
  - _Verify (browser):_ The computed `text-transform` is `uppercase` and the font family is Josefin.
- [ ] **AC6**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
