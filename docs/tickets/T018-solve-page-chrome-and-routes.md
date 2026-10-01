---
id: T018
title: Collection, category and solve routes plus solve-page chrome
milestone: M1
epic: E4
depends_on: [T015, T017]
migrations: false
requires_human: false
spec: ["SPEC §3", "SPEC §4.5", "SPEC §6.4", "SPEC §7.3"]
skills: []
---

# T018: Routes and solve-page chrome

## Context

This builds the browsing routes and the shared solve-page frame around every `Solver`: the header, timer, Check, Reveal and Reset, and the completion state (SPEC §4.5). With no real type registered yet, it is proven against the `__fixture` type and an empty-state collection.

## Scope

**In**

- **`/puzzles`:**
  - categories from `puzzle_categories` and `puzzle_types`;
  - a count of published puzzles per type;
  - an empty state rendered with `Walker`.
- **`/puzzles/[type]`:**
  - volume shelves using the Card `book` variant;
  - a puzzle list with difficulty badges and a difficulty filter in the URL (`?difficulty=`);
  - `notFound()` for an unknown type.
- **`/puzzles/[type]/[slug]`:**
  - loads through `getPuzzleForPlay`, with `notFound()` when it returns null;
  - renders `<SolveChrome>` wrapping the registry's `Solver`.
- **`src/components/puzzle/solve-chrome.tsx`:**
  - a `Credit` header, made of the category and title;
  - a difficulty badge;
  - a timer that pauses on `visibilitychange`;
  - Check, Reveal (confirmed with an AlertDialog) and Reset;
  - a completion state with `SolvedStamp`, the time and a "Next in volume" link.

  It talks to the T017 actions through a small client context that the `Solver` consumes.
- `generateMetadata` for each route.
- The routes cache public, session-independent data according to T006's Cache Components decision.

**Out**

- `localStorage` for signed-out players (T020). Until then, signed-out players can play but nothing is saved.
- Transitions (T066).

## Notes

- Define the `Solver` props contract here: `{ payload, initialState, onStateChange, registerCheck }`, typed from the module's schemas. Record the final shape in `.claude/rules/puzzles.md` only if it differs from the rules file.

## Acceptance criteria

- [ ] **AC1**: `/puzzles` lists every category and type from the database, with a count of published puzzles.
  - _Verify (browser + db):_ The snapshot's category headings match `psql "$DATABASE_URL" -c "select name from puzzle_categories order by sort"`, and each count matches a `count(*)` per `type_key` where `published_at is not null`.
- [ ] **AC2**: Unknown types and slugs return 404.
  - _Verify (api):_ `curl -s -o /dev/null -w "%{http_code}" http://localhost:3018/puzzles/nope` and `…/puzzles/<fixtureType>/nope` both print `404`.
- [ ] **AC3**: The difficulty filter is driven by the URL and filters the list.
  - _Verify (browser):_ Navigate to `/puzzles/<type>?difficulty=2`. Only difficulty-2 puzzles are listed, and the filter control reflects the value.
- [ ] **AC4**: The solve page renders the chrome around the fixture solver, and the timer pauses when the tab is hidden.
  - _Verify (browser):_
    - The snapshot shows the `Credit` header, the badge, the timer, and the Check, Reveal and Reset buttons.
    - Dispatch `visibilitychange` with `document.hidden` mocked (`browser_evaluate`), wait 2 seconds, and confirm the timer value didn't advance.
- [ ] **AC5**: Reveal requires confirmation, and Cancel changes nothing.
  - _Verify (browser + db):_ Click Reveal, then Cancel in the AlertDialog. `select count(*) from attempt_hints` is unchanged.
- [ ] **AC6**: Solving the fixture puzzle while signed in shows the completion state, and the attempt is completed in the database.
  - _Verify (browser + db):_
    - Sign up `T018-1@test.local`, enter the fixture's correct answer and press Check. The `SolvedStamp` and the time appear.
    - `select completed_at is not null from attempts a join "user" u on u.id = a.user_id where u.email = 'T018-1@test.local'` returns `t`.
- [ ] **AC7**: The page source contains no solution data.
  - _Verify (api):_ `curl -s http://localhost:3018/puzzles/<fixtureType>/<slug> | grep -c "<fixture solution value>"` prints `0`.
- [ ] **AC8**: The pages pass the brand checklist.
  - _Verify (browser):_ Screenshots of `/puzzles`, a category page and a solve page (before and after solving), in Paper and Ink at 1280px and 390px, under `.verification/T018/`. There is no horizontal scroll at 390px.
- [ ] **AC9**: There are no console errors or runtime errors.
  - _Verify (browser + next):_ `browser_console_messages` is clean, and `nextjs_call` reports no errors for the three routes.
- [ ] **AC10**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
