---
id: T015
title: "App shell: layout, nav, footer, theme switching, landing placeholder"
milestone: M1
epic: E4
depends_on: [T008, T010, T011]
migrations: false
requires_human: false
spec: ["SPEC §3", "SPEC §6.2", "SPEC §7.3", "SPEC §10"]
skills: []
---

# T015: App shell

## Context

This is the frame every page sits in: route groups, the top nav with a Suspense'd user menu, the mobile bottom sheet, the footer with attribution, and theme switching. The landing page here is only a branded placeholder; the full title sequence comes in T067.

## Scope

**In**

- **Remove the T006 probe** (if it still exists): `src/lib/data/probe.ts`, `src/app/(app)/probe/`, `src/app/api/probe/`.
- **Route groups:** `(marketing)`, `(auth)` and `(app)` layouts per SPEC §7.2.
- **Nav:**
  - `Wordmark` on the left, then links to Collection, Reverse Chess, Gears, This Week and Casebook (SPEC §3).
  - The user menu is the dropdown from T012, with sign-out. It sits behind `<Suspense>` with a `Walker` fallback.
  - Below 768px the nav collapses into the `Sheet` bottom sheet.
- **Footer:**
  - the "unofficial fan site, not affiliated with the BBC" line;
  - the cburnett pieces attribution (SPEC §10.2);
  - a font credits link.
- **Theme:**
  - `data-theme` set on `<html>` from `user_settings.theme` when signed in, and from `localStorage` otherwise, with `system` as the default.
  - No flash of the wrong theme. See `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`.
  - A theme toggle in the user menu, which persists to `user_settings` (creating the row on first write) or to `localStorage`.
- **Landing placeholder:** `Wordmark` with ink splat, a `Credit` tagline, and a CTA to the Collection.
- Fill in the root `metadata` title and description, replacing the Create Next App defaults.
- Delete the starter `page.tsx` content.

**Out**

- The full settings page (T065).
- The landing title sequence (T067).
- Page transitions (T066).

## Notes

- Reading the session must stay inside the Suspense boundary, so the shell can be prerendered (Cache Components; see T006's decision and `authentication-with-cache-components.md`).
- The theme write goes through a thin Server Action in `src/lib/actions/`, which calls data access (CLAUDE.md, Architecture).

## Acceptance criteria

- [ ] **AC1**: Every nav link resolves; placeholder routes may render a "Coming soon" `Credit`.
  - _Verify (api):_ For each of `/puzzles`, `/reverse-chess`, `/gears`, `/this-week` and `/casebook` (the last while signed in, with a cookie from sign-up), `curl -s -o /dev/null -w "%{http_code}" -b .verification/T015/cookies.txt http://localhost:3015<path>` prints `200`.
- [ ] **AC2**: Signed out, the nav shows Sign in. Signed in, it shows the user's display name, and the menu signs the user out.
  - _Verify (browser):_ Snapshot while signed out, then sign up `T015-1@test.local` and snapshot again showing the name. Sign out from the menu and the Sign in link returns.
- [ ] **AC3**: The user menu streams behind Suspense, and the static shell is prerendered.
  - _Verify (cli + next):_ The `pnpm build` output marks `/` and `/puzzles` as prerendered or partially prerendered, not fully dynamic. `nextjs_call` reports no runtime errors on those routes.
- [ ] **AC4**: When signed in, choosing Ink persists to the database and survives a reload, with no theme flash.
  - _Verify (browser + db):_
    - Toggle to Ink and reload; the `<html data-theme="ink">` attribute is present in the very first HTML response (`curl -s -b cookies.txt … | grep 'data-theme="ink"'`).
    - `psql "$DATABASE_URL" -c "select theme from user_settings us join \"user\" u on u.id = us.user_id where u.email = 'T015-1@test.local'"` returns `ink`.
- [ ] **AC5**: When signed out, the theme persists in `localStorage` and nothing is written to the database.
  - _Verify (browser + db):_ Signed out, toggle to Ink and reload; Ink is kept. `select count(*) from user_settings` is unchanged from before.
- [ ] **AC6**: At 390px the nav is a bottom sheet that opens and closes with the keyboard and with touch.
  - _Verify (browser):_ Resize to 390px, open the sheet with its trigger, Tab through the links, and close it with Escape.
- [ ] **AC7**: The footer shows the not-affiliated note and the cburnett attribution on every page group.
  - _Verify (browser):_ The snapshots of `/`, `/sign-in` and `/puzzles` each contain both texts.
- [ ] **AC8**: The shell and landing pass the brand checklist (SPEC §8.3).
  - _Verify (browser):_ Screenshots of `/` and `/puzzles` in Paper and Ink at 1280px and 390px under `.verification/T015/`. There is no horizontal scroll at 390px.
- [ ] **AC9**: There are no hydration warnings or console errors.
  - _Verify (browser):_ `browser_console_messages` is clean on `/`, `/puzzles` and `/sign-in`, both signed in and signed out.
- [ ] **AC10**: The T006 probe files are gone.
  - _Verify (code):_ `grep -rn "probe" src/` returns nothing.
- [ ] **AC11**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
