---
id: T032
title: Reverse Chess content ×10 and end-to-end flow 3
milestone: M2
epic: E6
depends_on: [T027, T030, T031, T073]
migrations: false
requires_human: false
spec: ["SPEC §5.1 (Difficulty ladder)", "SPEC §8.2 (flow 3)", "SPEC §10 (decision 3)", "PLAN §5.4"]
skills: []
---

# T032: Reverse Chess content ×10 and end-to-end flow 3

## Context

Launch content for Reverse Chess, plus the Playwright flow that proves Mode A end to end on every PR. This closes M2.

## Scope

**In**

- Ten original puzzles in `content/reverse-chess/`:
  - **at least 6 in Mode A**, covering every rung of the SPEC §5.1 difficulty ladder (check-forced; uncapture; promotion, en passant or castling; most-candidates-illegal);
  - **at least 3 in Mode B**, with 2–4 plies.
- A legality-review note per puzzle, in `content/reverse-chess/REVIEW.md`. It lists, for each slug, the reasoning that the position is reachable from the starting position.
- Removal of the T025–T030 dev fixtures, or promotion of them into the ten.
- A Playwright spec, `e2e/reverse-chess.spec.ts`, implementing SPEC §8.2 flow 3.

**Out**

- Rota content (T063).

## Acceptance criteria

- [ ] **AC1**: Ten published puzzles with the right mode mix.
  - _Verify (db):_ after `pnpm db:seed`, `SELECT mode, count(*) FROM reverse_chess_puzzles r JOIN puzzles p ON p.id=r.puzzle_id WHERE p.published_at IS NOT NULL GROUP BY mode` returns at least 6 `last_move` and at least 3 `unwind` rows, totalling 10.
- [ ] **AC2**: Every puzzle is unique.
  - _Verify (cli):_ `pnpm puzzles:verify` exits 0 and prints exactly one survivor per Mode A slug and per Mode B step.
- [ ] **AC3**: The difficulty ladder is covered.
  - _Verify (code):_ `REVIEW.md` maps each ladder rung to at least one slug. At least one puzzle uses each of uncapture, unpromote, en passant and castling (`grep` over the content files).
- [ ] **AC4**: Every slug has a legality review.
  - _Verify (code):_ every slug in `content/reverse-chess/` has a section in `REVIEW.md`.
- [ ] **AC5**: The content is original.
  - _Verify (code):_ each file's `meta.source_note` states "original". The report confirms that no position was taken from a published collection.
- [ ] **AC6**: Flow 3 passes.
  - _Verify (cli):_ `pnpm test:e2e e2e/reverse-chess.spec.ts` passes against the local dev server. The flow: sign up, open an uncapture puzzle, drag backwards, choose the uncapture, Check, see the stamp, and see the puzzle in the Casebook.
- [ ] **AC7**: The difficulty ordering looks right in the hub.
  - _Verify (browser):_ the hub lists the puzzles with difficulty badges from 1 to 5. Take a screenshot of the hub (Paper, 1280px).
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
