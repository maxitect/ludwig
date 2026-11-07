---
id: T092
title: "Detective scene: artwork and launch content"
milestone: M6
epic: E11
depends_on: [T091]
migrations: false
requires_human: true
spec: ["SPEC §2.4 (detective-scene)", "SPEC §6 (visual design)", "SPEC §10 (decision 6)", "PLAN §3 M6", "PLAN §5.4"]
skills: []
---

# T092: Detective scene: artwork and launch content

## Context

T091 built the type with a 3-title fixture. This ticket makes the first real scene: a full illustration in the brand style with at least 30 hidden TV detective-drama titles (SPEC §2.4). Art direction needs the user's sign-off, hence `requires_human`.

## Scope

**In**

- **Title list.** A shortlist of 40–50 British and American TV detective and crime dramas, past and present, each with a planned hiding idea (shop sign, poster, number plate, newspaper headline, prop). Include _Ludwig_ itself. Present it to the user for approval before drawing anything.
- **The scene.** One `src/puzzles/detective-scene/scenes/<key>.tsx`: a night-time Cambridge street (the show's setting) in ink line on paper, using design tokens only, with the approved titles hidden in it. No stills, logos or show artwork (SPEC IP note).
- **Content.** `content/detective-scene/<slug>.ts`, with each item's title, region and aliases (for example "Softly, Softly" and "Softly Softly: Task Force").

**Out**

- More scenes. Add them in later content tickets.
- Copying or tracing the Radio Times illustration (SPEC §10, decision 6). Titles of shows are facts and free to use; the drawing and the specific hiding gags must be ours.

## Notes

- **Human checkpoints:** the user approves the title list, then a rough layout of where each title sits, then the finished scene. Record each approval in the report.
- Keep the SVG small enough to stay inside the performance budget (SPEC §8.3). Measure the solve page's transfer size and record it in the report.

## Acceptance criteria

- [ ] **AC1**: The user has approved the title list, the layout and the finished scene.
  - _Verify (human):_ the approvals are quoted in the report.
- [ ] **AC2**: The scene hides at least 30 titles, and every region and title passes `verify`.
  - _Verify (cli):_ `pnpm puzzles:verify` passes.
- [ ] **AC3**: Every title can be found and accepted in the solver.
  - _Verify (browser):_ a scripted pass taps each region's centre and types its title. Every one is accepted, and the puzzle completes.
- [ ] **AC4**: The scene uses design tokens only and renders correctly in both themes at 1280px and 390px.
  - _Verify (browser):_ screenshots `.verification/T092/ac4-*.png`. Grepping the scene file for hex colours finds none.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
