---
id: T091
title: "Puzzle type: detective scene (engine, hit-test and solver)"
milestone: M6
epic: E11
depends_on: [T061]
migrations: true
requires_human: false
spec: ["SPEC §1.2.1", "SPEC §2.4 (detective-scene)", "SPEC §7.4.4 (detective-scene)", "SPEC §7.4.5", "PLAN §3 M6"]
skills: ["/new-puzzle-type", "/db-trigger", "/zod4"]
---

# T091: Puzzle type: detective scene (engine, hit-test and solver)

## Context

The Radio Times special hid 50 TV crime-drama titles in one illustrated street. That suits a show about a puzzle setter posing as a detective. This ticket builds the type, the server-side hit-test and the solver, using one small fixture scene. The real artwork and content come in T092.

## Scope

**In**

- **`src/puzzles/detective-scene/`**, built per `/new-puzzle-type`. Tables:
  - `detective_scene_puzzles`;
  - `detective_scene_items`;
  - `detective_scene_item_aliases`;
  - `detective_scene_attempts`;
  - `detective_scene_attempt_found`.

  All as in SPEC §7.4.4.
- **Triggers** (`/db-trigger`): `detective_scene_attempts_fill_puzzle_id` and `detective_scene_attempt_found_fill_puzzle_id`, as listed in SPEC §7.4.5.
- **`scenes/`:** a registry from `scene_key` to an SVG scene component. It holds one fixture scene (`fixture-street`) with 3 hidden titles, drawn in the ink-line brand style.
- **`engine.ts`:** `normaliseTitle` (SPEC §2.4) and `matchFind(items, aliases, tap, typed)`, which returns the position of the found item or none.
- **`verify`:** regions lie inside the scene and don't overlap, titles and aliases are distinct after normalising, and the scene key exists in the registry.
- **Server action:** posts the tap in scene units and the typed title, matches on the server, and saves the find. Neither regions nor titles are sent to the client.
- **Solver UI:**
  - a pannable and zoomable scene, which matters at 390px;
  - tap to drop a pin, then type a title;
  - each find gets a red pencil ring and a numbered marker;
  - a "found N of M" counter;
  - Reveal lists the titles and rings their regions.
- **Keyboard:** a focusable sector grid over the scene, as in spot-difference (T061), with Enter to pin a sector centre.
- **Preview:** add `src/puzzles/<type>/preview.tsx` (T129) and register it in `src/puzzles/previews.ts`. Typecheck fails until you do.

**Out**

- The real scene artwork and content (T092).
- Fuzzy matching beyond normalising and aliases.

## Notes

- The scene SVG necessarily contains the hidden text (a sign that reads "SCUPPER TIMES" is the puzzle). That is expected. What must not leak is the list of titles, the regions and the aliases.
- Reuse the hit-test and sector-overlay patterns from spot-difference. Extract a shared piece into `src/puzzles/_shared/` only where both types now call it (PLAN §2, principle 7).

## Acceptance criteria

- [ ] **AC1**: The tables, triggers and composite FKs exist. An explicit mismatched `puzzle_id` on a found row is rejected.
  - _Verify (unit):_ DB-integrity tests for both fill triggers and the FK.
- [ ] **AC2**: Matching follows SPEC §2.4.
  - _Verify (unit):_ "the sweeney", "Sweeney" and "THE SWEENEY!" all match "The Sweeney". "Starsky & Hutch" matches "Starsky and Hutch". A correct title tapped outside its region doesn't match. An alias matches.
- [ ] **AC3**: `verify` rejects overlapping regions, a region outside the scene, duplicate normalised titles and an unknown scene key.
  - _Verify (unit)._
- [ ] **AC4**: The payload and the solve page's HTML carry no titles, aliases or regions.
  - _Verify (unit):_ the payload leak test passes.
  - _Verify (api):_ grepping the solve page HTML for the fixture titles finds only text drawn in the scene itself.
- [ ] **AC5**: Signed in, finding all 3 fixture titles records the finds and completes the puzzle, and finds persist across a reload.
  - _Verify (browser + db)._
- [ ] **AC6**: The puzzle can be solved by keyboard alone through the sector grid.
  - _Verify (browser)._
- [ ] **AC7**: Both themes render correctly at 1280px and 390px, and pan and zoom work by touch.
  - _Verify (browser):_ screenshots `.verification/T091/ac7-*.png`.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
