---
id: T010
title: Brand components
milestone: M1
epic: E3
depends_on: [T007]
migrations: false
requires_human: false
spec: ["SPEC §1.4", "SPEC §6.1", "SPEC §6.3", "PLAN §3 M1"]
skills: []
---

# T010: Brand components

## Context

These are the reusable motifs every screen composes. They are built once here so no screen ever hand-rolls them (`.claude/rules/design-system.md`). The tokens, fonts and textures they rely on come from T007.

## Scope

**In** (all components live in `src/components/brand/`):

- `Wordmark`: our own inline SVG of "Ludwig." traced from the chosen script (SPEC §6.1). Variants `red` (on paper) and `ink-splat` (ink with the `InkSplat` behind the "L").
- `Credit`: the stacked caps heading, `top`/`bottom` props and a heading level (SPEC §6.1, typographic rules).
- `InkSplat`: the SVG splat asset.
- `Walker`: the silhouette walking across grid cells, used for loading. It is static when motion is reduced.
- `SolvedStamp`: the red script "Solved." stamp with its appear animation.
- `GridPaper`: a wrapper applying `.grid-paper`.
- `Raking`: a wrapper applying `.raking`.
- `Grain`, if T007 didn't already provide the overlay as a component.

**Out**

- `BulletHole` transitions (T066).
- The landing composition (T067).
- The kitchen-sink showcase (T014).

## Notes

- The SVG paths are hand-authored, or traced once from the free script font and saved as path data. The wordmark must not depend on a font loading at runtime.
- `Walker` must render well inside Suspense fallbacks, so it has no client-only hooks unless it is wrapped as a client island. Check `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`.
- Only `SolvedStamp` may use `motion`. Everything else uses CSS (SPEC §6.6).

## Acceptance criteria

- [ ] **AC1**: Every component listed under In scope is exported from `src/components/brand/index.ts`.
  - _Verify (code):_ `grep -E "export .*(Wordmark|Credit|InkSplat|Walker|SolvedStamp|GridPaper|Raking)" src/components/brand/index.ts` matches all seven.
- [ ] **AC2**: `Wordmark` renders as inline SVG with no `<text>` element and no font dependency, and both variants look correct in both themes.
  - _Verify (code + browser):_
    - `grep -c "<text" src/components/brand/wordmark.tsx` returns 0.
    - Render both variants on a temporary route or test page; screenshot in Paper and Ink at 1280px and 390px.
- [ ] **AC3**: `Credit` renders a semantic heading. The top line is small, light and uppercase; the bottom line is large, bold and uppercase in `font-display`.
  - _Verify (browser):_ The `browser_snapshot` shows a heading role at the requested level, and computed styles (`browser_evaluate` `getComputedStyle`) show `text-transform: uppercase` and the display font family on both lines.
- [ ] **AC4**: `Walker` animates by default and is static under `prefers-reduced-motion: reduce`.
  - _Verify (browser):_
    - Use `browser_emulate_media` with `reducedMotion: "reduce"`; the computed `animation-name` is `none`, or the element has no running animations (`document.getAnimations().length === 0` within the walker).
    - Without emulation, it is greater than 0.
- [ ] **AC5**: `SolvedStamp` uses the script font and `ludwig-red`, and skips its animation under reduced motion.
  - _Verify (browser):_ The computed `color` matches the `--ludwig-red` value. With reduced motion emulated, the stamp is immediately visible at its final transform.
- [ ] **AC6**: No brand component contains raw hex colours, Tailwind palette colours or `rounded-*` classes.
  - _Verify (code):_ `grep -rnE "#[0-9a-fA-F]{3,6}\b|(bg|text|border)-(red|blue|gray|slate|zinc|neutral|white|black)-?[0-9]*|rounded-" src/components/brand/` matches nothing. SVG `fill`/`stroke` values must use `currentColor` or `var(--…)`.
- [ ] **AC7**: There are no console errors or hydration warnings when the components render.
  - _Verify (browser):_ `browser_console_messages` is empty of errors and warnings on the test route.
- [ ] **AC8**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
