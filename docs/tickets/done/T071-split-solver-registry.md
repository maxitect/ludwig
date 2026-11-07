---
id: T071
title: Split client solvers out of the server puzzle registry
milestone: M1
epic: E4
depends_on: [T019]
migrations: false
requires_human: false
spec: ["SPEC §4.1", "SPEC §4.6", "PLAN §2.6"]
skills: []
---

# T071: Split client solvers out of the server puzzle registry

## Context

`db:seed` and `puzzles:verify` import `src/puzzles/registry.ts` under `tsx --conditions react-server`. The registry pulls in every type's `Solver`, so any solver that imports radix (`ui/Button`, via `Slot`) or react-chessboard (`ChessBoard`) crashes the scripts with `TypeError: React.createContext is not a function`. T019 worked around it with plain `<button>`s; T029 (Reverse Chess Mode A) can't, because it needs `ChessBoard`. PLAN §2.6 says a framework change gets its own ticket, so this is it.

## Scope

**In**

- Remove `Solver` from `PuzzleTypeModule`. Add a separate client-facing solver map (for example `src/puzzles/solvers.ts`, keyed by type key, `SolverComponent | null` per type) that only the solve page imports. The scripts and every server-only module keep importing the registry without touching any solver.
- Move the existing solvers (`anagram`, `__fixture`, plus `null` for gears, reverse-chess and rota — rota currently has an inline placeholder `Solver`) into that map. Keep `SolverProps`/`SolverComponent` types where the solvers can import them without pulling in the server registry.
- The solve page resolves the solver from the new map and passes it into `SolveChrome` as today. Unknown or `null` keeps the current "not open yet" state.
- Switch the anagram solver's Shuffle and Clear buttons to `ui/Button` now that it is safe.
- A test that proves the scripts' import graph is solver-free: running `puzzles:verify` (or importing the registry under `--conditions react-server`) succeeds while a registered solver imports `ui/Button` and `ChessBoard`.
- Update `/new-puzzle-type` (`.claude/skills/new-puzzle-type/`) and `.claude/rules/puzzles.md` to describe the split, and list the module members added by T019: `loadAttemptState` and `clearAttemptState` next to `replaceAttemptState`.

**Out**

- Registering a reverse-chess solver (T029) or any new solver.

## Notes

- Keep it a pure restructure: no behaviour change on the solve page.
- `src/puzzles/__fixture/registry.ts` is the test registry used by `--registry`; give the fixture solver the same treatment.

## Acceptance criteria

- [ ] **AC1**: The server registry has no solver imports.
  - _Verify (code):_ `grep -rn "solver" src/puzzles/registry.ts src/puzzles/*/module.ts` finds no import of a solver file, and `PuzzleTypeModule` has no `Solver` member.
- [ ] **AC2**: The scripts survive client-only solver dependencies.
  - _Verify (unit + cli):_ the new test passes; `pnpm db:seed && pnpm puzzles:verify` exits 0 with the anagram solver importing `ui/Button`.
- [ ] **AC3**: The anagram solve page behaves exactly as before.
  - _Verify (browser):_ signed in as `T071-1@test.local`, solve `/puzzles/anagram/crossing-point`; the Solved stamp shows, Shuffle and Clear work, and a gears or reverse-chess puzzle still shows "not open yet". Screenshots in Paper and Ink at 1280px and 390px; console clean.
- [ ] **AC4**: The docs describe the new contract.
  - _Verify (code):_ the skill and `.claude/rules/puzzles.md` mention the solver map and `loadAttemptState`/`clearAttemptState`.
- [ ] **AC5**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
