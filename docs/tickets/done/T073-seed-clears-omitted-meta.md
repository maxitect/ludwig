---
id: T073
title: Seed clears optional meta fields that a content file omits
milestone: M1
epic: E4
depends_on: [T072]
migrations: false
requires_human: false
spec: ["SPEC §4.6"]
skills: []
---

# T073: Seed clears omitted optional meta

## Context

Found in the T029 review. `scripts/seed.ts` (`upsertPuzzle`/`writePuzzle`) updates an existing puzzle with `tx.update(puzzles).set({ ...columns, volumeId })`. Drizzle skips keys whose value is `undefined`, so when a content file drops an optional meta field (`publishedAt`, `sourceNote`), the stored value is kept. Content can therefore never be unpublished, and a removed source note stays. Content is code (PLAN §2.5): the DB row must match the file after a seed. T032 will hit this when it unpublishes or replaces the reverse-chess dev fixtures.

## Scope

**In**

- On update, every optional column from `contentMetaSchema` that the file omits is written as `null` (`publishedAt`, `sourceNote`; `volumeId` already is).
- A test in `scripts/seed.test.ts`.

**Out**

- Changing the `gear_daily` sparing or gen-gears' skip of existing dates.
- Any change to how removed content files are handled.

## Acceptance criteria

- [ ] **AC1**: Removing `publishedAt` from a published content file and re-seeding unpublishes the puzzle; removing `sourceNote` clears it.
  - _Verify (unit):_ `scripts/seed.test.ts` seeds a puzzle with both fields, re-seeds with both omitted, and asserts both columns are `null`. Attempt rows are unchanged.
- [ ] **AC2**: Re-seeding unchanged content is still a no-op on data.
  - _Verify (cli + db):_ `pnpm db:seed` twice on the local DB; `published_at` and `source_note` of every puzzle are identical before and after the second run.
- [ ] **AC3**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
