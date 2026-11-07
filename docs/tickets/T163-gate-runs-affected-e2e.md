---
id: T163
title: Run the affected end-to-end specs in the ticket gate, and archive done tickets
milestone: M8
epic: E8
depends_on: []
migrations: false
requires_human: false
preview: false
spec: []
skills: []
---

# T163: Run the affected end-to-end specs in the ticket gate, and archive done tickets

## Context

T158 passed `pnpm ticket:gates` and was reported ALL CLEAR, then failed CI on `e2e/crossword-mobile.spec.ts` (iPhone project). The gate covers typecheck, lint, Vitest, build and `puzzles:verify`, but no Playwright, so an agent can finish a ticket that regrids every crossword without ever running a crossword end-to-end spec. CI already selects specs by the puzzle types a branch touches (`scripts/ci-changes.mts`); the gate should do the same locally.

## Scope

**In**

- A `ticket:gates` step, after `build`, that runs the specs CI would run for the branch: take the `e2e_specs` output of `scripts/ci-changes.mts origin/main` (reuse it, don't copy its selection rules; export a function from it if running the script is awkward).
- Run them on every Playwright project (desktop, mobile, iphone), against `pnpm start` on a port derived from the ticket (as the agents already do), with `VERCEL_ENV=preview` and a seeded database, started and stopped by the step.
- Skip the step with a clear message when the selection is empty because CI would run every spec (shared code, CI or dependency changes); CI covers that case. Skip it silently when no app files changed.
- Record the specs run in `gates.log` and in the `gates.ok` stamp, and have `ticket:stop-check` and `ticket:merge` accept only a stamp that includes the e2e step when it applied.
- Update `docs/tickets/INSTRUCTIONS.md` §2.1 and the table in §1 to say the gate includes the affected specs, and that the report lists which ones ran.
- **Archive done tickets.** Move the ticket file of every ticket whose README status is `done` from `docs/tickets/` into `docs/tickets/done/`, so the folder root holds only open tickets (plus `README.md`, `INSTRUCTIONS.md`, `_TEMPLATE.md`, `reports/`, `done/`). Reports stay in `reports/`.
  - A one-off migration moves the existing done tickets with `git mv` (history kept) and rewrites every link to them: the README index rows, ticket-to-ticket links, and links from `docs/SPEC.md`, `docs/PLAN.md`, `docs/research/`, `.claude/` and `CLAUDE.md`.
  - A script step (`pnpm ticket:archive`, in `scripts/dev/`) does the same for any ticket newly `done`, and `ticket:merge` runs it after it sets a ticket to done, so the move lands in the same status commit. It is idempotent and fails on a `done` ticket whose file it can't find in either place.
  - Every script and doc that resolves a ticket path (`status.ts`, `merge.ts`, `preflight.ts`, the agent definitions, `INSTRUCTIONS.md`, the orchestrate skill) looks in both `docs/tickets/` and `docs/tickets/done/`.
  - The README index links to the new location for done tickets.

**Out**

- Running the full suite in the gate. CI keeps that.
- Moving or renaming reports, or renumbering tickets.
- Changing which specs CI selects.
- Any change to the specs themselves.

## Notes

- The gate already builds the app, so the step reuses that build. Do not build twice.
- Keep the added time reasonable: report the gate time on a crossword-only change before and after in the report.
- `scripts/dev/` is skipped by CI, so edit there freely. If `scripts/ci-changes.mts` is edited, CI runs everything for that PR, which is expected.

## Acceptance criteria

- [ ] **AC1**: A branch that touches only one puzzle type's files runs that type's specs (plus type-less specs) on desktop, mobile and iphone inside `pnpm ticket:gates`.
  - _Verify (cli):_ on a scratch branch editing a file under `src/puzzles/crossword/`, `pnpm ticket:gates` output lists the crossword specs and all three projects.
- [ ] **AC2**: A failing spec fails the gate and no `gates.ok` is written.
  - _Verify (cli):_ break an assertion in a crossword spec on the scratch branch; the gate prints `FAIL: e2e`, exits non-zero and leaves no `gates.ok`.
- [ ] **AC3**: Shared-code changes skip the step with a message that CI runs everything, and docs-only changes skip it silently.
  - _Verify (cli):_ run the gate on a scratch branch editing `src/components/ui/button.tsx`, then on one editing only a markdown file, and read the output.
- [ ] **AC4**: The dev server the step starts is stopped when the gate ends, including on failure.
  - _Verify (cli):_ after each run above, `lsof -i :<port>` shows nothing listening.
- [ ] **AC5**: `INSTRUCTIONS.md` describes the new gate step and the report line.
  - _Verify (cli):_ `grep -n "e2e" docs/tickets/INSTRUCTIONS.md` shows §1 and §2.1 updated.
- [ ] **AC6**: After the migration, `docs/tickets/` holds only tickets that are not `done`, and every `done` ticket is in `docs/tickets/done/` with its history intact.
  - _Verify (cli):_ `ls docs/tickets/T*.md` lists only non-done IDs from the README; `ls docs/tickets/done | wc -l` equals the README's done count; `git log --follow docs/tickets/done/T001-tooling-and-local-env.md` shows its earlier commits.
- [ ] **AC7**: No link to a ticket is broken.
  - _Verify (cli):_ a link check over every `.md` file and `.claude/` file (a script or `grep -rEo 'T[0-9]{3}-[a-z0-9-]+\.md'` resolved against both folders) finds no missing target.
- [ ] **AC8**: Archiving is automatic and idempotent, and the tooling finds tickets in either folder.
  - _Verify (cli):_ on a scratch branch set a ticket to `done` in the README and run `pnpm ticket:archive`: the file moves and links update; a second run changes nothing; `pnpm ticket:status` and `pnpm ticket:merge --help`-style dry paths still resolve a ticket in each folder.
- [ ] **AC9**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
