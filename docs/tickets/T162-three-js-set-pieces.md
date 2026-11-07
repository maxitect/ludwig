---
id: T162
title: "Brand set pieces in three.js: a spike, then one piece on the Desk"
milestone: M8
epic: E10
depends_on: [T160, T156]
migrations: false
requires_human: false
preview: true
spec: ["SPEC §1.4", "SPEC §6", "SPEC §6.6", "SPEC §8.3"]
skills: []
---

# T162: Brand set pieces in three.js: a spike, then one piece on the Desk

## Context

The user wants more spectacle in the brand, and named three.js. The landing already does a 3D title sequence in CSS (T067, T140, T156), and the charts dashboard (T160) is D3. This ticket finds where real 3D earns its place, proves it can look like Ludwig (flat ink and paper, hard shadows, one red, no gradients or glow), and ships one set piece on the Desk. Later pieces get their own tickets.

## Scope

**In**

- **Spike** (time-boxed, half the ticket): three candidates prototyped on `/dev/kitchen-sink` behind a `data-dev` flag, each a `@react-three/fiber` scene with toon or flat shading only, a single directional light casting a hard shadow in `shadow` blue, paper background, ink outlines (edge geometry or an outline pass), and scroll or pointer interaction:
  1. **The Desk hero**: the player's solved puzzles as a stack of paper sheets and pieces on an isometric desk, one object per category, growing with their solves, with the toppled white pieces from the landing.
  2. **The Board room, for real**: the landing's chess room as geometry, so The Board's unwind (T140) plays with true perspective and the camera walk of T156.
  3. **The gear daily**: the day's gear diagram as 3D gears on the Gears hub, cranked by the pointer, sharing the engine's integer state.
  Record for each: look (screenshots in both themes), bundle cost (gzipped chunk), frame time on a 4x throttled CPU at 390px, and reduced-motion fallback. Write it up in `docs/research/three-js-set-pieces.md` with a recommendation.
- **Ship candidate 1** (the Desk hero) unless the spike shows a stronger case for another; say why in the report. Rules:
  - the chunk is lazy and loads only on the Desk, after the first shelves paint; the Desk without JavaScript or with reduced motion shows a static SVG of the same composition;
  - tokens only, drawn into materials from the CSS variables at mount so both themes work;
  - no post-processing bloom, fog or gradients; shadows are hard (shadow map with no blur);
  - 60 fps on a 4x throttled CPU at 390px, under 300 ms added to the Desk's LCP, Lighthouse performance on `/` signed in at or above 90;
  - pointer and keyboard interaction (arrow keys orbit a few degrees), with an accessible name and a hidden text description of what is on the desk.
- Pin `three` and `@react-three/fiber` (and `@react-three/drei` only if needed) at exact versions, note the size in the report, and add the brand rules for 3D to `.claude/rules/design-system.md` (toon or flat shading, hard shadows, outlines, tokens).

**Out**

- Replacing the CSS landing sequence (candidate 2 ships only if a later ticket picks it).
- Any 3D on solve pages.
- WebGPU or custom shaders beyond the outline pass.

## Notes

- `src/puzzles/_shared/chess-board/pieces.tsx` has the cburnett geometry as SVG paths; extrude them (`ExtrudeGeometry` from the SVG path) rather than importing models, so the pieces match the rest of the site and the licence stays as credited on `/about`.
- Measure before and after on the Desk with `pnpm perf:lighthouse`, adding `/` signed in to its URL list if it is not there.
- Self-assessed like T160: screenshots in both themes at 1280px and 390px, a short clip or frame sequence of the interaction, and the user reviews the preview.

## Acceptance criteria

- [ ] **AC1**: The research note compares the three candidates with measurements and makes a recommendation.
  - _Verify (code):_ `docs/research/three-js-set-pieces.md` has a table of look, chunk size, frame time and fallback per candidate.
- [ ] **AC2**: The shipped piece looks like Ludwig.
  - _Verify (browser):_ screenshots in Paper and Ink at 1280px and 390px show flat or toon shading, hard shadows, ink outlines and no gradient; the raw-token test passes.
- [ ] **AC3**: It costs little.
  - _Verify (cli + browser):_ the three.js chunk is lazy (not in the Desk's initial JS); Lighthouse performance on `/` signed in is at or above 90; rAF frame deltas during interaction have p95 at or below 20 ms with 4x CPU throttling at 390px.
- [ ] **AC4**: Reduced motion and no-JavaScript show the static composition.
  - _Verify (browser):_ with `reducedMotion: 'reduce'` no WebGL canvas is created and the static SVG is visible; with JavaScript disabled the SVG is visible.
- [ ] **AC5**: It is operable and described.
  - _Verify (browser):_ arrow keys orbit the scene with focus on it; the canvas has an accessible name and the hidden description lists the objects; `axe` is clean on `/`.
- [ ] **AC6**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
