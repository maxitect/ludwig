---
paths:
  - "src/lib/auth.ts"
  - "src/lib/auth-client.ts"
  - "src/proxy.ts"
  - "src/lib/actions/**"
  - "src/lib/data/**"
  - "src/app/(auth)/**"
  - "src/app/api/auth/**"
---

# Auth Rules

Spec: `docs/SPEC.md` section 7.3. Better Auth 1.7, email and password only, with sessions stored in the database.

## Server

- **Configuration.** `src/lib/auth.ts` is the only place Better Auth is configured. It uses the `drizzleAdapter(db, { provider: "pg" })`, the `nextCookies()` plugin last in `plugins`, and `advanced.database.generateId: "uuid"`.
- **Reading the session.** Read it through `getCurrentUser()` in `src/lib/data/user.ts`, which wraps `auth.api.getSession({ headers: await headers() })` and is `server-only`. Don't call `auth.api.getSession` anywhere else.
- **Sign-up and sign-in.** These are Server Actions that validate with the Zod form schema, then call `auth.api.signUpEmail` / `auth.api.signInEmail`. Map `APIError` onto field errors.
- **Email verification** is on (`requireEmailVerification: true`, `autoSignIn: false`), and password reset is on. Emails go through `src/lib/email/send.ts` with React Email templates in `src/lib/email/templates/`. Never add a branch that reveals whether an email is registered. Sends run in the background through `advanced.backgroundTasks`. Only `@e2e.test` sign-ups are verified on creation (and so signed straight in), and only on previews and in development.

## Authorisation

- `src/proxy.ts` only does an optimistic `getSessionCookie()` redirect for `/casebook` and `/settings`. It is never the security boundary.
- Every Server Action that writes user data, and every data-access function that returns user data, calls `requireUser()`, which checks the session row rather than the cookie cache and throws if there is no session.
- Scope user data by `user.id` from the session, never from client input.
- Puzzle pages are public. Without a session, progress goes to `localStorage`.

## Client

- Use `authClient` from `src/lib/auth-client.ts` only for `signOut` and `useSession` in client components.

## Rate limiting and secrets

- **Rate limiting:** `rateLimit: { enabled: true, storage: "database" }`, with custom rules on `/sign-in/email`, `/request-password-reset` and `/send-verification-email`. Never use in-memory storage, because it doesn't work on serverless.
- **Secrets:** `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` come from `src/env.ts`. Never read `process.env` directly.
- **Origins:** `trustedOrigins` includes the production domain and `https://${VERCEL_URL}` for previews.
