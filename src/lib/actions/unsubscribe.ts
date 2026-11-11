"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clearNotification } from "@/lib/data/notifications";
import { readUnsubscribeToken } from "@/lib/email/unsubscribe";

const unsubscribeSchema = z.object({ token: z.string() });

/** The signed token is the credential, so this works signed out. A deleted user gets the same answer as a live one. */
export async function unsubscribe(formData: FormData) {
  const parsed = unsubscribeSchema.safeParse(Object.fromEntries(formData));
  const token = parsed.success ? readUnsubscribeToken(parsed.data.token) : null;
  if (!token) redirect("/unsubscribe");
  await clearNotification(token.userId, token.kind);
  redirect("/unsubscribed");
}
