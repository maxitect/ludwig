---
id: T143
title: Email verification, password reset and password change through Resend
milestone: M5
epic: E10
depends_on: []
migrations: true
requires_human: true
preview: true
spec: ["SPEC §2.2", "SPEC §7.3", "SPEC §10 (decision 5)"]
skills: ["/zod4", "/db-trigger"]
---

# T143: Email verification, password reset and password change through Resend

## Context

Email was deferred (SPEC §2.2, §7.3 "v1.1", §10 decision 5) because there was no provider. Resend is now set up with the verified sending domain `noreply.ludwigpuzzles.com`, so this ticket moves verification and password reset onto the launch path and adds a password change to Settings. It also stops the sign-up form from revealing whether an email is already registered.

## Scope

**In**

- **Mailer.** Add the `resend` package and `src/lib/email.ts` (`server-only`), one `sendEmail({ to, subject, text, html })` wrapper. Add `RESEND_API_KEY` and `EMAIL_FROM` to `src/env.ts`. The user has put `RESEND_API_KEY` in the main checkout's `.env.local`. Never read or print it. Outside production, a missing key logs the email's subject and link to the server console instead of sending, so local verification works without real email.
- **Templates.** `src/lib/email-templates.ts`: verify email, reset password, and "someone tried to sign up with your address". Each has plain text plus minimal inline-styled HTML (wordmark text, one link, the "not affiliated with the BBC" line). These are emails, so design tokens can't apply. Use the token hex values in one constant there, and add the file to the raw-token guard's allow list.
- **Better Auth config (`src/lib/auth.ts`):**
  - `emailAndPassword`: `requireEmailVerification: true`, `autoSignIn: false`, `sendResetPassword`, `revokeSessionsOnPasswordReset: true`, `onExistingUserSignUp`, which sends the "someone tried to sign up" email.
  - `emailVerification`: `sendVerificationEmail`, `sendOnSignUp: true`, `sendOnSignIn: true`, `autoSignInAfterVerification: true`.
  - `rateLimit.customRules`: `/request-password-reset` and `/send-verification-email` at 3 per 15 minutes, beside the existing sign-in rule.
- **Sign-up.** On success the form is replaced by "Check your inbox. We've sent a link to <email>." with a resend button. The duplicate-email branch in `src/lib/actions/auth.ts` goes away: Better Auth returns its generic duplicate response when verification is required (`api/routes/sign-up.mjs`), so a new and an existing email look the same.
- **Verify link.** The `callbackURL` is the original `next` path. A successful verification signs the user in and lands on it. An expired or invalid token lands on `/sign-in?error=verification` with a message and a resend form.
- **Sign-in.** An unverified account gets 403 `EMAIL_NOT_VERIFIED`, and `sendOnSignIn` re-sends the link. Show "Verify your email first. We've sent you a new link."
- **Forgot password.** `/forgot-password` (linked from sign-in): an email field. Whatever happens, the reply is "If there's an account for that email, we've sent a link to reset your password." The action calls the rate-limited handler (the sign-in pattern), and a 429 shows the retry message.
- **Reset password.** `/reset-password?token=…`: new password and confirmation, with the sign-up rules. On success, redirect to `/sign-in?reset=1` with a confirmation line. A bad or expired token shows an error and a link back to `/forgot-password`.
- **Change password.** A "Password" section in Settings: current password, new password, confirmation. It calls `auth.api.changePassword` with `revokeOtherSessions: true`. A wrong current password is a field error on that field.
- **Form schemas** in `src/lib/forms/auth.ts`, derived from `signUpSchema` (`.pick()`/`.extend()`), with a `.refine` for the confirmation match.
- **Existing users.** A custom migration sets `email_verified = true` on every existing `user` row, so no account made before this ticket is locked out.
- **Spec.** Update SPEC §2.2, §7.3 and §10 decision 5 to describe the new flow.
- **Env on Vercel.** `RESEND_API_KEY` and `EMAIL_FROM` for Production and Preview. This is a Vercel settings change, so ask the user for approval (or ask them to add the variables) before doing it.

**Out**

- Changing the email address, deleting the account, OAuth, magic links.
- React Email or any templating dependency.

## Notes

- Better Auth 1.7.6 is pinned. Read the installed types (`node_modules/better-auth/dist`) for the exact option and endpoint names rather than the web docs. `requestPasswordReset` already returns a generic success for unknown emails. Don't add a branch that undoes that.
- Use `EMAIL_FROM="Ludwig <noreply@noreply.ludwigpuzzles.com>"` unless the user says otherwise. Confirm the exact sender address with them at the first human checkpoint.
- `LocalProgressMerge` currently runs after sign-in or sign-up. Check it still runs when the session comes from the verification link instead of a form.
- The verification link is built from `authBaseURL`, so on previews it points at the preview. Check that the link works behind Vercel deployment protection, or record that previews need the share link.
- Messages that differ when an account exists are an enumeration leak. The only allowed difference is on sign-in after the correct password.

## Acceptance criteria

- [ ] **AC1**: Sign-up with a new email creates an unverified user and no session, and shows the check-your-inbox state.
  - _Verify (browser + db):_ sign up, screenshot. `select email_verified from "user" where email=…` returns `false`, and there is no `session` row for the user.
- [ ] **AC2**: Sign-up with an existing email shows the same screen and the same response shape, sends the "someone tried to sign up" email, and changes no rows.
  - _Verify (api):_ `POST /api/auth/sign-up/email` twice with the same email. Both are 200 with the same body shape. The server log shows the second template.
- [ ] **AC3**: The verification link verifies the account, signs the user in and lands on `next`. A tampered token lands on the sign-in error state.
  - _Verify (browser + db):_ follow the link from the dev console log. `email_verified` is `true`, and the user menu shows the name.
- [ ] **AC4**: An unverified sign-in is refused with the verify message, and a new link is sent.
  - _Verify (browser)._
- [ ] **AC5**: Forgot password shows the identical message for a registered and an unregistered email, and only the registered one gets an email.
  - _Verify (browser + api):_ compare both responses and the server log. The fourth request inside 15 minutes is 429.
- [ ] **AC6**: Resetting the password lets the user sign in with the new one and not the old one, and revokes every existing session.
  - _Verify (browser + db):_ there are no `session` rows from before the reset.
- [ ] **AC7**: Change password in Settings works, rejects a wrong current password with a field error, and revokes other sessions but not the current one.
  - _Verify (browser + db)._
- [ ] **AC8**: Every new page and form renders in both themes at 1280px and 390px.
  - _Verify (browser):_ screenshots.
- [ ] **AC9**: Users that existed before the migration are verified.
  - _Verify (db):_ `select count(*) from "user" where not email_verified` returns 0 after `pnpm db:migrate` on a seeded database that had users.
- [ ] **AC10**: On the PR preview, a real verification email and a real reset email arrive from the Resend domain and their links work.
  - _Verify (deploy + human):_ the user confirms receipt. `get_runtime_logs` shows no errors.
- [ ] **AC11**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
