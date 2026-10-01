---
id: T067
title: Title-sequence landing
milestone: M5
epic: E10
depends_on: [T015, T028]
migrations: false
requires_human: false
spec: ["SPEC §1.4", "SPEC §6.3", "SPEC §3", "PLAN §3 M5"]
skills: []
---

# T067: Title-sequence landing

## Context

This replaces T015's landing placeholder with the signed-out hero inspired by the title sequence (SPEC §1.4 and §6.3): Escher-like grid rooms, the silhouette walker, toppled white chess pieces, raking blue-grey light, the wordmark with an ink splat, and mirrored-digit sudoku backgrounds.

## Scope

**In**

- Landing page `/` for signed-out users: hero with the Wordmark and InkSplat, a scroll-driven sequence of grid "rooms" (CSS 3D transforms), the Walker crossing cells, toppled cburnett pieces from T028 with long shadows, the `.raking` overlay, a mirrored-digit background, and a CTA into `/puzzles`.
- Signed-in users still see the Desk (T015).

**Out**

- The bullet-hole transition (T066).
- New brand components beyond small landing-only parts.

## Notes

- Prefer CSS scroll-driven animations (`animation-timeline: view()`) with a static fallback. No WebGL, no new dependencies.
- Use our own artwork only: no BBC stills or logo files (SPEC IP note).

## Acceptance criteria

- [ ] **AC1**: The landing page renders every listed motif in the Paper theme.
  - _Verify (browser):_ Signed out, open `/` and take screenshots at 1280px and 390px. Wordmark, ink splat, a grid room, walker, a toppled piece and a raking-light overlay are all visible.
- [ ] **AC2**: The Ink theme renders correctly.
  - _Verify (browser):_ Take the same screenshots with `data-theme="ink"`. Contrast is legible and there are no flat whites.
- [ ] **AC3**: The scroll sequence progresses.
  - _Verify (browser):_ Screenshots at scroll 0%, 50% and 100% show distinct room states.
- [ ] **AC4**: Reduced motion shows a static composition.
  - _Verify (browser):_ With `browser_emulate_media` set to `reducedMotion: 'reduce'`, `getAnimations()` on the hero returns an empty list and all motifs are still visible.
- [ ] **AC5**: There is no horizontal scroll at 390px.
  - _Verify (browser):_ `document.documentElement.scrollWidth <= 390`.
- [ ] **AC6**: Signed-in users see the Desk, not the landing page.
  - _Verify (browser):_ Sign in, open `/`, and the Desk renders.
- [ ] **AC7**: Brand checklist (SPEC §8.3) items for this page pass.
  - _Verify (code):_ `grep -nE "#[0-9a-fA-F]{3,6}|rounded-|bg-white" src/app/(marketing)` returns nothing.
- [ ] **AC8**: Gates pass, and there are no console errors.
  - _Verify (cli + browser):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0, and `browser_console_messages` is empty.
