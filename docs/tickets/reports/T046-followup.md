# T046 follow-up: sudoku reload test lost its save on the preview

## Cause

`digits and notes survive a reload` (`e2e/sudoku-keyboard.spec.ts`) only waited for the autosave when `databaseAvailable` was true. On a Vercel preview there is no `DATABASE_URL`, so nothing waited: `page.reload()` ran within the 800 ms autosave debounce (`SAVE_DEBOUNCE_MS` in `solve-chrome.tsx`), or aborted the in-flight Server Action started by the `pagehide` flush. The reload then loaded an empty attempt (`Row 1, column 2, empty`). It is a test race, not an app bug: with the save allowed to land, the state is restored.

## Fix

Before the last keypress, register `page.waitForResponse` for a POST carrying a `next-action` header, and await it after the keypress. This runs with or without DB access; the DB poll stays for local runs. No assertions were weakened. `SolveChrome` exposes no UI save signal, so the Server Action response is the observable one.

## Evidence

Preview path simulated with `DATABASE_URL=` (empty, so `playwright.config.ts`'s `loadEnvFile` cannot restore it and `databaseAvailable` is false), dev server on 3146, `--repeat-each 5`, desktop and mobile:

- Original spec: 10 failed of 10.
- Fixed spec, no DB: 20 passed of 20 (both tests, both projects).
- Fixed spec, DB available: 20 passed of 20.
- `pnpm typecheck && pnpm lint && pnpm test`: typecheck, lint and Vitest (69 files, 814 tests) pass.
