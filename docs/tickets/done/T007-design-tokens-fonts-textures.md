---
id: T007
title: Design tokens, themes, fonts and textures
milestone: M0
epic: E3
depends_on: [T001]
migrations: false
requires_human: false
spec: ["SPEC §1.4", "SPEC §6.1", "SPEC §6.2", "SPEC §6.3", "SPEC §8.3", ".claude/rules/design-system.md"]
skills: []
---

# T007: Design tokens, themes, fonts and textures

## Context

This is the visual foundation. Every later UI ticket composes these tokens and never defines new colours, radii or fonts. See SPEC §6.1–6.3.

## Scope

**In**

- `src/app/globals.css`:
  - the SPEC §6.2 colour tokens in a Tailwind v4 `@theme`;
  - the shadcn semantic variables mapped for **Paper** (the default) and **Ink**;
  - `--radius: 0`.
- Theme selection:
  - `:root[data-theme="ink"]` and `:root[data-theme="paper"]`;
  - `@media (prefers-color-scheme: dark)` applying Ink when there is no `data-theme`.
- Fonts in `src/app/fonts.ts` through `next/font/google`: Yesteryear, Josefin Sans (300/600/700), Jost, Barlow Semi Condensed 600, Caveat Brush and JetBrains Mono. They are exposed as the SPEC §6.1 CSS variables and Tailwind `font-*` utilities.
- `public/textures/grain.png`, a tileable noise image of about 512px and under 40 KB. Commit the generator script as `scripts/dev/make-grain.ts`.
- The `body::before` grain overlay per SPEC §6.3.
- Utilities `.grid-paper` and `.raking`.
- A `src/app/layout.tsx` update: font variables on `<html>`, `lang="en-GB"`, and replaced metadata (title "Ludwig.", description).
- The placeholder home page becomes a token test sheet: a `<Credit>`-style heading as plain markup, a body paragraph, swatches of every token and samples of every font. T015 replaces it.

**Out**

- Brand components (T010).
- shadcn components (T011–T013).
- The theme switcher UI and persistence (T015).

## Notes

- **Wordmark script.** SPEC §6.1 says to compare Yesteryear and Norican. Render both on the test sheet, pick one, and record the choice in SPEC §6.1 (one line). The losing font isn't loaded in the final code.
- **Contrast.** Check contrast with a script, not by eye: `scripts/dev/contrast.ts` computes the WCAG ratio for each foreground and background pair in both themes, and exits 1 below 4.5 for text pairs. `crayon` is exempt only for large text (3:1).
- **Flash of the wrong theme.** `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md` is needed by T015. Here, only make sure no hard-coded theme class is set.

## Acceptance criteria

- [ ] **AC1**: Every SPEC §6.2 token exists with its exact hex value in the Paper theme.
  - _Verify (browser):_ on `/`, run `getComputedStyle(document.documentElement).getPropertyValue('--color-ludwig-red')` (and the same for each token) through `browser_evaluate`. Each one equals the SPEC §6.2 hex value.
- [ ] **AC2**: Ink theme remaps the semantic variables.
  - _Verify (browser):_ set `document.documentElement.dataset.theme='ink'`. Then `--background` resolves to `#0A0B0D` and `--foreground` to the paper value. Take screenshots of both themes at 1280px and 390px into `.verification/T007/`.
- [ ] **AC3**: The system dark preference applies Ink when no theme is set.
  - _Verify (browser):_ `browser_emulate_media({ colorScheme: 'dark' })` with no `data-theme` gives an Ink background.
- [ ] **AC4**: There are no rounded corners or pure white anywhere in the tokens.
  - _Verify (code):_ `grep -nE "#fff\b|#ffffff|white" src/app/globals.css` returns nothing, and `grep -n -- "--radius" src/app/globals.css` shows `0`.
- [ ] **AC5**: All six fonts load through `next/font` and are applied through the variables.
  - _Verify (browser):_ `document.fonts.check('16px "Josefin Sans"')`, and the same for each family, returns `true`. `browser_network_requests` shows no requests to `fonts.googleapis.com`, because the fonts are self-hosted by `next/font`.
- [ ] **AC6**: The grain texture is under 40 KB and applied as a static overlay.
  - _Verify (cli + code):_ `stat -f%z public/textures/grain.png` is below 40960. `grep -n "feTurbulence" src/` returns nothing, so no live filters are used.
- [ ] **AC7**: Text colour pairs meet WCAG AA in both themes.
  - _Verify (cli):_ `pnpm tsx scripts/dev/contrast.ts` exits 0 and prints each pair with its ratio.
- [ ] **AC8**: The wordmark font choice is recorded.
  - _Verify (code):_ the SPEC §6.1 wordmark row names a single font.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
