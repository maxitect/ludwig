---
id: T166
title: "One-line briefs for sightlines and the CCTV maze, and named witnesses in sightlines"
milestone: M8
epic: E8
depends_on: [T059, T060]
migrations: true
requires_human: false
preview: false
spec: ["SPEC §1.2 (S1E3, S2E3)", "SPEC §7.4.4 (sightlines, cctv-maze)"]
skills: ["/zod4"]
---

# T166: One-line briefs for sightlines and the CCTV maze, and named witnesses in sightlines

## Context

The two visibility puzzles come from scenes with a clear story (S1E3: who could have seen the alcove past the pillars; S2E3: a route through Cambridge past the cameras) and present as bare grids. One line each is enough; the grid is the story. See [`docs/research/narrative.md`](../research/narrative.md) §5. This is the smallest of the three narrative tickets and can follow T164 and T165 or run alongside them.

## Scope

**In**

- `sightlines_puzzles.brief text not null` and `cctv_maze_puzzles.brief text not null` (check: 1 to 160 characters, one line). Content gains `brief`; the payload carries it; the solver shows it above the grid on a `paper-sheet`.
- `sightlines_observers.name text not null`, unique per puzzle. Content names each observer. The solver labels each observer with the name and uses it in the accessible name ("The porter, facing east, 90 degrees"). The answer (blind-spot marks) is unchanged, so attempt marks stay valid.
- Content: briefs for the five sightlines and five CCTV maze files, and names for every observer. Example sightlines brief: "Three people swear they saw the alcove. Mark every square none of them could have seen."
- Tests: payload leak tests extended; the sightlines content test checks observer names are unique; e2e specs read the brief.
- Docs: SPEC §7.4.4 rows.

**Out**

- Any change to the visibility engine or the answers.
- Narrative for other types; everything else is left as it is (research note §1.4).

## Notes

- Sightlines returns only `{ correct }` (SPEC §4.1); nothing here changes that.
- Keep the brief to one sentence. If a puzzle needs two, it needs a different puzzle.

## Acceptance criteria

- [ ] **AC1**: Every sightlines and CCTV maze puzzle has a one-line brief, and every observer a name.
  - _Verify (cli):_ `pnpm puzzles:verify` passes; a copy with a 200-character brief or two observers of the same name fails.
- [ ] **AC2**: The payloads carry the brief and names and nothing from the solution.
  - _Verify (unit):_ both strict payload tests pass.
- [ ] **AC3**: The solve pages show the brief and the names.
  - _Verify (browser):_ a sightlines puzzle shows the brief above the grid and named observers in the accessible tree; a CCTV maze shows its brief. Screenshots in both themes at 1280px and 390px.
- [ ] **AC4**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
