---
id: T164
title: "Rota: the case. Victim, incident sheet, voiced clues, the accusation and the summing-up"
milestone: M8
epic: E6
depends_on: [T063, T141]
migrations: true
requires_human: false
preview: true
spec: ["SPEC §1.3", "SPEC §5.1 Mode D", "SPEC §7.4.4 (rota)", "PLAN §5.4"]
skills: ["/db-trigger", "/zod4"]
---

# T164: Rota: the case. Victim, incident sheet, voiced clues, the accusation and the summing-up

## Context

User feedback (2026-11-07): the Rota "is adding names to people but there's absolutely no narrative to it, which is what made it good in the show". Today the board is a permutation with name tokens, the clues are unspoken constraints ("Colm never stood in a zone in row 5, at any point."), and the payoff is one footnote in the solved footer ("Opening gambit: Fenn insisted on it."). Nothing says who died, where, or why the swaps matter.

The research and the design are in [`docs/research/narrative.md`](../../research/narrative.md): §1.3 maps John's method in S1E4 (physical evidence, site process, statements, then the accusation) and §3 gives proposals R1 to R5. This ticket builds all five. The rule throughout is Color Gray's: nothing on the solve page that is neither required for the solution nor a deliberate misdirection. No prose longer than three lines before the solve.

## Scope

**In**

