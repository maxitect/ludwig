# Chess problem legality review

These are compositions, not proof games, so each position is reviewed as a legal position rather than as a reachable one. `pnpm puzzles:verify` loads every FEN in chess.js, rejects a pawn on the first or last rank and a position with Black in check, rejects any mate in fewer moves than the stated `mateIn`, and needs exactly one key move.

All five are original, found by randomised search over small positions and kept for a clean, unique key.

| Slug | Mate in | Key | Black's best defence | Mating move |
| --- | --- | --- | --- | --- |
| `open-file` | 1 | Rxd8# | none | none |
| `no-way-out` | 1 | Nf7# | none | none |
| `a-quiet-word` | 2 | Qc6 | Ka7 | Qb7# |
| `the-king-steps-in` | 2 | Kc7 | b5 | Ra1# |
| `the-corner-office` | 2 | Qg7 | Kh4 | Qh6# or Qg4# |

`the-corner-office` has two mating second moves. SPEC section 2.4 allows duals on the later White moves, and `check` accepts either.
