"use server";

import { revalidatePath } from "next/cache";
import { requireUser, setUserTheme } from "@/lib/data/user";
import { themeSchema } from "@/lib/forms/theme";

export async function saveTheme(input: unknown) {
  const user = await requireUser();
  const { theme } = themeSchema.parse(input);
  await setUserTheme(user.id, theme);
  revalidatePath("/", "layout");
}
