---
id: T081
title: "Reverse Chess: Proof Game (unwind to the starting position)"
milestone: M2
epic: E6
depends_on: [T032, T076]
migrations: true
requires_human: false
spec: ["SPEC §5.1", "SPEC §7.4.4 (reverse-chess)", "SPEC §7.4.1", "SPEC §7.4.5", "PLAN §5.4"]
skills: ["/db-trigger", "/zod4"]
---

# T081: Reverse Chess: Proof Game (unwind to the starting position)

## Context

Modes A and B take back at most a few half-moves (T076). The user wants a Reverse Chess puzzle that recovers a whole game: a **proof game**. The player sees a position reached after N half-moves and takes back every move until they reach the starting position. There is exactly one way to do it. This is an Unwind puzzle (SPEC §5.1 Mode B) whose goal is the initial position. The player enters it backwards, with the existing Unwind solver. Only the goal and the verifier are new. User decision (2026-10-05): backward entry, not forward play.

## Scope

**In**

- **Goal kind.** Add `'initial_position'` to `retro_goal_kind`. It takes no parameters, so it has no subtype table. Exempt it in the trigger that requires a subtype row, as rota does for `adjacent_only`.
- **Goal predicate.** The chain is reversed and replayed forward with chess.js from the standard starting FEN, and must reproduce the puzzle position exactly: piece placement, side to move, castling rights and en passant file. This one test covers the castling rights and en passant state that a piece-placement comparison would miss. Put it in `check.ts` / `load-solution.ts` alongside the existing goal predicates. Everything else about Unwind checking is unchanged (SPEC §5.1 Mode B "Checking").
- **`ply_count` consistency.** For this goal, N is derivable from the position: `2 × (fullmove − 1) + (1 if Black to move)`. Enforce it with a deferred trigger, and add it to SPEC §7.4.5 with an integrity test (SPEC §7.4.1: redundancy only with a trigger).
- **Verifier.** When the goal is `initial_position`, `verify.ts` uses a new forward search, a pure module such as `proof-search.ts`, instead of `goalChains`. It counts the N-ply games from the starting position that reach the puzzle position, and requires exactly one, equal to the authored chain reversed. Backward search from a mid-game position doesn't scale to these depths, but forward search from the start does, and a unique game forward is the same as a unique chain backward.
  - Different move orders are different games, so a position reachable by transposed moves is not unique (the standard proof-game convention).
  - Prune with admissible per-side lower bounds on the plies still needed. Each piece away from its target square needs at least one move of its colour. Captures implied by the target's material need moves. Pawns moving files need captures.
  - Memoise dead positions by (position key, plies left), as T076 does.
  - Add equivalence tests against an unpruned search at N ≤ 6.
- **Solver.** Reuse the Unwind view (`unwind.tsx`). The goal text reads, for example, "Back to the starting position". The move list and its "k of N" heading already show progress, and the board already locks at N. Check that the uncapture tray, unpromote, en passant and retro castling hold up across a 10–16 ply chain, and that Undo works at every depth.
- **Hub.** A "Proof Game" section on `/reverse-chess`, listing Unwind puzzles with the `initial_position` goal separately from other Unwind puzzles, with a short "How it works".
- **Content.** At least 3 original proof games in `content/reverse-chess/`: one short (N ≤ 8), one medium, and one where the player must infer a capture or castling. Each needs a `REVIEW.md` entry and a `sourceNote` starting "Original position". The content file states the goal kind and nothing else, since the goal is fixed.
- **SPEC.** In the same PR:
  - add the `initial_position` goal and the Proof Game presentation to SPEC §5.1 Mode B;
  - widen the N range for this goal;
  - update the §7.4.4 reverse-chess row and §7.4.5.

**Out**

- Forward-play entry (the user chose backward entry).
- A "board locked, goal not reached" message for Unwind. That is a separate ticket.
- Generated or daily proof games.
- An end-to-end Playwright flow.

## Notes

