---
id: T145
title: "Spot the difference: authored engraving scenes replace the procedural SVG"
milestone: M5
epic: E8
depends_on: []
migrations: true
requires_human: false
preview: true
spec: ["SPEC §1.2 (S1E2)", "SPEC §2.3", "SPEC §7.4.4 (spot-difference)", "SPEC §10 (decision 6)"]
skills: ["/new-puzzle-type", "/db-trigger", "/zod4"]
---

# T145: Spot the difference: authored engraving scenes replace the procedural SVG

## Context

The T061 generator draws flat clip-art: the house floats above the ground line, the figures are stick people and the props are primitive shapes. No version of a primitive-shape generator will read as the show's ink-on-paper world. The user chose real artwork instead: public-domain 19th-century line engravings (country houses, Cambridge colleges, crowded street and group scenes), each paired with an edited copy. Differences become authored content rather than seeded output.

This ticket changes the engine, data model and solver, and ships one fixture scene. T146 makes the real launch scenes.

## Scope

**In**

- **Scene registry.** `src/puzzles/spot-difference/scenes.ts`, one entry per scene key: intrinsic `width` and `height` in pixels, `credit` (artist, work, year) and `sourceUrl`. The assets are `public/spot-difference/<key>/original.webp` and `altered.webp`. This is static asset metadata, so it lives in code like the chess pieces, not in the DB.
- **Asset script.** `scripts/dev/prepare-scene.ts <key> <original> <altered>`, using `sharp`:
  - greyscale, then a levels and threshold pass, so the paper becomes transparent and the ink becomes alpha;
  - resize both images to the same long edge (1600px);
  - write two WebPs, refusing if the two inputs differ in size;
  - print the dimensions to paste into the registry.
- **Theme-aware rendering.** Each scene is a `div` with `role="img"`, an `aria-label` and an `aspect-ratio`. The prepared image is used as a CSS `mask-image` over `bg-ink`, so the engraving is drawn in the ink token in both Paper and Ink themes, with no raw colours and no white boxes in dark mode. It sits in the existing framed panel.
- **Data model (SPEC §7.4.4 rewritten):**
  - `spot_difference_puzzles`: `puzzle_id`, `type_key`, `scene_key` text, non-empty CHECK. Drop `scene_seed`, `difference_count` and `generator_version`.
  - New `spot_difference_differences` **(S)**: `(puzzle_id, difference_index)` pk, `difference_index` 0–14, `x`, `y` ≥ 0, `width`, `height` > 0, in scene pixels. The difference count is now derived (the row count) and is not stored.
  - `spot_difference_attempt_found` gets a redundant `puzzle_id`, filled by a `BEFORE INSERT` trigger from the attempt. A composite FK `(puzzle_id, difference_index)` to `spot_difference_differences` replaces the index-range triggers. List it in SPEC §7.4.5.
- **Module.**
  - `load.ts` returns `{ puzzleId, sceneKey, width, height, differenceCount }`. The count comes from a row count in the same relational query, and the regions are never selected.
  - `load-solution.ts` reads the regions.
  - `check.ts` and the server-side tap hit-test use them, with the same semantics as today.
  - `verify.ts` checks the scene key exists, every region lies inside the scene, the regions don't overlap, and there are 1–15 differences. It also **pixel-diffs** the two prepared images: every changed pixel cluster above a noise floor must lie inside a region, and every region must contain changes. This is the exactly-N-differences proof.
- **Solver.** Keep the interaction from T061 and T117:
  - side by side on desktop, the Left/Right toggle on touch;
  - tap coordinates in scene pixels, posted to the server;
  - red-pencil circles on finds;
  - the keyboard sector overlay.

  Only the drawing layer changes. Taps map from the rendered box to scene pixels.
- **Preview.** `preview.tsx` (T129 thumbnails) renders the original scene with the same mask.
- **Remove** `engine.ts`, `scene.ts`, the snapshots and the five seed-based content files. Add one fixture scene (`content/spot-difference/fixture-…` or the smallest real T146 candidate) with 3 differences made by the agent, for example by mirroring a window or erasing a chimney with a cloned patch, so the pipeline is proven end to end.
- **Spec.** SPEC §2.3 row, §7.4.4, §7.4.5, and the §1.2 line "(SVG scenes)" becomes "(engraved scenes)".

**Out**

- The launch scenes and their art direction (T146).
- Hiding differences from a determined user. Diffing the two images reveals them, as diffing the SVGs did (T061 notes). That is still accepted.

## Notes

- Check `sharp` is resolvable from `scripts/dev` (Next ships it as an optional dependency). If it isn't, add it as a dev dependency.
- The mask needs a fallback for the rare browser without `mask-image`: use `-webkit-mask-image` too, as both are needed for Safari.
- Removing the generated puzzles: seeding drops omitted content only with confirmation (T079). Follow that path. Spot-difference attempts made before launch can go, so say so in the migration and the report.
- Budget: one scene pair should stay under about 300 KB. Record the transfer size of the solve page.

## Acceptance criteria

- [ ] **AC1**: The new tables and constraints exist, and the old seed columns are gone.
  - _Verify (db):_ `\d spot_difference_puzzles`, `\d spot_difference_differences`, `\d spot_difference_attempt_found`. Prove that a found row for an index the puzzle doesn't have fails the FK, and that a valid one succeeds.
- [ ] **AC2**: The payload and the solve page HTML contain no region data.
  - _Verify (unit + api):_ the leak test, and `curl` the page then grep for the fixture's region numbers.
- [ ] **AC3**: `puzzles:verify` passes on the fixture, and fails when an altered pixel lies outside every region or a region contains no change.
  - _Verify (cli + unit):_ two doctored test fixtures.
- [ ] **AC4**: A tap inside a region in either scene records the find, a tap outside doesn't, and the last find completes the puzzle.
  - _Verify (browser + db)._
- [ ] **AC5**: The scene draws in the ink token in both themes, with no white or paper box, at 1280px and 390px, and the touch toggle still works.
  - _Verify (browser):_ screenshots. _Verify (code):_ there are no hex or colour literals in `src/puzzles/spot-difference/`.
- [ ] **AC6**: The generator code is gone.
  - _Verify (code):_ `grep -rn "generateScene\|generatorVersion" src` finds nothing.
- [ ] **AC7**: The fixture plays on the PR preview.
  - _Verify (deploy):_ a share link plus a headless browser, and `get_runtime_logs` is clean.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
