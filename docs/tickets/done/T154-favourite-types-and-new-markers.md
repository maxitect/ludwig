---
id: T154
title: "Favourite puzzle types, and New markers on recently added puzzles"
milestone: M8
epic: E4
depends_on: [T153]
migrations: true
requires_human: false
preview: false
spec: ["SPEC §3", "SPEC §4.6", "SPEC §7.4.3"]
skills: ["/db-trigger", "/zod4"]
---

# T154: Favourite puzzle types, and New markers on recently added puzzles

## Context

User feedback: players want to mark the types they like, see at a glance which puzzles are new since they last looked, and later be told when a new puzzle of a favourite type drops (the email is T157). The Desk (T153) is where the favourites surface.

## Scope

**In**

- **Favourites table.** `user_favourite_types (user_id fk→user on delete cascade, type_key fk→puzzle_types, created_at)`, primary key `(user_id, type_key)`. Migration and integrity test. SPEC §7.4.3.
- **Toggle.** A heart-free, brand-consistent control (a `Toggle` labelled "Favourite", red when on, Lucide `Star` or `Bookmark`) on the type page header (`/puzzles/[type]`) and on each type card in the Collection. A Server Action `toggleFavouriteType(typeKey)` that authenticates, validates `typeKey` against the registry keys with Zod, writes, and revalidates. Signed out, the control links to sign-in with `next`.
- **Desk.** A "Your favourites" shelf on the Desk, in the second slot, directly under Continue and above everything else (user decision, 2026-11-07): each favourite type as a card linking to its type page, with its newest published puzzle and a count of puzzles added since the user's last visit to that type.
- **"New" markers.** A puzzle is new for 14 days after its `published_at`. Show a `Badge` "New" on the type page shelf rows and on the Collection type cards ("3 new"). Dailies are excluded: every daily is new by that rule and the Daily shelf already orders by date. Weekly pairs count. Put the window in `src/config/`.
- **Per-user "since your last visit".** `user_type_visits (user_id, type_key, visited_at)`, primary key `(user_id, type_key)`, upserted when a signed-in user opens a type page. The Desk's favourites shelf counts puzzles with `published_at > visited_at`. This is a fact (when the user visited), not a derived value.
- Content dates: `content/*/*.ts` carry `publishedAt` by hand, and most launch files say 2026-10-01 or thereabouts. Nothing to migrate; new content files set the date they ship. Add a note to PLAN §5.4 (content authoring) that `publishedAt` is the date the puzzle should appear and drives the New marker.
- E2E: favourite a type, see it on the Desk; a puzzle published yesterday carries New, one published 15 days ago does not (seed two fixtures in the test database, or use existing content dates and freeze the clock in the test).

**Out**

- Email or push (T157).
- Favouriting individual puzzles.
- Reordering the Collection by favourites.

## Notes

- Counts and "new" are derived at read time from `published_at` and `visited_at`; nothing stores a count.
- The Collection and type pages are cached with `cacheTag("puzzles")`; the favourite state and visit counts are per user, so render them in a `<Suspense>` slot beside the cached content, the way `SolvedBadge` does, and never inside the cached functions.
- Recording a visit is a write on a GET; do it from a Server Action fired by a small client component after hydration (`after-hydration.tsx`), or in the page's dynamic slot. Say which and why in the report. Never in the cached function.

## Acceptance criteria

- [ ] **AC1**: The favourites table enforces its keys.
  - _Verify (db):_ a duplicate `(user_id, type_key)` is rejected; an unknown `type_key` is rejected; deleting the user removes the rows.
- [ ] **AC2**: Toggling a favourite persists and reflects everywhere, and the favourites shelf sits second on the Desk.
  - _Verify (browser):_ favourite "Troix" on its type page; the Collection card shows it on, the Desk lists it; toggle off and all three clear.
- [ ] **AC3**: Signed out, the control sends you to sign in and back.
  - _Verify (browser):_ click Favourite signed out; land on `/sign-in?next=/puzzles/troix`.
- [ ] **AC4**: New markers follow the 14-day window and skip dailies.
  - _Verify (browser + db):_ with one puzzle `published_at = now() - 1 day` and one at `now() - 20 days`, only the first shows New; the Daily shelf shows none; the Collection card reads "1 new".
- [ ] **AC5**: The Desk counts puzzles since the last visit.
  - _Verify (browser + db):_ visit the type page, set a puzzle's `published_at` to now in the test database, reload the Desk: "1 new since your last visit"; open the type page and the count returns to 0.
- [ ] **AC6**: The action validates and authorises.
  - _Verify (api + code):_ `toggleFavouriteType("not-a-type")` returns a validation error; the action calls `requireUser()` before any write.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
