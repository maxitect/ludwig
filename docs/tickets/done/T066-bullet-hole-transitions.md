---
id: T066
title: Bullet-hole view transitions
milestone: M5
epic: E10
depends_on: [T018]
migrations: false
requires_human: false
spec: ["SPEC §6.3", "SPEC §6.6", "PLAN §3 M5"]
skills: []
---

# T066: Bullet-hole view transitions

## Context

This is the "bullet-hole tear-through" motif from SPEC §6.3. It plays on puzzle completion, and on the route transition from the landing page into the app.

## Scope

**In**

- A `BulletHole` brand component: an SVG torn circular mask that expands to reveal the `grid-blue` grid.
- Wiring as a view transition on landing → `/puzzles` navigation, and as an in-page effect when a puzzle is solved.
- A fade fallback for `prefers-reduced-motion` and the `reduce_motion` setting, and for browsers without the View Transitions API.

**Out**

- The landing page content itself (T067).
- Any other route transitions.

## Notes

- Read `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` before starting. It uses React's `<ViewTransition>`; follow whatever config flag that guide requires.
- No SVG filters in the animation (`.claude/rules/design-system.md`). Animate a `clip-path` or mask only.

## Acceptance criteria

- [ ] **AC1**: Navigating from the landing page to `/puzzles` plays the bullet-hole transition.
  - _Verify (browser):_ Click the landing CTA, take screenshots at roughly 150ms and roughly 600ms, and `browser_evaluate` confirms `document.startViewTransition` ran (e.g. via a `data-vt` marker set in the transition callback).
- [ ] **AC2**: Solving a puzzle plays the effect behind the Solved stamp.
  - _Verify (browser):_ Solve an anagram. A screenshot shows the torn hole revealing `grid-blue`.
- [ ] **AC3**: With reduced motion, a fade is used instead.
  - _Verify (browser):_ `browser_emulate_media` with `reducedMotion: 'reduce'`, then repeat AC1. No clip-path animation runs (check `getAnimations()` for clip-path keyframes), and the opacity transition is at most 200ms.
- [ ] **AC4**: The `reduce_motion` user setting has the same effect as the media query.
  - _Verify (browser):_ Signed in with `reduce_motion = true` (set via `/settings`), repeat AC3 with no media emulation and get the same result.
- [ ] **AC5**: Browsers without the API degrade gracefully.
  - _Verify (browser):_ `browser_evaluate` deletes `document.startViewTransition` before navigation. Navigation still works and the console shows no errors.
- [ ] **AC6**: There are no console errors or hydration warnings.
  - _Verify (browser + next):_ `browser_console_messages` is empty, and `nextjs_call` reports no runtime errors.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
