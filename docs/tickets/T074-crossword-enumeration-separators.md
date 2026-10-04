---
id: T074
title: Crossword enumeration separators (hyphen or word break)
milestone: M4
epic: E8
depends_on: [T045]
migrations: true
requires_human: false
spec: ["SPEC §7.4.4 (crossword)", "SPEC §2.3"]
skills: ["/zod4"]
---

# T074: Crossword enumeration separators (hyphen or word break)

## Context

Cryptic crosswords (T045) need enumerations such as "(5-4)" for hyphenated answers, but `crossword_clue_segments` only stores lengths, so `deriveEnumeration` (`src/puzzles/crossword/derive.ts`) always joins with commas. This ticket stores the separator so both "(3,4)" and "(5-4)" render.

## Scope

**In**

- A separator on `crossword_clue_segments`: an enum (e.g. `segment_separator`: 'word', 'hyphen') describing the break that follows a segment, or another 3NF shape that keeps the data atomic (no encoded text, SPEC §7.4.1). The last segment of a clue has no following break; enforce that in the database (check or trigger with an integrity test).
- Generated migration, `schema.ts` content and payload shapes, `upsertContent` (seed follows the T072 pattern), `load.ts`, `deriveEnumeration` and its tests.
- Content: every existing crossword file states its separators where they aren't commas. Review the cryptic puzzles (`content/crossword/red-herring.ts`, `loose-ends.ts`, `fine-print.ts`) and the quick ones for hyphenated answers.
- SPEC §7.4.4 (crossword row) updated in the same PR.

**Out**

- Apostrophes or other punctuation in enumerations.
- Any change to the solver layout or `CellGrid`.

## Notes

- Keep the default so content files that omit separators still mean word breaks, so only hyphenated answers need the extra field.
- The migration must be backward-compatible with the previous deploy (PLAN §5.1): add the column with a default, don't drop or rename anything.

## Acceptance criteria

- [ ] **AC1**: The separator is stored per segment and the last segment of a clue can't carry one.
  - _Verify (db):_ the column and its constraint exist; inside `BEGIN; … ROLLBACK;` an insert giving the last segment a separator fails, and a valid insert succeeds.
- [ ] **AC2**: Enumerations render with the right separators.
  - _Verify (unit):_ `derive.test.ts` covers "(4,3)", "(5-4)" and a mixed "(3,4-5)".
- [ ] **AC3**: A hyphenated answer shows its hyphenated enumeration in the clue list.
  - _Verify (browser):_ open a crossword with a hyphenated clue and read the enumeration. Screenshots in both themes at 1280px and 390px.
- [ ] **AC4**: The payload still carries no letters.
  - _Verify (unit):_ the crossword payload-leak test passes.
- [ ] **AC5**: The seeded preview has the column and the content.
  - _Verify (deploy):_ Neon MCP `run_sql` on `preview/ticket/T074-…` shows the separator column with hyphen rows where the content has them.
- [ ] **AC6**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
