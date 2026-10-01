---
id: T065
title: Settings page (theme, notation, reduced motion, display name)
milestone: M5
epic: E10
depends_on: [T015, T030]
migrations: false
requires_human: false
spec: ["SPEC §3", "SPEC §6.2", "SPEC §7.3", "SPEC §7.4.3", "SPEC §5.1"]
skills: ["/zod4"]
---

# T065: Settings page (theme, notation, reduced motion, display name)

## Context

This is the `/settings` route from SPEC §3. The `user_settings` table already exists (T004). The theme switcher from T015 and the descriptive notation from T030 both read these settings, and this ticket persists them.

## Scope

**In**

- `/settings` page with a form for display name (`user.name`), theme, chess notation and reduced motion.
- A Server Action that upserts `user_settings` using `createUpdateSchema(userSettings)` and updates the name through Better Auth.
- The theme, notation and reduced-motion values are applied app-wide from the stored settings for signed-in users.

**Out**

- Password change or reset (v1.1).
- Theme switching for signed-out users (T015).

## Notes

- `reduce_motion` combines with `prefers-reduced-motion` using OR. Either one disables motion.
- `/settings` is protected by `proxy.ts` (T008), but the action must still call `getCurrentUser()`.

## Acceptance criteria

- [ ] **AC1**: Signed out, `/settings` redirects to `/sign-in`.
  - _Verify (api):_ `curl -i http://localhost:3065/settings` returns a 307/308 with `location: /sign-in…`.
- [ ] **AC2**: Saving the form persists every field.
  - _Verify (browser + db):_ Sign in as `t065-1@test.local`. Set theme to Ink, notation to descriptive, reduced motion on and name to "John Taylor", then save. `psql "$DATABASE_URL" -c "select s.theme, s.chess_notation, s.reduce_motion, u.name from user_settings s join \"user\" u on u.id = s.user_id where u.email = 't065-1@test.local'"` returns `ink | descriptive | t | John Taylor`.
- [ ] **AC3**: The theme is applied on every page after a reload.
  - _Verify (browser):_ Reload `/puzzles`. `browser_evaluate` shows `document.documentElement.dataset.theme === "ink"`. Take a screenshot at 1280px and at 390px.
- [ ] **AC4**: Descriptive notation is shown in the Reverse Chess move list.
  - _Verify (browser):_ Open a Mode B puzzle and make one retro move. The move list shows descriptive notation (e.g. `N–Q1`), and switching the setting back to algebraic shows algebraic.
- [ ] **AC5**: The reduced-motion setting disables motion.
  - _Verify (browser):_ With `reduce_motion` on, complete an anagram. The solved stamp appears with no animation: `getAnimations().length === 0` on the stamp element.
- [ ] **AC6**: Invalid input is rejected with a field error, and nothing is written.
  - _Verify (browser + db):_ Submit an empty name. A field error shows, and the `psql` query from AC2 is unchanged.
- [ ] **AC7**: One user cannot change another user's settings.
  - _Verify (code + unit):_ The action derives `user_id` only from `getCurrentUser()` (grep shows no `userId` in the action input schema). A Vitest test calling the data-access function without a session throws.
- [ ] **AC8**: Gates and PLAN §5.3 pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
