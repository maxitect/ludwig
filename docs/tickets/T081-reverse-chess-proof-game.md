---
id: T081
title: "Reverse Chess Mode D: Proof Game"
milestone: M2
epic: E6
depends_on: [T032, T076]
migrations: true
requires_human: false
spec: ["SPEC §5.1", "SPEC §7.4.4 (reverse-chess)", "SPEC §7.4.1", "PLAN §5.4"]
skills: ["/db-trigger", "/zod4"]
---

# T081: Reverse Chess Mode D: Proof Game

## Context

Modes A and B take back at most a few half-moves, because the verifier proves uniqueness by searching every retro chain, and that search grows too fast to go further (T076). The user wants a Reverse Chess puzzle that recovers a whole game. The classic form is the **proof game**: the player sees a position and "this arose after N half-moves", and finds the one game from the starting position that reaches it. Uniqueness is proven by a forward search from the start, which stays tractable for short games. This adds it as a fourth Reverse Chess mode, within the existing `reverse-chess` type.

## Scope

**In**

- **Mode.** Add `'proof_game'` to the `retro_mode` enum. For this mode, the existing columns hold the target position: `reverse_chess_pieces`, side to move, the castling flags, `en_passant_file`, halfmove and fullmove. `ply_count` is the length of the game, N.
- **Solution and attempts.** A new (S) table, `reverse_chess_proof_plies`: `(puzzle_id, ply)` pk, from file and rank, to file and rank, and `promotion chess_piece null`. It stores forward moves; captures, en passant and castling follow from replaying them. Add the attempt mirror, `reverse_chess_attempt_proof_plies`, following the existing attempt-ply pattern: FK to the `<type>_attempts` row, deferred and non-cascading where it refers to content.
- **Triggers.** Deferred constraint triggers so that:
  - a `proof_game` puzzle has proof plies 1..`ply_count` and no retro solution plies and no goal;
  - the other modes have no proof plies.

  Extend the existing goal and solution-ply triggers rather than duplicating them.
- **Schemas, load, check and derive.** Update `schema.ts` (content, payload, answer and attempt schemas for the mode), `load.ts` (the payload is the target position plus N, never the plies), `load-solution.ts`, and `check.ts`. `check` replays the answer from the standard starting position with chess.js. It is correct when there are exactly N legal plies and the final position equals the target in piece placement, side to move, castling rights and en passant file. Like Mode B, any game that does this is accepted; the authored game is not compared.
- **Verifier.** Add a forward search in a new pure module, e.g. `proof-search.ts`, wired into `verify.ts`. It requires exactly one game of N plies from the start that reaches the target, and requires it to be the authored game. Different move orders count as different games, so a puzzle where moves can be transposed is not unique; that is the standard proof-game convention. Prune with admissible lower bounds on the plies each side still needs: for example, each piece away from its target square needs at least one move of its colour, and every capture the target's material implies needs a move. Memoise dead positions by (position key, plies left), as T076 does. Equivalence tests against an unpruned search at small N.
- **Solver.** A Mode D view, alongside `last-move.tsx` and `unwind.tsx`:
  - the target position on a smaller static board, with "White to move after N half-moves" (or the equivalent);
  - a play board that starts from the initial position, where the player plays forward with legal moves only (chess.js), with promotion choice;
  - the move list using the notation setting (`derive.ts`), Undo, and a counter "k of N". The play board locks at N.
  - the solver saves only legal plies, as Mode A does.
- **Hub.** A "Proof Game" section on `/reverse-chess` with a "How it works" note, matching the existing sections.
- **Content.** At least 3 original proof games in `content/reverse-chess/`, covering a short one (N ≤ 8), a medium one, and one with a capture or castling the player must infer. Each has a `REVIEW.md` entry and a `sourceNote` starting "Original position".
- **SPEC.** Add Mode D to SPEC §5.1, and update the reverse-chess row in §7.4.4, in the same PR.

**Out**