- **Backward compatibility (PLAN §5.1).** Adding an enum value and a trigger is additive, and the previous deploy's seed never writes the new kind. Postgres can't use a new enum value in the transaction that adds it, so put `ALTER TYPE ... ADD VALUE` in its own statement, before anything that refers to it. Check what drizzle-kit emits.
- **Retro castling rights.** In the backward chain, castling rights must be restorable: un-moving a king or rook back to its home square can give a right back, and the starting position has all four. Check how the retro engine (`engine.ts`, `retro-ply.ts`) handles rights across a long chain. The forward-replay predicate is the source of truth for the final check. If the engine can't restore rights, a valid answer is unenterable: stop and report rather than working around it.
- **Player-side cost.** The solver validates each retro step as it is entered. It doesn't search, so long chains are fine. Measure the time per step at 16 plies anyway.
- **Search budget.** Unique proof games are usually 8–16 plies. Set a verify budget, for example under 5 s per puzzle on CI hardware, and author within it. Report the measured time per puzzle.
- **Payload.** The goal's display text is already in the payload. The authored chain stays (S). The hub may read the goal kind server-side to group puzzles; it is not a secret.
- **Name.** "Proof Game" is a working title. Confirm the display name with the user before writing the hub copy.

## Acceptance criteria

- [ ] **AC1**: The schema accepts an `initial_position` goal and enforces its rules.
  - _Verify (db):_ inside `BEGIN; … ROLLBACK;`:
    - an Unwind puzzle with an `initial_position` goal, no subtype row and a consistent `ply_count` commits;
    - the same puzzle with a `ply_count` that disagrees with fullmove and side to move fails at commit;
    - a `piece_count` goal without its subtype row still fails.
- [ ] **AC2**: No solution data reaches the client.
  - _Verify (unit):_ the payload-leak test covers a Proof Game puzzle: its payload has the position, N and the goal text, and no plies.
- [ ] **AC3**: `check` accepts any legal N-ply retro chain that ends at the starting position, and nothing else.
  - _Verify (unit):_ `check.test.ts` covers:
    - the authored chain is correct;
    - a chain one ply short is incorrect;
    - a chain with an illegal step is incorrect;
    - a chain that ends at the start's piece placement but not the puzzle position's forward replay (for example a wrong castling right or en passant file) is incorrect.
- [ ] **AC4**: The verifier proves uniqueness and rejects ambiguous puzzles.
  - _Verify (unit):_ `proof-search.test.ts` shows the pruned search equals the unpruned one at N ≤ 6 on several targets. It also shows that a target reachable by two move orders is rejected, and that an unreachable target is rejected.
  - _Verify (cli):_ `pnpm puzzles:verify` exits 0 and reports the time per Proof Game puzzle. Changing one authored ply in a copy of each file makes it fail.
- [ ] **AC5**: The launch content meets the scope.
  - _Verify (code):_ at least 3 Proof Game files exist, with N values matching the scope, each with a `REVIEW.md` entry.
  - _Verify (db):_ after `pnpm db:seed`, at least 3 published puzzles have the `initial_position` goal.
- [ ] **AC6**: A signed-in player can unwind a Proof Game all the way back, and progress persists.
  - _Verify (browser):_ on the medium puzzle, enter the authored chain backwards, including at least one uncapture. Check shows the Solved stamp.
  - _Verify (db):_ the attempt is complete.
  - _Verify (browser):_ reloading at the halfway point restores the chain.
  - Take screenshots in both themes at 1280px and 390px, with no console errors.
- [ ] **AC7**: The hub lists Proof Game puzzles separately.
  - _Verify (browser):_ `/reverse-chess` shows a Proof Game section with these puzzles, and they don't appear in the other Unwind list. Take screenshots in both themes at 1280px.
- [ ] **AC8**: The preview has the migration and the content.
  - _Verify (deploy):_ the preview build log shows migrations applied and the seed inserting the Proof Game puzzles. Neon MCP `run_sql` on `preview/ticket/t081-…` counts the `initial_position` goals.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
