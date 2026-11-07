---
id: T152
title: "Spot the difference: bigger scenes on desktop, and paper scenes in Ink"
milestone: M5
epic: E8
depends_on: [T146]
migrations: false
requires_human: false
preview: false
spec: ["SPEC §4.5", "SPEC §6.3", "SPEC §6.7"]
skills: []
---

# T152: Spot the difference: bigger scenes on desktop, and paper scenes in Ink

## Context

User feedback after launch testing. Two problems, both confirmed on the dev server (`/puzzles/spot-difference/pembroke-college`):

1. **The scenes are too small on desktop.** The solve page is `max-w-3xl` and the solver puts the two scenes side by side inside it, so each scene is about 340px wide at 1280px and the same at 1920px. The prepared images are 1000px on the long edge, so two thirds of the detail is thrown away, and a 60px difference region renders at about 20px.
2. **The scenes invert in Ink.** `SceneArt` masks `bg-current`, so in Ink the engraving's ink becomes paper on a dark card: a negative. SPEC §6.3 says grids and printed pages stay paper in Ink, "like a printed page on a dark desk". An engraving is a printed page.

## Scope

**In**

- **Desktop layout.** Side by side on a wider page (user decision, 2026-11-07). The solve page (`src/app/(app)/puzzles/[type]/[slug]/page.tsx`) widens `<main>` to `max-w-7xl` for types that ask for it (a `wide` flag beside the solver in `src/puzzles/solvers.tsx`, or a small set in `src/config/`), keeping the header, status line and actions where they are. Each scene then gets about 600px at 1280px. Under `touch` the layout stays stacked (SPEC §6.7).
- **Ink theme.** Draw each scene as a printed sheet in both themes: the `paper-sheet` surface with the mask coloured ink, so the engraving reads as ink on paper on the dark desk. Found circles stay `ludwig-red` and the keyboard cursor stays `grid-blue`. Apply the same to the shelf thumbnail (`preview.tsx`) and the detective scene if it shares `SceneArt` or the same masking idea (check `src/puzzles/detective-scene/`; if it has the same inversion, fix it here and say so in the report).
- **Image size check.** Scenes are prepared at 1000px on the long edge (`scripts/dev/prepare-scene.ts`, `LONG_EDGE`). At 600px display width and 2x DPR that is slightly under-sampled. Measure it: if the engraving looks soft at 1280px and 2x, raise `LONG_EDGE` to 1400, re-run the preparation for the five launch scenes and `fixture-clandon`, and re-run `pnpm puzzles:verify` (regions are in scene pixels, so a size change moves every region: only do this if the content files are updated by the same script run and the diffs are reviewed). Record the decision either way.
- Update the mobile spec `e2e/spot-difference-mobile.spec.ts` if it asserts anything about the desktop column, and add a desktop assertion for the new scene width.
- SPEC §6.3: add the printed-sheet rule for engraved scenes, and SPEC §4.5 the wide solve layout if one is introduced.

**Out**

- New scenes or changes to the hit-test, regions or `verify.ts`.
- Lighthouse work on this page (T069 follow-up, scored 85-86 on production).

## Notes

- The raw-token test (`src/config/raw-tokens.test.ts`) fails `bg-paper` and `text-ink` in `src/puzzles/**`; use the `paper-sheet` utility or allowlist the scene like the grids are.
- The found-circle overlay is an SVG with `vectorEffect="non-scaling-stroke"`, so it survives the size change unchanged.
- Keep the `preload` in the solver: a wider scene makes the first image the LCP element.

## Acceptance criteria

- [ ] **AC1**: On desktop each scene is at least 560px wide at a 1280px viewport, and the two scenes sit side by side.
  - _Verify (browser):_ at 1280×900, `getBoundingClientRect().width` of each `[role="img"]` scene is ≥ 560 and the two boxes share a top edge. Screenshots at 1280px and 1920px, both themes.
- [ ] **AC2**: Under `touch` the scenes are stacked and the page still fits the viewport width.
  - _Verify (browser):_ `e2e/spot-difference-mobile.spec.ts` passes on the `mobile` and `iphone` projects; `document.documentElement.scrollWidth <= 390`.
- [ ] **AC3**: In Ink the engraving is ink on paper, not paper on ink.
  - _Verify (browser):_ with `data-theme="ink"`, the scene's mask layer computed `background-color` equals the ink token and its container background equals the paper token; a screenshot at 1280px shows a light engraving on a dark page. The shelf thumbnail on `/puzzles/spot-difference` matches.
- [ ] **AC4**: Finding a difference still works at the new size on desktop and phone.
  - _Verify (browser):_ click the centre of a known region on the altered scene; the status line reads "Difference found. 1 of 5." and a `found-circle` appears on both scenes.
- [ ] **AC5**: Other solve pages are unchanged.
  - _Verify (browser):_ a crossword and a sudoku solve page still render in a `max-w-3xl` main at 1280px (measure the main's width ≤ 768px + padding).
- [ ] **AC6**: Gates pass, and the brand checklist holds.
  - _Verify (cli + code):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0; `grep -nE "#[0-9a-fA-F]{3,6}|rounded-|bg-white" src/puzzles/spot-difference` returns nothing.
