"use server";

import { APIError } from "better-auth/api";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireUser, updateUserSettings } from "@/lib/data/user";
import { changePasswordSchema } from "@/lib/forms/auth";
import { settingsSchema } from "@/lib/forms/settings";

export type SettingsFormState = {
  fieldErrors: Partial<Record<keyof z.input<typeof settingsSchema>, string[]>>;
  saved: boolean;
};

export async function saveSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireUser();
  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    theme: formData.get("theme"),
    chessNotation: formData.get("chessNotation"),
    reduceMotion: formData.get("reduceMotion") === "on",
  });
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      saved: false,
    };
  }
  await updateUserSettings(parsed.data);
  revalidatePath("/", "layout");
  return { fieldErrors: {}, saved: true };
}

export type PasswordFormState = {
  fieldErrors: Partial<
    Record<"currentPassword" | "password" | "confirmPassword", string[]>
  >;
  saved: boolean;
};

export async function changePassword(
  _prev: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      saved: false,
    };
  }
  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.password,
        revokeOtherSessions: true,
      },
    });
  } catch (error) {
    if (!(error instanceof APIError)) throw error;
    return {
      fieldErrors: {
        currentPassword: ["That isn't your current password."],
      },
      saved: false,
    };
  }
  return { fieldErrors: {}, saved: true };
}
