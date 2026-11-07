---
id: T053
title: "Puzzle type: book cipher and book_texts"
milestone: M4
epic: E8
depends_on: [T052]
migrations: true
requires_human: false
spec: ["SPEC §1.2 (S1E6 Bowerbird)", "SPEC §2.3", "SPEC §7.4.4 (book-cipher)", "SPEC §7.4.5 (book_cipher_refs.text_id)", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/db-trigger", "/zod4"]
---

# T053: Puzzle type: book cipher and book_texts

## Context

This is the S1E6 book cipher (SPEC §1.2). References are page:line:word into a public-domain source text kept in the app, and the plaintext is derived. `book_cipher_refs.text_id` is controlled redundancy (SPEC §7.4.5). It is kept consistent by a composite FK and a fill trigger.

## Scope

**In**

- **Source text:**
  - `book_texts` and `book_text_lines`, seeded from one public-domain text file in `content/book-texts/`, paginated deterministically into pages and lines;
  - a bird book is preferred as a nod to the Bowerbird (any pre-1929 public-domain natural history text);
  - the source and its public-domain status recorded in `book_texts`.
- **`src/puzzles/book-cipher/`**, built per `/new-puzzle-type`:
  - `book_cipher_puzzles(text_id)`;
  - `book_cipher_refs` with composite FKs `(puzzle_id, text_id)` → `book_cipher_puzzles` and `(text_id, page, line)` → `book_text_lines`;
  - `book_cipher_attempts`.
- **The `trg_book_cipher_refs_fill_text_id`** `BEFORE INSERT` trigger, in a custom migration (`/db-trigger`).
- **A reader UI:** a paginated view of the source text, side by side with the reference list, reusing the T052 cipher-key panel where it applies.
- **Content:** 5 original puzzles.

**Out**

- More than one source text in v1. The schema supports it; the content doesn't need it.

## Acceptance criteria

- [ ] **AC1**: The fill trigger populates `text_id`, and the composite FK rejects drift.
  - _Verify (db):_ inserting a ref without `text_id` gets it filled from the puzzle. A ref whose explicit `text_id` differs from the puzzle's fails on the FK.
  - _Verify (unit):_ a DB-integrity test in the T005 harness covers both cases.
- [ ] **AC2**: References to a page or line that doesn't exist fail on the FK.
  - _Verify (db)._
- [ ] **AC3**: The plaintext is derived (no plaintext column), and `word_index` beyond the line's word count is caught by `puzzles:verify`.
  - _Verify (code):_ there is no plaintext column.
  - _Verify (unit):_ `derive.test.ts` has page:line:word fixtures.
  - _Verify (cli):_ `puzzles:verify` fails on a broken copy.
- [ ] **AC4**: The payload contains references and access to the text, but no derived plaintext.
  - _Verify (unit):_ the payload leak test passes.
- [ ] **AC5**: Signed in, a solve is recorded.
  - _Verify (browser + db):_ `book_cipher_attempts.answer` is set and `completed_at` is set.
- [ ] **AC6**: Page navigation in the reader is keyboard-operable, and the page:line:word location is announced.
  - _Verify (browser)._
- [ ] **AC7**: Both themes render at 1280px and 390px. At 390px the reader and the reference list stack.
  - _Verify (browser):_ screenshots.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
