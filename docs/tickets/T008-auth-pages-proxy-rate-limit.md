---
id: T008
title: Auth pages, actions, proxy.ts, getCurrentUser and rate limiting
milestone: M0
epic: E2
depends_on: [T003, T007]
migrations: false
requires_human: false
spec: ["SPEC §7.3", "SPEC §7.4.6 Sign-up form", ".claude/rules/auth.md", ".claude/rules/design-system.md"]
skills: ["/zod4"]
---

# T008: Auth pages, actions, proxy.ts, getCurrentUser and rate limiting

## Context

T003 proved auth at the API level. This ticket gives it user-facing sign-up, sign-in and sign-out, the `getCurrentUser()` choke point, optimistic route protection and the sign-in rate limit, all per SPEC §7.3 and `.claude/rules/auth.md`.

## Scope

**In**

- `src/lib/data/user.ts`: `getCurrentUser()`, `server-only`. It wraps `auth.api.getSession({ headers: await headers() })` and returns the user or `null`. Also `requireUser()`, which throws if there is none.
- Form schemas in `src/lib/forms/auth.ts`:
  - sign-up per SPEC §7.4.6, built with `createInsertSchema(user, { email: z.email() })`;
  - sign-in as `{ email, password }`, picked or extended from the same source.
- Server Actions in `src/lib/actions/auth.ts`: `signUp`, `signIn`. They validate, call `auth.api.signUpEmail` / `auth.api.signInEmail`, map `APIError` onto field errors, and redirect to `?next=`, or to `/`, on success.
- Pages `src/app/(auth)/sign-in/page.tsx` and `sign-up/page.tsx`, styled only with T007 tokens. Use plain elements; T011 restyles them with shadcn.
- `src/components/auth/sign-out-button.tsx` (client, `authClient.signOut()`).
- `src/proxy.ts`: a `getSessionCookie()` redirect of `/casebook` and `/settings` to `/sign-in?next=<path>` when there is no cookie, and a `matcher` limited to those paths.
- The Better Auth custom rate-limit rule: 5 requests per 15 minutes on `/sign-in/email`.
- The T006 user slot now uses `getCurrentUser()`, with the sign-out button shown when signed in.

**Out**

- Nav and shell styling (T015).
- The settings page (T065).
- Password reset (v1.1).

## Notes

- Read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`, the proxy API reference, and `.../02-guides/authentication.md` (optimistic checks).
- `?next=` must be validated as a same-origin relative path. Reject anything else, falling back to `/`.

## Acceptance criteria

- [ ] **AC1**: A user can sign up in the browser and land signed in.
  - _Verify (browser):_ on `/sign-up`, fill in name, `t008-1@test.local` and `correct-horse-battery`, then submit. You are redirected to `/`, and the user slot shows the email. Screenshots in both themes at 1280px and 390px.
- [ ] **AC2**: Sign-up validation errors appear on the right fields.
  - _Verify (browser):_ submit `not-an-email` and the password `short`. Field errors appear under email and password, and `select count(*) from "user" where email='not-an-email'` returns 0.
- [ ] **AC3**: A duplicate email shows a form error, not a crash.
  - _Verify (browser):_ signing up again with `t008-1@test.local` shows an "already registered" style message. `browser_console_messages` shows no errors.
- [ ] **AC4**: Sign-out clears the session, and sign-in restores it.
  - _Verify (browser + db):_ click sign out. The slot shows "Signed out", and `select count(*) from session s join "user" u on u.id=s.user_id where u.email='t008-1@test.local'` decreases. Sign in on `/sign-in` and the slot shows the email again.
- [ ] **AC5**: The proxy redirects protected paths when there is no cookie, and lets them through when there is one.
  - _Verify (api):_ `curl -sI http://localhost:3008/casebook` returns `307` with `location: /sign-in?next=%2Fcasebook`. With a valid session cookie it does **not** redirect to sign-in; a 404 is fine because the page doesn't exist yet. `curl -sI /` is not redirected.
- [ ] **AC6**: An open redirect through `next` is impossible.
  - _Verify (browser):_ sign in at `/sign-in?next=https://evil.example`. You land on `/`, not the external host.
- [ ] **AC7**: The sign-in rate limit applies.
  - _Verify (api):_ six rapid wrong-password `POST /api/auth/sign-in/email` calls for one email. Calls 1–5 return 401, and call 6 returns 429.
- [ ] **AC8**: `getCurrentUser` is the only session reader in app code.
  - _Verify (code):_ `grep -rn "auth.api.getSession" src --include=*.ts --include=*.tsx` matches only `src/lib/data/user.ts`.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
