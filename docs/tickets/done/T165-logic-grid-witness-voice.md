---
id: T165
title: "Logic grid: witness voice. A brief, a speaker per clue, and \"Name the liar\""
milestone: M8
epic: E8
depends_on: [T048, T131]
migrations: true
requires_human: false
preview: false
spec: ["SPEC §1.2 (S1E1)", "SPEC §2.3 (logic-grid)", "SPEC §7.4.4 (logic-grid)"]
skills: ["/db-trigger", "/zod4"]
---

# T165: Logic grid: witness voice. A brief, a speaker per clue, and "Name the liar"

## Context

The same feedback as T164 applies to the logic grid: the clues speak as "the file" ("The file puts Rake together with Beetroot."), the categories are domestic, and the false-clue variant reads as a technicality. In S1E1 the puzzle is seven suspects' statements in an interview room, "a concatenation of syllogisms, one of which will be false", and John names the liar. Murdle shows the same grid works as a case when the clues are things people say and the setup is two lines. See [`docs/research/narrative.md`](../../research/narrative.md) §2.2 and §4 (L1 to L3).

## Scope

**In**

- **L2 Brief.** `logic_grid_puzzles.brief text not null` (check: 1 to 280 characters). Content gains `brief`. The solver shows it on a `paper-sheet` above the grid, under the small caps line "Case notes". Two lines in practice; the schema caps it at three.
- **L1 Speakers.** `logic_grid_clues.speaker_item_id uuid` (nullable), FK `(puzzle_id, speaker_item_id)` → `logic_grid_items (puzzle_id, id)`, with a deferred constraint trigger that the speaker is an item of the first category (the people). Content gives `speaker` by label. The payload carries `speakerItemId` per clue (not (S)). A spoken clue renders as `Hettie: "I had the rake, and I was at the compost end."`; an unspoken one renders as now.
- **"Name the liar".** In the variant, the control that flags the false clue is labelled "Name the liar" when the clue has a speaker and "Mark the false statement" otherwise; the flagged clue's accessible name says whose statement it is. The payload's `variant` boolean is unchanged.
- **Verifier.** The existing rule (clue text names every item of its rule as a whole word, and reads with its polarity) gains one allowance: a spoken clue's speaker counts as naming that item, so "I had the rake" is valid when Hettie speaks it and the rule links Hettie and Rake. Every puzzle in the variant must have a speaker on its false clue (so the liar is a person), and every puzzle must have at least one spoken clue.
- **L3 Content.** The five files in `content/logic-grid/` gain a brief and speakers, and their clue text is rewritten in voice. Rules, categories, items and solutions do not change, so attempt marks and struck clues stay valid. At least two of the five lean to the S1E1 shape (people, places, times, what was carried) without every case being a murder.
- **Tests.** Verifier tests for the allowance and the new requirements; payload leak test unchanged but extended to the new field; table integrity test for the speaker FK and trigger; `e2e/logic-grid.spec.ts` reads the brief and, in the variant, names the liar.
- **Docs.** SPEC §2.3 logic-grid row and §7.4.4.

**Out**

- Item descriptions that carry clue content (Murdle's "peeling paint"); needs a looser verifier and is a later decision.
- New logic grid puzzles.
- The rota (T164).

## Notes

- The speaker is a person, so the trigger ties it to category position 0. Content files already put people first; `verify` should say so in its error if a file does not.
- Keep every statement to one line. The brief is the only other prose on the page.
- A false statement must still be a statement a liar would plausibly make; do not make it the only spoken clue.

## Acceptance criteria

- [ ] **AC1**: Every logic grid has a brief and spoken clues, and the verifier enforces the voice rules.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on the five files; it fails a copy with no spoken clue, a copy whose variant false clue has no speaker, and a copy whose spoken clue names neither the speaker's partner item nor the speaker.
- [ ] **AC2**: The payload carries the brief and speakers and no solution field.
  - _Verify (unit):_ the strict payload test passes with `brief` and `speakerItemId` present and `isFalse` absent.
- [ ] **AC3**: The grid reads as a case.
  - _Verify (browser):_ on a variant puzzle the case notes sheet is above the grid, clues show speakers, the flag control reads "Name the liar", and flagging a clue names its speaker in the accessible name. Screenshots in both themes at 1280px and 390px.
- [ ] **AC4**: Existing attempts survive the content change.
  - _Verify (db):_ locally, seed with marks on a logic grid, apply the new content, re-seed: `pnpm db:seed` exits 0 and the marks remain.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify && pnpm test:e2e -- logic-grid` exits 0.
