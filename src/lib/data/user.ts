import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorised");
  return user;
}

export async function getUserTheme(userId: string) {
  const settings = await db.query.userSettings.findFirst({
    where: { userId },
    columns: { theme: true },
  });
  return settings?.theme ?? "system";
}

export async function setUserTheme(
  userId: string,
  theme: (typeof userSettings.$inferInsert)["theme"],
) {
  await db
    .insert(userSettings)
    .values({ userId, theme })
    .onConflictDoUpdate({ target: userSettings.userId, set: { theme } });
}
