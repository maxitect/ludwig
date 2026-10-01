---
paths:
  - "src/components/**"
  - "src/app/**/*.tsx"
  - "src/app/**/*.css"
  - "src/puzzles/**/solver.tsx"
  - "src/puzzles/_shared/**/*.tsx"
---

# Design System Rules

Spec: `docs/SPEC.md` section 6. The look is the _Ludwig_ title sequence: textured paper, near-black ink, one red accent, blue-grey shadows, crossword grids.

## Tokens only

- Colours come from the `@theme` tokens in `src/app/globals.css`, through shadcn semantic variables or Tailwind token classes:
  - `paper`, `paper-shade`, `paper-deep`;
  - `ink`, `ink-soft`;
  - `ludwig-red`, `blood`, `crayon`;
  - `shadow`, `shadow-soft`;
  - `grid-blue`, `book-blue`.
- Never use raw hex values, Tailwind palette colours (`red-600` and so on) or `#fff`/`white`.
- **Red is the only accent.** Blue appears only as shadow, focus (`grid-blue`) and book covers (`book-blue`).
- `--radius: 0`, so nothing has rounded corners, including shadcn defaults, focus rings, avatars and toasts.
- Borders are 2px `ink`. Shadows are hard offsets or long `shadow` casts, never soft grey blurs.
- Both themes (Paper and Ink) must work. Check `/dev/kitchen-sink` after changing any component.

## Typography

- **Headings:** always UPPERCASE `font-display` (Josefin Sans) in the credits pattern, a small light line over a large bold line. Use the `<Credit top bottom />` component; don't hand-roll it.
- **Body:** `font-sans` (Jost), sentence case.
- **Script:** `font-signature` is used only in the Wordmark SVG and the "Solved." stamp. Never in UI text.
- **Hand font:** user-entered grid letters use `font-hand` in `crayon` or `ludwig-red`. Each cell gets a ±2° rotation seeded by its index, so SSR output is stable.
- **Fonts:** load through `next/font` CSS variables only.

## Components

- Install shadcn components with `pnpm dlx shadcn@latest add <component>` into `src/components/ui/`, then restyle them in place to the treatments in spec section 6.4.
- Compose brand components (`src/components/brand/`) rather than recreating motifs.
- **Icons:**
  - **Lucide** for general UI.
  - **Tabler** for chess glyphs in UI chrome.
  - Board pieces are the cburnett set, restyled white.
  - Icon stroke is 2px. Icons are ink or paper, and red only when active.
- **Textures:**
  - Grain comes from the static PNG overlay. No live SVG filters, especially inside animations.
  - Grid paper uses the `.grid-paper` utility.
- **Loading** uses the `Walker` silhouette. No spinners.

## Motion and accessibility

- Every animation respects `prefers-reduced-motion`, and the user's `reduce_motion` setting.
- Use `motion` only for gears and the solved stamp. Everything else is CSS transitions.
- Every interaction is keyboard-operable.
- Colour is never the only signal (e.g. Xs versus dots on gear sightlines).
- Text contrast meets WCAG AA. `crayon` is only for large text.
