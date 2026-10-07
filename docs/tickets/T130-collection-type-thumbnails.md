---
id: T130
title: Collection type cards show a representative preview
milestone: M5
epic: E10
depends_on: [T129, T128]
migrations: false
requires_human: false
spec: ["SPEC §3"]
skills: []
---

# T130: Collection type cards show a representative preview

## Context

The type cards on `/puzzles` (`src/app/(app)/puzzles/page.tsx`) show only a name, a count and a description. Players should see what each puzzle type looks like. This ticket puts a T129 preview on each card.

## Scope

**In**

- Each type card shows the preview of one representative published puzzle. Choose it deterministically, for example the first in volume order, so the page caches and SSR is stable. Show it at a fixed aspect ratio above or beside the text, in both themes and at 390px.
- Extend `getCatalogue()` (`src/lib/data/catalogue.ts`), or add a cached sibling, to return the representative puzzle's payload. It stays inside `"use cache"` with the `puzzles` tag.
- A type with nothing published shows a fixed motif instead: the type's preview drawn from a built-in sample payload, faded or dashed, with T128's coming-soon treatment.

**Out**

- Per-puzzle thumbnails (T129).
- Animated or hover previews.

## Acceptance criteria

- [ ] **AC1**: Every type card on `/puzzles` shows a preview.
  - _Verify (browser):_ Screenshots of `/puzzles` in Paper and Ink at 1280px and 390px. `browser_evaluate` counts one preview `svg` per type card.
- [ ] **AC2**: Types with nothing published show the motif and the coming-soon state.
  - _Verify (browser):_ With a type that has 0 published, its card shows the sample motif and isn't a live link.
- [ ] **AC3**: The page is still served from cache.
  - _Verify (cli):_ `pnpm build` output lists `/puzzles` with the same rendering mode as before.
- [ ] **AC4**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