- **R1 The case.** `rota_puzzles` gains `brief text not null` (check: 1 to 280 characters, as `knights_knaves_puzzles.question_text` does) and `victim_worker_id uuid not null`, composite FK `(puzzle_id, victim_worker_id)` → `rota_workers (puzzle_id, id)`, deferred because the worker rows are written after the subtype row (same shape as `rota_instigator_in_first_swap`). The hazard zone is the victim's **final** square, derived in `derive.ts`, never stored. Content gains `brief` and `victimName`. The payload gains `brief` and `victimWorkerId`; neither is (S).
- **R2 Voiced clues.** `rota_clues` gains `speaker_worker_id uuid` (nullable, composite FK to `rota_workers`). Content gives `speakerName` on spoken clues. Predicate tables are unchanged. `verifyRota` requires: a `never_in_rank` display text names its rank and an `unpowered_square` text names its square (the logic grid verifier's whole-word check is the model); every puzzle has at least one spoken clue and at least one unspoken clue (a site log or site rule).
- **R3 The summing-up.** `rota_solution_swaps` gains `excuse text not null` (S), the reason given for that swap at the time. `check` returns, for a correct answer only, `epilogue` as the forward timeline: one line per step with both names, the excuse and what the swap achieved for the victim (derived from the placements: "Hobb is now one zone from D3"), then the confession line naming the instigator. The registry's `epilogue` becomes `string | string[]`, and the solve chrome footer renders an array as an `<ol>` (one element per step) under the stamp. Other types keep returning a string.
- **R5 The accusation.** New clue kind `not_instigator` (enum value plus table `rota_clue_not_instigator(clue_id, worker_id)`, pinned by `(clue_id, kind)` and scoped by `(puzzle_id, worker_id)` like `rota_clue_never_in_rank`). Predicate: the named worker did not insist on the first swap. The answer gains `instigatorWorkerId`; `check` requires it to equal `rota_solutions.instigator_worker_id`, after the sequence checks. `verifyRota` requires that the `not_instigator` clues exclude exactly one of the two workers of step 1 and never the stored instigator. `rota_attempts` gains `instigator_worker_id uuid` (nullable, composite FK to `rota_workers`) so the choice survives a reload; `attemptSchema` and `replaceAttemptState` follow. The solver, once the rota is restored, asks "Who insisted on the first swap?" with the two step-1 workers as a radio group (the gears Accuse pattern, `src/puzzles/gears/solver.tsx`); Check is withheld until one is chosen. A wrong accusation with a right sequence fails the check as now, with no hint which part was wrong.
- **Board and solver** (`board.tsx`, `solver.tsx`):
  - the hazard zone is drawn torn (a `BulletHole` or a hatch in `--ludwig-red`, no filter) with the accessible name "D3, where Hobb was found"; the victim's token has a red border that follows it as it is unswapped, so the player watches the victim being walked onto the square;
  - the brief sits above the board on a `paper-sheet` under the small caps line "Incident sheet"; the binding words (the hazard zone and the pinned zone) are bold;
  - the intended-rota list becomes a second sheet titled "The rota as pinned up that morning";
  - clues render in voice: a spoken clue as `Colm: "I never went near row 5. I don't do heights."`, an unspoken one with its source in small caps (`Site log`, `Site rule`, `Supervisor`); a broken clue reads "Colm's statement does not hold" (or "The site log does not hold"), not "Broken";
  - tapping or focusing a clue highlights the speaker's token and the squares its predicate names (a row or a zone) in the pencil red, and clears on the next action;
  - the how-to paragraph moves into a collapsible "How to play" under the sheets, closed by default.
- **Hub** (`src/app/(app)/reverse-chess/page.tsx`): the Mode D blurb becomes "A worker died in the wrong zone. Work the swaps backwards to find who put them there." The how-it-works list ends with the accusation step. The mode tagline quotes John: _"We start with the end-game and we work backwards."_ (SPEC §1.3).
- **Content.** The five files in `content/rota/` gain `brief`, `victimName`, `speakerName` on spoken clues, one `not_instigator` clue each, and an `excuse` per swap. Workers, placements, existing clues and swaps do not change, so attempt rows stay valid. For `the-building-site`, Hobb is the victim (final D3, pinned D2) and Fenn the instigator, as authored.
- **Tests.** Engine tests for `not_instigator`; check tests for the accusation (right sequence and wrong name fails; the epilogue is present only for a correct answer and lists every step); payload leak test extended to `excuse` and `instigatorWorkerId`; a `verify` test for each new rule (unvoiced puzzle, unbound display text, undecidable instigator); table integrity tests for the new FKs and the deferred victim trigger; `e2e/rota.spec.ts` extended to accuse and read the timeline.
- **Docs.** SPEC §5.1 Mode D (payload, clue kinds, the accusation as part of the answer, the epilogue), SPEC §7.4.4 rota row, and the research note's §7 status.

**Out**

- Logic grid, sightlines and CCTV maze briefs (T165, T166).
- Times on the pencil-line steps (R3's optional `startTime`); revisit after the user plays this.
- New rota puzzles beyond the five.
- Any change to Reverse Chess modes A to C.

## Notes

- The columns T132 and T141 removed were an unused attempt instigator with no UI. This ticket adds one back **with** the UI that needs it; name the column the same so the migration history reads as a reversal with a reason.
- The epilogue must be computed from the stored solution and the payload only after `correct` is true. Nothing from `excuse` or the instigator may be returned on a wrong answer, and `violatedClue` stays as it is (payload and answer only).
- Do not reveal excuses step by step during the solve: confirming an excuse confirms the step, which leaks the sequence. The timeline is post-solve only.
- Clue voice is free; `verify` checks only the binding words and the mix. Keep each statement to one line.
- A `not_instigator` clue is a statement by, or about, a step-1 worker who did not insist ("Gwyn: 'I never ask for swaps. People ask me.'"). It is the Murdle "last clue about the crime itself".
- Run `pnpm db:generate`, `pnpm db:migrate`, `pnpm test`, then `pnpm puzzles:verify` after the content edits.

## Acceptance criteria

- [ ] **AC1**: Every rota puzzle has a victim, a brief, voiced clues and a decidable instigator, and the verifier proves it.
  - _Verify (cli):_ `pnpm puzzles:verify` passes on the five files; it fails a copy with no spoken clue, a copy whose `never_in_rank` text omits the rank, and a copy whose `not_instigator` clue names the stored instigator.
- [ ] **AC2**: The payload carries the brief and the victim and nothing from the solution.
  - _Verify (unit):_ the payload leak test rejects `excuse`, `instigatorWorkerId` and the swaps; a `load` result has `brief` and `victimWorkerId`.
- [ ] **AC3**: The answer is the sequence plus the accusation.
  - _Verify (unit):_ `check` accepts the authored sequence with the authored instigator and returns an epilogue with one line per step plus a confession line; the same sequence with the other step-1 worker is `correct: false` with no epilogue; a wrong sequence returns `violatedClue` and no epilogue.
- [ ] **AC4**: The board is the crime scene.
  - _Verify (browser):_ on `/puzzles/rota/the-building-site` the zone D3 is marked and named "D3, where Hobb was found", Hobb's token is red-bordered, the incident sheet is three lines or fewer, and tapping a clue highlights its speaker and squares. Screenshots in both themes at 1280px and 390px.
- [ ] **AC5**: The accusation flow works and persists.
  - _Verify (browser + db):_ restore the rota, choose a worker, reload: the choice is still selected and `rota_attempts.instigator_worker_id` holds it; Check with the right worker shows the stamp and the timeline as a list; Check with the wrong worker shows the wrong notice.
- [ ] **AC6**: The game stays keyboard-operable and announced.
  - _Verify (browser):_ `browser_snapshot` shows the radio group reachable by keyboard, the clue highlight on focus, and the status line announcing the accusation.
- [ ] **AC7**: The hub reads as the case.
  - _Verify (browser):_ `/reverse-chess` shows the new blurb, John's line and the five-step how-it-works ending in the accusation.
- [ ] **AC8**: The behaviour holds on the PR's preview.
  - _Verify (deploy):_ Neon MCP `run_sql` on `preview/<branch>` shows `rota_puzzles.victim_worker_id` set for all five rows and five `rota_clue_not_instigator` rows; `vercel curl --yes --deployment <preview-url> /puzzles/rota/the-building-site` returns 200.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify && pnpm test:e2e -- rota` exits 0.
