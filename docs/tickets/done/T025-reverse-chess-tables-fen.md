---
id: T025
title: Reverse Chess tables and FEN derivation
milestone: M2
epic: E6
depends_on: [T016]
migrations: true
requires_human: false
spec: ["SPEC §5.1", "SPEC §7.4.2", "SPEC §7.4.4 (reverse-chess)", "SPEC §7.4.6"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T025: Reverse Chess tables and FEN derivation

## Context

This is the storage layer for Modes A and B. Positions are piece rows, never FEN strings (SPEC §7.4.1). The FEN that `chess.js` needs is derived. The engine (T026) and the UI (T029) build on this ticket.

## Scope

**In**

- `src/puzzles/reverse-chess/tables.ts`, containing exactly the tables listed in SPEC §7.4.4 for `reverse-chess`:
  - `reverse_chess_puzzles`
  - `reverse_chess_pieces`
  - `reverse_chess_solution_plies` **(S)**
  - `reverse_chess_attempts`
  - `reverse_chess_attempt_plies`
- Enums `retro_mode`, `retro_special`, `chess_file`, `chess_piece` and `chess_colour` (shared, so put it in `src/db/schema/core.ts` if it isn't already there).
- `schema.ts`: `payloadSchema`, `contentSchema`, `answerSchema` and `attemptSchema`, composed per SPEC §7.4.6.
- `derive.ts`: `toFen(position)`, built from piece rows plus scalar columns. Its inverse, `fromFen(fen)`, is for authoring and tests only.
- `load.ts` and `load-solution.ts`.
- A registry entry with a placeholder `Solver` (T029 replaces it).
- A `puzzle_types` row in `content/lookups.ts`.
- The migration.

**Out**

- Retro-move logic (T026), the verifier (T027), UI (T028/T029) and content beyond one dev fixture (T032).

## Notes

- Ranks use `smallint CHECK (rank BETWEEN 1 AND 8)`. Files use the `chess_file` enum ('a'…'h').
- `en_passant_file` is nullable. The en passant rank is implied by side to move (rank 6 if White is to move, rank 3 if Black is), so it isn't stored.
- `toFen` must emit castling as `KQkq` in that order, or `-`. `chess.js` `load()` rejects non-canonical orderings in strict validation.

## Acceptance criteria

- [ ] **AC1**: The subtype is pinned to its type.
  - _Verify (db):_ `\d reverse_chess_puzzles` shows `type_key` as `generated always as ('reverse-chess'::text) stored`, with an FK `(puzzle_id, type_key)` → `puzzles(id, type_key)`, `on delete cascade`.
- [ ] **AC2**: A wrong-type subtype row is rejected.
  - _Verify (db):_ in a transaction, insert a `puzzles` row with `type_key='anagram'`, then a `reverse_chess_puzzles` row for that id. It fails with an FK violation. `ROLLBACK`.
- [ ] **AC3**: A puzzle without a subtype row fails at commit.
  - _Verify (db):_ `BEGIN; INSERT INTO puzzles (…type_key='reverse-chess'…); COMMIT;` raises the `trg_puzzles_require_subtype` error.
- [ ] **AC4**: Piece squares are unique and in range.
  - _Verify (db):_ inserting two pieces on `(puzzle_id,'e',4)` fails with a PK violation. Inserting rank `9` fails the CHECK. Inserting file `'i'` fails the enum.
- [ ] **AC5**: No json, array or FEN-string columns.
  - _Verify (code):_ `grep -nE "jsonb|json\(|\.array\(|fen" src/puzzles/reverse-chess/tables.ts` returns no column definitions.
- [ ] **AC6**: `toFen` and `fromFen` round-trip.
  - _Verify (unit):_ `derive.test.ts` round-trips exactly these FENs:
    - `k7/8/1K6/8/8/8/8/R7 b - - 1 1`
    - `4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1`
    - `4k3/8/8/8/8/8/8/4K2R w K - 0 1`
    - `r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1`
- [ ] **AC7**: The play payload never contains solution data.
  - _Verify (unit):_ a payload-leak test seeds one puzzle, calls `load.ts`, and parses the result with `payloadSchema.strict()`. No key from `reverse_chess_solution_plies` is present.
  - _Verify (code):_ `grep -n "solution" src/puzzles/reverse-chess/load.ts` returns nothing.
- [ ] **AC8**: A content file seeds correctly.
  - _Verify (cli + db):_ add a dev fixture `content/reverse-chess/dev-rook-check.ts`, using the first FEN above with one solution ply h1→a1. After `pnpm db:seed`:
    - `SELECT count(*) FROM reverse_chess_pieces WHERE puzzle_id=(SELECT id FROM puzzles WHERE slug='dev-rook-check')` returns `3`;
    - `SELECT count(*) FROM reverse_chess_solution_plies …` returns `1`.
- [ ] **AC9**: Attempt state is type-pinned.
  - _Verify (db):_ inserting a `reverse_chess_attempts` row whose `attempt_id` belongs to an `anagram` attempt fails with an FK violation.
- [ ] **AC10**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
