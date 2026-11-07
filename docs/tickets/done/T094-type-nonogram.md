---
id: T094
title: "Puzzle type: nonogram (Ludwig picture reveals)"
milestone: M6
epic: E11
depends_on: [T021]
migrations: true
requires_human: false
spec: ["SPEC §2.4 (nonogram)", "SPEC §7.4.4 (nonogram)", "SPEC §6 (visual design)", "SPEC §10 (decision 6)", "PLAN §3 M6"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T094: Puzzle type: nonogram (Ludwig picture reveals)

## Context

Nonograms are KrazyDad's "Konograms" (SPEC §1.1). Our twist: every solution is a picture of a Ludwig motif, revealed with a caption once solved (SPEC §2.4). The picture is stored as solution data, and the clues are derived from it.

## Scope

**In**

- **`src/puzzles/nonogram/`**, built per `/new-puzzle-type`. Tables: `nonogram_puzzles`, `nonogram_cells` **(S)**, `nonogram_attempts` and `nonogram_attempt_marks` (enum `nonogram_mark`), as in SPEC §7.4.4.
- **`derive.ts`:** the row and column clues from the picture.
- **`engine.ts`:**
  - a line solver: for each line, the cells forced in every arrangement of its runs;
  - `countSolutions`: line propagation plus backtracking, capped at 2.
- **`verify`:** exactly one picture satisfies the clues.
- **Solver UI:**
  - tap to cycle fill, cross and blank, and drag to paint a run;
  - keyboard: arrows, Space to fill, `x` to cross;
  - each clue greys out once its line is satisfied;
  - on completion the picture inverts to ink on paper and shows its caption.
- **Content:** 5 original pictures from 10×10 to 15×15: a gear, a white knight, a pencil, a phrenology head, the walker.
- **Preview:** add `src/puzzles/<type>/preview.tsx` (T129) and register it in `src/puzzles/previews.ts`. Typecheck fails until you do.

**Out**

- Colour nonograms.
- A picture-to-puzzle tool. Pictures are drawn as content files.

## Notes

- The caption is solution data, since it gives the picture away. Don't put it in the payload or the page title.

## Acceptance criteria

- [ ] **AC1**: The tables, the size CHECKs and the enum exist.
  - _Verify (db):_ size 4 is rejected.
- [ ] **AC2**: Clue derivation and solution counting are correct.
  - _Verify (unit):_ clue fixtures for an empty line, a full line and split runs. Counting fixtures for a unique picture, a two-solution picture (a 2×2 checker inside the grid) and a contradictory one.
- [ ] **AC3**: The payload carries only the dimensions and clues, with no cells and no caption.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on 5 files.
- [ ] **AC4**: Signed in, marks persist across a reload, and a full solve completes and reveals the caption.
  - _Verify (browser + db)._
- [ ] **AC5**: The puzzle can be solved by keyboard alone, and each line's clue is announced when the line is focused.
  - _Verify (browser)._
- [ ] **AC6**: Both themes render correctly at 1280px and 390px, and a 15×15 grid fits at 390px with legible clues.
  - _Verify (browser):_ screenshots `.verification/T094/ac6-*.png`.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
