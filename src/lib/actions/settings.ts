"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, updateUserSettings } from "@/lib/data/user";
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
