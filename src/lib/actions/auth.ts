"use server";

import { APIError } from "better-auth/api";
import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/env";
import { auth } from "@/lib/auth";
import { signInSchema, signUpSchema } from "@/lib/forms/auth";
import { safeRedirectPath } from "@/utils/safe-redirect-path";

export type AuthFormState = {
  fieldErrors: Partial<Record<"name" | "email" | "password", string[]>>;
  formError?: string;
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

  try {
    await auth.api.signUpEmail({ body: parsed.data });
  } catch (error) {
    if (!(error instanceof APIError)) throw error;
    const duplicate =
      error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL";
    return {
      fieldErrors: duplicate
        ? { email: ["This email is already registered."] }
        : {},
      formError: duplicate ? undefined : "Sign-up failed. Please try again.",
      values: echoValues(formData),
    };
  }
  redirect(safeRedirectPath(formData.get("next")));
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

  const requestHeaders = new Headers(await headers());
  requestHeaders.set("content-type", "application/json");
  requestHeaders.delete("content-length");

  // auth.handler, not auth.api, so the rate limit applies; nextCookies skips
  // handler calls, so the session cookie is copied over below
  const response = await auth.handler(
    new Request(`${env.BETTER_AUTH_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(parsed.data),
    }),
  );

  if (!response.ok) {
    const minutes = Math.ceil(
      Number(response.headers.get("x-retry-after") ?? 0) / 60,
    );
    return {
      fieldErrors: {},
      formError:
        response.status === 429
          ? `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`
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
