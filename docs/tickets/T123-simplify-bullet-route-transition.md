---
id: T123
title: Simplify the bullet-hole route transition into the Collection
milestone: M5
epic: E10
depends_on: [T122]
migrations: false
requires_human: false
spec: ["SPEC §6.3", "SPEC §6.6"]
skills: []
---

# T123: Simplify the bullet-hole route transition into the Collection

## Context

The landing → `/puzzles` view transition (T066) runs two competing clip animations. The audit's frame-by-frame capture (`docs/research/look-and-feel-audit.md` §4) found these problems:

- The blue grid shows for only about 100–150ms.
- Nothing visible happens for the first 250ms.
- The hole is an ellipse that starts at the viewport centre.
- Old-page corners linger, and the header is torn even though it is identical on both pages.

It also relies on cancelling React-internal animations and on `view-transition-name: root !important`. The user chose option B: simplify.

## Scope

**In**

- **One moving layer.** `::view-transition-old(root)` sits on top and tears open: a circular torn hole that grows from the click point to past the farthest corner (about 400ms, ease-out), revealing the grid on the group background.
- **New page.** `::view-transition-new(root)` sits underneath and only fades in (about 200–500ms). It never clips.
- **Click origin.** The landing CTAs set `--vt-x`/`--vt-y` on `<html>` from the pointer event (keyboard activation uses the element's centre). The polygon is written in `vmax`-based `calc()` lengths around that point, so the hole stays circular at any aspect ratio.
- **Fixed header.** The site header gets its own `view-transition-name` with `animation: none`, so it doesn't tear.
- **Grid.** The revealed grid matches T122: `grid-blue`, the 24px pitch, an ordered phase.
- **Consistency.** The header "Collection" link from the landing page also carries `transitionTypes={["bullet-hole"]}`, so the same navigation looks the same whichever link is used.
- **Clean-up.** Remove the leftover `data-vt` marker. Keep the reduced-motion crossfade (150ms).
- **Fallback.** If the React root-snapshot workaround can't be kept stable, fall back to a plain crossfade (option C) and update SPEC §6.3. Record the decision in the report.

**Out**

- The in-page solved hole (T122).
- View transitions on any other route.

## Notes

- Read `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` again. Screenshots don't capture view-transition pseudo-elements. Use CDP `Page.startScreencast`, as the audit did (`scratchpad/cast.mjs` approach, documented in the T066 report).
- The scrollbar of the old page disappears at the end, which causes a 15px jump. Use `scrollbar-gutter: stable` on `html`, or an equivalent, if it is still visible.

## Acceptance criteria

- [ ] **AC1**: The tear starts at the clicked CTA and is circular.
  - _Verify (browser):_ Screencast frames at 1280×800 and 390×844 show the hole centred within 24px of the click point, with a width-to-height ratio within 10% of 1.
- [ ] **AC2**: The grid is visible as a ring for at least 200ms, and no old-page fragment remains at the end.
  - _Verify (browser):_ Screencast frames. The frame at the end of the tear shows no old-page content in any corner.
- [ ] **AC3**: The header doesn't tear.
  - _Verify (browser):_ The header pixels are identical across all mid-transition frames.
- [ ] **AC4**: The landing CTAs and the header Collection link play the same transition.
  - _Verify (browser):_ Screencast both navigations.
- [ ] **AC5**: Reduced motion and the `reduce_motion` setting give the crossfade, and browsers without the API navigate normally.
  - _Verify (browser):_ T066 AC3–AC5 still pass.
- [ ] **AC6**: There are no console errors, and the `data-vt` attribute is gone.
  - _Verify (browser):_ `browser_console_messages` is empty, and `document.documentElement.dataset.vt` is undefined after navigation.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
