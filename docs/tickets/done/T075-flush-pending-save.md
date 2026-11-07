---
id: T075
title: Flush the pending autosave on check, navigation and page hide
milestone: M1
epic: E4
depends_on: [T030]
migrations: false
requires_human: false
spec: ["SPEC §4.5"]
skills: []
---

# T075: Flush the pending autosave on check, navigation and page hide

## Context

`SolveChrome` (`src/components/puzzle/solve-chrome.tsx`) debounces signed-in saves by `SAVE_DEBOUNCE_MS`, and its unmount cleanup `clearTimeout`s the pending save. Leaving the page within the debounce window drops the last state. The T030 reviewer saw it on Reverse Chess: after a correct Check followed by navigating away, `reverse_chess_attempt_plies` was never written, though the solve was recorded. The bug is generic, so every type with saved state is affected.

## Scope

**In**

- Keep the latest unsaved state in a ref. Flush it (call `saveState` immediately, cancelling the timer) when:
  - Check runs, before or alongside `checkAnswer`;
  - the component unmounts (client navigation);
  - the page is hidden (`pagehide` / `visibilitychange` to hidden).
- Don't send a save when nothing is pending, and never send two saves for the same state.
- Signed-out play is unchanged (it writes `localStorage` synchronously).

**Out**

- Changing the debounce interval, or what each type stores.
- A `sendBeacon` endpoint. Use the Server Action. If an unload save can't complete reliably through it, record that in the report rather than adding a route.

## Notes

- A Server Action started during unmount still runs on the server once the request is sent; confirm with the DB, not the client.

## Acceptance criteria

- [ ] **AC1**: A Reverse Chess Mode B chain survives leaving straight after a correct Check.
  - _Verify (browser + db):_ signed in, solve a locally published reverse chess puzzle (set `published_at` in the ticket DB only), press Check and navigate to `/puzzles` within 100 ms. `select count(*) from reverse_chess_attempt_plies …` for that attempt equals the chain length.
- [ ] **AC2**: Typing a crossword letter and navigating away within the debounce window keeps the letter.
  - _Verify (browser + db):_ type a letter, click a nav link immediately, and the letter is in `crossword_attempt_cells`. Reload the puzzle and it shows.
- [ ] **AC3**: Hiding the page flushes the pending save.
  - _Verify (browser + db):_ type a letter, dispatch `visibilitychange` to hidden (or close the tab) within the debounce window, and the row exists.
- [ ] **AC4**: No duplicate saves.
  - _Verify (unit or browser):_ one state change followed by Check and unmount sends exactly one `saveState` call (count requests or spy in a component test).
- [ ] **AC5**: Gates and the PLAN §5.3 definition of done pass, and e2e flows 1 and 2 still pass locally.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:e2e` exits 0.
