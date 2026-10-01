---
id: T061
title: "Puzzle type: spot the difference (seeded SVG scenes)"
milestone: M4
epic: E8
depends_on: [T018]
migrations: true
requires_human: false
spec: ["SPEC §1.2 (S1E2)", "SPEC §2.3", "SPEC §7.4.4 (spot-difference)", "PLAN §3 M4 (Visual group)", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T061: Puzzle type: spot the difference (seeded SVG scenes)

## Context

This is S1E2's "entry-level puzzle". The two scenes and their differences are **derived** deterministically from `(scene_seed, difference_count, generator_version)`, and only those three values are stored (SPEC §7.4.4). `generator_version` pins the derivation, so changing the generator never silently changes existing puzzles.

## Scope

**In**

- **`src/puzzles/spot-difference/engine.ts`**: a pure, seeded (mulberry32) SVG scene generator.
  - It builds an ink-line-drawn stately-home group scene (S1E2's team-building photo) from a small library of primitives: figures, windows, a tree, a lamp post, a hat, a tie.
  - The scene renders as an SVG element tree, not a string.
  - It applies N differences, each one of: object removed, colour swapped (within the tokens), object moved, object mirrored, or size changed.
  - Difference regions are axis-aligned bounding boxes, used for hit-testing.
- **The generator is versioned:**
  - an `engines` map keyed by `generator_version`;
  - v1 is the only entry;
  - a test snapshots the v1 output for a fixed seed.
- **`src/puzzles/spot-difference/`**, built per `/new-puzzle-type`. Tables: `spot_difference_puzzles` and `spot_difference_attempts`, plus `spot_difference_attempt_found` (difference_index).
- **The solver** shows the scenes side by side (stacked at 390px). A tap or click hit-tests against the derived regions. Found differences are circled in red pencil.
- **Content:** 5 seeds, at difficulties set by `difference_count` and primitive density.

**Out**

- Photo or bitmap scenes.

## Notes

- **Server-side hit-testing.** The client receives both rendered scenes (it has to), but the difference regions must **not** be sent. The client posts the tap coordinates in scene units, and a server action hit-tests them with the derived regions. Each find is a `saveState` write.
- **The SVG itself leaks differences.** A determined user could diff the two SVG DOMs. That is acceptable for a fan site, but note it in the report.

## Acceptance criteria

- [ ] **AC1**: The table stores only the seed, count and version, with `difference_count` CHECK 1–15 and `generator_version` CHECK ≥ 1.
  - _Verify (db):_ `\d spot_difference_puzzles`. Out-of-range values fail.
- [ ] **AC2**: Generation is deterministic and version-pinned.
  - _Verify (unit):_ the same seed and version give an identical tree (snapshot); a different seed gives a different tree; an unknown version throws.
- [ ] **AC3**: Exactly `difference_count` differences are generated, and their regions don't overlap.
  - _Verify (unit):_ a property test over 500 seeds.
  - _Verify (cli):_ `puzzles:verify` passes on 5 files.
- [ ] **AC4**: The payload and initial HTML contain no difference regions or indexes.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (api):_ grepping the solve page HTML for region data finds nothing.
- [ ] **AC5**: A tap inside a difference region (either scene) records the find. A tap elsewhere doesn't. Finding all of them completes the puzzle.
  - _Verify (browser + db):_ use the coordinates from a known region (computed in a test helper). `spot_difference_attempt_found` gets a row, and `completed_at` is set after the last find.
- [ ] **AC6**: A keyboard alternative exists: a focusable grid overlay of sectors, where Enter picks a sector centre.
  - _Verify (browser)._
- [ ] **AC7**: Both themes render at 1280px and 390px, and the scenes use design tokens only.
  - _Verify (browser):_ screenshots.
  - _Verify (code):_ there are no hex literals in `engine.ts`.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
