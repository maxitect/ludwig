import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";
import { E2E_EMAIL_DOMAIN } from "@/config/email";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/env";
import { sendEmail } from "@/lib/email/send";
import { existingSignUp } from "@/lib/email/templates/existing-sign-up";
import { resetPassword } from "@/lib/email/templates/reset-password";
import { verifyEmail } from "@/lib/email/templates/verify-email";

const previewURL =
  env.VERCEL_ENV === "preview" && env.VERCEL_URL
    ? `https://${env.VERCEL_URL}`
    : undefined;

const previewBranchURL =
  env.VERCEL_ENV === "preview" && env.VERCEL_BRANCH_URL
    ? `https://${env.VERCEL_BRANCH_URL}`
    : undefined;

const configuredURL = env.BETTER_AUTH_URL ?? previewURL;

export const authBaseURL = configuredURL?.replace(/\/+$/, "");

const verifyE2EUsers =
  env.VERCEL_ENV === "preview" || env.NODE_ENV === "development";

export const auth = betterAuth({
  baseURL: authBaseURL,
  trustedOrigins: [env.BETTER_AUTH_URL, previewURL, previewBranchURL].filter(
    (origin) => origin !== undefined,
  ),
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: false,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        ...resetPassword({ name: user.name, url }),
      });
    },
    onExistingUserSignUp: async ({ user }) => {
      await sendEmail({
        to: user.email,
        ...existingSignUp({ name: user.name }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        ...verifyEmail({ name: user.name, url }),
      });
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) =>
          verifyE2EUsers && user.email.endsWith(`@${E2E_EMAIL_DOMAIN}`)
            ? { data: { ...user, emailVerified: true } }
            : undefined,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 300 },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60 * 15, max: 5 },
      "/request-password-reset": { window: 60 * 15, max: 3 },
      "/send-verification-email": { window: 60 * 15, max: 3 },
    },
  },
  advanced: {
    database: { generateId: "uuid" },
    backgroundTasks: { handler: (promise) => after(promise) },
  },
  plugins: [nextCookies()],
});
