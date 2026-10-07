---
id: T083
title: "Gear train UI, gears hub integration and content"
milestone: M4
epic: E7
depends_on: [T082, T043]
migrations: false
requires_human: false
spec: ["SPEC §5.2.5 (interaction)", "SPEC §3", "SPEC §6", "PLAN §5.4"]
skills: ["/new-puzzle-type", "/zod4"]
---

# T083: Gear train UI, gears hub integration and content

## Context

This is the playable Mode B, built on the T082 engine. The player places cogs from an inventory tray onto a pegboard, and the train turns live once the driver reaches each cog (SPEC §5.2.5). The dancer diagrams stay the main version, so Mode B sits after them on `/gears`.

## Scope

**In**

- **`solver.tsx`:**
  - the pegboard, bolts, driver crank handle and target direction arrow;
  - the inventory tray with remaining counts;
  - placing by drag and by keyboard (choose a size, move the peg cursor with the arrow keys, Enter to place, Delete to remove);
  - refused placements announced with the broken rule;
  - the live train (spin, jam marks, status line), with direction arrows under reduced motion;
  - Check.
- **Cog drawing:** reuse the cog from the gears board. Extract it to `src/puzzles/_shared/` only if the gears board doesn't already expose it.
- **The gears hub** (`/gears`, T043) gains a "Mode B: Classic Gear Train" section after Fix the Diagram, linking to `/puzzles/gear-train`, and a "Classic Gear Train" list in its How it works section.
- **Content:** 6 original puzzles in `content/gear-train/`, at least one per difficulty. One is "The Station", modelled on the detectives' board.

**Out**

- Engine changes beyond bug fixes. If a rule is missing, stop and raise it.
- A generator or daily gear trains.

## Notes

How it works copy for the hub (adjust if the UI wording changes):

1. The driver turns clockwise. The target has to turn the way its arrow shows.
2. Place cogs from the tray on free pegs. Cogs mesh when their rims touch, and neighbours turn opposite ways.
3. Cogs can't overlap each other or a bolt. A loop with an odd number of cogs jams the train.
4. Every cog you place must be needed. Only one set of cogs works.

## Acceptance criteria

- [ ] **AC1**: `puzzles:verify` requires exactly one placement per content file.
  - _Verify (cli):_ it passes on 6 files and fails on a broken copy (one bolt removed, opening a second chain).
- [ ] **AC2**: Signed in, placed cogs persist across reloads, and completion is recorded.
  - _Verify (browser + db):_ `gear_train_attempt_cogs` rows match the board, and `completed_at` is set after a correct check.
- [ ] **AC3**: A colliding placement is refused, a jammed train shows jam marks and does not turn, and an unneeded cog is named in the status line.
  - _Verify (browser):_ `browser_snapshot` of each state.
- [ ] **AC4**: The game is keyboard-operable, and refusals and the status line are announced.
  - _Verify (browser):_ `browser_snapshot`.
- [ ] **AC5**: The hub shows the Mode B section after the dancer sections, and it links to `/puzzles/gear-train`.
  - _Verify (browser)._
- [ ] **AC6**: Both themes render at 1280px and 390px. Spinning respects reduced motion.
  - _Verify (browser):_ screenshots, plus one with reduced motion emulated.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
