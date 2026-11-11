import { NextResponse } from "next/server";
import { clearNotification } from "@/lib/data/notifications";
import { readUnsubscribeToken } from "@/lib/email/unsubscribe";

const columns = {
  favourites: "notifyFavourites",
  streak: "notifyStreak",
} as const;

/** The signed token is the credential, so this works signed out. A deleted user gets the same answer as a live one. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const parsed = readUnsubscribeToken(token);
  if (!parsed) return new Response("This link is not valid.", { status: 400 });
  await clearNotification(parsed.userId, columns[parsed.kind]);
  return NextResponse.redirect(new URL("/unsubscribed", request.url));
}
