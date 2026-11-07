---
id: T029
title: Mode A "The Last Move": UI and check
milestone: M2
epic: E6
depends_on: [T026, T028, T018]
migrations: false
requires_human: false
spec: ["SPEC §5.1 (Mode A)", "SPEC §4.2", "SPEC §4.3", "SPEC §4.5"]
skills: []
---

# T029: Mode A "The Last Move"

## Context

This is the first playable Reverse Chess mode. The player drags a piece backwards, optionally uncaptures, and submits. Checking happens on the server through the shared `checkAnswer` action (SPEC §4.2).

## Scope

**In**

- `src/puzzles/reverse-chess/solver.tsx` for `mode='last_move'`, using `<ChessBoard>` and `<UncaptureTray>`, plus an unpromote toggle, undo and Check.
- `check.ts` for Mode A. It calls `applyRetro` and `replayMatches`, then compares with the authored ply.
- Saving attempt state into `reverse_chess_attempt_plies` through `saveState`.
- Registry wiring.
- Two content files: the unique fixture from T027 and one uncapture puzzle. Both must pass `puzzles:verify`.

**Out**

- Mode B and notation (T030), the hub page (T031) and full content (T032).

## Acceptance criteria

- [ ] **AC1**: The puzzle renders at its solve route.
  - _Verify (browser):_ `/puzzles/reverse-chess/<unique-fixture-slug>` shows:
    - the board;
    - the stacked caps header (SPEC §4.5);
    - the prompt "What was the last move?";
    - the side-to-move indicator.
- [ ] **AC2**: A correct answer is accepted.
  - _Verify (browser + db):_ signed in as `T029-1@test.local`:
    1. Perform the authored retro move and press Check.
    2. The "Solved." stamp appears.
    3. `SELECT completed_at IS NOT NULL FROM attempts a JOIN "user" u ON u.id=a.user_id WHERE u.email='T029-1@test.local'` returns `t`.
- [ ] **AC3**: A wrong answer is rejected without revealing the solution.
  - _Verify (browser):_ a different legal retro move shows a "not quite" state and no stamp.
  - _Verify (api):_ in `browser_network_requests`, the action response contains only `{correct:false}` fields, with no ply data.
- [ ] **AC4**: An invalid prior position gets a reason.
  - _Verify (browser):_ a retro move that leaves the non-moving side in check shows the inline message for `non_moving_side_in_check`. The board does not change.
- [ ] **AC5**: The uncapture puzzle solves end to end.
  - _Verify (browser):_ solve the uncapture fixture using the tray. The stamp appears.
- [ ] **AC6**: Progress persists.
  - _Verify (browser + db):_
    1. Make a retro move without checking, then reload.
    2. The move is restored.
    3. `SELECT count(*) FROM reverse_chess_attempt_plies p JOIN attempts a ON a.id=p.attempt_id …` returns `1`.
- [ ] **AC7**: Keyboard-only solve.
  - _Verify (browser):_ solve AC2's puzzle again (as `T029-2`) using only the keyboard: board navigation, the tray via Tab and Enter, and Check via Enter.
- [ ] **AC8**: Visuals and console.
  - _Verify (browser):_ take screenshots in both themes at 1280px and 390px. At 390px there is no horizontal scroll, and the board fits the viewport width minus the 16px gutters. `browser_console_messages` shows no errors.
- [ ] **AC9**: The payload contains no solution.
  - _Verify (browser):_ in the page HTML or RSC payload (`browser_evaluate` on `document.documentElement.outerHTML`), the authored origin square and the uncapture piece of the solution do not appear in the serialised props. Search for the solution ply's JSON shape.
- [ ] **AC10**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
