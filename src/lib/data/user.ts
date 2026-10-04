import "server-only";
import { headers } from "next/headers";
import { connection } from "next/server";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { auth } from "@/lib/auth";
import type { SettingsInput } from "@/lib/forms/settings";

export async function getCurrentUser() {
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorised");
  return user;
}

export async function getUserSettings(userId: string) {
  const settings = await db.query.userSettings.findFirst({
    where: { userId },
    columns: { theme: true, chessNotation: true, reduceMotion: true },
  });
  return (
    settings ?? {
      theme: "system" as const,
      chessNotation: "algebraic" as const,
      reduceMotion: false,
    }
  );
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

export async function getUserChessNotation(userId: string) {
  const settings = await db.query.userSettings.findFirst({
    where: { userId },
    columns: { chessNotation: true },
  });
  return settings?.chessNotation ?? "algebraic";
}

export async function setUserChessNotation(
  userId: string,
  chessNotation: (typeof userSettings.$inferInsert)["chessNotation"],
) {
  await db
    .insert(userSettings)
    .values({ userId, chessNotation })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { chessNotation },
    });
}

export async function updateUserSettings({ name, ...settings }: SettingsInput) {
  const user = await requireUser();
  await db
    .insert(userSettings)
    .values({ userId: user.id, ...settings })
    .onConflictDoUpdate({ target: userSettings.userId, set: settings });
  await auth.api.updateUser({ headers: await headers(), body: { name } });
}
