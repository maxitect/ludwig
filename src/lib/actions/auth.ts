"use server";

import { APIError } from "better-auth/api";
import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, authBaseURL } from "@/lib/auth";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/forms/auth";
import { safeRedirectPath } from "@/utils/safe-redirect-path";

export type AuthFormState = {
  fieldErrors: Partial<
    Record<"name" | "email" | "password" | "confirmPassword", string[]>
  >;
  formError?: string;
  sentTo?: string;
  values: { name?: string; email?: string };
};

function echoValues(formData: FormData): AuthFormState["values"] {
  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: echoValues(formData),
    };
  }

  let created;
  try {
    created = await auth.api.signUpEmail({
      body: {
        ...parsed.data,
        callbackURL: verifiedCallback(formData.get("next")),
      },
    });
  } catch (error) {
    if (!(error instanceof APIError)) throw error;
    return {
      fieldErrors: {},
      formError: "Sign-up failed. Please try again.",
      values: echoValues(formData),
    };
  }
  // Only e2e accounts outside production are created verified (databaseHooks in lib/auth.ts)
  if (created.user.emailVerified) {
    await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
    });
    redirect(safeRedirectPath(formData.get("next")));
  }
  return { fieldErrors: {}, values: {}, sentTo: parsed.data.email };
}

function verifiedCallback(next: FormDataEntryValue | null) {
  return `/verified?next=${encodeURIComponent(safeRedirectPath(next))}`;
}

/** Posts through auth.handler, not auth.api, so the rate limit applies. */
async function postToAuth(path: string, body: object) {
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("content-type", "application/json");
  requestHeaders.delete("content-length");
  return auth.handler(
    new Request(`${authBaseURL}/api/auth/${path}`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(body),
    }),
  );
}

function tooManyRequests(response: Response, what: string) {
  const minutes = Math.ceil(
    Number(response.headers.get("x-retry-after") ?? 0) / 60,
  );
  return `Too many ${what}. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: echoValues(formData),
    };
  }

  // nextCookies skips handler calls, so the session cookie is copied over below
  const response = await postToAuth("sign-in/email", {
    ...parsed.data,
    callbackURL: verifiedCallback(formData.get("next")),
  });

  if (!response.ok) {
    return {
      fieldErrors: {},
      formError:
        response.status === 429
          ? tooManyRequests(response, "sign-in attempts")
          : response.status === 403
            ? "Verify your email first. We've sent you a new link."
            : "Invalid email or password.",
      values: echoValues(formData),
    };
  }
  const cookieJar = await cookies();
  parseSetCookieHeader(response.headers.get("set-cookie") ?? "").forEach(
    (cookie, name) => cookieJar.set(name, cookie.value, toCookieOptions(cookie)),
  );
  redirect(safeRedirectPath(formData.get("next")));
}

export async function resendVerification(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: echoValues(formData),
    };
  }
  const response = await postToAuth("send-verification-email", {
    email: parsed.data.email,
    callbackURL: verifiedCallback(formData.get("next")),
  });
  if (response.status === 429) {
    return {
      fieldErrors: {},
      formError: tooManyRequests(response, "requests"),
      values: echoValues(formData),
    };
  }
  return { fieldErrors: {}, values: {}, sentTo: parsed.data.email };
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: echoValues(formData),
    };
  }
  const response = await postToAuth("request-password-reset", {
    email: parsed.data.email,
    redirectTo: "/reset-password",
  });
  if (response.status === 429) {
    return {
      fieldErrors: {},
      formError: tooManyRequests(response, "requests"),
      values: echoValues(formData),
    };
  }
  if (!response.ok) console.error("request-password-reset", response.status);
  return { fieldErrors: {}, values: {}, sentTo: parsed.data.email };
}

export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: {},
    };
  }
  try {
    await auth.api.resetPassword({
      body: { newPassword: parsed.data.password, token: parsed.data.token },
    });
  } catch (error) {
    if (!(error instanceof APIError)) throw error;
    redirect("/reset-password?error=INVALID_TOKEN");
  }
  redirect("/sign-in?reset=1");
}
