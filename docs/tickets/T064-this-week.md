---
id: T064
title: "This Week page and the weekly schedule"
milestone: M4
epic: E9
depends_on: [T019]
migrations: false
requires_human: false
spec: ["SPEC §4.4", "SPEC §3 (/this-week)", "SPEC §7.4.3 (weekly_puzzles)", "SPEC §4.6"]
skills: ["/zod4"]
---

# T064: This Week page and the weekly schedule

## Context

"Two puzzles a week" (SPEC §4.4) is a nod to Ludwig's newspaper deal. The `weekly_puzzles` table already exists (T004). This ticket adds the schedule as content and the `/this-week` page.

## Scope

**In**

- `content/weekly.ts`: a list of `{ weekStart, first, second }` entries that reference puzzles by `(type, slug)`, validated by a schema composed from the `weekly_puzzles` insert schema. `db:seed` resolves the slugs to ids.
  - Seed at least 8 weeks, covering the current week at the time of writing plus the following 7, using only puzzles that already exist.
- `/this-week`:
  - Shows the current week's pair as two large volume-style cards, with the credits header "THIS / **WEEK**".
  - Shows a list of previous weeks, linking to their pairs.
  - Shows the user's solved state for each puzzle when signed in.
- Week boundaries are **Monday 00:00 Europe/London**, computed in one shared helper.
- A nav link in the app shell, if T015 didn't already add one.

**Out**

- Cron or automatic scheduling (SPEC §4.4: none in v1).
- Admin UI.

## Notes

- **Cache Components (decided in T006).** The week computation depends on the current time, so the page is dynamic or uses a short `cacheLife`. The user's solved state sits behind `<Suspense>`.
- **Validation.** `db:seed` must fail clearly when a referenced slug doesn't exist, and when `weekStart` isn't a Monday.

## Acceptance criteria

- [ ] **AC1**: The seeded schedule is stored correctly: two slots per week, with no puzzle repeated within a week.
  - _Verify (db):_ `select week_start, slot, puzzle_id from weekly_puzzles order by 1,2` returns 2 rows per week.
  - _Verify (db):_ inserting the same puzzle twice in one week fails on the unique constraint.
- [ ] **AC2**: Seed validation fails the run when a `weekStart` isn't a Monday or a slug is unknown.
  - _Verify (cli):_ `pnpm db:seed` on a temporarily broken `weekly.ts` exits non-zero with a clear message. Revert afterwards.
- [ ] **AC3**: The week helper is correct across BST and GMT transitions and Sunday-midnight edges.
  - _Verify (unit):_ fixtures for 2026-10-25 (the clocks change), Sunday 23:59 versus Monday 00:00 London time, and a UTC instant that falls on a different London date.
- [ ] **AC4**: `/this-week` shows the current week's two puzzles, linking to their solve pages, with previous weeks listed below.
  - _Verify (browser)._
- [ ] **AC5**: Signed in, solving one of the week's puzzles shows it as solved on `/this-week`. Signed out, no solved state appears and there are no errors.
  - _Verify (browser):_ check both states, then `browser_console_messages`.
- [ ] **AC6**: Both themes render at 1280px and 390px.
  - _Verify (browser):_ screenshots.
- [ ] **AC7**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
