---
id: T157
title: "Email players when a favourite type gets a new puzzle, and when a streak is about to break"
milestone: M8
epic: E4
depends_on: [T154, T155]
migrations: true
requires_human: true
preview: false
spec: ["SPEC §7.3", "SPEC §7.7"]
skills: ["/db-trigger"]
---

# T157: Email players when a favourite type gets a new puzzle, and when a streak is about to break

## Context

The second half of the favourites feedback: players who favourite a type want to hear when a new puzzle of it drops. Email through Resend already exists for auth (T143). Dailies drop every day, so they are excluded; this is about curated puzzles and weekly pairs.

The user also wants the streak nudges a language app sends: "your 12-day streak ends at midnight" when the player has not solved anything today, and a note on streak milestones. Those are the same machinery: an opt-in, a daily cron, the Resend layout.

Sending needs a trigger. The build is the moment new content lands (the seed runs in every production deploy), but previews also build, and a build should not send mail. A daily cron is the safest trigger, and T155 frees both Hobby cron slots. One run a day, one function invocation, is well inside the limits.

## Scope

**In**

- **Opt-in.** Two columns on `user_settings`, both `boolean not null default false`: `notify_favourites` ("Email me when a favourite type gets a new puzzle") and `notify_streak` ("Remind me before my streak breaks"), as checkboxes on `/settings`, and an unsubscribe link in every email that clears the matching one without signing in (a signed token, the way Better Auth's verification links work; never a bare user id). Migration and integrity test.
- **What was sent.** `favourite_digests (user_id, sent_at)` with primary key `(user_id, sent_at)`, or a single `last_digest_at` on `user_settings`: a fact about what was sent, so it may be stored. Choose the simpler one and say why.
- **The digest.** `/api/cron/favourite-digest` at 09:00 London once a day (Hobby allows daily crons), `CRON_SECRET` bearer auth as T078 had. For each opted-in user with favourites, the curated puzzles of those types with `published_at` after their last digest (or after they opted in) and not after now; skip dailies. One email per user listing title, type and link, from the same sender as auth mail, using the React Email layout in `src/lib/email/`. No email when there is nothing new. Sends go through `send.ts`; `.test` and `.local` recipients are logged, not sent (T143).
- **Streak nudge.** A second cron, `/api/cron/streak-nudge`, at 18:00 London (Hobby allows two daily crons once T155 frees them). For each user with `notify_streak` on, a current streak of 2 or more (from `user_streaks`) and no solve today (London), one email: the streak length, that it ends at midnight, and a link to today's quickest daily (the troix daily, difficulty permitting). At most one nudge per user per day, recorded the same way as digests. On the morning after a streak reaches 7, 30, 100 or 365 days, the favourites digest run includes a one-line milestone note for that user, even when there is nothing new; no separate email.
- A unit test on the nudge selection (streak 1 gets nothing; streak 3 with a solve today gets nothing; streak 3 with no solve today gets one; the same user is not selected twice in a day).
- A unit test on the selection query (user A favourites troix and gets the new troix puzzle, user B favourites sudoku and gets nothing, a daily never counts) and a template test like `templates.test.tsx`.
- SPEC §7.3 (email kinds) and §7.7 (crons: this is now the only one).

**Out**

- Push notifications and in-app notification badges (the Desk shows counts, T154).
- Any nudge that is not opt-in, and any more than one email per user per day from each route.
- Marketing or broadcast email.

## Notes

- Never add a branch that reveals whether an email is registered (auth rules).
- `CRON_SECRET` stays in `src/env.ts` and in Vercel after T155, so the route reuses it.
- Human step: the user confirms the sender, subject line and copy, and receives one real digest on production.

## Acceptance criteria

- [ ] **AC1**: Opt-in is off by default and the setting round-trips.
  - _Verify (db + browser):_ a new user has `notify_favourites = false`; ticking the box on `/settings` sets it; the unsubscribe link in a digest clears it without a session.
- [ ] **AC2**: The digest lists only new curated puzzles of favourite types since the last digest.
  - _Verify (unit):_ the selection test above passes; a second run the same day selects nothing.
- [ ] **AC3**: Both cron routes are authorised and idempotent.
  - _Verify (api):_ without the bearer each returns 401; with it, 200 with per-user counts; a second call the same day sends nothing.
- [ ] **AC3b**: The streak nudge goes only to players at risk.
  - _Verify (unit + db):_ the nudge selection test passes; with a seeded user at streak 4 and no solve today the route reports one send, and after a solve today it reports none.
- [ ] **AC4**: The email renders in the house style.
  - _Verify (unit + human):_ the template test passes; the user approves one production digest.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
