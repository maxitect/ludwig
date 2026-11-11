# Three.js set pieces: spike and recommendation (T162)

Pinned: `three` 0.186.1, `@react-three/fiber` 9.8.2, `@types/three` 0.186.0 (all more than two weeks old; no `drei`). Three candidates were prototyped with one shared toolkit (`src/components/three/`): `MeshToonMaterial` with a three-band `NearestFilter` gradient map, ink `EdgesGeometry` outlines, one directional light with a `BasicShadowMap` shadow, a `ShadowMaterial` ground shadow in the `--cast` token, colours read from the CSS variables, `frameloop="demand"`. The prototypes are on `/dev/kitchen-sink` under "Three.js set pieces" (`data-dev="three-spike"`, dev-only like the rest of the page). Each mounts only when its button is pressed.

## Method

- Look: screenshots in Paper and Ink at 1280 px and 390 px, `.verification/T162/spike-<candidate>-<theme>-<width>.png` (not committed).
- Chunk: gzipped JS fetched after pressing the candidate's button, from a production build, in a fresh page per candidate.
- Frame time: headless Chromium (SwiftShader software GL), 390 px, CPU throttled 4x through CDP, a `requestAnimationFrame` delta log while driving the candidate's interaction for about 3 s.
- Caveat: headless rAF is vsync-locked at 16.7 ms, so these numbers prove the main thread keeps up with 4x throttling; they do not measure GPU cost on a phone. On-demand rendering means no frames are drawn while nothing moves.

## Results

| | 1. Desk hero | 2. Board room | 3. Gear daily |
|---|---|---|---|
| What it is | Stack of paper per category (a sheet per solve), a marker object on each, toppled extruded cburnett pawns, hard blue-grey shadows | Landing chess room as geometry (checker floor, wall, table), perspective camera walk driven by a slider and pointer parallax | Three extruded meshing gears, pointer cranks an integer tick, rotation derived from the tick |
| Look | Reads as Ludwig: flat paper, ink outlines, one red (pencil), hard shadow. Best of the three because the subject is objects on paper | Works as a room but the CSS landing already does this with the title sequence; 3D adds depth, not new content | Face-on gears are nearly flat; the extrusion and outline add little over the existing SVG gears |
| Gzipped chunk | +249 KB (three, r3f, `SVGLoader` ~9 KB) | +240 KB | +240 KB |
| Frame p95, 390 px, 4x CPU | 16.8 ms (p50 16.7) | 16.8 ms | 16.7 ms |
| Reduced-motion / no-JS fallback | Static SVG of the same stacks, same camera maths (`iso.ts`) | Would need a static still of the room: new art | Existing SVG gears (the Gears hub already draws them) |
| Data it can show | Real: solves per category | None (decor) | Real: the daily's state, but the SVG already shows it |
| Cost to ship | Done in this ticket | Re-do T140 and T156 walks in 3D, keep CSS fallback | Re-wire the engine's integer state into a second renderer on the Gears hub |

Both three.js dependencies together are about 240 KB gzipped regardless of the candidate: r3f imports the whole `three` namespace, so tree-shaking does not help. Only the first scene on a page pays it; it is a separate lazy chunk and no other route imports it.

## Recommendation

Ship candidate 1, the Desk hero, as the ticket specified. It is the only candidate where 3D carries information (a visible record of the player's solves) rather than re-presenting something the site already draws well, it needs no new fallback art (the SVG is the same composition), and it lives on the one page where a recurring visitor will see it.

Candidate 2 is the strongest future piece for spectacle, but it replaces a working CSS sequence and needs its own static fallback; it should wait for a ticket that owns T140 and T156 together. Candidate 3 gains too little face-on to justify a second renderer for the gear engine.

If the 240 KB gz ever matters, drop `@react-three/fiber` and drive `three` directly (a `WebGLRenderer`, one camera, the same `Solid` meshes): the scene is small enough, and it would save roughly the r3f reconciler and event system. Not done here because the ticket asks for r3f.

## Shipped piece: Desk hero

`src/components/desk/desk-scene/`. Server renders the static SVG; after hydration plus 250 ms the client imports `desk-canvas.tsx` (never earlier, never on reduced motion), and swaps SVG for canvas once the first frame is drawn. Arrow keys orbit up to 16 degrees in 4-degree steps; the mouse maps horizontal position to the same orbit, touch drags. The figure has an accessible name and a hidden list of what is on the desk.

Measured on a production build, signed in, 390 px mobile Lighthouse:

| | Without the scene | With the scene |
|---|---|---|
| `pnpm perf:lighthouse` (simulated throttling), performance | 89 | 91-92 |
| Devtools throttling, median LCP of 5 | 1547 ms (scene disabled with `--force-prefers-reduced-motion`) | 1575 ms (+28 ms) |
| Devtools throttling, performance / TBT | 99 / 0 ms | 99 / 0 ms |

Under simulated throttling Lighthouse ends its capture before the scene chunk is requested, so that run says nothing about the chunk; the devtools-throttled runs include it. The 89 versus 91-92 difference is run-to-run noise (the signed-in Desk was already at the edge of 90 before this ticket).

## Findings worth keeping

- The Desk streams inside a `Suspense` boundary, and without JavaScript the streamed content stays in a hidden container, so the whole signed-in Desk is invisible without JS (this predates T162). The Desk page's `Suspense` fallback now carries a `<noscript>` with the empty-desk SVG, which is what "SVG visible with JavaScript disabled" can mean today. Making the shelves themselves work without JS is a separate change.
- `frameloop="demand"` means input must request a frame: the scene hands its `invalidate` to the hero (`onWake`), otherwise arrow keys silently do nothing.
- `THREE.Clock` is deprecated in three 0.186 and r3f 9.8.2 still uses it, so a console warning is printed in development and production builds.