- The "board locked, goal not reached" message for Mode B. It's a separate small UX change and needs its own ticket; Mode D's counter makes the lock visible.
- Generating proof games automatically, a daily proof game, and a longest-proof-game record mode.
- An end-to-end Playwright flow. Add one in a later content or e2e ticket if wanted.

## Notes

- **Backward compatibility (PLAN §5.1).** Adding an enum value and new tables is additive. The previous deploy's seed never writes `proof_game`. Postgres can't use a new enum value in the same transaction that adds it, so keep `ALTER TYPE ... ADD VALUE` in its own migration statement, before anything that refers to it. Check how drizzle-kit emits it.
- **Target state.** Side to move and the castling and en passant fields are part of the target. Show them to the player as text, because a static board can't show them. The en passant file only matters when the last ply was a double pawn push.
- **Search budget.** Proof games with unique solutions are usually 8–14 plies. Set a verify time budget, for example under 5 s per puzzle on CI hardware, and author within it. Report the measured time per puzzle.
- **Chess.js.** Replaying forward needs no retro engine. Reuse `derive.ts` for the FEN of the target and for notation. The search should work on chess.js's move generation or a lighter internal one; measure before optimising.
- **Mode name.** "Proof Game" is a working title. Confirm the display name with the user before writing hub copy, if the show suggests a better one.

## Acceptance criteria

- [ ] **AC1**: The schema supports Proof Game puzzles and enforces their shape.
  - _Verify (db):_ inside `BEGIN; … ROLLBACK;`:
    - a `proof_game` puzzle with plies 1..N commits;
    - one missing a ply, one with a goal row, and one with retro solution plies each fail at commit;
    - a `last_move` puzzle with proof plies fails.
- [ ] **AC2**: No solution data reaches the client.
  - _Verify (unit):_ a payload-leak test shows that the Mode D payload contains the target and N, and no plies.
  - _Verify (code):_ `grep` shows `reverse_chess_proof_plies` is read only in `load-solution.ts`, `check.ts` and the seed.
- [ ] **AC3**: `check` accepts any legal N-ply game that reaches the target, and nothing else.
  - _Verify (unit):_ `check.test.ts` covers:
    - the authored game is correct;
    - a different legal game that reaches the same target is also correct;
    - a game one ply short, one with an illegal ply, and one that ends in a different position (including wrong castling rights or en passant file) are all incorrect.
- [ ] **AC4**: The verifier proves uniqueness and rejects ambiguous puzzles.
  - _Verify (unit):_ `proof-search.test.ts` shows the pruned search matches the unpruned search at N ≤ 6 on several targets. It also shows a target reachable by two move orders is rejected, and a target with no game is rejected.
  - _Verify (cli):_ `pnpm puzzles:verify` exits 0. Changing one authored ply in a copy of each content file makes it fail. Print the time per Proof Game puzzle.
- [ ] **AC5**: The launch content meets the scope.
  - _Verify (code):_ there are at least 3 `proof_game` files, with N values matching the scope, each with a `REVIEW.md` entry.
  - _Verify (db):_ after `pnpm db:seed`, the published puzzles by mode include at least 3 `proof_game` rows.
- [ ] **AC6**: A signed-in player can solve a Proof Game, and their progress persists.
  - _Verify (browser):_ on a Proof Game puzzle, play the authored game forward. The counter reaches N, Check shows the Solved stamp, and the board locks at N.
  - _Verify (db):_ the attempt is complete.
  - _Verify (browser):_ reloading mid-game restores the moves played.
  - Take screenshots in both themes at 1280px and 390px, with no console errors.
- [ ] **AC7**: The hub lists Proof Game puzzles with their copy.
  - _Verify (browser):_ `/reverse-chess` shows the Proof Game section with its puzzles. Take screenshots in both themes at 1280px.
- [ ] **AC8**: The preview has the migration and the content.
  - _Verify (deploy):_ the preview build log shows migrations applied and the seed inserting the Proof Game puzzles. Neon MCP `run_sql` on `preview/ticket/t081-…` counts the `proof_game` rows.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
