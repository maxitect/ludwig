---
id: T122
title: Solved footer, a small, ordered, framed tear behind the stamp
milestone: M5
epic: E10
depends_on: [T120]
migrations: false
requires_human: false
spec: ["SPEC §6.3", "SPEC §6.6"]
skills: []
---

# T122: Solved footer, a small, ordered, framed tear behind the stamp

## Context

On solve, `BulletHole` paints a full-opacity 1px `--ring` grid behind the whole footer (`src/components/brand/bullet-hole.css` `.bullet-hole`, `src/components/puzzle/solve-chrome.tsx:341`). The result has several problems:

- In Ink it is bright book-blue.
- It ends as a hard-edged rectangle, with half cells at the sides.
- Its percentage polygon squashes into a lozenge.
- "Solved in" sits on the grid lines.

See `docs/research/look-and-feel-audit.md` §3. The user decided to keep a small tear, made ordered and framed.

## Scope

**In**

- **Shape:** one truly circular torn hole behind the "Solved." stamp only. It is sized in `px` or `em`, never `%`, so its aspect ratio doesn't depend on the footer's.
- **Ordered grid:** the grid inside the hole uses the brand's 24px pitch. It is anchored so the hole's centre falls on a cell centre, with whole cells only: no half cells or stray line ends at the rim.
- **Colour:** the grid is `grid-blue` in both themes, never `--ring`. Its alpha makes it read as a layer revealed beneath the paper.
- **Framed:** the hole has a defined edge. That is a torn paper rim following the polygon (a lighter or darker ring) or a 2px border just inside the tear. Either way, the grid reads as seen *through* the paper.
- **Footer:** the rest of the footer is a plain surface. "Solved in", the epilogue and "Next in volume" never sit on grid lines.
- **Sequence:** the hole opens (about 300ms, ease-out), then the `SolvedStamp` spring lands on top of it. With reduced motion, or the `reduce_motion` setting, both appear at once with no clip animation.
- Update SPEC §6.3 ("Bullet-hole transition") to describe the in-page hole.

**Out**

- The landing → Collection route transition (T123). If the torn polygon keyframes are shared, T123 adapts to them.

## Notes

- Keep animating `clip-path` (or a mask) only. No SVG filters (design rules).
- Generate the torn circle's polygon points with the existing approach in `bullet-hole.css`, but in absolute units around a centre point.

## Acceptance criteria

- [ ] **AC1**: The solved footer shows a round hole behind the stamp, with an ordered, framed grid, in both themes.
  - _Verify (browser):_ Solve an anagram in Paper and in Ink at 1280px and 390px, and screenshot the footer after 1s. The hole's bounding box is within 5% of square. The grid has no partial cell at the rim, and the hole's edge is visible.
- [ ] **AC2**: No footer text overlaps the grid.
  - _Verify (browser):_ `browser_evaluate`: the bounding boxes of the "Solved in" paragraph, the epilogue and the Next button don't intersect the hole element.
- [ ] **AC3**: The grid uses `grid-blue` in both themes.
  - _Verify (browser):_ The computed grid line colour in Ink resolves to `grid-blue` (at its alpha), not `book-blue`.
- [ ] **AC4**: The stamp lands after the hole opens.
  - _Verify (browser):_ Slow animations with `document.getAnimations().forEach(a => a.playbackRate = 0.1)`. A screenshot mid-open shows the hole growing with the stamp not yet at rest.
- [ ] **AC5**: Reduced motion shows the final state immediately.
  - _Verify (browser):_ With `browser_emulate_media` `reducedMotion: 'reduce'`, no clip-path animation runs (`getAnimations()`), and the final screenshot matches AC1.
- [ ] **AC6**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
